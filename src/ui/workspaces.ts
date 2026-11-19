// Workspace tabs over the view, in workflow order (like Rigging Studio's Rigging / Animation / Generate):
// Kịch bản -> Dựng cảnh -> Camera -> Thư viện -> Xuất video.
import { S, on, emit, Workspace } from '../state';
import { h } from './dom';
import { scriptPanel } from './wizard';
import { libraryPanel, refreshLibraryPanel } from './libraryPanel';
import { exportPanel, onRenderChanged } from './exportPanel';
import { redraw } from './viewport';
import { onLibrary } from '../library';

const TABS: Array<{ id: Workspace; label: string; tip: string }> = [
  { id: 'library', label: 'Thư viện', tip: 'Chuẩn bị trước: tạo nhân vật, bối cảnh, đồ vật dùng chung cho mọi video (Ctrl+1)' },
  { id: 'script', label: 'Kịch bản', tip: 'Ý tưởng hoặc clone video, kịch bản, giọng đọc, chọn nhân vật và bối cảnh, dựng bản nháp (Ctrl+2)' },
  { id: 'scene', label: 'Dựng cảnh', tip: 'Sửa nhân vật, đồ vật, tóc, mặt, dáng, chuyển động trên timeline (Ctrl+3)' },
  { id: 'camera', label: 'Camera', tip: 'Góc máy, cắt cảnh, chuyển cảnh (Ctrl+4)' },
  { id: 'export', label: 'Xuất video', tip: 'Xuất MP4, tách layer, xem lại file đã xuất (Ctrl+5)' },
];
const bar = document.getElementById('wstabs')!, view = document.getElementById('viewwrap')!, panel = document.getElementById('wspanel')!;

export function setWorkspace(ws: Workspace) { if (S.ws !== ws) { S.ws = ws; emit('ws'); } }
function render() {
  bar.replaceChildren(...TABS.map((t, i) => h('button', { class: 'wstab' + (S.ws === t.id ? ' on' : ''), title: t.tip, onclick: () => setWorkspace(t.id) }, h('span', { class: 'wsn' }, String(i + 1)), t.label)));
  const usesView = S.ws === 'scene' || S.ws === 'camera';
  view.hidden = !usesView; panel.hidden = usesView;
  document.body.dataset.ws = S.ws;
  if (S.ws === 'script') scriptPanel(panel);
  else if (S.ws === 'library') libraryPanel(panel);
  else if (S.ws === 'export') exportPanel(panel);
  else { panel.replaceChildren(); redraw(); }
}
on('ws', render);
on('project', () => { if (S.ws === 'script' || S.ws === 'export') render(); });
on('select', refreshLibraryPanel);
onLibrary(refreshLibraryPanel);
window.addEventListener('keydown', (e) => {
  if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return;
  const i = +e.key; if (i >= 1 && i <= TABS.length) { e.preventDefault(); setWorkspace(TABS[i - 1].id); }
});
render();
export { onRenderChanged };
