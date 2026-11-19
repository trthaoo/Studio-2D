// The caption and sign font the engine draws with ("Cap" = Poppins 800).
import capUrl from '@fontsource/poppins/files/poppins-latin-800-normal.woff2?url';
export async function loadFonts() {
  try { const f = new FontFace('Cap', `url(${capUrl})`, { weight: '800' }); await f.load(); document.fonts.add(f); }
  catch (e) { console.warn('caption font', e); }
}
