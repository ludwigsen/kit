document.addEventListener('DOMContentLoaded', () => {

  // ── State ──────────────────────────────────────────────────────
  let currentDataUrl = '';
  let currentRawB64 = '';
  let currentMimeType = '';
  let currentFileName = '';

  // ── Elements ───────────────────────────────────────────────────
  const btnEncode     = document.getElementById('btn-encode');
  const btnDecode     = document.getElementById('btn-decode');
  const panelEncode   = document.getElementById('panel-encode');
  const panelDecode   = document.getElementById('panel-decode');

  // Encode
  const dropZone      = document.getElementById('drop-zone');
  const fileInput     = document.getElementById('file-input');
  const browseBtn     = document.getElementById('browse-btn');
  const encodeResult  = document.getElementById('encode-result');
  const resultMeta    = document.getElementById('result-meta');
  const previewImg    = document.getElementById('preview-img');
  const b64Output     = document.getElementById('b64-output');
  const copyDataUrl   = document.getElementById('copy-data-url');
  const copyRawB64    = document.getElementById('copy-raw-b64');
  const encodeReset   = document.getElementById('encode-reset');
  const formatRadios  = document.querySelectorAll('input[name="output-format"]');

  // Decode
  const b64Input      = document.getElementById('b64-input');
  const decodeBtn     = document.getElementById('decode-btn');
  const decodeReset   = document.getElementById('decode-reset');
  const decodeResult  = document.getElementById('decode-result');
  const decodeMeta    = document.getElementById('decode-meta');
  const decodeImg     = document.getElementById('decode-preview-img');
  const downloadBtn   = document.getElementById('download-btn');
  const decodeError   = document.getElementById('decode-error');
  const decodeErrMsg  = document.getElementById('decode-error-msg');

  // ── Mode switching ─────────────────────────────────────────────
  function setMode(mode) {
    const isEncode = mode === 'encode';
    btnEncode.classList.toggle('active', isEncode);
    btnDecode.classList.toggle('active', !isEncode);
    panelEncode.classList.toggle('hidden', !isEncode);
    panelDecode.classList.toggle('hidden', isEncode);
    lucide.createIcons();
  }

  btnEncode.addEventListener('click', () => setMode('encode'));
  btnDecode.addEventListener('click', () => setMode('decode'));

  // ── Encode: drop zone ──────────────────────────────────────────
  browseBtn.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('click', (e) => {
    if (e.target !== browseBtn) fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) processFile(fileInput.files[0]);
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  });

  function processFile(file) {
    currentFileName = file.name;
    currentMimeType = file.type || 'image/png';

    const reader = new FileReader();
    reader.onload = (e) => {
      currentDataUrl = e.target.result;
      // Strip the data URL prefix to get raw base64
      currentRawB64 = currentDataUrl.split(',')[1] || '';

      // Render preview
      previewImg.src = currentDataUrl;

      // Render meta
      const sizeKb = (file.size / 1024).toFixed(1);
      const b64Kb  = (currentRawB64.length / 1024).toFixed(1);
      resultMeta.innerHTML =
        `<span>${file.name}</span>` +
        `<span>${currentMimeType}</span>` +
        `<span>${sizeKb} KB → ${b64Kb} KB base64</span>`;

      // Render output
      updateOutput();

      // Show result
      dropZone.classList.add('hidden');
      encodeResult.classList.remove('hidden');
      lucide.createIcons();
    };
    reader.readAsDataURL(file);
  }

  function updateOutput() {
    const selected = document.querySelector('input[name="output-format"]:checked').value;
    b64Output.value = selected === 'raw' ? currentRawB64 : currentDataUrl;
  }

  formatRadios.forEach(r => r.addEventListener('change', updateOutput));

  // ── Encode: copy buttons ───────────────────────────────────────
  function flashSuccess(btn, label) {
    const original = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="check" width="13" height="13"></i> Copied`;
    btn.classList.add('success');
    lucide.createIcons();
    setTimeout(() => {
      btn.innerHTML = original;
      btn.classList.remove('success');
      lucide.createIcons();
    }, 1800);
  }

  copyDataUrl.addEventListener('click', () => {
    if (!currentDataUrl) return;
    navigator.clipboard.writeText(currentDataUrl).then(() => flashSuccess(copyDataUrl));
  });

  copyRawB64.addEventListener('click', () => {
    if (!currentRawB64) return;
    navigator.clipboard.writeText(currentRawB64).then(() => flashSuccess(copyRawB64));
  });

  encodeReset.addEventListener('click', () => {
    currentDataUrl = '';
    currentRawB64 = '';
    currentMimeType = '';
    currentFileName = '';
    fileInput.value = '';
    previewImg.src = '';
    b64Output.value = '';
    encodeResult.classList.add('hidden');
    dropZone.classList.remove('hidden');
  });

  // ── Decode ─────────────────────────────────────────────────────
  decodeBtn.addEventListener('click', () => {
    const raw = b64Input.value.trim();
    if (!raw) return;

    decodeError.classList.add('hidden');
    decodeResult.classList.add('hidden');

    try {
      let dataUrl = raw;
      let mime = 'image/png';

      if (!raw.startsWith('data:')) {
        // Attempt to detect from raw base64
        mime = detectMimeFromB64(raw) || 'image/png';
        dataUrl = `data:${mime};base64,${raw}`;
      } else {
        // Parse mime from data URL
        const match = raw.match(/^data:([^;]+);base64,/);
        if (match) mime = match[1];
      }

      // Validate by trying to load as image
      const img = new Image();
      img.onload = () => {
        decodeImg.src = dataUrl;
        const b64Part = dataUrl.split(',')[1] || '';
        const kb = (b64Part.length * 0.75 / 1024).toFixed(1);
        decodeMeta.innerHTML =
          `<span>${mime}</span>` +
          `<span>~${kb} KB</span>` +
          `<span>${img.naturalWidth} × ${img.naturalHeight} px</span>`;

        // Set up download
        downloadBtn.onclick = () => {
          const ext = mime.split('/')[1]?.split('+')[0] || 'png';
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `decoded-image.${ext}`;
          a.click();
        };

        decodeResult.classList.remove('hidden');
        lucide.createIcons();
      };
      img.onerror = () => {
        showDecodeError('Not a valid image. Check that the base64 string is complete and uncorrupted.');
      };
      img.src = dataUrl;

    } catch (err) {
      showDecodeError('Could not decode. Paste a full data URL or a raw base64 string.');
    }
  });

  function showDecodeError(msg) {
    decodeErrMsg.textContent = msg;
    decodeError.classList.remove('hidden');
    lucide.createIcons();
  }

  decodeReset.addEventListener('click', () => {
    b64Input.value = '';
    decodeResult.classList.add('hidden');
    decodeError.classList.add('hidden');
    decodeImg.src = '';
  });

  // ── Utility: detect mime from base64 magic bytes ───────────────
  function detectMimeFromB64(b64) {
    try {
      const bin = atob(b64.replace(/\s/g, '').slice(0, 16));
      const bytes = Array.from(bin).map(c => c.charCodeAt(0));
      if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'image/png';
      if (bytes[0] === 0xFF && bytes[1] === 0xD8) return 'image/jpeg';
      if (bytes[0] === 0x47 && bytes[1] === 0x49) return 'image/gif';
      if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[8] === 0x57) return 'image/webp';
      if (bytes[0] === 0x3C) return 'image/svg+xml';
    } catch (_) {}
    return null;
  }

});
