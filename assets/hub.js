/**
 * KIT — HUB SCRIPT
 * Reads from TOOLS (manifest.js) and renders the grid, pills, and search.
 * Depends on: manifest.js loaded before this file, lucide available globally.
 */
document.addEventListener('DOMContentLoaded', () => {

  // =====================
  //  STATE
  // =====================
  let activeFilter = 'all';
  let searchQuery  = '';

  // =====================
  //  ELEMENTS
  // =====================
  const gridEl      = document.getElementById('tool-grid');
  const pillsEl     = document.getElementById('filter-pills');
  const countEl     = document.getElementById('visible-count');
  const toolCountEl = document.getElementById('tool-count');
  const searchEl    = document.getElementById('search');

  // Live tool count in wordmark superscript
  toolCountEl.textContent = TOOLS.length;

  // =====================
  //  FILTER PILLS
  //  Only show tags that exist in the manifest
  // =====================
  const PILL_TAGS = ['all', 'llm', 'json', 'color', 'css', 'encode', 'regex', 'diff', 'time', 'gen'];

  function renderPills() {
    pillsEl.innerHTML = '';
    const tags = PILL_TAGS.filter(t => t === 'all' || TOOLS.some(tool => tool.tags.includes(t)));

    tags.forEach(tag => {
      const btn = document.createElement('button');
      btn.className = 'pill' + (activeFilter === tag ? ' active' : '');
      btn.textContent = tag === 'all' ? 'All' : tag;
      btn.addEventListener('click', () => {
        activeFilter = tag;
        renderPills();
        renderGrid();
      });
      pillsEl.appendChild(btn);
    });
  }

  // =====================
  //  GRID
  // =====================
  const badgeClass = { new: 'badge-new', wip: 'badge-wip', soon: 'badge-soon' };
  const badgeLabel = { new: 'New',       wip: 'WIP',       soon: 'Soon' };

  function renderGrid() {
    const q = searchQuery.toLowerCase().trim();

    const visible = TOOLS.filter(tool => {
      const matchesFilter = activeFilter === 'all' || tool.tags.includes(activeFilter);
      const matchesSearch = !q ||
        tool.name.toLowerCase().includes(q) ||
        tool.desc.toLowerCase().includes(q) ||
        tool.tags.some(t => t.includes(q));
      return matchesFilter && matchesSearch;
    });

    gridEl.innerHTML = '';

    visible.forEach(tool => {
      const isReady = tool.badge === 'new' || tool.badge === 'wip';
      const el = document.createElement(isReady ? 'a' : 'div');

      if (isReady) el.href = tool.path;
      el.className = 'tool-card' + (isReady ? '' : ' placeholder');
      el.setAttribute('tabindex', isReady ? '0' : '-1');

      el.innerHTML = `
        <div class="card-top">
          <div class="card-icon-wrap ${tool.color}">
            <i data-lucide="${tool.icon}" width="18" height="18"></i>
          </div>
          <span class="card-badge ${badgeClass[tool.badge]}">${badgeLabel[tool.badge]}</span>
        </div>
        <div>
          <div class="card-name">${tool.name}</div>
          <div class="card-desc">${tool.desc}</div>
        </div>
        <div class="card-footer">
          <div class="card-tags">
            ${tool.tags.map(t => `<span class="tag">${t}</span>`).join('')}
          </div>
          ${isReady ? '<i data-lucide="arrow-right" class="card-arrow" width="14" height="14"></i>' : ''}
        </div>
      `;

      gridEl.appendChild(el);
    });

    // No results message
    if (visible.length === 0) {
      const msg = document.createElement('div');
      msg.className = 'no-results';
      msg.innerHTML = `No tools match <i>"${q}"</i>`;
      gridEl.appendChild(msg);
    }

    countEl.textContent = `${visible.length} of ${TOOLS.length}`;

    // Re-init Lucide after DOM update
    lucide.createIcons();
  }

  // =====================
  //  SEARCH
  // =====================
  searchEl.addEventListener('input', e => {
    searchQuery = e.target.value;
    renderGrid();
  });

  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement !== searchEl) {
      e.preventDefault();
      searchEl.focus();
      searchEl.select();
    }
    if (e.key === 'Escape' && document.activeElement === searchEl) {
      searchEl.blur();
      searchEl.value = '';
      searchQuery = '';
      renderGrid();
    }
  });

  // =====================
  //  INIT
  // =====================
  renderPills();
  renderGrid();

});
