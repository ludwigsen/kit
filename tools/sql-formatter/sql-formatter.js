document.addEventListener('DOMContentLoaded', () => {

  // ─── State ────────────────────────────────────────────

  const state = {
    dialect: 'tsql',
    keywordCase: 'lower',
    indent: '2',
  };

  // ─── Elements ─────────────────────────────────────────

  const inputEl    = document.getElementById('input');
  const outputEl   = document.getElementById('output');
  const btnFormat  = document.getElementById('btn-format');
  const btnCopy    = document.getElementById('btn-copy');
  const btnClear   = document.getElementById('btn-clear');
  const statusMsg  = document.getElementById('status-msg');

  // ─── Segmented controls ───────────────────────────────

  function bindSeg(id, key) {
    const seg = document.getElementById(id);
    seg.querySelectorAll('.seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        seg.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state[key] = btn.dataset.value;
      });
    });
  }

  bindSeg('dialect-seg', 'dialect');
  bindSeg('case-seg',    'keywordCase');
  bindSeg('indent-seg',  'indent');

  // ─── Format ───────────────────────────────────────────

  function getIndentString() {
    if (state.indent === 'tab') return '\t';
    return ' '.repeat(parseInt(state.indent, 10));
  }

  function format() {
    const sql = inputEl.value.trim();
    if (!sql) {
      setStatus('', '');
      return;
    }

    try {
      const formatted = sqlFormatter.format(sql, {
        language:    state.dialect,
        keywordCase: state.keywordCase,
        tabWidth:    state.indent === 'tab' ? 1 : parseInt(state.indent, 10),
        useTabs:     state.indent === 'tab',
        linesBetweenQueries: 2,
      });

      outputEl.value = formatted;
      btnCopy.disabled = false;
      setStatus('Formatted', 'success');
    } catch (err) {
      outputEl.value = '';
      btnCopy.disabled = true;
      setStatus('Parse error — check your SQL', 'error');
      console.error('[sql-formatter]', err);
    }
  }

  // ─── Copy ─────────────────────────────────────────────

  function copyOutput() {
    if (!outputEl.value) return;
    navigator.clipboard.writeText(outputEl.value).then(() => {
      setStatus('Copied!', 'success');
      setTimeout(() => setStatus('', ''), 2000);
    }).catch(() => {
      setStatus('Copy failed', 'error');
    });
  }

  // ─── Clear ────────────────────────────────────────────

  function clear() {
    inputEl.value  = '';
    outputEl.value = '';
    btnCopy.disabled = true;
    setStatus('', '');
    inputEl.focus();
  }

  // ─── Status ───────────────────────────────────────────

  function setStatus(msg, type) {
    statusMsg.textContent = msg;
    statusMsg.className   = 'status-msg' + (type ? ` ${type}` : '');
  }

  // ─── Keyboard shortcut ────────────────────────────────
  // Ctrl/Cmd + Enter to format

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      format();
    }
  });

  // ─── Bindings ─────────────────────────────────────────

  btnFormat.addEventListener('click', format);
  btnCopy.addEventListener('click', copyOutput);
  btnClear.addEventListener('click', clear);

});
