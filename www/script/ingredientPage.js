import { mockNutritionDB, addIngredient, saveMockNutritionDB, syncFromCloud } from './mockDatabase.js';

// === State ===
let currentSort = { key: 'name', direction: 'asc' };
let searchQuery = '';

// === Render the ingredient table ===
function renderIngredientTable() {
  const tbody = document.getElementById('ingredientTableBody');
  const countEl = document.getElementById('ingredientCount');
  if (!tbody) return;

  // Get all ingredients as array
  let items = Object.keys(mockNutritionDB).map(name => ({
    name,
    ...mockNutritionDB[name],
  }));

  // Filter by search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    items = items.filter(item => item.name.toLowerCase().includes(q));
  }

  // Sort
  items.sort((a, b) => {
    const key = currentSort.key;
    const dir = currentSort.direction === 'asc' ? 1 : -1;

    if (key === 'name') {
      return a.name.localeCompare(b.name) * dir;
    }
    return ((a[key] || 0) - (b[key] || 0)) * dir;
  });

  // Update count
  const totalCount = Object.keys(mockNutritionDB).length;
  if (countEl) {
    if (searchQuery && items.length !== totalCount) {
      countEl.textContent = `Showing ${items.length} of ${totalCount} ingredients`;
    } else {
      countEl.textContent = `${totalCount} ingredients total`;
    }
  }

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#999;padding:30px;">No ingredients found matching "${searchQuery}"</td></tr>`;
    updateSortArrows();
    return;
  }

  tbody.innerHTML = items.map(item => {
    const unitsInfo = item.servingUnits && item.servingUnits.length > 0
      ? `<br><small class="serving-units-badge">📏 ${item.servingUnits.map(u => `${u.name} = ${u.grams}g`).join(', ')}</small>`
      : '';
    return `
    <tr>
      <td class="ingredient-name-cell">${capitalize(item.name)}${unitsInfo}</td>
      <td class="num-cell">${item.calories.toFixed(1)}</td>
      <td class="num-cell">${item.protein.toFixed(1)}</td>
      <td class="num-cell">${item.fat.toFixed(1)}</td>
      <td class="num-cell">${item.carbs.toFixed(1)}</td>
      <td class="num-cell">${(item.fiber || 0).toFixed(1)}</td>
      <td class="actions-cell">
        <button class="edit-ingredient-btn" data-name="${item.name}" title="Edit">✏️</button>
        <button class="delete-ingredient-btn" data-name="${item.name}" title="Delete">🗑️</button>
      </td>
    </tr>
  `;}).join('');

  // Attach delete handlers
  tbody.querySelectorAll('.delete-ingredient-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-name');
      if (confirm(`Delete "${name}" from the database?`)) {
        delete mockNutritionDB[name];
        saveMockNutritionDB();
        renderIngredientTable();
      }
    });
  });

  // Attach edit handlers
  tbody.querySelectorAll('.edit-ingredient-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-name');
      openEditModal(name);
    });
  });

  updateSortArrows();
}

// === Sort arrows ===
function updateSortArrows() {
  document.querySelectorAll('.sortable .sort-arrow').forEach(arrow => {
    arrow.textContent = '';
  });
  const activeHeader = document.querySelector(`.sortable[data-sort="${currentSort.key}"] .sort-arrow`);
  if (activeHeader) {
    activeHeader.textContent = currentSort.direction === 'asc' ? ' ▲' : ' ▼';
  }
}

// === Edit modal ===
function openEditModal(name) {
  const data = mockNutritionDB[name];
  if (!data) return;

  document.getElementById('editOriginalName').value = name;
  document.getElementById('editName').value = name;
  document.getElementById('editCalories').value = data.calories;
  document.getElementById('editProtein').value = data.protein;
  document.getElementById('editFat').value = data.fat;
  document.getElementById('editCarbs').value = data.carbs;
  document.getElementById('editFiber').value = data.fiber || 0;

  // Load serving units into edit modal
  const container = document.getElementById('editServingUnitsContainer');
  container.innerHTML = '';
  if (data.servingUnits && data.servingUnits.length > 0) {
    data.servingUnits.forEach(unit => addServingUnitRow(container, unit.name, unit.grams));
  }

  document.getElementById('editIngredientModal').style.display = 'flex';
}

