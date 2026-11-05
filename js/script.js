/* ================= CAMPAIGN IMAGERY ================= */
const posterPhotoSrc = "assets/images/img_9783.jpg";
const heroPhotoSrc = "assets/images/jjumaru-hero.jpg";
const apcLogoSrc = "assets/images/sdp-logo.png";

const heroPhoto = document.getElementById('heroPhoto');
heroPhoto.src = heroPhotoSrc;
heroPhoto.addEventListener('load', () => heroPhoto.classList.add('loaded'));

/* ================= MASTHEAD ================= */
const masthead = document.getElementById('masthead');
const syncMasthead = () => masthead.classList.toggle('scrolled', window.scrollY > 36);
syncMasthead();
window.addEventListener('scroll', syncMasthead, { passive: true });

/* ================= POSTER STUDIO ================= */
const uploadZone = document.getElementById('uploadZone');
const supporterUpload = document.getElementById('supporterUpload');
const supporterThumb = document.getElementById('supporterThumb');
const uploadTxt = document.getElementById('uploadTxt');
const downloadBtn = document.getElementById('downloadBtn');
const canvas = document.getElementById('posterCanvas');
const previewPlaceholder = document.getElementById('previewPlaceholder');
const ctx = canvas.getContext('2d');
const zoomRange = document.getElementById('zoomRange');

let supporterImg = null;
let posterCandidateImg = null;
let apcLogoImg = null;
let accentColor = '#0B6E3C';
let renderQueued = false;

/* The campaign image is enough to render a useful poster preview immediately.
   The supporter photo is optional for preview; after upload it replaces the placeholder. */
const preload = new Image();
const logoPreload = new Image();
preload.onload = () => {
  posterCandidateImg = preload;
  queueRender();
};
preload.onerror = () => {
  previewPlaceholder.textContent = 'Campaign image could not be loaded.';
};
preload.src = posterPhotoSrc;
logoPreload.onload = () => { apcLogoImg = logoPreload; queueRender(); };
logoPreload.src = apcLogoSrc;

uploadZone.addEventListener('click', () => supporterUpload.click());
uploadZone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    supporterUpload.click();
  }
});

['dragenter', 'dragover'].forEach(type => {
  uploadZone.addEventListener(type, event => {
    event.preventDefault();
    uploadZone.classList.add('dragging');
  });
});
['dragleave', 'drop'].forEach(type => {
  uploadZone.addEventListener(type, event => {
    event.preventDefault();
    uploadZone.classList.remove('dragging');
  });
});
uploadZone.addEventListener('drop', event => {
  const file = event.dataTransfer.files?.[0];
  if (file?.type.startsWith('image/')) loadSupporterPhoto(file);
});

supporterUpload.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (file) loadSupporterPhoto(file);
});

function loadSupporterPhoto(file) {
  const reader = new FileReader();
  reader.onload = event => {
    const img = new Image();
    img.onload = () => {
      supporterImg = img;
      supporterThumb.src = event.target.result;
      supporterThumb.classList.add('visible');
      uploadTxt.innerHTML = 'Photo selected<small>Click or drop another photo to change</small>';
      uploadZone.classList.add('has-photo');
      downloadBtn.classList.add('ready');
      queueRender();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

document.querySelectorAll('.swatch').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.swatch').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    accentColor = btn.dataset.color;
    queueRender();
  });
});

['supporterName', 'slogan', 'hashtag'].forEach(id => {
  document.getElementById(id).addEventListener('input', queueRender);
});
zoomRange.addEventListener('input', queueRender);

function queueRender() {
  if (!posterCandidateImg) return;
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    drawPoster();
  });
}

