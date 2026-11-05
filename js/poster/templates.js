export const TEMPLATES = {
  classic: { label: 'Signature' },
  modern: { label: 'Editorial' }
};

const C = { green: '#075B35', deep: '#063D27', orange: '#F47B20', white: '#FFFFFF', pale: '#EAF2EC', ink: '#123326', muted: '#B9D0C1' };

// The supporter photo circle. Shared with the engine so dragging can hit-test it.
export const PHOTO_CIRCLE = { cx: 170, cy: 1040, r: 112 };
export const DEFAULT_POSITION = { x: 0.5, y: 0.3 };

export function coverMetrics(img, w, h, zoom = 100) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const z = Math.max(1, zoom / 100), ir = iw / ih, br = w / h;
  let sw, sh;
  if (ir > br) { sh = ih; sw = sh * br; } else { sw = iw; sh = sw / br; }
  sw = Math.min(iw, sw / z); sh = Math.min(ih, sh / z);
  return { sw, sh, slackX: iw - sw, slackY: ih - sh };
}

// px / py (0..1) choose which part of the image stays visible once it is cropped or zoomed.
export function drawCover(ctx, img, x, y, w, h, zoom = 100, px = 0.5, py = 0.5) {
  const m = coverMetrics(img, w, h, zoom);
  const clamp = v => Math.min(1, Math.max(0, v));
  ctx.drawImage(img, m.slackX * clamp(px), m.slackY * clamp(py), m.sw, m.sh, x, y, w, h);
}

// ctx.roundRect is missing from older browsers; fall back to arcs so the poster still renders.
function roundRectPath(ctx, x, y, w, h, r) {
  if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
  r = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fit(ctx, value, maxWidth, maxSize, minSize = 20, weight = 800, family = 'Arial') {
  let size = maxSize;
  do { ctx.font = `${weight} ${size}px ${family}`; if (ctx.measureText(value).width <= maxWidth) break; size--; } while (size > minSize);
  return size;
}
function roundedPhoto(ctx, img, cx, cy, r, zoom, pos) {
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  if (img) drawCover(ctx, img, cx - r, cy - r, r * 2, r * 2, zoom, pos.x, pos.y);
  else { ctx.fillStyle = '#DDE9DF'; ctx.fillRect(cx - r, cy - r, r * 2, r * 2); ctx.fillStyle = C.green; ctx.textAlign = 'center'; ctx.font = '700 22px Arial'; ctx.fillText('YOUR', cx, cy - 4); ctx.fillText('PHOTO', cx, cy + 25); }
  ctx.restore();
}
function drawLogo(ctx, img, x, y, size) {
  if (!img?.complete || !img.naturalWidth) return;
  const w = size * img.naturalWidth / img.naturalHeight;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.16)'; ctx.shadowBlur = 18; ctx.fillStyle = '#fff'; ctx.beginPath(); roundRectPath(ctx, x - 10, y - 10, w + 20, size + 20, 14); ctx.fill(); ctx.drawImage(img, x, y, w, size); ctx.restore();
}
function candidateTitle(ctx) {
  const name = 'MP. JEREMIAH UMARU';
  ctx.fillStyle = C.white; ctx.font = `900 ${fit(ctx, name, 950, 70, 42, 900)}px Arial`; ctx.fillText(name, 58, 660);
  ctx.fillStyle = C.orange; ctx.fillRect(60, 682, 92, 8);
  ctx.fillStyle = C.white; ctx.font = '700 24px Arial'; ctx.fillText('ACA, ACTI, Ph.D.', 60, 730);
  ctx.fillStyle = '#E5EEE8'; ctx.font = '600 19px Arial'; ctx.fillText('HOUSE OF REPRESENTATIVES  ·  NASARAWA NORTH', 60, 774);
}
function supporterBlock(ctx, supporter, name, zoom, pos, variant) {
  const y = 850;
  const modern = variant === 'modern';
  ctx.fillStyle = modern ? C.white : C.deep; ctx.fillRect(0, y, 1080, 500);
  if (modern) { ctx.fillStyle = C.orange; ctx.fillRect(0, y, 18, 500); }
  const { cx, cy, r } = PHOTO_CIRCLE;
  ctx.beginPath(); ctx.arc(cx, cy, r + 10, 0, Math.PI * 2); ctx.fillStyle = C.orange; ctx.fill();
  roundedPhoto(ctx, supporter, cx, cy, r, zoom, pos);

  const tx = 330, primary = modern ? C.ink : C.white, secondary = modern ? '#64766B' : C.muted;
  ctx.textAlign = 'left';
  const label = 'PROUD SUPPORTER OF SABON SALO';
  ctx.fillStyle = C.orange; ctx.font = `800 ${fit(ctx, label, 690, 28, 16)}px Arial`; ctx.fillText(label, tx, 970);
  const displayName = (name || 'Your Name').trim();
  ctx.fillStyle = primary; ctx.font = `800 ${fit(ctx, displayName, 690, 49, 25)}px Arial`; ctx.fillText(displayName, tx, 1040);
  ctx.fillStyle = secondary; ctx.font = '600 20px Arial'; ctx.fillText('Nasarawa North  ·  SDP', tx, 1085);

  ctx.strokeStyle = modern ? '#DCE6DE' : 'rgba(255,255,255,.18)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(60, 1190); ctx.lineTo(1020, 1190); ctx.stroke();

  // Footer line under the photo.
  const area = 'AKWANGA/NASARAWA EGGON/WAMBA CONSTITUENCY';
  ctx.fillStyle = modern ? C.green : C.white; ctx.font = `800 ${fit(ctx, area, 640, 20, 14)}px Arial`; ctx.fillText(area, 60, 1238);
  ctx.textAlign = 'right'; ctx.fillStyle = modern ? '#64766B' : C.muted; ctx.font = '700 17px Arial'; ctx.fillText('2027', 1020, 1238); ctx.textAlign = 'left';

  // Call-to-action band.
  ctx.fillStyle = C.orange; ctx.fillRect(0, 1262, 1080, 88);
  const cta = 'VOTE FOR CONTINUITY AND PROGRESS';
  ctx.fillStyle = C.deep; ctx.font = `900 ${fit(ctx, cta, 960, 40, 22, 900)}px Arial`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(cta, 540, 1306);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}
