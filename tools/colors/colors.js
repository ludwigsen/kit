document.addEventListener('DOMContentLoaded', () => {

// ── Utilities ──────────────────────────────────────────
function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
  if (hex.length !== 6 || !/^[0-9a-f]+$/i.test(hex)) return null;
  const n = parseInt(hex, 16);
  return { r: (n>>16)&255, g: (n>>8)&255, b: n&255 };
}

function rgbToHex({r,g,b}) {
  return '#' + [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}

function rgbToHsl({r,g,b}) {
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h,s, l=(max+min)/2;
  if (max===min) { h=s=0; }
  else {
    const d=max-min; s=l>.5?d/(2-max-min):d/(max+min);
    switch(max){
      case r: h=((g-b)/d+(g<b?6:0))/6; break;
      case g: h=((b-r)/d+2)/6; break;
      case b: h=((r-g)/d+4)/6; break;
    }
  }
  return { h: Math.round(h*360), s: Math.round(s*100), l: Math.round(l*100) };
}

function hslToRgb(h,s,l) {
  s/=100; l/=100;
  const k=n=>(n+h/30)%12;
  const a=s*Math.min(l,1-l);
  const f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));
  return { r:Math.round(f(0)*255), g:Math.round(f(8)*255), b:Math.round(f(4)*255) };
}

function luminance({r,g,b}) {
  const [rr,gg,bb] = [r,g,b].map(v=>{v/=255; return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);});
  return .2126*rr+.7152*gg+.0722*bb;
}

function contrastRatio(c1,c2) {
  const l1=luminance(c1), l2=luminance(c2);
  return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
}

// ── State ─────────────────────────────────────────────
let current = { h:225, s:88, l:64 };
let savedColors = JSON.parse(localStorage.getItem('kit-colors')||'[]');

// ── DOM refs ───────────────────────────────────────────
const mainSwatch    = document.getElementById('mainSwatch');
const swatchHex     = document.getElementById('swatchHex');
const swatchHsl     = document.getElementById('swatchHsl');
const colorPicker   = document.getElementById('colorPicker');
const hexInput      = document.getElementById('hexInput');
const rgbInput      = document.getElementById('rgbInput');
const hslInput      = document.getElementById('hslInput');
const cssInput      = document.getElementById('cssInput');
const sliderH       = document.getElementById('sliderH');
const sliderS       = document.getElementById('sliderS');
const sliderL       = document.getElementById('sliderL');
const valH          = document.getElementById('valH');
const valS          = document.getElementById('valS');
const valL          = document.getElementById('valL');
const bgInput       = document.getElementById('bgInput');
const bgPicker      = document.getElementById('bgPicker');
const contrastPreview = document.getElementById('contrastPreview');
const contrastRatioEl = document.getElementById('contrastRatio');
const wcagBadges    = document.getElementById('wcagBadges');
const scaleRow      = document.getElementById('scaleRow');
const scaleLabels   = document.getElementById('scaleLabels');
const btnSave       = document.getElementById('btnSave');
const paletteGrid   = document.getElementById('paletteGrid');
const paletteEmpty  = document.getElementById('paletteEmpty');
const toast         = document.getElementById('toast');

// ── Update all UI from current HSL ────────────────────
function updateAll() {
  const {h,s,l} = current;
  const rgb = hslToRgb(h,s,l);
  const hex = rgbToHex(rgb);

  // Swatch
  mainSwatch.style.background = hex;
  swatchHex.textContent = hex.toUpperCase();
  swatchHsl.textContent = `hsl(${h}, ${s}%, ${l}%)`;

  // Native picker sync
  colorPicker.value = hex;

  // Sliders
  sliderH.value=h; sliderS.value=s; sliderL.value=l;
  valH.textContent=h; valS.textContent=s; valL.textContent=l;
  updateSliderColors();

  // Inputs
  hexInput.value = hex.toUpperCase();
  rgbInput.value = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
  hslInput.value = `${h}, ${s}%, ${l}%`;
  cssInput.value = `hsl(${h}, ${s}%, ${l}%)`;

  // Contrast
  updateContrast(rgb);

  // Scale
  buildScale(h,s);
}

function updateSliderColors() {
  const {h,s,l} = current;
  sliderS.style.background = `linear-gradient(to right, hsl(${h},0%,${l}%), hsl(${h},100%,${l}%))`;
  sliderL.style.background = `linear-gradient(to right, hsl(${h},${s}%,0%), hsl(${h},${s}%,50%), hsl(${h},${s}%,100%))`;
}

function updateContrast(fgRgb) {
  const bgHex = bgInput.value.trim();
  const bgRgb = hexToRgb(bgHex);
  if (!bgRgb) { contrastRatioEl.textContent='—'; wcagBadges.innerHTML=''; return; }

  const hex = rgbToHex(fgRgb);
  contrastPreview.style.background = bgHex;
  contrastPreview.style.color = hex;

  const ratio = contrastRatio(fgRgb, bgRgb);
  contrastRatioEl.textContent = ratio.toFixed(2) + ':1';

  const aa   = ratio >= 4.5;
  const aaLg = ratio >= 3;
  const aaa  = ratio >= 7;
  wcagBadges.innerHTML = `
    <span class="badge ${aaa?'badge-pass':'badge-fail'}">AAA</span>
    <span class="badge ${aa?'badge-pass':'badge-fail'}">AA</span>
    <span class="badge ${aaLg?'badge-pass':'badge-fail'}">AA Lg</span>
  `;
}

