document.addEventListener('DOMContentLoaded', () => {

  // ── State ──────────────────────────────────────────────────────────
  const state = {
    version: '4',
    casing: 'lower',
    hyphens: 'yes',
    count: 1,
  };

  // ── DOM refs ───────────────────────────────────────────────────────
  const outputArea    = document.getElementById('output-area');
  const actionRow     = document.getElementById('action-row');
  const resultMeta    = document.getElementById('result-meta');
  const countDisplay  = document.getElementById('count-display');
  const btnGenerate   = document.getElementById('btn-generate');
  const btnCopyAll    = document.getElementById('btn-copy-all');
  const btnRegenerate = document.getElementById('btn-regenerate');
  const countDec      = document.getElementById('count-dec');
  const countInc      = document.getElementById('count-inc');

  // ── Segmented controls ─────────────────────────────────────────────
  function bindSeg(groupId, stateKey) {
    const group = document.getElementById(groupId);
    group.querySelectorAll('.seg').forEach(btn => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('.seg').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state[stateKey] = btn.dataset.value;
      });
    });
  }

  bindSeg('version-seg',  'version');
  bindSeg('case-seg',     'casing');
  bindSeg('hyphens-seg',  'hyphens');

  // ── Count control ──────────────────────────────────────────────────
  const MIN_COUNT = 1;
  const MAX_COUNT = 50;

  function setCount(n) {
    state.count = Math.min(MAX_COUNT, Math.max(MIN_COUNT, n));
    countDisplay.textContent = state.count;
  }

  countDec.addEventListener('click', () => setCount(state.count - 1));
  countInc.addEventListener('click', () => setCount(state.count + 1));

  // ── UUID generation ────────────────────────────────────────────────

  function uuidV4() {
    // Use crypto.randomUUID if available, else manual fallback
    if (crypto.randomUUID) return crypto.randomUUID();
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

  function uuidV1() {
    // Pseudo-v1: timestamp-based, not RFC-compliant node/clock sequence
    // Suitable for uniqueness tooling; label clearly
    const now = Date.now();
    const timeHex = now.toString(16).padStart(12, '0');
    const rand = () => crypto.getRandomValues(new Uint8Array(2));

    const timeLow     = timeHex.slice(-8);
    const timeMid     = timeHex.slice(-12, -8);
    const timeHiVer   = '1' + timeHex.slice(0, 3);
    const clockSeq    = ((rand()[0] & 0x3f) | 0x80).toString(16).padStart(2, '0')
                      + rand()[0].toString(16).padStart(2, '0');
    const node        = Array.from(crypto.getRandomValues(new Uint8Array(6)))
                          .map(b => b.toString(16).padStart(2, '0')).join('');

    return `${timeLow}-${timeMid}-${timeHiVer}-${clockSeq}-${node}`;
  }

  function formatUUID(raw) {
    let result = raw;
    if (state.hyphens === 'no') result = result.replace(/-/g, '');
    if (state.casing === 'upper') result = result.toUpperCase();
    return result;
  }

  function generate() {
    const uuids = [];
    for (let i = 0; i < state.count; i++) {
      const raw = state.version === '4' ? uuidV4() : uuidV1();
      uuids.push(formatUUID(raw));
    }
    renderOutput(uuids);
  }

  // ── Render ─────────────────────────────────────────────────────────

  function renderOutput(uuids) {
    outputArea.innerHTML = '';

    const list = document.createElement('div');
    list.className = 'uuid-list';

    uuids.forEach(uuid => {
      const row = document.createElement('div');
      row.className = 'uuid-row';
      row.title = 'Click to copy';

      const val = document.createElement('span');
      val.className = 'uuid-value';
      val.textContent = uuid;

      const hint = document.createElement('span');
      hint.className = 'uuid-copy-hint';
      hint.textContent = 'copy';

      row.appendChild(val);
      row.appendChild(hint);
      list.appendChild(row);

      row.addEventListener('click', () => copyRow(row, uuid, hint));
    });

    outputArea.appendChild(list);
    lucide.createIcons();

    // Show action bar
    actionRow.style.display = 'flex';
    const label = state.version === '1' ? 'pseudo-v1 (timestamp)' : 'v4 (random)';
    resultMeta.textContent = `${uuids.length} UUID${uuids.length > 1 ? 's' : ''} · ${label}`;
  }

  function copyRow(row, uuid, hint) {
    navigator.clipboard.writeText(uuid).then(() => {
      hint.textContent = 'copied!';
      row.classList.add('copied');
      setTimeout(() => {
        hint.textContent = 'copy';
        row.classList.remove('copied');
      }, 1500);
    });
  }

  // ── Copy all ───────────────────────────────────────────────────────

  btnCopyAll.addEventListener('click', () => {
    const values = [...document.querySelectorAll('.uuid-value')].map(v => v.textContent);
    if (!values.length) return;
    navigator.clipboard.writeText(values.join('\n')).then(() => {
      const orig = btnCopyAll.innerHTML;
      btnCopyAll.innerHTML = '<i data-lucide="check" width="13" height="13"></i> Copied';
      lucide.createIcons();
      setTimeout(() => {
        btnCopyAll.innerHTML = orig;
        lucide.createIcons();
      }, 1500);
    });
  });

  // ── Buttons ────────────────────────────────────────────────────────

  btnGenerate.addEventListener('click', generate);
  btnRegenerate.addEventListener('click', generate);

  // Keyboard shortcut: Enter or G
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === 'g') && document.activeElement.tagName !== 'BUTTON') {
      generate();
    }
  });

});
