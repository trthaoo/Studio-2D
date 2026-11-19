// A small demo scene: an office, two characters, three cameras, cuts, lines and captions. Everything is keys.
import { SceneDoc, normalize } from './doc';

export function demoDoc(name: string): SceneDoc {
  return normalize({
    version: 1, name, fps: 30, width: 1080, height: 1920, duration: 6,
    stages: [{ id: 'office', name: 'Office', mood: 'day' }],
    objects: [
      { id: 'room', name: 'Office room', kind: 'set', stage: 'office', params: { type: 'room', opts: { kind: 'office', seed: 3, plate: 'BOSS' } }, tracks: {} },
      { id: 'sign', name: 'Wall sign', kind: 'prop', stage: 'office', params: { type: 'sign', text: 'NO RAISES', opts: { post: false, w: 0.8, h: 0.34, bg: '#d9342b', fg: '#ffffff' } }, tracks: { pos: [[0, [1.55, 1.3, -4.1]]], text: [[0, 'NO RAISES'], [4.8, 'NO RAISES|EVER']] } },
      { id: 'dan', name: 'Dan', kind: 'char', stage: 'office',
        params: { role: 'schemer', R: 0.2, shirt: '#ffc928', hair: '#5a3a22', hair2: '#7a5232', style: 'mess', build: 'average', outfit: 'polo', acc: [] },
        tracks: {
          pos: [[0, [2.3, 0, -1.3]], [1.4, [0.9, 0, -1.3], 'smooth']], rotY: [[0, -150], [1.4, -125]],
          walk: [[0, 1.9], [1.35, 0]], expr: [[0, 'smug'], [3.0, 'shock'], [4.9, 'dazed']],
          armL: [[0, 'down'], [3.25, 'shrug'], [4.8, 'down']], armR: [[0, 'down'], [0.9, 'point'], [1.8, 'down'], [3.25, 'shrug'], [4.8, 'down']],
          look: [[0, [1, 0, 0]]], say: [[0.6, 'Boss, I need a raise.'], [3.3, 'But I fixed the printer!']],
        } },
      { id: 'pat', name: 'Pat (boss)', kind: 'char', stage: 'office',
        params: { role: 'agent', R: 0.21, shirt: '#1f2a44', hair: '#1c1c24', hair2: '#3a3a48', style: 'bun', build: 'tall', outfit: 'suit', acc: ['glasses'], glasses: true },
        tracks: {
          pos: [[0, [-0.55, 0, -2.95]]], rotY: [[0, -60]], expr: [[0, 'calm'], [2.05, 'stern'], [4.9, 'grin']],
          armL: [[0, 'down'], [2.05, 'cross'], [4.85, 'down']], armR: [[0, 'down'], [2.05, 'cross'], [4.85, 'point']],
          say: [[2.1, 'Denied.'], [5.0, 'Nice try.']],
        } },
      { id: 'cam1', name: 'Wide', kind: 'camera', stage: 'office', params: {}, tracks: { pos: [[0, [0.3, 1.3, 2.7]], [2, [0.25, 1.25, 2.35]], [6, [0.2, 1.2, 2.0]]], target: [[0, [0.2, 0.8, -2.0]]], fov: [[0, 50]] } },
      { id: 'cam2', name: 'Close Dan', kind: 'camera', stage: 'office', params: {}, tracks: { pos: [[2.9, [0.2, 1.08, 0.95]], [4.8, [0.28, 1.04, 0.6]]], target: [[0, [0.9, 1.0, -1.3]]], fov: [[0, 34]], dof: [[0, 12]] } },
      { id: 'cam3', name: 'Close Pat', kind: 'camera', stage: 'office', params: {}, tracks: { pos: [[1.9, [0.0, 1.14, -0.35]], [3, [-0.08, 1.12, -0.6]]], target: [[0, [-0.55, 1.05, -2.95]]], fov: [[0, 34]] } },
    ],
    cuts: [{ t: 0, camera: 'cam1' }, { t: 2.0, camera: 'cam3' }, { t: 3.0, camera: 'cam2' }, { t: 4.8, camera: 'cam1', dissolve: 9 }],
    captions: [
      { t: 0.6, text: 'Boss,' }, { t: 0.86, text: 'I need' }, { t: 1.2, text: 'a raise.' }, { t: 1.75, text: '' },
      { t: 2.1, text: 'Denied.' }, { t: 2.7, text: '' },
      { t: 3.3, text: 'But I' }, { t: 3.62, text: 'fixed the' }, { t: 4.05, text: 'printer!' }, { t: 4.7, text: '' },
      { t: 5.0, text: 'Nice try.' }, { t: 5.7, text: '' },
    ],
    audio: [],
    notes: 'Demo: every object here is editable. Try dragging Dan in the view, a key on the timeline, or a dot on his hands.',
  });
}
