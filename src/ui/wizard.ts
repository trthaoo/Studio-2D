// Workspace "Kịch bản": ý tưởng, kịch bản, giọng đọc, nhân vật, bối cảnh -> dựng cảnh (bản nháp tự động), và brief
// cho Claude làm đẹp. Đây là bước đầu của workflow; xong thì sang "Dựng cảnh".
import { S, emit, edit, newProject, toast } from '../state';
import { LIB, loadLibrary, safeName } from '../library';
import { autoBuild, briefMarkdown, speakersOf, parseScript, BUILTIN_BG, Brief, CastPick, BgPick } from '../autobuild';
import { normalize } from '../doc';
import { h, ask } from './dom';
import { fit } from './timeline';

const EXAMPLE = `Dan: Sếp ơi, em cần tăng lương.
Sếp: Không được.
Dan: Nhưng em vừa sửa xong cái máy in!
Sếp: Máy in đó là của công ty đối thủ.`;

function audioDuration(f: File): Promise<number> {
  return new Promise((res) => { const a = new Audio(); a.preload = 'metadata'; a.onloadedmetadata = () => { res(a.duration || 0); URL.revokeObjectURL(a.src); }; a.onerror = () => res(0); a.src = URL.createObjectURL(f); });
}

interface Draft {
  idea: string; script: string; mood: string; cast: Record<string, string>; bg: string; voice?: { file: string; duration: number } | null;
  mode?: 'idea' | 'clone'; refUrl?: string; lang?: 'en' | 'auto'; useRefVoice?: boolean; useRefCuts?: boolean;
  lineTimes?: Array<{ s: number; e: number }> | null;
  extra?: string[];   // cast picked here that has no lines in the script yet
}
let draft: Draft | null = null, draftFor = '';
let voiceFile: File | null = null, voiceDur = 0;

function current(): Draft {
  if (draft && draftFor === S.project) return draft;
  const b = S.doc.brief;
  draftFor = S.project; voiceFile = null; voiceDur = 0;
  draft = b ? { idea: b.idea || '', script: b.script || '', mood: b.mood || 'day', cast: Object.fromEntries(Object.entries(b.cast || {}).map(([k, v]: any) => [k, `${v.from}:${v.name}`])), bg: `${b.background?.from || 'builtin'}:${b.background?.name || 'office'}`, voice: b.audio || null,
      mode: b.ref ? 'clone' : 'idea', refUrl: b.ref?.url || '', useRefVoice: true, useRefCuts: !!b.refCuts, lineTimes: b.lineTimes || null,
      extra: Object.keys(b.cast || {}).filter((k) => !speakersOf(b.script || '').includes(k)) }
    : { idea: '', script: S.doc.objects.some((o) => o.kind === 'char') ? '' : EXAMPLE, mood: 'day', cast: {}, bg: 'builtin:office', voice: null, mode: 'idea', useRefVoice: true, useRefCuts: true };
  return draft;
}

