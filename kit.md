# Kit

A self-hosted, zero-build folder of browser-based dev tools. Open `index.html` in a browser or serve locally. No framework, no bundler — vanilla JS, HTML, and CSS only.

---

## Quick start

```bash
# Option A — VS Code Live Server (recommended)
# Right-click index.html → Open with Live Server

# Option B — npx
npx serve .

# Option C — Python
python -m http.server 8000
```

> Tools that use `fetch()` (e.g. animal-generator) require a local server. Others work fine from `file://`.

---

## Folder structure

```
kit/
├── index.html                  ← Hub. Add tools to manifest.js only.
├── README.md                   ← You are here
├── assets/
│   ├── style.css               ← Shared tokens + layout. Edit to retheme everything.
│   ├── manifest.js             ← Single source of truth for all tools.
│   ├── hub.js                  ← Grid, search, filter logic. Reads from manifest.
│   └── TOOL_TEMPLATE.js        ← Copy-paste starting point for new tool JS.
└── tools/
    └── [tool-name]/
        ├── index.html
        ├── [tool-name].css
        └── [tool-name].js
```

---

## Adding a tool

1. Create `tools/[tool-name]/` with `index.html`, `[tool-name].css`, `[tool-name].js`
2. Add one entry to `assets/manifest.js`
3. Set `badge: 'soon'` while in progress, flip to `'new'` when live

That's it. The hub updates automatically.

---

## Manifest entry shape

```js
{
  id:    'tool-id',               // matches folder name
  name:  'Display Name',
  desc:  'One sentence description.',
  icon:  'lucide-icon-name',      // see https://lucide.dev/icons/
  color: 'icon-blue',             // icon-blue | icon-green | icon-yellow | icon-red
  path:  './tools/tool-id/index.html',
  tags:  ['tag1', 'tag2'],
  badge: 'new',                   // new | wip | soon
}
```

**Badge behavior:**
- `new` / `wip` — rendered as a clickable `<a>` card
- `soon` — non-interactive placeholder, dashed border, 45% opacity

---

## Tool HTML pattern

```html
<link rel="stylesheet" href="../../assets/style.css">
<link rel="stylesheet" href="./[tool-name].css">

<header class="header">
  <div class="shell">
    <div class="header-inner">
      <div class="wordmark">
        Kit<span class="wordmark-accent">.</span>
        <span class="wordmark-sep">/</span>
        <span class="wordmark-page">Tool Name</span>
      </div>
      <a class="back-link" href="../../index.html">
        <i data-lucide="arrow-left" width="13" height="13"></i>
        All tools
      </a>
    </div>
  </div>
</header>

<!-- Tool content -->

<footer class="footer">
  <div class="shell">
    <div class="footer-inner">
      <div class="footer-left">kit / tool-name</div>
    </div>
  </div>
</footer>

<!-- Script load order matters -->
<script src="https://unpkg.com/lucide@latest"></script>
<script>document.addEventListener('DOMContentLoaded', () => lucide.createIcons());</script>
<script src="./[tool-name].js"></script>
```

**All tool JS must be wrapped in `DOMContentLoaded`.**

---

## Design tokens

Defined in `assets/style.css`. Edit here to retheme the entire suite.

| Token | Value | Role |
|---|---|---|
| `--bg` | `#0f1117` | Page background |
| `--surface` | `#161b25` | Input/panel background |
| `--card` | `#1e2535` | Card background |
| `--card-hover` | `#232d42` | Card hover state |
| `--border` | `#2e3a50` | Standard border |
| `--border-soft` | `#1e2a3a` | Subtle border |
| `--accent` | `#5b8dee` | Primary accent (slate-blue) |
| `--accent-glow` | `rgba(91,141,238,0.12)` | Accent shadow/glow |
| `--accent-dim` | `rgba(91,141,238,0.2)` | Accent fill |
| `--text` | `#e2e8f4` | Primary text |
| `--text-muted` | `#637896` | Secondary text |
| `--text-sub` | `#3d5070` | Tertiary / placeholder |
| `--green` | `#3ecf8e` | Success / extant |
| `--yellow` | `#f6c94e` | Warning / WIP |
| `--red` | `#f16c6c` | Error / extinct |
| `--mono` | `'JetBrains Mono'` | Code, labels, tags |
| `--sans` | `'Inter'` | UI text |
| `--radius` | `8px` | Standard border radius |
| `--radius-lg` | `12px` | Card border radius |
| `--radius-sm` | `4px` | Badge border radius |

---

## Shared CSS classes

These are available to all tools via `style.css`:

- **Layout:** `.shell`, `.header`, `.header-inner`, `.footer`, `.footer-inner`, `.footer-left`
- **Wordmark:** `.wordmark`, `.wordmark-accent`, `.wordmark-sep`, `.wordmark-page`
- **Navigation:** `.back-link`
- **Icon colors:** `.icon-blue`, `.icon-green`, `.icon-yellow`, `.icon-red`
- **Badges:** `.card-badge` + `.badge-new`, `.badge-wip`, `.badge-soon`
- **Tags:** `.tag`

---

## Icons

Lucide via CDN. Browse at [lucide.dev/icons](https://lucide.dev/icons/).

```html
<script src="https://unpkg.com/lucide@latest"></script>
<script>document.addEventListener('DOMContentLoaded', () => lucide.createIcons());</script>
```

Icons are rendered by placing `<i data-lucide="icon-name"></i>` anywhere in the DOM, then calling `lucide.createIcons()` after content is rendered. Call it again after any dynamic DOM update that adds new icons.

---

## Tools

| Tool | Status | Notes |
|---|---|---|
| File → Markdown | `new` | Converts .txt .html .csv .json .pdf .docx → .md. CDN: mammoth 1.6.0, pdf.js 3.11.174 |
| Animal Generator | `new` | Reads `animals.json`, picks by category or all. Requires local server for `fetch()`. |
| JSON Formatter | `soon` | — |
| Color Converter | `soon` | — |
| Base64 / URL Encode | `soon` | — |
| Regex Tester | `soon` | — |
| Text Diff | `soon` | — |
| Timestamp Converter | `soon` | — |
| Lorem / Placeholder | `soon` | — |

---

## Fonts

Loaded from Google Fonts in each page's `<head>`. To use system fonts instead, update `--mono` and `--sans` in `style.css` and remove the `<link>` tags.

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
```
