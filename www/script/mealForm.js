import { mockNutritionDB, syncFromCloud, addIngredient } from './mockDatabase.js';
import { isCloudEnabled, saveToCloud, loadFromCloud } from './cloudStorage.js';
import { searchSwedishFood, getFoodNutrition, searchSwedishStoreProducts } from './swedishFoodAPI.js';
import { searchFatSecretFood, getFatSecretFoodDetails, isFatSecretConfigured } from './fatSecretAPI.js';

console.log(mockNutritionDB);

// 🇸🇪 Swedish Food API Search Integration
let apiSelectedFood = null;
let currentSearchSource = "stores";
let editingMealId = null;
let editingMealOriginalDate = null;

function initAPISearch() {
  const searchInput = document.getElementById("apiSearch");
  const resultsDiv = document.getElementById("apiSearchResults");
  const previewDiv = document.getElementById("apiNutritionPreview");
  if (!searchInput) return;

  // Source toggle buttons
  const sourceToggles = document.querySelectorAll(".api-source-btn");
  sourceToggles.forEach(btn => {
    btn.addEventListener("click", () => {
      sourceToggles.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentSearchSource = btn.getAttribute("data-source");
      if (searchInput.value.trim().length >= 2) {
        searchInput.dispatchEvent(new Event("input"));
      }
    });
  });

  let debounceTimer = null;

  searchInput.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    const query = this.value.trim();
    if (query.length < 2) {
      resultsDiv.style.display = "none";
      return;
    }
    debounceTimer = setTimeout(async () => {
      resultsDiv.innerHTML = '<div class="ingredient-option disabled">Searching...</div>';
      resultsDiv.style.display = "block";
      console.log("[API Search] Source:", currentSearchSource, "Query:", query);

      if (currentSearchSource === "history") {
        let historyMeals = [];
        try {
          historyMeals = (await getMealHistory()).filter((meal) => !meal.addedToTracker);
        } catch (e) {
          console.error("History meal search failed:", e);
        }

        const normalizedQuery = query.toLowerCase();
        const filteredMeals = historyMeals.filter((meal) => {
          const nameMatch = (meal.name || "").toLowerCase().includes(normalizedQuery);
          const ingredientMatch = Array.isArray(meal.items)
            && meal.items.some((item) => (item.name || "").toLowerCase().includes(normalizedQuery));
          return nameMatch || ingredientMatch;
        });

        if (filteredMeals.length === 0) {
          resultsDiv.innerHTML = '<div class="ingredient-option disabled">No meals found in your history.</div>';
        } else {
          window._historyMealResults = filteredMeals;
          resultsDiv.innerHTML = filteredMeals.map((meal, idx) => {
            const mealCalories = meal?.totals?.calories || 0;
            const servings = meal.servings || 1;
            return `<div class="ingredient-option" data-index="${idx}">
              <strong>${meal.name}</strong><br>
              <small>🍽️ ${servings} serving${servings > 1 ? "s" : ""} · ${mealCalories.toFixed(1)} kcal</small>
            </div>`;
          }).join("");

          resultsDiv.querySelectorAll(".ingredient-option:not(.disabled)").forEach((opt) => {
            opt.addEventListener("click", () => {
              const meal = window._historyMealResults[parseInt(opt.getAttribute("data-index"), 10)];
              if (!meal) return;

              searchInput.value = meal.name || "";
              resultsDiv.style.display = "none";
              showHistoryMealPreview(previewDiv, meal);
            });
          });
        }
      } else if (currentSearchSource === "fatsecret") {
        if (!isFatSecretConfigured()) {
          resultsDiv.innerHTML = '<div class="ingredient-option disabled">⚠️ FatSecret not configured.</div>';
          return;
        }
        let results = [];
        try {
          results = await searchFatSecretFood(query);
        } catch (e) {
          console.error("FatSecret search failed:", e);
        }
        if (results.length === 0) {
          resultsDiv.innerHTML = '<div class="ingredient-option disabled">No results found on FatSecret.</div>';
        } else {
          window._fatSecretSearchResults = results;
          resultsDiv.innerHTML = results.map((item, idx) =>
            `<div class="ingredient-option" data-index="${idx}">
              <strong>${item.name}</strong>${item.brand ? ` <small>(${item.brand})</small>` : ""}
              ${item.description ? `<br><small class="food-desc">${item.description}</small>` : ""}
            </div>`
          ).join("");
          resultsDiv.querySelectorAll(".ingredient-option:not(.disabled)").forEach(opt => {
            opt.addEventListener("click", async () => {
              const item = window._fatSecretSearchResults[parseInt(opt.getAttribute("data-index"))];
              searchInput.value = item.name;
              resultsDiv.style.display = "none";
              previewDiv.style.display = "block";
              previewDiv.innerHTML = "<p>Loading detailed nutrition from FatSecret...</p>";

              const nutrition = await getFatSecretFoodDetails(item.id);
              if (nutrition) {
                showNutritionPreview(previewDiv, nutrition);
              } else {
                showNutritionPreview(previewDiv, {
                  name: `${item.name}${item.brand ? " (" + item.brand + ")" : ""}`,
                  calories: item.calories,
                  protein: item.protein,
                  fat: item.fat,
                  carbs: item.carbs,
                  fiber: item.fiber,
                  source: "FatSecret",
                });
              }
            });
          });
        }
      } else if (currentSearchSource === "stores") {
        let results = [];
        try {
          results = await searchSwedishStoreProducts(query);
        } catch (e) {
          console.error("Store search failed:", e);
        }
        if (results.length === 0) {
          resultsDiv.innerHTML = '<div class="ingredient-option disabled">No store products found.</div>';
        } else {
          window._storeSearchResults = results;
          resultsDiv.innerHTML = results.map((item, idx) => {
            const hasNutrition = item.calories > 0 || item.protein > 0;
            const nutritionBadge = hasNutrition
              ? `<small style="color:#2ecc71">✅ ${item.calories} kcal</small>`
              : `<small style="color:#999">⏳ Nutrition not available</small>`;
            return `<div class="ingredient-option" data-index="${idx}">
              <strong>${item.name}</strong>${item.brand ? ` <small>(${item.brand})</small>` : ""}
              ${item.volume ? ` <small>${item.volume}</small>` : ""}
              <br>${item.stores ? `<small>🏪 ${item.stores}</small> · ` : ""}${item.price ? `<small>💰 ${item.price}</small> · ` : ""}${nutritionBadge}
            </div>`;
          }).join("");
          resultsDiv.querySelectorAll(".ingredient-option:not(.disabled)").forEach(opt => {
            opt.addEventListener("click", () => {
              const item = window._storeSearchResults[parseInt(opt.getAttribute("data-index"))];
              searchInput.value = item.name;
              resultsDiv.style.display = "none";
              if (item.calories > 0 || item.protein > 0) {
                showNutritionPreview(previewDiv, {
                  name: `${item.name}${item.brand ? " (" + item.brand + ")" : ""}`,
                  calories: item.calories,
                  protein: item.protein,
                  fat: item.fat,
                  carbs: item.carbs,
                  fiber: item.fiber,
                  source: item.source,
                  stores: item.stores,
                });
              } else {
                previewDiv.style.display = "block";
                previewDiv.innerHTML = `
                  <p><strong>${item.name}</strong>${item.brand ? ` (${item.brand})` : ""}</p>
                  <p>🏪 ${item.stores}${item.price ? ` · 💰 ${item.price}` : ""}${item.volume ? ` · ${item.volume}` : ""}</p>
                  <p style="color:#e67e22">⚠️ Nutrition data not found. You can add it manually below.</p>
                  <p><small>💡 Tip: Check the product packaging or the store's website for accurate nutrition info.</small></p>
                `;
                apiSelectedFood = {
                  name: `${item.name}${item.brand ? " (" + item.brand + ")" : ""}`,
                  calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0,
                };
              }
            });
          });
        }
      } else {
        const results = await searchSwedishFood(query);
        if (results.length === 0) {
          resultsDiv.innerHTML = '<div class="ingredient-option disabled">No results found.</div>';
        } else {
          resultsDiv.innerHTML = results.map(item =>
            `<div class="ingredient-option" data-id="${item.id}">${item.name}</div>`
          ).join("");
          resultsDiv.querySelectorAll(".ingredient-option:not(.disabled)").forEach(opt => {
            opt.addEventListener("click", async () => {
              searchInput.value = opt.textContent;
              resultsDiv.style.display = "none";
              previewDiv.style.display = "block";
              previewDiv.innerHTML = "<p>Loading nutritional data...</p>";

              const nutrition = await getFoodNutrition(opt.getAttribute("data-id"));
              if (nutrition) {
                showNutritionPreview(previewDiv, nutrition);
              } else {
                previewDiv.innerHTML = "<p>❌ Could not load nutrition data.</p>";
              }
            });
          });
        }
      }
    }, 400);
  });

  document.addEventListener("click", (e) => {
    if (!searchInput.parentElement.contains(e.target)) {
      resultsDiv.style.display = "none";
    }
  });
}