export async function scriptPanel(root: HTMLElement) {
  await loadLibrary();
  const d = current();
  const sec = (n: string, title: string, ...kids: any[]) => h('section', { class: 'wsec' }, h('div', { class: 'wsec-h' }, h('span', { class: 'wnum' }, n), title), ...kids);
  const idea = h('textarea', { rows: 3, value: d.idea, placeholder: 'Ví dụ: nhân viên đòi tăng lương, sếp từ chối theo cách bất ngờ', oninput: (e: any) => { d.idea = e.target.value; } });
  const script = h('textarea', { rows: 12, class: 'script', value: d.script, placeholder: 'Tên: câu thoại\nTên khác: câu thoại\nDòng không có tên là lời dẫn' }) as HTMLTextAreaElement;
  const castBox = h('div', { class: 'castbox' }), summary = h('div', { class: 'wsum' });
  const voiceIn = h('input', { type: 'file', accept: 'audio/*' }) as HTMLInputElement;
  const voiceInfo = h('div', { class: 'hint' });
  const showVoice = () => { voiceInfo.textContent = voiceFile ? `${voiceFile.name}, ${voiceDur.toFixed(1)} giây (chưa tải lên)` : d.voice ? `${d.voice.file}, ${d.voice.duration.toFixed(1)} giây` : 'Không bắt buộc. Có giọng đọc thì thời gian từng câu được kéo cho khớp độ dài file.'; };
  const bgSel = h('select', { onchange: (e: any) => { d.bg = e.target.value; } },
    h('optgroup', { label: 'Có sẵn' }, ...BUILTIN_BG.map((b) => h('option', { value: 'builtin:' + b.key, selected: d.bg === 'builtin:' + b.key }, b.label))),
    LIB.backgrounds.length ? h('optgroup', { label: 'Thư viện' }, ...LIB.backgrounds.map((b) => h('option', { value: 'library:' + b.name, selected: d.bg === 'library:' + b.name }, b.data?.name || b.name))) : null);
  const moodSel = h('select', { onchange: (e: any) => { d.mood = e.target.value; } }, ...[['day', 'Ban ngày'], ['dusk', 'Hoàng hôn'], ['night', 'Ban đêm'], ['rain', 'Trời mưa']].map(([v, l]) => h('option', { value: v, selected: d.mood === v }, l)));

  // the cast: everyone who speaks in the script, plus anyone picked here first (they can get lines later)
  const people = () => { const sps = speakersOf(script.value); return [...sps, ...(d.extra || []).filter((x) => !sps.includes(x))]; };
  const libName = (v: string) => { const c = LIB.characters.find((x) => 'library:' + x.name === v); return c ? c.data?.name || c.name : ''; };
  const castOptions = (val: string) => [
    LIB.characters.length ? h('optgroup', { label: 'Nhân vật trong thư viện' }, ...LIB.characters.map((c) => h('option', { value: 'library:' + c.name, selected: val === 'library:' + c.name }, c.data?.name || c.name))) : null,
    h('option', { value: 'random:', selected: val === 'random:' }, 'Nhân vật mới, ngoại hình ngẫu nhiên')];
  function addLine(sp: string) {
    script.value = script.value.replace(/\s*$/, '') + (script.value.trim() ? '\n' : '') + sp + ': ';
    d.script = script.value; script.focus(); script.setSelectionRange(script.value.length, script.value.length); renderCast();
  }
  function renderCast() {
    const sps = speakersOf(script.value), lines = parseScript(script.value), all = people();
    const rows = all.map((sp) => {
      const lib = LIB.characters.find((c) => (c.data?.name || c.name).toLowerCase() === sp.toLowerCase());
      const val = d.cast[sp] && !d.cast[sp].startsWith('role:') ? d.cast[sp] : (lib ? 'library:' + lib.name : 'random:'); d.cast[sp] = val;
      const n = lines.filter((l) => l.speaker === sp).length, extra = !sps.includes(sp);
      return h('div', { class: 'castrow' },
        h('div', { class: 'castname' }, sp, h('span', { class: 'hint' }, n ? `${n} câu` : 'chưa có thoại')),
        h('select', { onchange: (e: any) => { d.cast[sp] = e.target.value; } }, ...castOptions(val)),
        h('div', { class: 'castbtns' },
          h('button', { onclick: () => addLine(sp), title: `Thêm dòng "${sp}: " vào cuối kịch bản` }, 'Thêm câu thoại'),
          extra ? h('button', { class: 'danger', onclick: () => { d.extra = (d.extra || []).filter((x) => x !== sp); delete d.cast[sp]; renderCast(); } }, 'Bỏ') : null));
    });
    // add someone: pick from the library or a new random character, give them a name
    let pickVal = LIB.characters.find((c) => !all.some((p) => d.cast[p] === 'library:' + c.name)) ? 'library:' + LIB.characters.find((c) => !all.some((p) => d.cast[p] === 'library:' + c.name))!.name : 'random:';
    const nameIn = h('input', { placeholder: 'Tên trong kịch bản', value: libName(pickVal) }) as HTMLInputElement;
    const pick = h('select', { onchange: (e: any) => { pickVal = e.target.value; nameIn.value = libName(pickVal) || nameIn.value; } }, ...castOptions(pickVal));
    const add = () => {
      let nm = nameIn.value.trim().replace(/:/g, '');
      if (!nm) { let i = all.length + 1; while (all.includes('Nhân vật ' + i)) i++; nm = 'Nhân vật ' + i; }
      if (all.some((p) => p.toLowerCase() === nm.toLowerCase())) { toast(`Đã có "${nm}" trong danh sách.`); return; }
      d.extra = [...(d.extra || []), nm]; d.cast[nm] = pickVal; renderCast();
    };
    castBox.replaceChildren(
      ...(rows.length ? rows : [h('div', { class: 'hint' }, 'Chưa có ai. Thêm nhân vật ở dưới, hoặc viết kịch bản dạng "Tên: câu thoại" thì người nói tự hiện ở đây.')]),
      h('div', { class: 'castadd' }, pick, nameIn, h('button', { class: 'primary', onclick: add }, 'Thêm nhân vật')),
      ...(LIB.characters.length ? [] : [h('div', { class: 'hint' }, 'Thư viện chưa có nhân vật nào. Tạo ở tab Thư viện để dùng lại cho mọi video.')]));
    const words = lines.reduce((n, l) => n + l.text.split(/\s+/).filter(Boolean).length, 0);
    summary.textContent = `${lines.length} câu, ${all.length} nhân vật, khoảng ${(voiceDur || d.voice?.duration || words / 3.8 + lines.length * 0.35 + 1).toFixed(1)} giây`;
  }
  script.addEventListener('input', () => { d.script = script.value; renderCast(); });
  voiceIn.addEventListener('change', async () => { voiceFile = voiceIn.files?.[0] || null; voiceDur = voiceFile ? await audioDuration(voiceFile) : 0; scriptPanel(root); });
  renderCast(); showVoice();

  async function brief(project: string): Promise<Brief | null> {
    if (!parseScript(d.script).length && !people().length) { toast('Kịch bản đang trống và chưa chọn nhân vật nào.'); return null; }
    let audio = d.voice || null;
    if (voiceFile) {
      const r = await fetch(`/api/upload?name=${encodeURIComponent(project)}&file=${encodeURIComponent(voiceFile.name)}`, { method: 'POST', body: voiceFile });
      const j = await r.json(); if (!r.ok) { toast('Không tải giọng đọc lên được: ' + j.error); return null; }
      audio = { file: j.file, duration: voiceDur }; d.voice = audio; voiceFile = null;
    }
    const cast: Record<string, CastPick> = {};
    for (const sp of people()) { const [from, n] = (d.cast[sp] || 'random:').split(/:(.*)/s); cast[sp] = { from: from as any, name: n }; }
    const [bf, bn] = d.bg.split(/:(.*)/s);
    const b: Brief = { name: project, idea: d.idea.trim(), script: d.script.trim(), mood: d.mood as any, cast, background: { from: bf as any, name: bn } as BgPick, audio };
    const info = refData?.project === project ? refData.info : null;
    if (d.mode === 'clone' && info) {
      b.ref = { url: info.url, duration: info.duration };
      if (d.useRefCuts) b.refCuts = info.cuts;
      if (d.useRefVoice && info.audio) b.audio = { file: info.audio, duration: info.duration };
      if (d.lineTimes && d.lineTimes.length === parseScript(d.script).length) b.lineTimes = d.lineTimes;
    }
    return b;
  }
  const writeBrief = (b: Brief) => fetch(`/api/project-file?name=${encodeURIComponent(b.name)}&file=brief.md`, { method: 'PUT', body: briefMarkdown(b) });
  const done = (msg: string) => { S.ws = 'scene'; emit('ws'); fit(); toast(msg, 5000); };

  async function buildHere() {
    if (!S.project) return buildNew();
    if (S.doc.objects.some((o) => o.kind === 'char')) { const ok = await ask(`Dựng lại sẽ thay toàn bộ cảnh của "${S.project}" bằng bản nháp mới (Ctrl+Z để quay lại). Gõ "ok" để tiếp tục.`); if (ok?.toLowerCase() !== 'ok') return; }
    const b = await brief(S.project); if (!b) return;
    const doc = autoBuild(b); doc.brief = b;
    edit((cur) => { Object.assign(cur, normalize({ ...doc, name: cur.name })); });
    await writeBrief(b); done('Đã dựng bản nháp. Bấm Phát để xem, rồi sửa trong Dựng cảnh.');
  }
  async function buildNew() {
    const name = safeName((await ask('Tên project mới', 'Video mới')) || ''); if (!name || name === 'item') return;
    const list: string[] = (await (await fetch('/api/projects')).json()).map((p: any) => p.name);
    if (list.includes(name)) { toast(`Đã có project "${name}".`); return; }
    const b = await brief(name); if (!b) return;
    const doc = autoBuild(b); doc.brief = b; draftFor = name;
    await newProject(name, doc); await writeBrief(b); document.getElementById('start')!.hidden = true;
    done(`Đã tạo "${name}" từ kịch bản.`);
  }
  async function copyForClaude() {
    if (!S.project) { toast('Mở hoặc tạo project trước.'); return; }
    const b = await brief(S.project); if (!b) return; await writeBrief(b);
    const prompt = `Mở project 2D Studio "${S.project}". Đọc skill/SKILL.md, rồi đọc Projects/${S.project}/brief.md (ý tưởng, kịch bản, nhân vật, bối cảnh, giọng đọc). Projects/${S.project}/scene.json là bản nháp tự động: dựng lại cho đẹp và đúng ý tưởng (góc máy, cắt cảnh, hành động, biểu cảm, đồ vật gây cười), giữ nguyên id nhân vật và câu thoại. Xem lại vài frame bằng studio.snapshot trước khi báo xong.`;
    await navigator.clipboard.writeText(prompt).catch(() => {});
    toast('Đã ghi brief.md và copy lời nhắn. Dán vào Claude; studio tự cập nhật khi Claude sửa xong.', 6000);
  }

  const clone = d.mode === 'clone';
  const refBox = h('div', { class: 'refbox' });
  if (clone) renderRef(refBox, d, () => scriptPanel(root));
  root.replaceChildren(h('div', { class: 'wsdoc' },
    h('div', { class: 'wshead' }, h('h1', {}, 'Kịch bản'),
      h('p', { class: 'hint' }, 'Viết từ ý tưởng của bạn, hoặc clone một video có sẵn (dán link hay chọn file). Chọn nhân vật và bối cảnh, rồi dựng. Sau đó sang Dựng cảnh để sửa từng thứ trên timeline.'),
      h('div', { class: 'seg modeseg' },
        h('button', { class: clone ? '' : 'on', onclick: () => { d.mode = 'idea'; scriptPanel(root); } }, 'Từ ý tưởng'),
        h('button', { class: clone ? 'on' : '', onclick: () => { d.mode = 'clone'; scriptPanel(root); } }, 'Clone video tham khảo'))),
    h('div', { class: 'wcols' },
      h('div', {},
        clone ? sec('1', 'Video tham khảo', refBox) : sec('1', 'Ý tưởng', idea),
        sec('2', 'Kịch bản', h('div', { class: 'hint' }, clone ? 'Lời thoại lấy từ video nằm ở đây. Sửa tên người nói ở đầu mỗi dòng ("Tên: câu") để chia vai, và viết lại câu theo ý bạn.' : 'Mỗi dòng một câu, dạng "Tên: câu thoại". Dòng không có tên, hoặc "Người dẫn: ...", là lời dẫn: chỉ hiện phụ đề.'), script,
          clone && d.lineTimes ? h('div', { class: 'hint' }, d.lineTimes.length === parseScript(d.script).length ? `Đang giữ đúng thời gian của ${d.lineTimes.length} câu trong video.` : `Số câu đã khác video (${parseScript(d.script).length} so với ${d.lineTimes.length}), thời gian sẽ được ước lượng lại.`) : null)),
      h('div', {},
        sec('3', 'Giọng đọc', clone && d.useRefVoice && refData?.info?.audio ? h('div', { class: 'hint' }, 'Đang dùng giọng trong video tham khảo (bỏ chọn ở mục 1 để dùng file khác).')
          : h('div', {}, h('div', { class: 'filepick' }, voiceIn, h('button', { onclick: () => voiceIn.click() }, voiceFile || d.voice ? 'Đổi file giọng đọc' : 'Chọn file giọng đọc'), d.voice || voiceFile ? h('button', { class: 'danger', onclick: () => { voiceFile = null; voiceDur = 0; d.voice = null; scriptPanel(root); } }, 'Bỏ giọng đọc') : null), voiceInfo)),
        sec('4', 'Nhân vật', h('div', { class: 'hint' }, 'Nhân vật trong thư viện (tạo ở tab Thư viện), hoặc một nhân vật mới ngẫu nhiên.'), castBox),
        sec('5', 'Bối cảnh', h('div', { class: 'row' }, bgSel, moodSel)),
        sec('6', 'Dựng', summary,
          h('div', { class: 'wbtns' },
            S.project ? h('button', { class: 'primary', onclick: buildHere }, `Dựng vào "${S.project}"`) : null,
            !clone ? h('button', { class: S.project ? '' : 'primary', onclick: buildNew }, 'Tạo project mới từ kịch bản') : null,
            h('button', { onclick: copyForClaude }, clone ? 'Nhờ Claude clone chi tiết' : 'Nhờ Claude làm đẹp')),
          h('div', { class: 'hint' }, clone ? 'Bản nháp giữ thời gian từng câu, giọng và nhịp cắt cảnh của video. "Nhờ Claude clone chi tiết" ghi brief.md (kèm frame của video) để Claude dựng lại đúng hành động, góc máy.' : 'Bản nháp tự động: xếp nhân vật, camera toàn cảnh và cận mặt người nói, nhép miệng, biểu cảm theo dấu chấm than và hỏi, phụ đề. "Nhờ Claude làm đẹp" ghi brief.md và copy lời nhắn để bạn dán cho Claude.'))))));
}

