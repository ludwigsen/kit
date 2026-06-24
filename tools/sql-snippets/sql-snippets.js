document.addEventListener('DOMContentLoaded', () => {

  // ─── Validate data ────────────────────────────────────────

  if (!window.SNIPPETS || !window.SNIPPETS_CATEGORIES) {
    console.error('[sql-snippets] snippets.js not loaded or missing exports.');
    return;
  }

  const snippets   = window.SNIPPETS;
  const categories = window.SNIPPETS_CATEGORIES;

  // ─── State ────────────────────────────────────────────────

  let activeCategory = null;
  let searchQuery    = '';

  // ─── Elements ─────────────────────────────────────────────

  const filterBar   = document.getElementById('filter-bar');
  const searchInput = document.getElementById('search');
  const searchClear = document.getElementById('search-clear');
  const grid        = document.getElementById('snippet-grid');
  const emptyState  = document.getElementById('empty-state');
  const resultsMeta = document.getElementById('results-meta');

  // ─── Build filter buttons ─────────────────────────────────

  function buildFilters() {
    const all = document.createElement('button');
    all.className   = 'filter-btn active';
    all.textContent = 'All';
    all.dataset.cat = '';
    all.addEventListener('click', () => setCategory(null, all));
    filterBar.appendChild(all);

    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className   = 'filter-btn';
      btn.textContent = cat;
      btn.dataset.cat = cat;
      btn.addEventListener('click', () => setCategory(cat, btn));
      filterBar.appendChild(btn);
    });
  }

  function setCategory(cat, btn) {
    activeCategory = cat;
    filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render();
  }

  // ─── Filter logic ─────────────────────────────────────────

  function filtered() {
    const q = searchQuery.toLowerCase();
    return snippets.filter(s => {
      const matchCat = !activeCategory || s.category === activeCategory;
      const matchQ   = !q
        || s.title.toLowerCase().includes(q)
        || s.desc.toLowerCase().includes(q)
        || s.category.toLowerCase().includes(q)
        || s.tags.some(t => t.toLowerCase().includes(q))
        || s.sql.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }

  // ─── Render ───────────────────────────────────────────────

  function render() {
    const results = filtered();
    grid.innerHTML = '';

    if (results.length === 0) {
      emptyState.hidden = false;
      resultsMeta.textContent = '';
      lucide.createIcons();
      return;
    }

    emptyState.hidden = true;
    resultsMeta.textContent = `${results.length} snippet${results.length !== 1 ? 's' : ''}`;

    results.forEach(s => {
      const card = buildCard(s);
      grid.appendChild(card);
    });

    lucide.createIcons();
  }

  // ─── Build card ───────────────────────────────────────────

  function buildCard(s) {
    const card = document.createElement('div');
    card.className    = 'snippet-card';
    card.dataset.id   = s.id;

    // Tags HTML
    const tagsHtml = s.tags
      .map(t => `<span class="tag">${t}</span>`)
      .join('');

    card.innerHTML = `
      <div class="card-header">
        <div class="card-header-left">
          <div class="card-title">${s.title}</div>
          <div class="card-desc">${s.desc}</div>
        </div>
        <div class="card-meta">
          <span class="card-category">${s.category}</span>
          <i data-lucide="chevron-down" width="16" height="16" class="card-chevron"></i>
        </div>
      </div>
      <div class="card-body">
        <div class="code-wrap">
          <pre class="snippet-code">${escapeHtml(s.sql)}</pre>
          <button class="copy-btn" title="Copy to clipboard">
            <i data-lucide="copy" width="12" height="12"></i>
            Copy
          </button>
        </div>
        ${tagsHtml ? `<div class="card-tags">${tagsHtml}</div>` : ''}
      </div>
    `;

    // Toggle open/close
    card.querySelector('.card-header').addEventListener('click', () => {
      card.classList.toggle('open');
    });

    // Copy button
    card.querySelector('.copy-btn').addEventListener('click', (e) => {
      e.stopPropagation(); // don't toggle card
      const btn = e.currentTarget;
      navigator.clipboard.writeText(s.sql).then(() => {
        btn.classList.add('copied');
        btn.innerHTML = '<i data-lucide="check" width="12" height="12"></i> Copied';
        lucide.createIcons();
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = '<i data-lucide="copy" width="12" height="12"></i> Copy';
          lucide.createIcons();
        }, 2000);
      });
    });

    return card;
  }

  // ─── Utility ──────────────────────────────────────────────

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ─── Search bindings ──────────────────────────────────────

  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    searchClear.hidden = !searchQuery;
    render();
  });

  searchClear.addEventListener('click', () => {
    searchInput.value  = '';
    searchQuery        = '';
    searchClear.hidden = true;
    searchInput.focus();
    render();
  });

  // ─── Init ─────────────────────────────────────────────────

  buildFilters();
  render();

});
