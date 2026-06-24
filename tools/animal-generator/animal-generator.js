/**
 * KIT — Animal Generator
 * Reads animals.json, populates the category dropdown, picks at random.
 */

document.addEventListener('DOMContentLoaded', () => {

    if (!window.ANIMALS) {
        console.error('[animal-generator] animals.js not loaded or missing exports.');
        return;
    }

    const animals = window.ANIMALS;

    // =====================
    //  STATE
    // =====================
    let data = {};       // raw JSON: { "Carnivores": [{...}], ... }
    let lastPick = null; // last generated animal

    // =====================
    //  DOM REFS
    // =====================
    const categorySelect = document.getElementById('category-select');
    const generateBtn = document.getElementById('generate-btn');
    const againBtn = document.getElementById('again-btn');
    const resultCard = document.getElementById('result-card');
    const resultFooter = document.getElementById('result-footer');
    const resultEmpty = document.getElementById('result-empty');
    const resultCategory = document.getElementById('result-category');
    const resultName = document.getElementById('result-name');
    const resultSci = document.getElementById('result-scientific');
    const statusDot = document.getElementById('status-dot');
    const statusLabel = document.getElementById('status-label');

    // =====================
    //  LOAD JSON
    // =====================

    data = animals;
    populateDropdown();
    generateBtn.disabled = false;

    // =====================
    //  POPULATE DROPDOWN
    // =====================
    function populateDropdown() {
        // "All" option first
        const allOpt = document.createElement('option');
        allOpt.value = 'all';
        allOpt.textContent = 'All categories';
        categorySelect.appendChild(allOpt);

        Object.keys(data).forEach(category => {
            const opt = document.createElement('option');
            opt.value = category;
            opt.textContent = `${category} (${data[category].length})`;
            categorySelect.appendChild(opt);
        });
    }

    // =====================
    //  PICK ANIMAL
    // =====================
    function pickAnimal() {
        const selected = categorySelect.value;
        let pool = [];

        if (selected === 'all') {
            pool = Object.values(data).flat();
        } else {
            pool = data[selected] || [];
        }

        if (!pool.length) return;

        // Avoid repeating the same animal if pool has more than one
        let pick = pool[Math.floor(Math.random() * pool.length)];
        if (pool.length > 1 && lastPick && pick.name === lastPick.name) {
            pick = pool[Math.floor(Math.random() * pool.length)];
        }

        lastPick = pick;

        // Resolve which category this animal belongs to (needed for "All" mode)
        const category = selected === 'all'
            ? Object.keys(data).find(cat => data[cat].some(a => a.name === pick.name))
            : selected;

        renderResult(pick, category);
    }

    // =====================
    //  RENDER
    // =====================
    function renderResult(animal, category) {
        resultCategory.textContent = category;
        resultName.textContent = animal.name;
        resultSci.textContent = animal.scientific_name || '';

        const status = (animal.status || 'unknown').toLowerCase();
        const dotClass = ['extant', 'extinct', 'endangered'].includes(status) ? status : 'unknown';
        statusDot.className = `status-dot ${dotClass}`;
        statusLabel.textContent = animal.status || 'Unknown';

        // Hide scientific name row if not present
        resultSci.style.display = animal.scientific_name ? 'block' : 'none';

        resultCard.classList.add('has-result');
        resultFooter.style.display = 'flex';

        // Subtle re-trigger animation on repeat clicks
        resultCard.style.animation = 'none';
        resultCard.offsetHeight; // reflow
        resultCard.style.animation = '';
    }

    // =====================
    //  EVENTS
    // =====================
    generateBtn.addEventListener('click', pickAnimal);
    againBtn.addEventListener('click', pickAnimal);

    // Also allow Enter on the select
    categorySelect.addEventListener('keydown', e => {
        if (e.key === 'Enter') pickAnimal();
    });

});