function buildScale(h,s) {
  const steps = [95,85,75,65,55,45,35,25,15,8];
  scaleRow.innerHTML = '';
  scaleLabels.innerHTML = '';
  steps.forEach(lv => {
    const rgb = hslToRgb(h,s,lv);
    const hex = rgbToHex(rgb);
    const div = document.createElement('div');
    div.className = 'scale-swatch';
    div.style.background = hex;
    div.title = `${hex.toUpperCase()} — L:${lv}`;
    div.addEventListener('click', () => {
      current = { h, s, l: lv };
      updateAll();
    });
    scaleRow.appendChild(div);

    const lbl = document.createElement('span');
    lbl.textContent = lv;
    scaleLabels.appendChild(lbl);
  });
}

// ── Inputs: parse and update ─────────────────────────
hexInput.addEventListener('input', () => {
  const rgb = hexToRgb(hexInput.value.trim());
  if (rgb) { hexInput.classList.remove('error'); current = rgbToHsl(rgb); updateAll(); }
  else hexInput.classList.add('error');
});

rgbInput.addEventListener('input', () => {
  const m = rgbInput.value.match(/^\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*$/);
  if (m) {
    const rgb = {r:+m[1],g:+m[2],b:+m[3]};
    if (rgb.r<=255&&rgb.g<=255&&rgb.b<=255) {
      rgbInput.classList.remove('error');
      current = rgbToHsl(rgb);
      updateAll();
      return;
    }
  }
  rgbInput.classList.add('error');
});

hslInput.addEventListener('input', () => {
  const m = hslInput.value.match(/^\s*(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*$/);
  if (m && +m[1]<=360 && +m[2]<=100 && +m[3]<=100) {
    hslInput.classList.remove('error');
    current = {h:+m[1],s:+m[2],l:+m[3]};
    updateAll();
  } else hslInput.classList.add('error');
});

colorPicker.addEventListener('input', () => {
  const rgb = hexToRgb(colorPicker.value);
  if (rgb) { current = rgbToHsl(rgb); updateAll(); }
});

sliderH.addEventListener('input', () => { current.h=+sliderH.value; updateAll(); });
sliderS.addEventListener('input', () => { current.s=+sliderS.value; updateAll(); });
sliderL.addEventListener('input', () => { current.l=+sliderL.value; updateAll(); });

bgInput.addEventListener('input', () => {
  const rgb = hexToRgb(bgInput.value.trim());
  if (rgb) { bgPicker.value = rgbToHex(rgb); updateContrast(hslToRgb(current.h,current.s,current.l)); }
});
bgPicker.addEventListener('input', () => {
  bgInput.value = bgPicker.value.toUpperCase();
  updateContrast(hslToRgb(current.h,current.s,current.l));
});

// ── Copy buttons ──────────────────────────────────────
document.querySelectorAll('[data-copy]').forEach(btn => {
  btn.addEventListener('click', () => {
    const map = { hex: hexInput, rgb: rgbInput, hsl: hslInput, css: cssInput };
    const val = map[btn.dataset.copy].value;
    navigator.clipboard.writeText(val).then(() => {
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(()=>{ btn.textContent='Copy'; btn.classList.remove('copied'); }, 1500);
    });
  });
});

// ── Saved palette ─────────────────────────────────────
function renderPalette() {
  paletteGrid.innerHTML = '';
  if (savedColors.length === 0) {
    paletteGrid.appendChild(paletteEmpty);
    paletteEmpty.style.display = '';
    return;
  }
  savedColors.forEach((hex, i) => {
    const chip = document.createElement('div');
    chip.className = 'palette-chip';
    chip.innerHTML = `
      <div class="palette-chip-dot" style="background:${hex}"></div>
      <span class="palette-chip-hex">${hex.toUpperCase()}</span>
      <button class="palette-chip-remove" data-i="${i}" title="Remove">×</button>
    `;
    chip.addEventListener('click', (e) => {
      if (e.target.classList.contains('palette-chip-remove')) return;
      const rgb = hexToRgb(hex);
      if (rgb) { current = rgbToHsl(rgb); updateAll(); }
    });
    chip.querySelector('.palette-chip-remove').addEventListener('click', () => {
      savedColors.splice(i, 1);
      localStorage.setItem('kit-colors', JSON.stringify(savedColors));
      renderPalette();
    });
    paletteGrid.appendChild(chip);
  });
}

btnSave.addEventListener('click', () => {
  const hex = hexInput.value.trim().toUpperCase();
  if (!hexToRgb(hex)) return;
  if (savedColors.includes(hex)) { showToast(`${hex} already saved`); return; }
  savedColors.push(hex);
  localStorage.setItem('kit-colors', JSON.stringify(savedColors));
  renderPalette();
  showToast(`Saved ${hex}`);
});

// ── Toast ─────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

// ── Init ──────────────────────────────────────────────
renderPalette();
updateAll();

});