function showNutritionPreview(previewDiv, nutrition) {
  apiSelectedFood = nutrition;
  previewDiv.style.display = "block";
  previewDiv.innerHTML = `
    <h5>📊 ${nutrition.name} (per 100g)</h5>
    <p>
      <strong>Calories:</strong> ${nutrition.calories} kcal |
      <strong>Protein:</strong> ${nutrition.protein}g |
      <strong>Fat:</strong> ${nutrition.fat}g |
      <strong>Carbs:</strong> ${nutrition.carbs}g |
      <strong>Fiber:</strong> ${nutrition.fiber || 0}g
    </p>
    ${nutrition.stores ? `<p><small>🏪 Sold at: ${nutrition.stores}</small></p>` : ""}
    <p><small>Source: ${nutrition.source}</small></p>
    <p><small style="color:#999">ℹ️ Values are approximate. Check product packaging for exact nutrition info.</small></p>
    <button type="button" id="useApiDataBtn">✅ Use this ingredient</button>
  `;
  document.getElementById("useApiDataBtn").addEventListener("click", () => {
    useApiFood(nutrition);
  });
}

function useApiFood(nutrition) {
  const name = nutrition.name.toLowerCase();
  mockNutritionDB[name] = {
    calories: nutrition.calories,
    protein: nutrition.protein,
    fat: nutrition.fat,
    carbs: nutrition.carbs,
    fiber: nutrition.fiber,
  };
  const ingredientInput = document.getElementById("ingredient");
  if (ingredientInput) {
    ingredientInput.value = name;
  }
  const amountInput = document.getElementById("amount");
  if (amountInput) {
    amountInput.focus();
    amountInput.value = 100;
  }
  updateAmountUnitSelector(name);
  renderIngredientList("", false);
}