// ---------------------------------------------------------------- clone: the reference video
const replaceKids = (el: Element, ...kids: any[]) => el.replaceChildren(...kids.filter((k) => k != null && k !== false));
let refData: { project: string; info: any; job: any; thumbs: string[]; hasVideo: boolean } | null = null, refTimer = 0;
async function loadRef() {
  if (!S.project) { refData = null; return; }
  const j = await (await fetch(`/api/ref?name=${encodeURIComponent(S.project)}`)).json();
  refData = { project: S.project, ...j };
}
async function renderRef(box: HTMLElement, d: Draft, rerender: () => void) {
  if (!S.project) {
    box.replaceChildren(h('div', { class: 'hint' }, 'Clone cần một project để chứa video tham khảo.'),
      h('button', { class: 'primary', onclick: async () => { const n = safeName((await ask('Tên project mới', 'Clone video')) || ''); if (!n || n === 'item') return; await newProject(n); document.getElementById('start')!.hidden = true; d.mode = 'clone'; draftFor = n; draft = d; rerender(); } }, 'Tạo project để clone'));
    return;
  }
  if (!refData || refData.project !== S.project) await loadRef();
  const R = refData!, running = R.job?.state === 'running', info = R.info;
  clearTimeout(refTimer);
  if (running) refTimer = window.setTimeout(async () => { await loadRef(); if (S.ws === 'script') rerender(); }, 1500);
  const urlIn = h('input', { class: 'grow', value: d.refUrl || '', placeholder: 'Dán link video (YouTube, TikTok, Instagram, Facebook...)', oninput: (e: any) => { d.refUrl = e.target.value; } }) as HTMLInputElement;
  const fileIn = h('input', { type: 'file', accept: 'video/*' }) as HTMLInputElement;
  const start = async (withUrl: boolean) => {
    if (withUrl && !/^https?:\/\//i.test(d.refUrl || '')) { toast('Dán một link bắt đầu bằng http.'); return; }
    const q = new URLSearchParams({ name: S.project, lang: d.lang || 'en' }); if (withUrl) q.set('url', d.refUrl!);
    const r = await fetch(`/api/ref?${q}`, { method: 'POST' }); const j = await r.json(); if (!r.ok) { toast(j.error); return; }
    await loadRef(); rerender();
  };
  fileIn.addEventListener('change', async () => {
    const f = fileIn.files?.[0]; if (!f) return;
    toast('Đang chép video vào project...');
    const r = await fetch(`/api/upload?name=${encodeURIComponent(S.project)}&dir=ref`, { method: 'POST', body: f });
    if (!r.ok) { toast('Không chép được video.'); return; }
    d.refUrl = ''; start(false);
  });
  const useLines = () => {
    const lines = (info?.lines || []).filter((l: any) => l.text);
    if (!lines.length) { toast('Không nghe được lời thoại nào trong video.'); return; }
    d.script = lines.map((l: any) => `Người nói: ${l.text}`).join('\n'); d.lineTimes = lines.map((l: any) => ({ s: l.s, e: l.e }));
    rerender(); toast('Đã đưa lời thoại vào kịch bản. Đổi "Người nói" thành tên từng nhân vật.');
  };
  replaceKids(box,
    h('div', { class: 'row' }, urlIn, h('button', { class: 'primary', disabled: running, onclick: () => start(true) }, 'Tải về và phân tích')),
    h('div', { class: 'row' }, h('span', { class: 'filepick' }, fileIn, h('button', { disabled: running, onclick: () => fileIn.click() }, 'Hoặc chọn file video trên máy')),
      h('select', { onchange: (e: any) => { d.lang = e.target.value; } },
        h('option', { value: 'en', selected: (d.lang || 'en') === 'en' }, 'Lời thoại tiếng Anh'),
        h('option', { value: 'auto', selected: d.lang === 'auto' }, 'Tiếng Việt / ngôn ngữ khác (lần đầu tải thêm model khoảng 480 MB)'))),
    running ? h('div', { class: 'refstat' }, h('div', { class: 'pbar indet' }, h('div')), R.job.progress) : null,
    R.job?.state === 'error' ? h('pre', { class: 'log' }, (R.job.log || []).join('\n')) : null,
    info ? h('div', { class: 'refinfo' },
      h('div', { class: 'refmain' },
        R.hasVideo ? h('video', { class: 'refvideo', src: `/Projects/${encodeURIComponent(S.project)}/ref/ref.mp4?v=${encodeURIComponent(info.made || '')}`, controls: true }) : null,
        h('dl', { class: 'facts' },
          h('dt', {}, 'Độ dài'), h('dd', {}, `${info.duration.toFixed(1)} giây`),
          h('dt', {}, 'Khung hình'), h('dd', {}, `${info.width} × ${info.height}`),
          h('dt', {}, 'Cảnh quay'), h('dd', {}, `${info.cuts.length} cảnh`),
          h('dt', {}, 'Lời thoại'), h('dd', {}, info.hasAudio ? `${info.lines.length} câu${info.lang ? ` (${info.lang})` : ''}` : 'video không có tiếng'),
          info.transcriptError ? h('dt', {}, 'Lỗi nghe') : null, info.transcriptError ? h('dd', { class: 'hint' }, info.transcriptError.slice(-160)) : null)),
      R.thumbs.length ? h('div', { class: 'thumbs' }, ...R.thumbs.map((t, i) => h('figure', {}, h('img', { src: '/' + t.split('/').map(encodeURIComponent).join('/') }), h('figcaption', {}, `${info.cuts[i]?.toFixed(1)} s`)))) : null,
      h('div', { class: 'wbtns' },
        h('button', { class: 'primary', disabled: !info.lines.length, onclick: useLines }, 'Dùng lời thoại làm kịch bản')),
      h('label', { class: 'radio' }, h('input', { type: 'checkbox', checked: d.useRefVoice !== false, disabled: !info.audio, onchange: (e: any) => { d.useRefVoice = e.target.checked; rerender(); } }), 'Dùng giọng trong video làm giọng đọc'),
      h('label', { class: 'radio' }, h('input', { type: 'checkbox', checked: d.useRefCuts !== false, onchange: (e: any) => { d.useRefCuts = e.target.checked; } }), `Cắt cảnh theo đúng nhịp của video (${info.cuts.length} cảnh)`))
      : !running ? h('div', { class: 'hint' }, 'Studio sẽ tải video, tìm các chỗ cắt cảnh, chụp frame, tách giọng và nghe lời thoại kèm thời gian từng câu.') : null);
}
