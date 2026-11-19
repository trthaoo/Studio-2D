// AI for the studio's back end: write code for library objects from a description.
// Ways to reach an AI, tried in order (keys are never sent to the page, only used here):
//   1. an Anthropic API key (ANTHROPIC_API_KEY, or the key saved from the studio in ~/.2d-studio/ai.json,
//      outside the project so it is never served or synced) -> the Messages API through the official SDK;
//   2. an OpenAI API key (OPENAI_API_KEY, or saved from the studio the same way; model OPENAI_MODEL, default gpt-5);
//   3. Claude Code installed on this machine (the desktop app's copy, or `claude` on PATH), signed in once with
//      `claude` then /login -> run headless (`claude -p`), using the subscription.
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CFG_DIR = path.join(os.homedir(), '.2d-studio'), CFG = path.join(CFG_DIR, 'ai.json');
const MODEL = 'claude-opus-5-5';

function readCfg(): { apiKey?: string; openaiKey?: string; openaiModel?: string } { try { return JSON.parse(fs.readFileSync(CFG, 'utf8')); } catch { return {}; } }
/** Save a key the user pasted in the studio: an Anthropic key (sk-ant-...) or an OpenAI key (sk-...). Empty = forget both. */
export function saveKey(key: string) {
  fs.mkdirSync(CFG_DIR, { recursive: true });
  const c = readCfg(), k = key.trim();
  if (!k) { delete c.apiKey; delete c.openaiKey; }
  else if (k.startsWith('sk-ant-')) c.apiKey = k;
  else if (k.startsWith('sk-')) c.openaiKey = k;
  else throw new Error('Không nhận ra key này (Anthropic: sk-ant-..., OpenAI: sk-...).');
  fs.writeFileSync(CFG, JSON.stringify(c, null, 1), { mode: 0o600 }); cliState = null;
}
const real = (k?: string) => (k && /^sk-/.test(k.trim()) ? k.trim() : '');   // a placeholder left in the file counts as no key
const apiKey = () => process.env.ANTHROPIC_API_KEY || real(readCfg().apiKey);
const openaiKey = () => process.env.OPENAI_API_KEY || real(readCfg().openaiKey);
const openaiModel = () => process.env.OPENAI_MODEL || readCfg().openaiModel || 'gpt-5';

/** The newest Claude Code executable: on PATH, or the copy that ships with the Claude desktop app. */
export function findCli(): string | null {
  const which = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['claude'], { encoding: 'utf8' });
  const onPath = which.status === 0 ? which.stdout.split(/\r?\n/).find((l) => l.trim()) : null;
  if (onPath) return onPath.trim();
  const roots = [path.join(process.env.LOCALAPPDATA || '', 'Claude-Data'), path.join(process.env.APPDATA || '', 'Claude')];
  let best: { f: string; m: number } | null = null;
  const walk = (d: string, depth: number) => {
    if (depth > 5 || !fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p, depth + 1);
      else if (/^claude(\.exe)?$/i.test(e.name) && /claude-code/i.test(p)) { const m = fs.statSync(p).mtimeMs; if (!best || m > best.m) best = { f: p, m }; }
    }
  };
  for (const r of roots) { try { walk(r, 0); } catch { /* unreadable */ } }
  return best ? (best as { f: string }).f : null;
}

let cliState: { exe: string | null; ok: boolean; msg: string; at: number } | null = null;
function runCli(exe: string, prompt: string, timeoutMs: number): Promise<{ code: number; out: string; err: string }> {
  return new Promise((res) => {
    const p = spawn(exe, ['-p', '--output-format', 'text'], { cwd: os.tmpdir(), env: process.env });
    let out = '', err = ''; const timer = setTimeout(() => { p.kill(); err += '\n(hết giờ)'; }, timeoutMs);
    p.stdout.on('data', (d) => (out += d)); p.stderr.on('data', (d) => (err += d));
    p.on('close', (code) => { clearTimeout(timer); res({ code: code ?? 1, out, err }); });
    p.on('error', (e) => { clearTimeout(timer); res({ code: 1, out, err: e.message }); });
    p.stdin.end(prompt);
  });
}
async function cliStatus() {
  if (cliState && Date.now() - cliState.at < 10 * 60e3) return cliState;
  const exe = findCli();
  if (!exe) return (cliState = { exe, ok: false, msg: 'Không tìm thấy Claude Code trên máy.', at: Date.now() });
  const r = await runCli(exe, 'Reply with exactly: OK', 60e3);
  const text = (r.out + r.err).trim();
  return (cliState = { exe, ok: r.code === 0 && /OK/.test(r.out), msg: /log ?in/i.test(text) ? 'Claude Code chưa đăng nhập.' : text.slice(0, 200), at: Date.now() });
}

/** Which way the studio will reach Claude. */
export async function aiStatus() {
  if (apiKey()) return { mode: 'key' as const, msg: process.env.ANTHROPIC_API_KEY ? 'Dùng ANTHROPIC_API_KEY' : 'Dùng API key Anthropic đã lưu' };
  if (openaiKey()) return { mode: 'openai' as const, msg: `Dùng API key OpenAI đã lưu (model ${openaiModel()})` };
  const c = await cliStatus();
  return c.ok ? { mode: 'cli' as const, msg: 'Dùng Claude Code trên máy (gói đăng ký của bạn)' } : { mode: 'none' as const, msg: c.msg, cli: c.exe };
}

/** One request: system + user text -> the reply text. */
export async function aiText(system: string, user: string): Promise<string> {
  const key = apiKey();
  if (key) {
    const client = new Anthropic({ apiKey: key });
    try {
      const stream = client.beta.messages.stream({
        model: MODEL, max_tokens: 32000, system,
        output_config: { effort: 'medium' },
        betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',   // a declined request is re-run on a fallback model
        messages: [{ role: 'user', content: user }],
      });
      const msg = await stream.finalMessage();
      if (msg.stop_reason === 'refusal') throw new Error('Claude từ chối yêu cầu này. Thử mô tả khác.');
      return msg.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError) throw new Error('API key không đúng hoặc đã hết hạn.');
      if (e instanceof Anthropic.RateLimitError) throw new Error('Đang bị giới hạn tốc độ, thử lại sau ít phút.');
      if (e instanceof Anthropic.APIError) throw new Error(`Lỗi API ${e.status}: ${e.message}`);
      throw e;
    }
  }
  const ok = openaiKey();
  if (ok) {
    const client = new OpenAI({ apiKey: ok });
    try {
      const r = await client.responses.create({ model: openaiModel(), instructions: system, input: user });
      return r.output_text;
    } catch (e) {
      if (e instanceof OpenAI.AuthenticationError) throw new Error('API key OpenAI không đúng hoặc đã bị thu hồi.');
      if (e instanceof OpenAI.RateLimitError) throw new Error('OpenAI đang giới hạn tốc độ hoặc tài khoản hết hạn mức.');
      if (e instanceof OpenAI.APIError) throw new Error(`Lỗi OpenAI ${e.status}: ${e.message}`);
      throw e;
    }
  }
  const c = await cliStatus();
  if (!c.ok || !c.exe) throw new Error('NO_AI');
  const r = await runCli(c.exe, `${system}\n\n---\n\n${user}\n\n(Chỉ trả lời bằng văn bản, không dùng công cụ, không sửa file nào.)`, 6 * 60e3);
  if (r.code !== 0) { cliState = null; throw new Error('Claude Code báo lỗi: ' + (r.err || r.out).trim().slice(0, 300)); }
  return r.out;
}