function drawCoverImage(context, img, x, y, w, h, zoomPct = 100) {
  const zoom = zoomPct / 100;
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let baseW, baseH;
  if (imgRatio > boxRatio) {
    baseH = img.height;
    baseW = baseH * boxRatio;
  } else {
    baseW = img.width;
    baseH = baseW / boxRatio;
  }
  const sw = baseW / zoom;
  const sh = baseH / zoom;
  const sx = Math.max(0, (img.width - sw) / 2);
  const sy = Math.max(0, (img.height - sh) / 2);
  context.drawImage(img, sx, sy, Math.min(sw, img.width), Math.min(sh, img.height), x, y, w, h);
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawBroomMark(context, cx, cy, scale, color) {
  context.save();
  context.translate(cx, cy);
  context.scale(scale, scale);
  context.strokeStyle = color;
  context.lineWidth = 6;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.beginPath();
  context.moveTo(-15, 32);
  context.lineTo(5, -32);
  context.lineTo(25, 32);
  context.stroke();
  context.restore();
}

function drawPoster() {
  const W = canvas.width;
  const H = canvas.height;
  const splitY = H * 0.60;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0C1D34';
  ctx.fillRect(0, 0, W, H);

  /* Main campaign portrait */
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, splitY);
  ctx.clip();
  drawCoverImage(ctx, posterCandidateImg, 0, 0, W, splitY, 100);
  const scrim = ctx.createLinearGradient(0, splitY - 260, 0, splitY);
  scrim.addColorStop(0, 'rgba(12,29,52,0)');
  scrim.addColorStop(1, 'rgba(12,29,52,.96)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, splitY - 260, W, 260);
  ctx.restore();

  if (apcLogoImg) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(48, 42, 76, 76, 10);
    ctx.clip();
    ctx.drawImage(apcLogoImg, 48, 42, 76, 76);
    ctx.restore();
  }
  ctx.fillStyle = '#D9BE83';
  ctx.font = '700 18px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('SDP · 2027', 142, 73);

  ctx.fillStyle = '#FBF9F2';
  ctx.font = '400 56px Georgia';
  ctx.fillText('Mp. Jeremiah Umaru ACA, ACTI, Ph.D.', 56, splitY - 96);
  ctx.font = '600 22px Arial';
  ctx.fillStyle = '#C7D2DE';
  ctx.fillText('Member, House of Representatives — Nasarawa North', 56, splitY - 58);

  /* Supporter section */
  ctx.fillStyle = '#0C1D34';
  ctx.fillRect(0, splitY, W, H - splitY);

  const suptR = 92;
  const suptCX = 56 + suptR;
  const suptCY = splitY + 90;
  ctx.save();
  ctx.beginPath();
  ctx.arc(suptCX, suptCY, suptR + 8, 0, Math.PI * 2);
  ctx.fillStyle = accentColor;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(suptCX, suptCY, suptR, 0, Math.PI * 2);
  ctx.clip();
  if (supporterImg) {
    drawCoverImage(ctx, supporterImg, suptCX - suptR, suptCY - suptR, suptR * 2, suptR * 2, parseInt(zoomRange.value, 10));
  } else {
    const placeholder = ctx.createLinearGradient(0, suptCY - suptR, 0, suptCY + suptR);
    placeholder.addColorStop(0, '#203D59');
    placeholder.addColorStop(1, '#10273E');
    ctx.fillStyle = placeholder;
    ctx.fillRect(suptCX - suptR, suptCY - suptR, suptR * 2, suptR * 2);
    ctx.fillStyle = '#D9BE83';
    ctx.font = '700 25px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('YOUR', suptCX, suptCY - 2);
    ctx.fillText('PHOTO', suptCX, suptCY + 27);
  }
  ctx.restore();

  const nameVal = document.getElementById('supporterName').value.trim() || 'Your Name';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#93A0AF';
  ctx.font = '600 18px Arial';
  ctx.fillText('SUPPORTED BY', suptCX + suptR + 32, suptCY - 18);
  ctx.fillStyle = '#FBF9F2';
  ctx.font = '400 34px Georgia';
  ctx.fillText(nameVal, suptCX + suptR + 32, suptCY + 18);
  ctx.fillStyle = '#93A0AF';
  ctx.font = '400 18px Arial';
  ctx.fillText('Nasarawa North · SDP Supporter', suptCX + suptR + 32, suptCY + 46);

  const barY = splitY + 210;
  ctx.strokeStyle = 'rgba(251,249,242,.16)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(56, barY);
  ctx.lineTo(W - 56, barY);
  ctx.stroke();

  const sloganVal = document.getElementById('slogan').value.trim() || 'I Support Sabon Salo For Continuity';
  ctx.fillStyle = accentColor;
  ctx.font = '400 40px Georgia';
  ctx.textAlign = 'center';
  wrapCenteredText(ctx, sloganVal, W / 2, barY + 66, W - 160, 46);

  const hashVal = document.getElementById('hashtag').value.trim() || '#JJUmaruForNasarawaNorth';
  ctx.font = '600 20px Arial';
  ctx.fillStyle = '#93A0AF';
  ctx.fillText(hashVal, W / 2, H - 44);

  canvas.style.display = 'block';
  previewPlaceholder.style.display = 'none';
}

function wrapCenteredText(context, text, cx, y, maxWidth, lineHeight) {
  const words = text.split(/\s+/).filter(Boolean);
  let line = '';
  const lines = [];
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (context.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((lineText, index) => context.fillText(lineText, cx, startY + index * lineHeight));
}

/* ================= DOWNLOAD ================= */
downloadBtn.addEventListener('click', () => {
  if (!posterCandidateImg) return;
  const nameVal = (document.getElementById('supporterName').value.trim() || 'supporter')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `jjumaru-poster-${nameVal || 'supporter'}.png`;
    link.href = url;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
});
