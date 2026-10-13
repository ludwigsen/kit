// Shared header/footer builder. Appearance controls are powered by Alpine.js.
document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('main');
  const body = document.body;
  if (!main || !body) return;

  const titleParts = (document.title || 'Kit').split(' / ');
  const isRoot = titleParts.length < 2;
  const toolName = isRoot ? null : titleParts.slice(1).join(' / ');
  const wordmarkHTML = isRoot
    ? 'Kit<span class="wordmark-accent">.</span>'
    : `Kit<span class="wordmark-accent">.</span><span class="wordmark-sep">/</span><span class="wordmark-page">${toolName}</span>`;

  const pathParts = location.pathname.replace(/\/index\.html$/, '').split('/').filter(Boolean);
  const toolIndex = pathParts.indexOf('tools');
  const footerSlug = toolIndex !== -1 && pathParts[toolIndex + 1] ? `kit / ${pathParts[toolIndex + 1]}` : 'kit';
  const backLinkHTML = isRoot ? '' : `<a class="back-link" href="../../index.html"><i data-lucide="arrow-left" width="13" height="13"></i>All tools</a>`;

  const appearance = `
    <div class="kit-appearance" x-data="kitTheme">
      <button class="appearance-mode" type="button" @click="toggleMode()" :aria-label="mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'" :title="mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'">
        <span x-text="mode === 'dark' ? '☼' : '☾'" aria-hidden="true"></span>
        <span class="appearance-mode-label" x-text="mode === 'dark' ? 'Dark' : 'Light'"></span>
      </button>
      <label class="sr-only" for="kit-palette">Color theme</label>
      <select id="kit-palette" class="appearance-palette" :value="palette" @change="setPalette($event.target.value)">
        <template x-for="item in palettes" :key="item.value"><option :value="item.value" x-text="item.label"></option></template>
      </select>
    </div>`;

  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `<div class="shell"><div class="header-inner"><div class="wordmark">${wordmarkHTML}</div>${backLinkHTML}${appearance}</div></div>`;

  const footer = document.createElement('footer');
  footer.className = 'footer';
  footer.innerHTML = `<div class="shell"><div class="footer-inner"><div class="footer-left">${footerSlug}</div><div class="footer-right">Tailwind CSS · Alpine.js</div></div></div>`;
  body.insertBefore(header, main);
  body.appendChild(footer);
  if (window.lucide) window.lucide.createIcons();
});