function showHistoryMealPreview(previewDiv, meal) {
  const totals = meal?.totals || {};
  const servings = meal?.servings || 1;
  previewDiv.style.display = "block";
  previewDiv.innerHTML = `
    <h5>📚 ${meal.name}</h5>
    <p>
      <strong>Total:</strong> ${(totals.calories || 0).toFixed(1)} kcal |
      ${(totals.protein || 0).toFixed(1)}g protein |
      ${(totals.fat || 0).toFixed(1)}g fat |
      ${(totals.carbs || 0).toFixed(1)}g carbs |
      ${(totals.fiber || 0).toFixed(1)}g fiber
    </p>
    <p><small>Servings in recipe: ${servings}</small></p>
    <button type="button" id="useHistoryMealBtn">✅ Load this meal</button>
  `;

  const useHistoryMealBtn = document.getElementById("useHistoryMealBtn");
  if (!useHistoryMealBtn) return;
  useHistoryMealBtn.addEventListener("click", () => {
    let requestedPortions = 1;
    if (servings > 1) {
      const input = prompt(
        `This recipe makes ${servings} portions.\nHow many portions do you want to log?`,
        "1"
      );
      if (input === null) return;
      requestedPortions = Math.max(1, parseInt(input, 10) || 1);
    }

    loadMealIntoForm(meal, { editMode: false, requestedPortions });
  });
}

