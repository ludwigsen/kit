/* Shared Kit appearance controls: theme mode + palette, persisted locally. */
(() => {
  const palettes = {
    ember: { label: 'Ember', accent: '#c65d3a', strong: '#9e4328', dim: 'rgba(198,93,58,.15)', glow: 'rgba(198,93,58,.09)' },
    ocean: { label: 'Ocean', accent: '#3b82a0', strong: '#28627b', dim: 'rgba(59,130,160,.15)', glow: 'rgba(59,130,160,.09)' },
    forest: { label: 'Forest', accent: '#478568', strong: '#2e694f', dim: 'rgba(71,133,104,.15)', glow: 'rgba(71,133,104,.09)' },
    violet: { label: 'Violet', accent: '#8870c4', strong: '#6b52a6', dim: 'rgba(136,112,196,.15)', glow: 'rgba(136,112,196,.09)' },
    graphite: { label: 'Graphite', accent: '#737f91', strong: '#566171', dim: 'rgba(115,127,145,.16)', glow: 'rgba(115,127,145,.09)' }
  };
  const get = (key) => { try { return localStorage.getItem(key); } catch (_) { return null; } };
  const savedMode = get('kit-mode');
  const savedPalette = get('kit-palette');
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const initial = {
    mode: savedMode === 'light' || savedMode === 'dark' ? savedMode : (prefersLight ? 'light' : 'dark'),
    palette: Object.prototype.hasOwnProperty.call(palettes, savedPalette) ? savedPalette : 'ember'
  };
  function apply(mode, palette) {
    const root = document.documentElement;
    const safeMode = mode === 'light' ? 'light' : 'dark';
    const safePalette = Object.prototype.hasOwnProperty.call(palettes, palette) ? palette : 'ember';
    const p = palettes[safePalette];
    root.dataset.theme = safeMode;
    root.dataset.palette = safePalette;
    root.style.colorScheme = safeMode;
    root.style.setProperty('--accent', p.accent);
    root.style.setProperty('--accent-strong', p.strong);
    root.style.setProperty('--accent-dim', p.dim);
    root.style.setProperty('--accent-glow', p.glow);
    return { mode: safeMode, palette: safePalette };
  }
  apply(initial.mode, initial.palette);
  document.addEventListener('alpine:init', () => {
    Alpine.data('kitTheme', () => ({
      mode: initial.mode,
      palette: initial.palette,
      palettes: Object.entries(palettes).map(([value, p]) => ({ value, label: p.label, color: p.accent })),
      init() { apply(this.mode, this.palette); },
      toggleMode() { this.mode = this.mode === 'dark' ? 'light' : 'dark'; this.persist(); },
      setPalette(value) { this.palette = value; this.persist(); },
      persist() {
        const state = apply(this.mode, this.palette);
        this.mode = state.mode; this.palette = state.palette;
        try { localStorage.setItem('kit-mode', this.mode); localStorage.setItem('kit-palette', this.palette); } catch (_) {}
      }
    }));
  });
})();
