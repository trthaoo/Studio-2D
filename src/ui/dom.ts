// Tiny DOM helpers and the right-click menu.
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, any> = {}, ...kids: (Node | string | null | undefined | false)[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k in el && k !== 'list') (el as any)[k] = v;
    else el.setAttribute(k, String(v));
  }
  for (const c of kids) if (c != null && c !== false) el.append(c as any);
  return el;
}

export interface MenuItem { label: string; action?: () => void; checked?: boolean; disabled?: boolean; sep?: boolean; sub?: MenuItem[] }
let open: HTMLElement | null = null;
export function closeMenu() { open?.remove(); open = null; }
export function contextMenu(x: number, y: number, items: MenuItem[]) {
  closeMenu();
  const m = h('div', { class: 'ctxmenu' });
  for (const it of items) {
    if (it.sep) { m.append(h('div', { class: 'sep' })); continue; }
    const row = h('div', { class: 'item' + (it.disabled ? ' off' : '') + (it.checked ? ' checked' : '') }, h('span', { class: 'chk' }), it.label);
    if (!it.disabled && it.action) row.addEventListener('click', () => { closeMenu(); it.action!(); });
    m.append(row);
  }
  document.body.append(m);
  const r = m.getBoundingClientRect();
  m.style.left = Math.min(x, innerWidth - r.width - 4) + 'px'; m.style.top = Math.min(y, innerHeight - r.height - 4) + 'px';
  open = m;
}
window.addEventListener('pointerdown', (e) => { if (open && !open.contains(e.target as Node)) closeMenu(); }, true);
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

/** A small modal asking for text (window.prompt replacement that works everywhere). */
export function ask(title: string, value = '', multiline = false): Promise<string | null> {
  return new Promise((resolve) => {
    const input = multiline ? h('textarea', { value, rows: 6 }) : h('input', { value });
    const done = (v: string | null) => { back.remove(); resolve(v); };
    const back = h('div', { class: 'modal-back' },
      h('div', { class: 'modal' }, h('div', { class: 'title' }, title), input,
        h('div', { class: 'row' }, h('button', { onclick: () => done(null) }, 'Huỷ'), h('button', { class: 'primary', onclick: () => done((input as any).value) }, 'Đồng ý'))));
    input.addEventListener('keydown', (e: any) => { if (e.key === 'Enter' && (!multiline || e.ctrlKey)) done((input as any).value); if (e.key === 'Escape') done(null); e.stopPropagation(); });
    document.body.append(back); (input as any).focus(); (input as any).select?.();
  });
}

export const fmtTime = (t: number, fps = 30) => { const s = Math.floor(t), f = Math.round((t - s) * fps); const m = Math.floor(s / 60); return `${m}:${String(s % 60).padStart(2, '0')}.${String(f).padStart(2, '0')}`; };
export const KIND_COLOR: Record<string, string> = { char: '#ff8a5c', car: '#ffc928', prop: '#7fd17f', set: '#8a96a8', camera: '#6fb6ff', lamp: '#f2e38a', fx: '#ff6bd5' };