function populateIngredientDropdown() {
  const ingredientDropdown = document.getElementById("ingredient");
  if (!ingredientDropdown) {
    console.error("Element with id 'ingredient' not found.");
    return;
  }

  if (ingredientDropdown.tagName === "SELECT") {
    const wrapper = document.createElement("div");
    wrapper.className = "ingredient-search-wrapper";
    wrapper.style.position = "relative";

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.id = "ingredient";
    searchInput.placeholder = "Search ingredients...";
    searchInput.autocomplete = "off";
    searchInput.required = true;

    const dropdown = document.createElement("div");
    dropdown.id = "ingredientDropdownList";
    dropdown.className = "ingredient-dropdown-list";

    ingredientDropdown.parentNode.replaceChild(wrapper, ingredientDropdown);
    wrapper.appendChild(searchInput);
    wrapper.appendChild(dropdown);

    searchInput.addEventListener("input", function () {
      renderIngredientList(this.value);
    });

    searchInput.addEventListener("focus", function () {
      renderIngredientList(this.value);
    });

    document.addEventListener("click", function (e) {
      if (!wrapper.contains(e.target)) {
        dropdown.style.display = "none";
      }
    });
  }
}

function renderIngredientList(filter, show = true) {
  const dropdown = document.getElementById("ingredientDropdownList");
  if (!dropdown) return;

  const query = filter.toLowerCase().trim();
  const sorted = Object.keys(mockNutritionDB).sort();
  const filtered = query
    ? sorted.filter(name => name.includes(query))
    : sorted;

  if (filtered.length === 0) {
    dropdown.innerHTML = '<div class="ingredient-option disabled">No ingredients found</div>';
    if (show) dropdown.style.display = "block";
    return;
  }

  dropdown.innerHTML = filtered.map(name =>
    `<div class="ingredient-option" data-value="${name}">${name.charAt(0).toUpperCase() + name.slice(1)}</div>`
  ).join("");

  if (show) {
    dropdown.style.display = "block";
  } else {
    dropdown.style.display = "none";
  }

  dropdown.querySelectorAll(".ingredient-option:not(.disabled)").forEach(opt => {
    opt.addEventListener("click", function () {
      const input = document.getElementById("ingredient");
      input.value = this.getAttribute("data-value");
      dropdown.style.display = "none";
      updateAmountUnitSelector(input.value);
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof waitForFirebase === "function") {
    await waitForFirebase();
  }
  await syncFromCloud();
  populateIngredientDropdown();
  initAPISearch();
  initInlineIngredientForm();
  loadPendingMealFromSession();

  const unitSelect = document.getElementById("amountUnit");
  const amountInput = document.getElementById("amount");
  if (unitSelect) {
    unitSelect.addEventListener("change", () => {
      updateUnitHint();
      updateAmountPlaceholder();
    });
  }
  if (amountInput) {
    amountInput.addEventListener("input", updateUnitHint);
  }
});

function updateAmountUnitSelector(ingredientName) {
  const unitSelect = document.getElementById("amountUnit");
  if (!unitSelect) return;

  unitSelect.innerHTML = '<option value="grams">grams</option>';

  const data = mockNutritionDB[ingredientName];
  if (data && data.servingUnits && data.servingUnits.length > 0) {
    data.servingUnits.forEach(unit => {
      const option = document.createElement("option");
      option.value = unit.name;
      option.textContent = `${unit.name} (${unit.grams}g each)`;
      unitSelect.appendChild(option);
    });
  }

  updateUnitHint();
  updateAmountPlaceholder();
}

function updateAmountPlaceholder() {
  const unitSelect = document.getElementById("amountUnit");
  const amountInput = document.getElementById("amount");
  if (!unitSelect || !amountInput) return;

  const selectedUnit = unitSelect.value;
  if (selectedUnit === "grams") {
    amountInput.placeholder = "e.g. 150";
    amountInput.step = "0.1";
  } else {
    amountInput.placeholder = `e.g. 2 ${selectedUnit}s`;
    amountInput.step = "0.5";
  }
}

function updateUnitHint() {
  const hint = document.getElementById("unitConversionHint");
  const unitSelect = document.getElementById("amountUnit");
  const amountInput = document.getElementById("amount");
  const ingredientInput = document.getElementById("ingredient");
  if (!hint || !unitSelect || !amountInput || !ingredientInput) return;

  const selectedUnit = unitSelect.value;
  const amount = parseFloat(amountInput.value);

  if (selectedUnit === "grams" || isNaN(amount) || amount <= 0) {
    hint.style.display = "none";
    return;
  }

  const data = mockNutritionDB[ingredientInput.value.trim().toLowerCase()];
  if (data && data.servingUnits) {
    const unit = data.servingUnits.find(u => u.name === selectedUnit);
    if (unit) {
      const totalGrams = (amount * unit.grams).toFixed(1);
      hint.textContent = `= ${totalGrams}g (${amount} × ${unit.grams}g per ${unit.name})`;
      hint.style.display = "block";
      return;
    }
  }
  hint.style.display = "none";
}

// 🥗 Meal Form Handling
const form = document.getElementById("mealForm");
const output = document.getElementById("mealOutput");
let mealItems = [];

function updateEditModeNotice(mealName) {
  const notice = document.getElementById("editingMealNotice");
  const saveBtn = document.getElementById("saveMealBtn");
  if (notice) {
    notice.textContent = `✏️ Editing saved meal: ${mealName}`;
    notice.style.display = "block";
  }
  if (saveBtn) {
    saveBtn.textContent = "💾 Update Saved Meal";
  }
}

function clearEditMode() {
  editingMealId = null;
  editingMealOriginalDate = null;

  const notice = document.getElementById("editingMealNotice");
  const saveBtn = document.getElementById("saveMealBtn");
  if (notice) {
    notice.textContent = "";
    notice.style.display = "none";
  }
  if (saveBtn) {
    saveBtn.textContent = "💾 Save Meal to History";
  }
}

function loadMealIntoForm(meal, options = {}) {
  const { editMode = false, requestedPortions = 1 } = options;
  if (!meal || !Array.isArray(meal.items) || meal.items.length === 0) return false;

  if (!editMode && mealItems.length > 0) {
    const shouldReplace = confirm("Replace your current meal with this saved one?");
    if (!shouldReplace) return false;
  }

  meal.items.forEach((item) => {
    const name = (item.name || "").toLowerCase();
    if (!name || mockNutritionDB[name] || !(item.amount > 0)) return;

    const factor = 100 / item.amount;
    mockNutritionDB[name] = {
      calories: +(item.calories * factor).toFixed(2),
      protein: +(item.protein * factor).toFixed(2),
      fat: +(item.fat * factor).toFixed(2),
      carbs: +(item.carbs * factor).toFixed(2),
      fiber: +((item.fiber || 0) * factor).toFixed(2),
    };
  });

  mealItems = meal.items.map((item) => ({
    name: (item.name || "").toLowerCase(),
    amount: item.amount,
    calories: item.calories,
    protein: item.protein,
    fat: item.fat,
    carbs: item.carbs,
    fiber: item.fiber || 0,
  }));

  const cleanName = (meal.name || "").replace(/ \(x\d+\)$/, "");
  const mealNameInput = document.getElementById("mealName");
  const mealServingsInput = document.getElementById("mealServings");
  const trackerServingsInput = document.getElementById("trackerServings");

  if (mealNameInput) mealNameInput.value = cleanName;
  if (mealServingsInput) mealServingsInput.value = meal.servings || 1;
  if (trackerServingsInput) trackerServingsInput.value = requestedPortions;

  if (editMode) {
    editingMealId = meal.id;
    editingMealOriginalDate = meal.date || new Date().toISOString();
    updateEditModeNotice(cleanName || "Unnamed meal");
  } else {
    clearEditMode();
  }

  renderIngredientList("", false);
  displayMeal();
  return true;
}

// 📋 Handle form submission for adding meal items
form.addEventListener("submit", function (e) {
  e.preventDefault();

  const ingredientInput = document.getElementById("ingredient").value.trim().toLowerCase();
  let amountInput = parseFloat(document.getElementById("amount").value);
  const unitSelect = document.getElementById("amountUnit");
  const selectedUnit = unitSelect ? unitSelect.value : "grams";

  if (!ingredientInput || isNaN(amountInput) || amountInput <= 0) {
    alert("Please enter a valid ingredient and amount.");
    return;
  }

  const ingredientData = mockNutritionDB[ingredientInput];
  if (!ingredientData) {
    alert("Ingredient not found in the database.");
    return;
  }

  let amountInGrams = amountInput;
  if (selectedUnit !== "grams" && ingredientData.servingUnits) {
    const unit = ingredientData.servingUnits.find(u => u.name === selectedUnit);
    if (unit) {
      amountInGrams = amountInput * unit.grams;
    }
  }

  const factor = amountInGrams / 100;
  const entry = {
    name: ingredientInput,
    amount: amountInGrams,
    calories: +(ingredientData.calories * factor).toFixed(1),
    protein: +(ingredientData.protein * factor).toFixed(1),
    fat: +(ingredientData.fat * factor).toFixed(1),
    carbs: +(ingredientData.carbs * factor).toFixed(1),
    fiber: +((ingredientData.fiber || 0) * factor).toFixed(1),
  };

  mealItems.push(entry);
  displayMeal();
  form.reset();
  if (unitSelect) {
    unitSelect.innerHTML = '<option value="grams">grams</option>';
  }
  const hint = document.getElementById("unitConversionHint");
  if (hint) hint.style.display = "none";
});

// 🖥️ Display meal summary
function displayMeal() {
  if (mealItems.length === 0) {
    output.innerHTML = "<p>No ingredients added yet.</p>";
    return;
  }

  const groupedItems = {};
  mealItems.forEach((item) => {
    if (!groupedItems[item.name]) {
      groupedItems[item.name] = {
        name: item.name,
        amount: 0,
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        fiber: 0,
      };
    }
    groupedItems[item.name].amount += item.amount;
    groupedItems[item.name].calories += item.calories;
    groupedItems[item.name].protein += item.protein;
    groupedItems[item.name].fat += item.fat;
    groupedItems[item.name].carbs += item.carbs;
    groupedItems[item.name].fiber += (item.fiber || 0);
  });

  let html = `
    <table>
      <thead>
        <tr>
          <th>Ingredient</th>
          <th>Amount (g)</th>
          <th>Calories</th>
          <th>Protein (g)</th>
          <th>Fat (g)</th>
          <th>Carbs (g)</th>
          <th>Fiber (g)</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  let total = { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 };

  Object.values(groupedItems).forEach((item) => {
    html += `
      <tr>
        <td>${item.name}</td>
        <td>
          <input type="number" class="edit-amount" data-name="${item.name}" value="${item.amount.toFixed(1)}" step="0.1" />
        </td>
        <td>${item.calories.toFixed(1)}</td>
        <td>${item.protein.toFixed(1)}</td>
        <td>${item.fat.toFixed(1)}</td>
        <td>${item.carbs.toFixed(1)}</td>
        <td>${item.fiber.toFixed(1)}</td>
        <td>
          <button class="delete-btn" data-name="${item.name}">Delete</button>
        </td>
      </tr>
    `;
    total.calories += item.calories;
    total.protein += item.protein;
    total.fat += item.fat;
    total.carbs += item.carbs;
    total.fiber += item.fiber;
  });

  html += `
      </tbody>
    </table>
    <h4>Total</h4>
    <p>
      <strong>Calories:</strong> ${total.calories.toFixed(1)} |
      <strong>Protein:</strong> ${total.protein.toFixed(1)}g |
      <strong>Fat:</strong> ${total.fat.toFixed(1)}g |
      <strong>Carbs:</strong> ${total.carbs.toFixed(1)}g |
      <strong>Fiber:</strong> ${total.fiber.toFixed(1)}g
    </p>
    <button id="clearMealBtn">Clear Meal</button>
  `;

  output.innerHTML = html;

  document.getElementById("clearMealBtn").addEventListener("click", function () {
    if (confirm("Clear all meal items?")) {
      mealItems = [];
      displayMeal();
    }
  });

  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const name = this.getAttribute("data-name");
      deleteMealItem(name);
    });
  });

  document.querySelectorAll(".edit-amount").forEach((input) => {
    input.addEventListener("change", function () {
      const name = this.getAttribute("data-name");
      const newAmount = parseFloat(this.value);
      if (isNaN(newAmount) || newAmount <= 0) {
        alert("Please enter a valid amount.");
        return;
      }
      editMealItem(name, newAmount);
    });
  });
}

function deleteMealItem(name) {
  mealItems = mealItems.filter((item) => item.name !== name);
  displayMeal();
}

function editMealItem(name, newAmount) {
  mealItems = mealItems.map((item) => {
    if (item.name === name) {
      const ingredientData = mockNutritionDB[name];
      const factor = newAmount / 100;
      return {
        ...item,
        amount: newAmount,
        calories: +(ingredientData.calories * factor).toFixed(1),
        protein: +(ingredientData.protein * factor).toFixed(1),
        fat: +(ingredientData.fat * factor).toFixed(1),
        carbs: +(ingredientData.carbs * factor).toFixed(1),
        fiber: +((ingredientData.fiber || 0) * factor).toFixed(1),
      };
    }
    return item;
  });
  displayMeal();
}

// 💾 Meal history — Firebase only
async function getMealHistory() {
  if (typeof cloudLoadAllMealHistory === "function" && typeof isFirebaseReady === "function" && isFirebaseReady()) {
    const cloudMeals = await cloudLoadAllMealHistory();
    if (cloudMeals) return cloudMeals;
  }
  return [];
}

async function saveMealHistory(history) {
  if (typeof cloudSaveAllMealHistory === "function" && typeof isFirebaseReady === "function" && isFirebaseReady()) {
    await cloudSaveAllMealHistory(history);
    console.log("☁️ Meal history saved to database");
  }
}

document.getElementById("saveMealBtn").addEventListener("click", async function () {
  if (mealItems.length === 0) {
    alert("No items in the current meal to save.");
    return;
  }

  const mealNameInput = document.getElementById("mealName");
  const mealName = mealNameInput.value.trim() || `Meal ${new Date().toLocaleString()}`;

  const servingsInput = document.getElementById("mealServings");
  const servings = Math.max(1, parseInt(servingsInput.value) || 1);

  const totals = mealItems.reduce((acc, item) => {
    acc.calories += item.calories;
    acc.protein += item.protein;
    acc.fat += item.fat;
    acc.carbs += item.carbs;
    acc.fiber += (item.fiber || 0);
    return acc;
  }, { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 });

  const perServing = {
    calories: +(totals.calories / servings).toFixed(1),
    protein: +(totals.protein / servings).toFixed(1),
    fat: +(totals.fat / servings).toFixed(1),
    carbs: +(totals.carbs / servings).toFixed(1),
    fiber: +(totals.fiber / servings).toFixed(1),
  };

  const nowIso = new Date().toISOString();
  const savedMeal = {
    id: editingMealId || Date.now(),
    username: "anonymous",
    name: mealName,
    servings: servings,
    date: editingMealOriginalDate || nowIso,
    updatedAt: nowIso,
    items: [...mealItems],
    totals: totals,
    perServing: perServing,
  };

  const history = await getMealHistory();
  if (editingMealId) {
    const index = history.findIndex((meal) => meal.id === editingMealId);
    if (index >= 0) {
      history[index] = savedMeal;
    } else {
      history.unshift(savedMeal);
    }
  } else {
    history.unshift(savedMeal);
  }
  await saveMealHistory(history);

  alert(editingMealId ? `Meal "${mealName}" updated!` : `Meal "${mealName}" saved to database!`);
  clearEditMode();
  sessionStorage.removeItem("editMeal");
  mealNameInput.value = "";

  if (confirm("Clear current meal?")) {
    mealItems = [];
    displayMeal();
  }
});

// 📅 Add to Today's Tracker — requires login
document.getElementById("addToTrackerBtn").addEventListener("click", async function () {
  if (mealItems.length === 0) {
    alert("No items in the current meal. Add ingredients first.");
    return;
  }

  const selectedUser = getActiveUserFromCookie();

  if (!selectedUser) {
    alert("⚠️ You must be logged in to add meals to your daily tracker.\n\nPlease log in from the Home page first.");
    return;
  }

  const mealNameInput = document.getElementById("mealName");
  const mealName = mealNameInput.value.trim() || `Meal ${new Date().toLocaleString()}`;

  const servingsInput = document.getElementById("mealServings");
  const totalServings = Math.max(1, parseInt(servingsInput.value) || 1);

  const trackerServingsInput = document.getElementById("trackerServings");
  const servingsEaten = Math.max(1, parseInt(trackerServingsInput.value) || 1);

  const totals = mealItems.reduce((acc, item) => {
    acc.calories += item.calories;
    acc.protein += item.protein;
    acc.fat += item.fat;
    acc.carbs += item.carbs;
    acc.fiber += (item.fiber || 0);
    return acc;
  }, { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 });

  const perServing = {
    calories: +(totals.calories / totalServings).toFixed(1),
    protein: +(totals.protein / totalServings).toFixed(1),
    fat: +(totals.fat / totalServings).toFixed(1),
    carbs: +(totals.carbs / totalServings).toFixed(1),
    fiber: +(totals.fiber / totalServings).toFixed(1),
  };

  const trackerEntry = {
    id: Date.now(),
    username: selectedUser,
    name: mealName + (servingsEaten > 1 ? ` (x${servingsEaten})` : ""),
    servings: totalServings,
    servingsEaten: servingsEaten,
    date: new Date().toISOString(),
    items: [...mealItems],
    totals: {
      calories: +(perServing.calories * servingsEaten).toFixed(1),
      protein: +(perServing.protein * servingsEaten).toFixed(1),
      fat: +(perServing.fat * servingsEaten).toFixed(1),
      carbs: +(perServing.carbs * servingsEaten).toFixed(1),
      fiber: +(perServing.fiber * servingsEaten).toFixed(1),
    },
    perServing: perServing,
    addedToTracker: true,
  };

  const history = await getMealHistory();
  history.unshift(trackerEntry);
  await saveMealHistory(history);

  alert(`✅ "${mealName}" (${servingsEaten} serving${servingsEaten > 1 ? 's' : ''}) added to today's tracker!`);
});

function getActiveUserFromCookie() {
  const match = document.cookie.match(/(?:^|; )activeUser=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function initInlineIngredientForm() {
  const form = document.getElementById("inlineAddIngredientForm");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("newIngName").value.trim();
    const calories = parseFloat(document.getElementById("newIngCal").value);
    const protein = parseFloat(document.getElementById("newIngProtein").value);
    const fat = parseFloat(document.getElementById("newIngFat").value);
    const carbs = parseFloat(document.getElementById("newIngCarbs").value);
    const fiber = parseFloat(document.getElementById("newIngFiber").value) || 0;

    if (!name || isNaN(calories) || isNaN(protein) || isNaN(fat) || isNaN(carbs)) {
      alert("Please fill in all required fields with valid numbers.");
      return;
    }

    addIngredient(name, calories, protein, fat, carbs, fiber);

    renderIngredientList("", false);

    const ingredientInput = document.getElementById("ingredient");
    if (ingredientInput) {
      ingredientInput.value = name.toLowerCase();
    }
    const amountInput = document.getElementById("amount");
    if (amountInput) {
      amountInput.focus();
      amountInput.value = 100;
    }

    form.reset();
    alert(`✅ "${name}" added to your ingredient database and selected!`);
  });
}

function loadPendingMealFromSession() {
  const editData = sessionStorage.getItem("editMeal");
  if (editData) {
    sessionStorage.removeItem("editMeal");
    try {
      const editMeal = JSON.parse(editData);
      loadMealIntoForm(editMeal, { editMode: true, requestedPortions: 1 });
      return;
    } catch (e) {
      console.error("Failed to load edit meal:", e);
    }
  }

  const reuseData = sessionStorage.getItem("reuseMeal");
  if (!reuseData) return;
  sessionStorage.removeItem("reuseMeal");

  try {
    const meal = JSON.parse(reuseData);
    const requestedPortions = meal._requestedPortions || 1;
    loadMealIntoForm(meal, { editMode: false, requestedPortions });
  } catch (e) {
    console.error("Failed to load reused meal:", e);
  }
}


