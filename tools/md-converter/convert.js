document.addEventListener('DOMContentLoaded', () => {
    // PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const state = {
        files: [],  // { file, name, ext, status: 'pending'|'done'|'error', result: '' }
        activeIdx: null,
    };

    // --- DOM refs ---
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileQueue = document.getElementById('file-queue');
    const convertBtn = document.getElementById('convert-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');
    const outputEl = document.getElementById('output');
    const outputBox = document.getElementById('output-box');
    const emptyState = document.getElementById('empty-state');
    const outputFilename = document.getElementById('output-filename');
    const outputFilenameText = document.getElementById('output-filename-text');
    const charCount = document.getElementById('char-count');
    const progressWrap = document.getElementById('progress-wrap');
    const progressBar = document.getElementById('progress-bar');
    const toast = document.getElementById('toast');

    // --- Drag & Drop ---
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => addFiles([...e.target.files]));

    ['dragenter', 'dragover'].forEach(ev =>
        dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.add('drag-over'); }));

    ['dragleave', 'drop'].forEach(ev =>
        dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.remove('drag-over'); }));

    dropZone.addEventListener('drop', e => {
        const files = [...e.dataTransfer.files];
        addFiles(files);
    });

    function addFiles(files) {
        const supported = ['.txt', '.html', '.htm', '.csv', '.json', '.pdf', '.docx', '.md'];
        files.forEach(f => {
            const ext = '.' + f.name.split('.').pop().toLowerCase();
            if (!supported.includes(ext)) { showToast(`Skipped: ${f.name} (unsupported)`); return; }
            if (state.files.find(x => x.name === f.name)) { showToast(`Already queued: ${f.name}`); return; }
            state.files.push({ file: f, name: f.name, ext, status: 'pending', result: '' });
        });
        renderQueue();
        fileInput.value = '';
    }

    // --- Queue Render ---
    function renderQueue() {
        fileQueue.innerHTML = '';
        state.files.forEach((item, i) => {
            const el = document.createElement('div');
            el.className = 'file-item' + (i === state.activeIdx ? ' active' : '');
            const statusText = { pending: '○ pending', done: '✓ done', error: '✗ error', processing: '⟳' }[item.status];
            const statusClass = { pending: '', done: 'done', error: 'error', processing: 'processing' }[item.status];
            el.innerHTML = `
      <span class="file-icon">${item.ext.slice(1).toUpperCase()}</span>
      <span class="file-name">${item.name}</span>
      <span class="file-status ${statusClass}">${statusText}</span>
      <button class="remove-btn" data-i="${i}" title="Remove">✕</button>
    `;
            el.addEventListener('click', e => {
                if (e.target.classList.contains('remove-btn')) return;
                selectFile(i);
            });
            el.querySelector('.remove-btn').addEventListener('click', () => removeFile(i));
            fileQueue.appendChild(el);
        });

        convertBtn.disabled = state.files.length === 0;
        clearBtn.disabled = state.files.length === 0;
    }

    function selectFile(i) {
        state.activeIdx = i;
        renderQueue();
        const item = state.files[i];
        if (item.status === 'done') showOutput(item);
        else clearOutput();
    }

    function removeFile(i) {
        state.files.splice(i, 1);
        if (state.activeIdx >= state.files.length) state.activeIdx = state.files.length - 1;
        if (state.files.length === 0) { state.activeIdx = null; clearOutput(); }
        renderQueue();
    }

    // --- Output ---
    function showOutput(item) {
        emptyState.style.display = 'none';
        outputFilename.style.display = 'flex';
        outputFilenameText.textContent = item.name.replace(/\.[^.]+$/, '.md');
        outputEl.style.display = 'block';
        outputEl.value = item.result;
        updateCharCount(item.result);
        copyBtn.disabled = false;
        downloadBtn.disabled = false;
    }

    function clearOutput() {
        emptyState.style.display = 'flex';
        outputFilename.style.display = 'none';
        outputEl.style.display = 'none';
        outputEl.value = '';
        charCount.textContent = '';
        copyBtn.disabled = true;
        downloadBtn.disabled = true;
    }

    function updateCharCount(text) {
        const chars = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        charCount.textContent = `${chars.toLocaleString()} chars · ${words.toLocaleString()} words`;
    }

    outputEl.addEventListener('input', () => updateCharCount(outputEl.value));

    // --- Converters ---
    async function convertFile(item) {
        const { file, ext } = item;
        const text = await readAsText(file);

        switch (ext) {
            case '.txt': return convertTxt(text, file.name);
            case '.md': return normalizeMd(text);
            case '.html':
            case '.htm': return convertHtml(text);
            case '.csv': return convertCsv(text);
            case '.json': return convertJson(text);
            case '.pdf': return await convertPdf(file);
            case '.docx': return await convertDocx(file);
            default: throw new Error(`Unsupported: ${ext}`);
        }
    }

    function readAsText(file) {
        return new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(r.result);
            r.onerror = rej;
            r.readAsText(file);
        });
    }

    function readAsArrayBuffer(file) {
        return new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(r.result);
            r.onerror = rej;
            r.readAsArrayBuffer(file);
        });
    }

    function convertTxt(text, name) {
        const title = name.replace(/\.[^.]+$/, '');
        return `# ${title}\n\n${text.trim()}`;
    }

    function normalizeMd(text) {
        // normalize line endings, trim trailing whitespace per line
        return text.split('\n').map(l => l.trimEnd()).join('\n').trim();
    }

    function convertHtml(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        // Remove scripts/styles
        doc.querySelectorAll('script, style, nav, footer, aside').forEach(el => el.remove());
        return htmlNodeToMd(doc.body || doc.documentElement).trim();
    }

    function htmlNodeToMd(node, depth = 0) {
        if (!node) return '';
        if (node.nodeType === 3) {
            const t = node.textContent.replace(/\s+/g, ' ');
            return t;
        }
        if (node.nodeType !== 1) return '';

        const tag = node.tagName?.toLowerCase();
        const children = () => [...node.childNodes].map(n => htmlNodeToMd(n, depth)).join('');

        switch (tag) {
            case 'h1': return `\n# ${children().trim()}\n`;
            case 'h2': return `\n## ${children().trim()}\n`;
            case 'h3': return `\n### ${children().trim()}\n`;
            case 'h4': return `\n#### ${children().trim()}\n`;
            case 'h5': return `\n##### ${children().trim()}\n`;
            case 'h6': return `\n###### ${children().trim()}\n`;
            case 'p': return `\n${children().trim()}\n`;
            case 'br': return '  \n';
            case 'strong': case 'b': return `**${children()}**`;
            case 'em': case 'i': return `*${children()}*`;
            case 'code': return `\`${children()}\``;
            case 'pre': {
                const inner = node.querySelector('code');
                const lang = inner?.className?.replace('language-', '') || '';
                const content = (inner ? inner.textContent : node.textContent);
                return `\n\`\`\`${lang}\n${content}\n\`\`\`\n`;
            }
            case 'a': {
                const href = node.getAttribute('href') || '';
                return `[${children()}](${href})`;
            }
            case 'img': {
                const src = node.getAttribute('src') || '';
                const alt = node.getAttribute('alt') || '';
                return `![${alt}](${src})`;
            }
            case 'ul': {
                return '\n' + [...node.children].map(li => `- ${htmlNodeToMd(li).trim()}`).join('\n') + '\n';
            }
            case 'ol': {
                return '\n' + [...node.children].map((li, i) => `${i + 1}. ${htmlNodeToMd(li).trim()}`).join('\n') + '\n';
            }
            case 'li': return children();
            case 'blockquote': return `\n> ${children().trim().split('\n').join('\n> ')}\n`;
            case 'hr': return '\n---\n';
            case 'table': return convertHtmlTable(node);
            case 'thead': case 'tbody': case 'tfoot': return children();
            case 'tr': case 'td': case 'th': return children();
            case 'head': return '';
            default: return children();
        }
    }

    function convertHtmlTable(table) {
        const rows = [...table.querySelectorAll('tr')];
        if (!rows.length) return '';
        const toRow = tr => [...tr.querySelectorAll('th,td')].map(c => c.textContent.trim().replace(/\|/g, '\\|'));
        const headers = toRow(rows[0]);
        const sep = headers.map(() => '---');
        const body = rows.slice(1).map(toRow);
        const fmt = cols => '| ' + cols.join(' | ') + ' |';
        return '\n' + [fmt(headers), fmt(sep), ...body.map(fmt)].join('\n') + '\n';
    }

    function convertCsv(text) {
        const lines = text.trim().split('\n').map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
        if (!lines.length) return '';
        const headers = lines[0];
        const sep = headers.map(() => '---');
        const fmt = cols => '| ' + cols.join(' | ') + ' |';
        const rows = lines.slice(1).filter(r => r.some(c => c));
        return [fmt(headers), fmt(sep), ...rows.map(fmt)].join('\n');
    }

    function convertJson(text) {
        let parsed;
        try { parsed = JSON.parse(text); } catch (e) { throw new Error('Invalid JSON: ' + e.message); }

        const type = Array.isArray(parsed) ? 'array' : typeof parsed;
        const len = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
        const summary = type === 'array'
            ? `Array with ${len} items`
            : `Object with ${len} keys: ${Object.keys(parsed).slice(0, 8).join(', ')}${len > 8 ? '…' : ''}`;

        // If array of objects, try to render as table
        let table = '';
        if (Array.isArray(parsed) && parsed.length && typeof parsed[0] === 'object' && !Array.isArray(parsed[0])) {
            const keys = Object.keys(parsed[0]);
            const fmt = cols => '| ' + cols.join(' | ') + ' |';
            const sep = keys.map(() => '---');
            const rows = parsed.slice(0, 50).map(item => keys.map(k => String(item[k] ?? '').replace(/\|/g, '\\|').slice(0, 80)));
            table = '\n## Preview\n\n' + [fmt(keys), fmt(sep), ...rows.map(fmt)].join('\n');
            if (parsed.length > 50) table += `\n\n*Showing 50 of ${parsed.length} rows.*`;
        }

        return `# JSON Document\n\n**Type:** ${summary}\n${table}\n\n## Raw\n\n\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``;
    }

    async function convertPdf(file) {
        const buf = await readAsArrayBuffer(file);
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        const numPages = pdf.numPages;
        let md = `# ${file.name.replace('.pdf', '')}\n\n`;

        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(' ').trim();
            if (pageText) {
                if (numPages > 1) md += `## Page ${i}\n\n`;
                md += pageText + '\n\n';
            }
        }
        return md.trim();
    }

    async function convertDocx(file) {
        const buf = await readAsArrayBuffer(file);
        const result = await mammoth.convertToHtml({ arrayBuffer: buf });
        const md = convertHtml(result.value);
        return md.trim();
    }

    // --- Convert All ---
    convertBtn.addEventListener('click', async () => {
        const pending = state.files.filter(f => f.status !== 'done');
        if (!pending.length) { showToast('All files already converted'); return; }

        convertBtn.disabled = true;
        progressWrap.classList.add('active');

        let done = 0;
        for (let i = 0; i < state.files.length; i++) {
            const item = state.files[i];
            if (item.status === 'done') { done++; continue; }
            item.status = 'processing';
            renderQueue();
            try {
                item.result = await convertFile(item);
                item.status = 'done';
                done++;
                if (state.activeIdx === null || state.activeIdx === i) {
                    state.activeIdx = i;
                    showOutput(item);
                }
            } catch (e) {
                item.status = 'error';
                item.result = `<!-- Error: ${e.message} -->`;
                console.error(e);
            }
            progressBar.style.width = (done / state.files.length * 100) + '%';
            renderQueue();
        }

        setTimeout(() => {
            progressWrap.classList.remove('active');
            progressBar.style.width = '0%';
        }, 600);

        convertBtn.disabled = false;
        showToast(`Converted ${done} file${done !== 1 ? 's' : ''}`);
    });

    // --- Clear ---
    clearBtn.addEventListener('click', () => {
        state.files = [];
        state.activeIdx = null;
        clearOutput();
        renderQueue();
    });

    // --- Copy ---
    copyBtn.addEventListener('click', async () => {
        const text = outputEl.value;
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            showToast('Copied to clipboard');
        } catch (e) {
            outputEl.select();
            document.execCommand('copy');
            showToast('Copied');
        }
    });

    // --- Download ---
    downloadBtn.addEventListener('click', () => {
        const text = outputEl.value;
        if (!text) return;
        const item = state.files[state.activeIdx];
        const filename = item ? item.name.replace(/\.[^.]+$/, '.md') : 'output.md';
        const blob = new Blob([text], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    });

    // --- Toast ---
    let toastTimer;
    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
    }

});