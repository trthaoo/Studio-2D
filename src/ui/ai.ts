// The studio's AI calls (back end: scripts/ai.ts) and the "connect an AI" box, shared by the code editors.
import { h } from './dom';
import { toast } from '../state';

export const AIH = { 'x-2d-studio': '1' };   // only the studio page may call /api/ai (see vite.config.ts)
export const codeOf = (text: string) => { const m = /```(?:js|javascript|ts)?\s*\n([\s\S]*?)```/i.exec(text); return (m ? m[1] : text).trim() + '\n'; };

/** Ask the AI; the reply's code block. Throws Error('NO_AI') when no AI is connected on this machine. */
export async function aiCode(system: string, prompt: string) {
  const r = await fetch('/api/ai/text', { method: 'POST', headers: AIH, body: JSON.stringify({ system, prompt }) });
  const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Lỗi');
  return codeOf(j.text);
}

/** Which AI is connected, or how to connect one: Claude Code sign-in, or an Anthropic / OpenAI key kept on this machine. */
export async function renderAiSetup(box: HTMLElement) {
  const again = () => renderAiSetup(box);
  box.replaceChildren(h('div', { class: 'hint' }, 'Đang kiểm tra kết nối AI...'));
  const st = await (await fetch('/api/ai/status', { headers: AIH })).json();
  if (st.mode !== 'none') {
    box.replaceChildren(h('div', { class: 'row wrap' }, h('span', { class: 'hint' }, `AI: ${st.msg}.`),
      st.mode === 'key' || st.mode === 'openai' ? h('button', { class: 'rbtn', title: 'Xoá API key đã lưu trên máy này', onclick: async () => { await fetch('/api/ai/key', { method: 'PUT', headers: AIH, body: '' }); again(); } }, 'Xoá key') : null));
    return;
  }
  const keyIn = h('input', { type: 'password', placeholder: 'Dán key: sk-ant-... (Anthropic) hoặc sk-... (OpenAI)', autocomplete: 'off', spellcheck: false }) as HTMLInputElement;
  box.replaceChildren(h('div', { class: 'aisetup' },
    h('b', {}, 'Chưa kết nối AI'),
    h('div', { class: 'hint' }, 'Chọn một trong hai cách (chỉ cần làm một lần):'),
    h('div', { class: 'hint' }, '1. Dùng gói Claude của bạn: bấm nút dưới để mở Claude Code, gõ /login và đăng nhập, rồi bấm Kiểm tra lại.'),
    h('div', { class: 'row wrap' },
      h('button', { onclick: async () => { const r = await fetch('/api/ai/login', { method: 'POST', headers: AIH }); if (!r.ok) toast((await r.json()).error); else toast('Đã mở Claude Code. Gõ /login trong cửa sổ đó.', 6000); } }, 'Mở Claude Code để đăng nhập'),
      h('button', { onclick: again }, 'Kiểm tra lại')),
    h('div', { class: 'hint' }, '2. Hoặc dán API key Anthropic hoặc OpenAI. Key chỉ lưu trên máy này (thư mục người dùng, ngoài project và OneDrive), không bao giờ gửi ngược ra trang:'),
    h('div', { class: 'row' }, keyIn, h('button', { onclick: async () => { if (!keyIn.value.trim()) return; const r = await fetch('/api/ai/key', { method: 'PUT', headers: AIH, body: keyIn.value.trim() }); keyIn.value = ''; if (!r.ok) toast((await r.json()).error); again(); } }, 'Lưu key')),
    st.msg ? h('div', { class: 'hint' }, `(${st.msg})`) : null));
}

/** Run an AI code job with a ticking status line: ask, try, send errors back (up to 3 tries). */
export async function aiLoop(o: { msg: HTMLElement; setupBox: HTMLElement; system: string; first: string; fix: (code: string, error: string) => string; apply: (code: string) => Promise<string | null> }) {
  const t0 = Date.now(); let step = 'Đang nhờ AI viết code';
  const tick = setInterval(() => { o.msg.textContent = `${step}... ${Math.round((Date.now() - t0) / 1000)} giây`; }, 500);
  try {
    let prompt = o.first;
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = await aiCode(o.system, prompt);
      step = 'Đang thử code';
      const err = await o.apply(code);
      if (!err) { clearInterval(tick); o.msg.textContent = `Xong sau ${Math.round((Date.now() - t0) / 1000)} giây${attempt ? ` (đã tự sửa lỗi ${attempt} lần)` : ''}. Xem thử; chưa ưng thì viết thêm yêu cầu rồi bấm "Sửa bằng AI". Ưng thì bấm Lưu.`; return true; }
      step = `Code bị lỗi, đang nhờ AI sửa (lần ${attempt + 1})`;
      prompt = o.fix(code, err);
    }
    clearInterval(tick); o.msg.textContent = 'AI chưa sửa được lỗi sau 3 lần. Xem lỗi, sửa tay hoặc viết mô tả rõ hơn.';
  } catch (e: any) {
    clearInterval(tick);
    if (e.message === 'NO_AI') { o.msg.textContent = ''; renderAiSetup(o.setupBox); } else o.msg.textContent = 'Lỗi: ' + e.message;
  } finally { clearInterval(tick); }
  return false;
}
