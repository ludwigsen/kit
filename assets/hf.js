document.addEventListener('DOMContentLoaded', () => {
    const main = document.querySelector('main');
    const body = document.querySelector('body');
    if (!main || !body) return;

    // --- Derive wordmark from <title> ---
    // Expected title formats: "Kit" or "Kit / Tool Name"
    const titleParts = (document.title || 'Kit').split(' / ');
    const isRoot = titleParts.length < 2;
    const toolName = isRoot ? null : titleParts.slice(1).join(' / ');

    const wordmarkHTML = isRoot
        ? `Kit<span class="wordmark-accent">.</span>`
        : `Kit<span class="wordmark-accent">.</span>
           <span class="wordmark-sep">/</span>
           <span class="wordmark-page">${toolName}</span>`;

    // --- Derive footer slug from pathname ---
    // e.g. /tools/animal-generator/index.html → "kit / animal-generator"
    const pathParts = location.pathname.replace(/\/index\.html$/, '').split('/').filter(Boolean);
    const toolIndex = pathParts.indexOf('tools');
    const footerSlug = toolIndex !== -1 && pathParts[toolIndex + 1]
        ? `kit / ${pathParts[toolIndex + 1]}`
        : 'kit';

    // --- Back link: root pages don't need it ---
    const backLinkHTML = isRoot
        ? ''
        : `<a class="back-link" href="../../index.html">
             <i data-lucide="arrow-left" width="13" height="13"></i>
             All tools
           </a>`;

    // --- Build header ---
    const header = document.createElement('header');
    header.className = 'header';
    header.innerHTML = `
        <div class="shell">
          <div class="header-inner">
            <div class="wordmark">${wordmarkHTML}</div>
            ${backLinkHTML}
          </div>
        </div>`;

    // --- Build footer ---
    const footer = document.createElement('footer');
    footer.className = 'footer';
    footer.innerHTML = `
        <div class="shell">
          <div class="footer-inner">
            <div class="footer-left">${footerSlug}</div>
          </div>
        </div>`;

    body.insertBefore(header, main);
    body.appendChild(footer);
});