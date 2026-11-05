import { initNavigation, toast } from './ui.js';
import { createPosterEngine } from './poster/engine.js';

initNavigation();

const $ = s => document.querySelector(s);
const uploadZone = $('#uploadZone'), fileInput = $('#supporterUpload'), avatar = $('#uploadAvatar'), uploadTitle = $('#uploadTitle');
const nameInput = $('#supporterName'), zoomInput = $('#zoomRange'), zoomValue = $('#zoomValue');
const posX = $('#posX'), posY = $('#posY');
const downloadBtn = $('#downloadBtn'), shareBtn = $('#shareBtn'), resetBtn = $('#resetBtn'), status = $('#previewStatus'), posterState = $('#posterState');
const steps = [...document.querySelectorAll('.step')];
let photoUrl = null;

function setStep(n) { steps.forEach((el, i) => el.classList.toggle('active', i < n)); }
function updateSteps() { setStep(!engine.hasSupporter ? 1 : nameInput.value.trim() ? 3 : 2); }

const engine = createPosterEngine({
  canvas: $('#posterCanvas'),
  candidateSrc: 'assets/images/img_9783.jpg',
  logoSrc: 'assets/images/sdp-logo.png',
  onState: ({ hasSupporter, name }) => {
    status.textContent = hasSupporter ? 'Personalised' : 'Ready';
    posterState.textContent = hasSupporter ? (name ? `Prepared for ${name}` : 'Personalised poster') : 'Base poster ready';
  },
  onPosition: ({ x, y }) => { posX.value = Math.round(x * 100); posY.value = Math.round(y * 100); }
});

engine.ready().catch(() => { status.textContent = 'Unavailable'; posterState.textContent = 'Poster preview unavailable'; toast('The poster image could not be loaded. Please refresh the page.'); });

nameInput.addEventListener('input', () => { engine.set({ name: nameInput.value.trim() }); updateSteps(); });
zoomInput.addEventListener('input', () => { zoomValue.value = `${zoomInput.value}%`; engine.setZoom(Number(zoomInput.value)); });
[posX, posY].forEach(input => input.addEventListener('input', () => engine.setPosition(Number(posX.value) / 100, Number(posY.value) / 100)));

uploadZone.addEventListener('click', () => fileInput.click());
['dragenter', 'dragover'].forEach(type => uploadZone.addEventListener(type, e => { e.preventDefault(); uploadZone.classList.add('dragging'); }));
['dragleave', 'drop'].forEach(type => uploadZone.addEventListener(type, e => { e.preventDefault(); uploadZone.classList.remove('dragging'); }));
uploadZone.addEventListener('drop', e => handleFile(e.dataTransfer.files?.[0]));
fileInput.addEventListener('change', e => handleFile(e.target.files?.[0]));

function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) return toast('Please choose an image file.');
  if (file.size > 8 * 1024 * 1024) return toast('Please choose an image under 8 MB.');
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = url;
    engine.setSupporter(img);
    avatar.innerHTML = '';
    const thumb = new Image(); thumb.src = url; thumb.alt = 'Selected supporter photo';
    avatar.appendChild(thumb);
    uploadTitle.textContent = 'Photo selected';
    updateSteps();
    toast('Photo added. Drag it on the poster to position it.');
  };
  img.onerror = () => { URL.revokeObjectURL(url); toast('That image could not be read.'); };
  img.src = url;
}

document.querySelectorAll('.template-tab').forEach(tab => tab.addEventListener('click', () => {
  document.querySelectorAll('.template-tab').forEach(t => { const active = t === tab; t.classList.toggle('active', active); t.setAttribute('aria-selected', String(active)); });
  engine.setTemplate(tab.dataset.template);
}));

downloadBtn.addEventListener('click', async () => {
  const blob = await engine.blob(); if (!blob) return;
  const safe = (nameInput.value.trim() || 'supporter').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'supporter';
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `jjumaru-poster-${safe}.png`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Poster downloaded.');
});

shareBtn.addEventListener('click', async () => {
  const blob = await engine.blob(); if (!blob) return;
  const file = new File([blob], 'jjumaru-poster.png', { type: 'image/png' });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ title: 'Mp. Jeremiah Umaru poster', text: 'Mp. Jeremiah Umaru — Member, House of Representatives, Akwanga/Nas Eggon/Wamba. Vote for Continuity and Progress.', files: [file] }); }
    catch (e) { if (e.name !== 'AbortError') toast('Sharing was not available.'); }
  } else {
    try { await navigator.clipboard.writeText(location.href); toast('Sharing is not supported here. Page link copied; use Download instead.'); }
    catch { toast('Sharing is not supported here. Please use Download.'); }
  }
});

resetBtn.addEventListener('click', () => {
  engine.reset();
  nameInput.value = ''; zoomInput.value = '100'; zoomValue.value = '100%'; fileInput.value = '';
  if (photoUrl) { URL.revokeObjectURL(photoUrl); photoUrl = null; }
  avatar.innerHTML = '<span>+</span>'; uploadTitle.textContent = 'Upload a photo';
  document.querySelectorAll('.template-tab').forEach(t => { const active = t.dataset.template === 'classic'; t.classList.toggle('active', active); t.setAttribute('aria-selected', String(active)); });
  setStep(1);
  toast('Studio reset.');
});
