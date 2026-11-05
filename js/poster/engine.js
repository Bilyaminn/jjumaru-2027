import { renderPoster, TEMPLATES, PHOTO_CIRCLE, DEFAULT_POSITION, coverMetrics } from './templates.js';

const clamp = v => Math.min(1, Math.max(0, v));

export function createPosterEngine({ canvas, candidateSrc, logoSrc, onState, onPosition }) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const candidate = new Image(), logoImg = new Image();
  let supporter = null, template = 'classic', zoom = 100, renderQueued = false;
  let pos = { ...DEFAULT_POSITION };
  const state = { name: '' };

  candidate.decoding = 'async'; logoImg.decoding = 'async';
  const candidateReady = new Promise((resolve, reject) => {
    candidate.onload = resolve;
    candidate.onerror = () => reject(new Error('Candidate portrait failed to load'));
    candidate.src = candidateSrc;
  });
  logoImg.onload = () => queue(); logoImg.onerror = () => queue(); logoImg.src = logoSrc;

  function set(partial) { Object.assign(state, partial); queue(); }
  function setSupporter(img) { supporter = img; pos = { ...DEFAULT_POSITION }; onPosition?.({ ...pos }); queue(); }
  function setTemplate(value) { if (TEMPLATES[value]) { template = value; queue(); } }
  function setZoom(value) { zoom = value; queue(); }
  function setPosition(x, y) { pos = { x: clamp(x), y: clamp(y) }; queue(); }
  function queue() { if (renderQueued) return; renderQueued = true; requestAnimationFrame(() => { renderQueued = false; draw(); }); }
  function draw() {
    if (!candidate.complete || !candidate.naturalWidth) return;
    renderPoster({ ctx, candidate, logoImg, supporter, name: state.name, zoom, position: pos, template });
    onState?.({ template, hasSupporter: Boolean(supporter), name: state.name });
  }
  async function ready() { await candidateReady; if (document.fonts?.ready) await document.fonts.ready; queue(); }
  function reset() { supporter = null; template = 'classic'; zoom = 100; pos = { ...DEFAULT_POSITION }; state.name = ''; onPosition?.({ ...pos }); queue(); }
  function blob() { return new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1)); }

  // Drag the supporter photo on the poster to reposition it.
  let drag = null;
  const toCanvas = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect(), k = canvas.width / rect.width;
    return { x: (clientX - rect.left) * k, y: (clientY - rect.top) * k };
  };
  const hit = p => Math.hypot(p.x - PHOTO_CIRCLE.cx, p.y - PHOTO_CIRCLE.cy) <= PHOTO_CIRCLE.r + 12;
  function begin(clientX, clientY) {
    if (!supporter) return false;
    const p = toCanvas(clientX, clientY);
    if (!hit(p)) return false;
    drag = p; canvas.classList.add('is-dragging');
    return true;
  }
  function move(clientX, clientY) {
    if (!drag) return;
    const p = toCanvas(clientX, clientY), dx = p.x - drag.x, dy = p.y - drag.y;
    drag = p;
    const size = PHOTO_CIRCLE.r * 2, m = coverMetrics(supporter, size, size, zoom), scale = m.sw / size;
    if (m.slackX > 0.5) pos.x = clamp(pos.x - dx * scale / m.slackX);
    if (m.slackY > 0.5) pos.y = clamp(pos.y - dy * scale / m.slackY);
    queue(); onPosition?.({ ...pos });
  }
  function end() { drag = null; canvas.classList.remove('is-dragging'); }

  canvas.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch') return;
    if (begin(e.clientX, e.clientY)) { canvas.setPointerCapture?.(e.pointerId); e.preventDefault(); }
  });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    if (drag) move(e.clientX, e.clientY);
    else canvas.classList.toggle('can-drag', Boolean(supporter) && hit(toCanvas(e.clientX, e.clientY)));
  });
  ['pointerup', 'pointercancel'].forEach(type => canvas.addEventListener(type, e => { if (e.pointerType !== 'touch') end(); }));
  canvas.addEventListener('pointerleave', () => { if (!drag) canvas.classList.remove('can-drag'); });
  // Touch uses its own listeners so the page still scrolls when the finger is not on the photo.
  canvas.addEventListener('touchstart', e => { const t = e.touches[0]; if (t && begin(t.clientX, t.clientY)) e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchmove', e => { if (!drag) return; e.preventDefault(); const t = e.touches[0]; if (t) move(t.clientX, t.clientY); }, { passive: false });
  ['touchend', 'touchcancel'].forEach(type => canvas.addEventListener(type, end));

  return { ready, set, setSupporter, setTemplate, setZoom, setPosition, reset, blob, get template() { return template; }, get state() { return state; }, get hasSupporter() { return Boolean(supporter); } };
}