function closeEditModal() {
  document.getElementById('editIngredientModal').style.display = 'none';
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// === Init ===
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof waitForFirebase === 'function') {
    await waitForFirebase();
  }
  await syncFromCloud();
  renderIngredientTable();

  // --- Add Ingredient Form ---
  const addForm = document.getElementById('addIngredientForm');
  addForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('ingredientName').value.trim();
    const calories = document.getElementById('ingredientCalories').value;
    const protein = document.getElementById('ingredientProtein').value;
    const fat = document.getElementById('ingredientFat').value;
    const carbs = document.getElementById('ingredientCarbs').value;
    const fiber = document.getElementById('ingredientFiber') ? document.getElementById('ingredientFiber').value : 0;

    if (!name || isNaN(calories) || isNaN(protein) || isNaN(fat) || isNaN(carbs)) {
      alert('Please enter valid ingredient details.');
      return;
    }

    // Collect serving units from the add form
    const servingUnits = collectServingUnits(document.getElementById('servingUnitsContainer'));

    addIngredient(name, calories, protein, fat, carbs, fiber, servingUnits.length > 0 ? servingUnits : null);
    addForm.reset();
    document.getElementById('servingUnitsContainer').innerHTML = '';
    renderIngredientTable();

    // Scroll to the list so user sees the new entry
    document.getElementById('ingredientTable').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // --- Search ---
  const searchInput = document.getElementById('ingredientSearch');
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim();
    renderIngredientTable();
  });

  // --- Sort dropdown ---
  const sortSelect = document.getElementById('sortBy');
  sortSelect.addEventListener('change', () => {
    const val = sortSelect.value;
    const parts = val.split('-');
    if (parts.length === 1) {
      currentSort = { key: parts[0], direction: 'asc' };
    } else {
      currentSort = { key: parts[0], direction: parts[1] };
    }
    renderIngredientTable();
  });

  // --- Clickable column headers for sorting ---
  document.querySelectorAll('.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.getAttribute('data-sort');
      if (currentSort.key === key) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort = { key, direction: key === 'name' ? 'asc' : 'desc' };
      }
      // Sync dropdown
      const dropdownVal = currentSort.key + '-' + currentSort.direction;
      for (const opt of sortSelect.options) {
        if (opt.value === dropdownVal || (currentSort.key === 'name' && currentSort.direction === 'asc' && opt.value === 'name')) {
          sortSelect.value = opt.value;
          break;
        }
      }
      renderIngredientTable();
    });
    th.style.cursor = 'pointer';
  });

  // --- Edit form submit ---
  document.getElementById('editIngredientForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const originalName = document.getElementById('editOriginalName').value;
    const newName = document.getElementById('editName').value.trim().toLowerCase();
    const calories = parseFloat(document.getElementById('editCalories').value);
    const protein = parseFloat(document.getElementById('editProtein').value);
    const fat = parseFloat(document.getElementById('editFat').value);
    const carbs = parseFloat(document.getElementById('editCarbs').value);
    const fiber = parseFloat(document.getElementById('editFiber').value) || 0;

    if (!newName || isNaN(calories) || isNaN(protein) || isNaN(fat) || isNaN(carbs)) {
      alert('Please fill in all required fields.');
      return;
    }

    // Collect serving units from the edit modal
    const servingUnits = collectServingUnits(document.getElementById('editServingUnitsContainer'));

    // Remove old entry if name changed
    if (originalName !== newName) {
      delete mockNutritionDB[originalName];
    }

    addIngredient(newName, calories, protein, fat, carbs, fiber, servingUnits.length > 0 ? servingUnits : null);
    closeEditModal();
    renderIngredientTable();
  });

  // --- Close edit modal ---
  document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
  document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);
  document.getElementById('editIngredientModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('editIngredientModal')) closeEditModal();
  });

  // --- Serving Units buttons ---
  document.getElementById('addServingUnitBtn').addEventListener('click', () => {
    addServingUnitRow(document.getElementById('servingUnitsContainer'));
  });
  document.getElementById('addEditServingUnitBtn').addEventListener('click', () => {
    addServingUnitRow(document.getElementById('editServingUnitsContainer'));
  });
});

// === Serving Units Helpers ===
function addServingUnitRow(container, unitName = '', unitGrams = '') {
  const row = document.createElement('div');
  row.className = 'serving-unit-row';
  row.innerHTML = `
    <input type="text" class="serving-unit-name" placeholder="e.g. slice" value="${unitName}" />
    <input type="number" class="serving-unit-grams" placeholder="grams" step="0.1" value="${unitGrams}" />
    <button type="button" class="remove-serving-unit-btn">✕</button>
  `;
  container.appendChild(row);
  row.querySelector('.remove-serving-unit-btn').addEventListener('click', () => row.remove());
}

function collectServingUnits(container) {
  const units = [];
  container.querySelectorAll('.serving-unit-row').forEach(row => {
    const name = row.querySelector('.serving-unit-name').value.trim();
    const grams = parseFloat(row.querySelector('.serving-unit-grams').value);
    if (name && !isNaN(grams) && grams > 0) {
      units.push({ name, grams });
    }
  });
  return units;
}