export function renderPoster({ ctx, candidate, logoImg, supporter, name, zoom, position = DEFAULT_POSITION, template }) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = C.deep; ctx.fillRect(0, 0, 1080, 1350);
  if (template === 'modern') {
    ctx.fillStyle = '#F2F5F0'; ctx.fillRect(0, 0, 1080, 1350);
    ctx.save(); ctx.beginPath(); roundRectPath(ctx, 24, 24, 1032, 806, 24); ctx.clip();
    drawCover(ctx, candidate, 24, 24, 1032, 806, 100);
    const g = ctx.createLinearGradient(0, 450, 0, 830); g.addColorStop(0, 'rgba(4,43,27,0)'); g.addColorStop(1, 'rgba(4,43,27,.96)'); ctx.fillStyle = g; ctx.fillRect(24, 430, 1032, 400); ctx.restore();
    drawLogo(ctx, logoImg, 58, 58, 72); candidateTitle(ctx); supporterBlock(ctx, supporter, name, zoom, position, 'modern');
  } else {
    drawCover(ctx, candidate, 0, 0, 1080, 850, 100);
    const g = ctx.createLinearGradient(0, 390, 0, 850); g.addColorStop(0, 'rgba(4,43,27,0)'); g.addColorStop(1, 'rgba(4,43,27,.98)'); ctx.fillStyle = g; ctx.fillRect(0, 390, 1080, 460);
    drawLogo(ctx, logoImg, 58, 58, 76); candidateTitle(ctx); supporterBlock(ctx, supporter, name, zoom, position, 'classic');
  }
}
