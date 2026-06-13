// ===== User Profiles & Daily Tracker =====
// All data lives in Firebase. No localStorage/sessionStorage.
// Active user session stored in a cookie.

// --- Cookie helpers ---
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : "";
}

// --- User Profile helpers (Firebase only) ---
async function getUsers() {
  if (typeof cloudLoadAllUsers === "function" && typeof isFirebaseReady === "function" && isFirebaseReady()) {
    const users = await cloudLoadAllUsers();
    return users || {};
  }
  return {};
}

async function saveUser(key, userData) {
  if (typeof cloudSaveUser === "function" && typeof isFirebaseReady === "function" && isFirebaseReady()) {
    await cloudSaveUser(key, userData);
    console.log(`☁️ User "${key}" saved to database`);
  }
}

function getActiveUsername() {
  return getCookie("activeUser");
}

async function getActiveUser() {
  const key = getActiveUsername();
  if (!key) return null;
  if (typeof cloudLoadUser === "function" && typeof isFirebaseReady === "function" && isFirebaseReady()) {
    const user = await cloudLoadUser(key);
    return user || null;
  }
  return null;
}

async function updateUserGoals(username, goals) {
  const key = username.toLowerCase();
  const user = await getActiveUser();
  if (!user) return;
  user.goals = {
    calories: parseFloat(goals.calories) || 0,
    caloriesMin: user.goals?.caloriesMin || 0,
    caloriesMax: user.goals?.caloriesMax || 0,
    protein: parseFloat(goals.protein) || 0,
    fat: parseFloat(goals.fat) || 0,
    carbs: parseFloat(goals.carbs) || 0,
    fiber: parseFloat(goals.fiber) || 0,
  };
  await saveUser(key, user);
}

// --- Meal History (Firebase only) ---
async function getMealHistory() {
  if (typeof cloudLoadAllMealHistory === "function" && typeof isFirebaseReady === "function" && isFirebaseReady()) {
    const meals = await cloudLoadAllMealHistory();
    return meals || [];
  }
  return [];
}

function getMealsForUserAndDate(allMeals, username, dateStr) {
  return allMeals.filter((meal) => {
    const mealUser = (meal.username || "").toLowerCase();
    const mealDate = meal.date ? meal.date.substring(0, 10) : "";
    // Only show meals that were explicitly added to the tracker (eaten meals)
    return meal.addedToTracker && mealUser === username.toLowerCase() && mealDate === dateStr;
  });
}

// --- Workout History (Firebase only) ---
async function getWorkoutsForUser(username) {
  if (typeof cloudLoadWorkouts === "function" && typeof isFirebaseReady === "function" && isFirebaseReady()) {
    const workouts = await cloudLoadWorkouts(username);
    return workouts || [];
  }
  return [];
}

function getWorkoutsForDate(workouts, dateStr) {
  return workouts.filter((w) => w.date === dateStr);
}

// --- Compute daily totals ---
// Tracker entries already store the correct eaten amount in totals (perServing × servingsEaten)
function computeDayTotals(meals) {
  const totals = { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 };
  meals.forEach((meal) => {
    totals.calories += (meal.totals.calories || 0);
    totals.protein += (meal.totals.protein || 0);
    totals.fat += (meal.totals.fat || 0);
    totals.carbs += (meal.totals.carbs || 0);
    totals.fiber += (meal.totals.fiber || 0);
  });
  return totals;
}

// --- UI Elements ---
const notLoggedInSection = document.getElementById("notLoggedInSection");
const profileSection = document.getElementById("profileSection");
const trackerContent = document.getElementById("trackerContent");
const trackerDate = document.getElementById("trackerDate");
const macroProgress = document.getElementById("macroProgress");
const dayMeals = document.getElementById("dayMeals");
const dayWorkouts = document.getElementById("dayWorkouts");
const updateGoalsBtn = document.getElementById("updateGoalsBtn");
const userStatsSection = document.getElementById("userStatsSection");
const userStatsContent = document.getElementById("userStatsContent");

function getTodayStr() {
  return new Date().toISOString().substring(0, 10);
}

function shiftDate(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().substring(0, 10);
}

// ==================== DONUT CHART (pure canvas) ====================
function drawDonutChart(canvas, consumed, goals) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2, radius = 80, thickness = 28;

  ctx.clearRect(0, 0, w, h);

  const macros = [
    { label: "Protein", value: consumed.protein, goal: goals.protein, color: "#3498db" },
    { label: "Fat", value: consumed.fat, goal: goals.fat, color: "#f39c12" },
    { label: "Carbs", value: consumed.carbs, goal: goals.carbs, color: "#9b59b6" },
    { label: "Fiber", value: consumed.fiber, goal: goals.fiber, color: "#1abc9c" },
  ];

  const total = macros.reduce((s, m) => s + (m.value || 0), 0);

  if (total === 0) {
    // Empty state
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = thickness;
    ctx.stroke();
    ctx.fillStyle = "#999";
    ctx.font = "14px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No data yet", cx, cy + 5);
    return macros;
  }

  let startAngle = -Math.PI / 2;
  macros.forEach((m) => {
    const sliceAngle = (m.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
    ctx.strokeStyle = m.color;
    ctx.lineWidth = thickness;
    ctx.stroke();
    startAngle += sliceAngle;
  });

  // Center text
  ctx.fillStyle = "#333";
  ctx.font = "bold 18px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${consumed.calories.toFixed(0)}`, cx, cy - 10);
  ctx.font = "11px Segoe UI, sans-serif";
  ctx.fillStyle = "#888";
  if (goals.caloriesMin && goals.caloriesMax) {
    ctx.fillText(`${goals.caloriesMin}–${goals.caloriesMax}`, cx, cy + 8);
    ctx.fillText(`kcal range`, cx, cy + 22);
  } else {
    ctx.fillText(`/ ${goals.calories.toFixed(0)} kcal`, cx, cy + 14);
  }

  return macros;
}

function renderDonutLegend(macros) {
  const legend = document.getElementById("donutLegend");
  legend.innerHTML = macros.map((m) =>
    `<span class="legend-item"><span class="legend-dot" style="background:${m.color}"></span>${m.label}: ${(m.value || 0).toFixed(1)}g / ${(m.goal || 0).toFixed(0)}g</span>`
  ).join("");
}

// ==================== PROGRESS BARS ====================
function renderMacroProgress(goals, consumed) {
  const caloriesMin = goals.caloriesMin || 0;
  const caloriesMax = goals.caloriesMax || goals.calories || 0;
  const calEaten = consumed.calories || 0;

  const macros = [
    { label: "Protein", key: "protein", unit: "g", color: "#3498db" },
    { label: "Fat", key: "fat", unit: "g", color: "#f39c12" },
    { label: "Carbs", key: "carbs", unit: "g", color: "#9b59b6" },
    { label: "Fiber", key: "fiber", unit: "g", color: "#1abc9c" },
  ];

  let html = '<div class="macro-progress-container">';

  // Calorie range bar (BMR – TDEE)
  if (caloriesMin > 0 && caloriesMax > 0) {
    const pct = caloriesMax > 0 ? Math.min(100, (calEaten / caloriesMax) * 100) : 0;
    const minPct = caloriesMax > 0 ? (caloriesMin / caloriesMax) * 100 : 0;
    const belowMin = calEaten < caloriesMin;
    const overMax = calEaten > caloriesMax;
    const barColor = overMax ? '#e74c3c' : (belowMin ? '#f39c12' : '#27ae60');

    let statusText;
    if (overMax) {
      statusText = `⚠️ Over TDEE by ${(calEaten - caloriesMax).toFixed(0)} kcal`;
    } else if (belowMin) {
      statusText = `⚠️ Below BMR — eat at least ${(caloriesMin - calEaten).toFixed(0)} more kcal`;
    } else {
      statusText = `✅ In range — ${(caloriesMax - calEaten).toFixed(0)} kcal left until TDEE`;
    }

    html += `
      <div class="macro-row">
        <div class="macro-label">
          <strong>Calories</strong>
          <span class="macro-numbers">${calEaten.toFixed(0)} kcal</span>
        </div>
        <div class="macro-bar-bg" style="position:relative;">
          <div class="macro-bar-fill" style="width:${pct}%; background:${barColor};"></div>
          <div class="calorie-range-marker" style="position:absolute; left:${minPct}%; top:0; bottom:0; width:2px; background:#333; opacity:0.5;" title="BMR (${caloriesMin} kcal)"></div>
        </div>
        <div class="macro-range-labels" style="display:flex; justify-content:space-between; font-size:11px; color:#888; margin-top:2px;">
          <span>BMR: ${caloriesMin} kcal</span>
          <span>TDEE: ${caloriesMax} kcal</span>
        </div>
        <div class="macro-remaining ${overMax ? 'over-text' : ''}" style="margin-top:2px;">
          ${statusText}
        </div>
      </div>
    `;
  } else {
    // No BMR/TDEE set — show basic calorie bar
    const goal = goals.calories || 0;
    const pct = goal > 0 ? Math.min(100, (calEaten / goal) * 100) : 0;
    const over = calEaten > goal && goal > 0;
    html += `
      <div class="macro-row">
        <div class="macro-label">
          <strong>Calories</strong>
          <span class="macro-numbers">${calEaten.toFixed(1)} / ${goal.toFixed(0)} kcal</span>
        </div>
        <div class="macro-bar-bg">
          <div class="macro-bar-fill ${over ? 'over' : ''}" style="width:${pct}%; background:${over ? '#e74c3c' : '#e74c3c'};"></div>
        </div>
        <div class="macro-remaining">
          ${goal === 0 ? '⚠️ <a href="bmi-bmr.html">Calculate BMI & BMR</a> to set your calorie range' : (over ? `⚠️ Over by ${(calEaten - goal).toFixed(1)} kcal` : `✅ ${(goal - calEaten).toFixed(1)} kcal left`)}
        </div>
      </div>
    `;
  }

  // Other macros
  macros.forEach((m) => {
    const goal = goals[m.key] || 0;
    const eaten = consumed[m.key] || 0;
    const remaining = Math.max(0, goal - eaten);
    const pct = goal > 0 ? Math.min(100, (eaten / goal) * 100) : 0;
    const over = eaten > goal && goal > 0;

    html += `
      <div class="macro-row">
        <div class="macro-label">
          <strong>${m.label}</strong>
          <span class="macro-numbers">${eaten.toFixed(1)} / ${goal.toFixed(0)} ${m.unit}</span>
        </div>
        <div class="macro-bar-bg">
          <div class="macro-bar-fill ${over ? 'over' : ''}" style="width:${pct}%; background:${over ? '#e74c3c' : m.color};"></div>
        </div>
        <div class="macro-remaining ${over ? 'over-text' : ''}">
          ${goal === 0 ? '—' : (over ? `⚠️ Over by ${(eaten - goal).toFixed(1)} ${m.unit}` : `✅ ${remaining.toFixed(1)} ${m.unit} left`)}
        </div>
      </div>
    `;
  });
  html += "</div>";
  macroProgress.innerHTML = html;
}

// --- Save meal history helper ---
async function saveMealHistory(history) {
  if (typeof cloudSaveAllMealHistory === "function" && typeof isFirebaseReady === "function" && isFirebaseReady()) {
    await cloudSaveAllMealHistory(history);
  }
}

// ==================== DAY MEALS (with inline editing) ====================
let _inlineEditId = null;
let _inlineEditMeal = null;
let _inlineEditAllHistory = null;

function _escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function computeItemTotals(items) {
  return items.reduce((acc, item) => {
    acc.calories += (item.calories || 0);
    acc.protein  += (item.protein  || 0);
    acc.fat      += (item.fat      || 0);
    acc.carbs    += (item.carbs    || 0);
    acc.fiber    += (item.fiber    || 0);
    return acc;
  }, { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 });
}

function renderDayMeals(meals) {
  if (meals.length === 0) {
    dayMeals.innerHTML = '<p>No meals logged for this day. <a href="meal.html">Add a meal →</a></p>';
    return;
  }

  let html = `<h4>🍽️ Meals Eaten (${meals.length})</h4>`;
  meals.forEach((meal) => {
    const time = new Date(meal.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const servingsEaten = meal.servingsEaten || 1;
    const totalServings = meal.servings || 1;
    html += `
      <div class="saved-meal-card" id="mealCard_${meal.id}">
        <div class="meal-card-header">
          <h4>${meal.name}</h4>
          <span class="meal-date">🕐 ${time}</span>
          ${totalServings > 1 ? `<span class="serving-badge">🍽️ ${servingsEaten} of ${totalServings} portions</span>` : ''}
          <div class="meal-card-actions">
            <button class="edit-tracker-meal-btn" data-id="${meal.id}" title="Edit ingredients & amounts">✏️ Edit</button>
            <button class="reuse-meal-btn" data-id="${meal.id}" title="Reuse this meal">♻️ Reuse</button>
            <button class="delete-btn delete-tracker-meal-btn" data-id="${meal.id}" title="Remove from tracker">🗑️ Delete</button>
          </div>
        </div>
        <table>
          <thead><tr><th>Ingredient</th><th>Amount (g)</th><th>Calories</th><th>Protein</th><th>Fat</th><th>Carbs</th><th>Fiber</th></tr></thead>
          <tbody>
    `;
    meal.items.forEach((item) => {
      html += `<tr><td>${item.name}</td><td>${item.amount.toFixed(1)}</td><td>${item.calories.toFixed(1)}</td><td>${item.protein.toFixed(1)}</td><td>${item.fat.toFixed(1)}</td><td>${item.carbs.toFixed(1)}</td><td>${(item.fiber || 0).toFixed(1)}</td></tr>`;
    });
    html += `</tbody></table>
        <p class="meal-totals">
          <strong>Logged:</strong> ${meal.totals.calories.toFixed(1)} cal |
          ${meal.totals.protein.toFixed(1)}g protein |
          ${meal.totals.fat.toFixed(1)}g fat |
          ${meal.totals.carbs.toFixed(1)}g carbs |
          ${(meal.totals.fiber || 0).toFixed(1)}g fiber
        </p>
        ${meal.perServing ? `<p class="meal-totals" style="color:#888;"><strong>Per portion:</strong> ${meal.perServing.calories} cal | ${meal.perServing.protein}g P | ${meal.perServing.fat}g F | ${meal.perServing.carbs}g C | ${meal.perServing.fiber || 0}g fiber</p>` : ''}
      </div>`;
  });
  dayMeals.innerHTML = html;

  // Delete
  dayMeals.querySelectorAll(".delete-tracker-meal-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const id = parseInt(this.getAttribute("data-id"));
      if (confirm("Remove this meal from today's tracker?")) {
        let allHistory = await getMealHistory();
        allHistory = allHistory.filter((m) => m.id !== id);
        await saveMealHistory(allHistory);
        refreshTracker();
      }
    });
  });

  // Edit — enter inline edit mode for that card
  dayMeals.querySelectorAll(".edit-tracker-meal-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const id = parseInt(this.getAttribute("data-id"));
      const allHistory = await getMealHistory();
      const meal = allHistory.find((m) => m.id === id);
      if (!meal) { alert("Meal not found."); return; }

      const card = document.getElementById(`mealCard_${id}`);
      if (!card) return;

      _inlineEditId = id;
      _inlineEditAllHistory = allHistory;
      _inlineEditMeal = JSON.parse(JSON.stringify(meal));

      // Pre-compute per-gram nutrition ratios for live recalculation when user changes grams
      _inlineEditMeal.items.forEach(item => {
        item._perGram = item.amount > 0
          ? { cal: item.calories/item.amount, prot: item.protein/item.amount,
              fat: item.fat/item.amount, carbs: item.carbs/item.amount,
              fiber: (item.fiber||0)/item.amount }
          : { cal: 0, prot: 0, fat: 0, carbs: 0, fiber: 0 };
      });

      renderCardEditMode(card);
    });
  });

  // Reuse
  dayMeals.querySelectorAll(".reuse-meal-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const id = parseInt(this.getAttribute("data-id"));
      let allHistory = await getMealHistory();
      const meal = allHistory.find((m) => m.id === id);
      if (!meal) return;

      const totalServings = meal.servings || 1;
      let portionsToLog = 1;
      if (totalServings > 1 && meal.perServing) {
        const input = prompt(`This recipe makes ${totalServings} portions.\nHow many portions do you want to log?`, "1");
        if (input === null) return;
        portionsToLog = Math.max(1, parseInt(input) || 1);
      }
      const reuseData = { ...meal, _requestedPortions: portionsToLog };
      sessionStorage.setItem("reuseMeal", JSON.stringify(reuseData));
      window.location.href = "meal.html";
    });
  });
}

// ==================== INLINE MEAL EDITOR ====================
function renderCardEditMode(card) {
  const m = _inlineEditMeal;
  const time = new Date(m.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const totals = computeItemTotals(m.items);
  const cleanName = (m.name || "").replace(/ \(x\d+\)$/, "");

  const rowsHtml = m.items.map((item, idx) => `
    <tr data-idx="${idx}">
      <td class="ing-name-cell">${_escapeHtml(item.name)}</td>
      <td><input type="number" class="inline-amount-input" data-idx="${idx}"
           value="${item.amount.toFixed(1)}" min="0.1" step="0.1" /></td>
      <td class="cell-cal">${(item.calories||0).toFixed(1)}</td>
      <td class="cell-prot">${(item.protein||0).toFixed(1)}</td>
      <td class="cell-fat">${(item.fat||0).toFixed(1)}</td>
      <td class="cell-carbs">${(item.carbs||0).toFixed(1)}</td>
      <td class="cell-fiber">${(item.fiber||0).toFixed(1)}</td>
      <td><button class="inline-del-btn" data-idx="${idx}" title="Remove ingredient">🗑️</button></td>
    </tr>`).join("");

  card.classList.add("editing");
  card.innerHTML = `
    <div class="meal-card-header">
      <input type="text" id="inlineEditName_${m.id}" class="inline-name-input"
             value="${_escapeHtml(cleanName)}" placeholder="Meal name" />
      <span class="meal-date">🕐 ${time}</span>
      <div class="meal-card-actions">
        <button class="inline-save-btn" data-id="${m.id}">✅ Save</button>
        <button class="inline-cancel-btn">❌ Cancel</button>
      </div>
    </div>

    <div class="inline-edit-table-wrap">
      <table class="inline-edit-table">
        <thead><tr>
          <th style="text-align:left">Ingredient</th>
          <th>Grams</th><th>Cal</th><th>Protein</th><th>Fat</th><th>Carbs</th><th>Fiber</th><th></th>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
        <tfoot><tr class="inline-totals-row">
          <td style="text-align:left"><strong>Total</strong></td><td>—</td>
          <td class="itotal-cal">${totals.calories.toFixed(1)}</td>
          <td class="itotal-prot">${totals.protein.toFixed(1)}</td>
          <td class="itotal-fat">${totals.fat.toFixed(1)}</td>
          <td class="itotal-carbs">${totals.carbs.toFixed(1)}</td>
          <td class="itotal-fiber">${totals.fiber.toFixed(1)}</td>
          <td></td>
        </tr></tfoot>
      </table>
    </div>

    <div class="inline-add-row">
      <strong>➕ Add ingredient</strong>
      <div class="inline-add-fields">
        <input type="text"   class="inline-add-name"   placeholder="Name" />
        <input type="number" class="inline-add-amount"  placeholder="Grams" min="0.1" step="0.1" />
        <input type="number" class="inline-add-cal"     placeholder="Cal/100g" min="0" step="0.1" />
        <input type="number" class="inline-add-prot"    placeholder="Protein/100g" min="0" step="0.1" />
        <input type="number" class="inline-add-fat"     placeholder="Fat/100g" min="0" step="0.1" />
        <input type="number" class="inline-add-carbs"   placeholder="Carbs/100g" min="0" step="0.1" />
        <button class="inline-add-ing-btn add-ing-btn">Add</button>
      </div>
    </div>

    <div class="inline-servings-row">
      <label>Recipe servings:
        <input type="number" class="inline-servings" value="${m.servings || 1}" min="1" step="1" />
      </label>
      <label>Portions eaten:
        <input type="number" class="inline-servings-eaten" value="${m.servingsEaten || 1}" min="1" step="1" />
      </label>
    </div>
  `;

  bindCardEditEvents(card, m.id);
}

function updateInlineTotals(card) {
  const t = computeItemTotals(_inlineEditMeal.items);
  card.querySelector(".itotal-cal").textContent   = t.calories.toFixed(1);
  card.querySelector(".itotal-prot").textContent  = t.protein.toFixed(1);
  card.querySelector(".itotal-fat").textContent   = t.fat.toFixed(1);
  card.querySelector(".itotal-carbs").textContent = t.carbs.toFixed(1);
  card.querySelector(".itotal-fiber").textContent = t.fiber.toFixed(1);
}

function bindCardEditEvents(card, mealId) {
  // Amount changed → recalculate nutrition using per-gram ratio
  card.querySelectorAll(".inline-amount-input").forEach(input => {
    input.addEventListener("change", function () {
      const idx = parseInt(this.dataset.idx);
      const newAmt = parseFloat(this.value);
      if (isNaN(newAmt) || newAmt <= 0) {
        this.value = _inlineEditMeal.items[idx].amount.toFixed(1);
        return;
      }
      const item = _inlineEditMeal.items[idx];
      item.amount   = newAmt;
      item.calories = +(item._perGram.cal   * newAmt).toFixed(1);
      item.protein  = +(item._perGram.prot  * newAmt).toFixed(1);
      item.fat      = +(item._perGram.fat   * newAmt).toFixed(1);
      item.carbs    = +(item._perGram.carbs * newAmt).toFixed(1);
      item.fiber    = +(item._perGram.fiber * newAmt).toFixed(1);
      const row = this.closest("tr");
      row.querySelector(".cell-cal").textContent   = item.calories.toFixed(1);
      row.querySelector(".cell-prot").textContent  = item.protein.toFixed(1);
      row.querySelector(".cell-fat").textContent   = item.fat.toFixed(1);
      row.querySelector(".cell-carbs").textContent = item.carbs.toFixed(1);
      row.querySelector(".cell-fiber").textContent = item.fiber.toFixed(1);
      updateInlineTotals(card);
    });
  });

  // Delete ingredient
  card.querySelectorAll(".inline-del-btn").forEach(btn => {
    btn.addEventListener("click", function () {
      const idx = parseInt(this.dataset.idx);
      if (_inlineEditMeal.items.length <= 1) {
        alert("A meal must have at least one ingredient.");
        return;
      }
      if (confirm(`Remove "${_inlineEditMeal.items[idx].name}" from this meal?`)) {
        _inlineEditMeal.items.splice(idx, 1);
        renderCardEditMode(card);
      }
    });
  });

  // Add ingredient
  card.querySelector(".inline-add-ing-btn").addEventListener("click", () => {
    const name    = (card.querySelector(".inline-add-name").value   || "").trim();
    const amount  = parseFloat(card.querySelector(".inline-add-amount").value);
    const cal100  = parseFloat(card.querySelector(".inline-add-cal").value)   || 0;
    const prot100 = parseFloat(card.querySelector(".inline-add-prot").value)  || 0;
    const fat100  = parseFloat(card.querySelector(".inline-add-fat").value)   || 0;
    const carbs100= parseFloat(card.querySelector(".inline-add-carbs").value) || 0;
    if (!name || isNaN(amount) || amount <= 0) {
      alert("Enter an ingredient name and gram amount.");
      return;
    }
    const f = amount / 100;
    _inlineEditMeal.items.push({
      name: name.toLowerCase(), amount,
      calories: +(cal100*f).toFixed(1), protein: +(prot100*f).toFixed(1),
      fat: +(fat100*f).toFixed(1), carbs: +(carbs100*f).toFixed(1), fiber: 0,
      _perGram: { cal: cal100/100, prot: prot100/100, fat: fat100/100, carbs: carbs100/100, fiber: 0 },
    });
    renderCardEditMode(card);
  });

  // Save
  card.querySelector(".inline-save-btn").addEventListener("click", () => saveInlineEdit(card, mealId));

  // Cancel
  card.querySelector(".inline-cancel-btn").addEventListener("click", () => {
    _inlineEditId = null;
    _inlineEditMeal = null;
    _inlineEditAllHistory = null;
    refreshTracker();
  });
}

async function saveInlineEdit(card, mealId) {
  const meal       = _inlineEditMeal;
  const allHistory = _inlineEditAllHistory;

  const name          = (card.querySelector(`#inlineEditName_${mealId}`)?.value || "").trim() || "Meal";
  const servings      = Math.max(1, parseInt(card.querySelector(".inline-servings")?.value)       || 1);
  const servingsEaten = Math.max(1, parseInt(card.querySelector(".inline-servings-eaten")?.value) || 1);

  const totals = computeItemTotals(meal.items);
  const perServing = {
    calories: +(totals.calories / servings).toFixed(1),
    protein:  +(totals.protein  / servings).toFixed(1),
    fat:      +(totals.fat      / servings).toFixed(1),
    carbs:    +(totals.carbs    / servings).toFixed(1),
    fiber:    +(totals.fiber    / servings).toFixed(1),
  };
  const loggedTotals = {
    calories: +(perServing.calories * servingsEaten).toFixed(1),
    protein:  +(perServing.protein  * servingsEaten).toFixed(1),
    fat:      +(perServing.fat      * servingsEaten).toFixed(1),
    carbs:    +(perServing.carbs    * servingsEaten).toFixed(1),
    fiber:    +(perServing.fiber    * servingsEaten).toFixed(1),
  };

  // Strip internal _perGram helper before saving to Firebase
  const cleanItems = meal.items.map(({ _perGram, ...rest }) => rest);

  const idx = allHistory.findIndex(m => m.id === meal.id);
  if (idx !== -1) {
    allHistory[idx] = {
      ...allHistory[idx],
      name: name + (servingsEaten > 1 ? ` (x${servingsEaten})` : ""),
      servings,
      servingsEaten,
      items: cleanItems,
      totals: loggedTotals,
      perServing,
    };
  }

  await saveMealHistory(allHistory);
  _inlineEditId = null;
  _inlineEditMeal = null;
  _inlineEditAllHistory = null;
  refreshTracker();
}

// ==================== DAY WORKOUTS ====================
function renderDayWorkouts(workouts) {
  if (workouts.length === 0) {
    dayWorkouts.innerHTML = '<p>No workouts logged for this day. <a href="workout.html">Log a workout →</a></p>';
    return;
  }

  let html = `<h4>💪 Workouts (${workouts.length} exercises)</h4>
    <table class="workout-table"><thead><tr><th>Muscle</th><th>Exercise</th><th>Weight (kg)</th><th>Sets</th><th>Reps</th></tr></thead><tbody>`;
  workouts.forEach((w) => {
    html += `<tr>
      <td><span class="muscle-tag ${w.muscleGroup}">${capitalize(w.muscleGroup)}</span></td>
      <td>${w.name}</td><td>${w.weight}</td><td>${w.sets}</td><td>${w.reps}</td>
    </tr>`;
  });
  html += "</tbody></table>";
  dayWorkouts.innerHTML = html;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ==================== USER STATS (BMI/BMR/Diet Plan) ====================
function renderUserStats(user) {
  if (!user.bmi && !user.bmr && !user.dietPlan) {
    userStatsSection.style.display = "none";
    return;
  }
  userStatsSection.style.display = "block";

  let html = '<div class="stats-cards">';
  if (user.bmi) {
    html += `<div class="stat-card">
      <span class="stat-icon">⚖️</span>
      <div><strong>BMI:</strong> ${user.bmi} <span class="stat-sub">(${user.bmiCategory || ''})</span></div>
    </div>`;
  }
  if (user.bmr) {
    html += `<div class="stat-card">
      <span class="stat-icon">🔥</span>
      <div><strong>BMR:</strong> ${user.bmr} kcal/day <span class="stat-sub">(minimum)</span></div>
    </div>`;
  }
  if (user.tdee) {
    html += `<div class="stat-card">
      <span class="stat-icon">⚡</span>
      <div><strong>TDEE:</strong> ${user.tdee} kcal/day <span class="stat-sub">(maximum)</span></div>
    </div>`;
  }
  if (user.bmr && user.tdee) {
    html += `<div class="stat-card" style="background:linear-gradient(135deg,#e8f8f0,#e8f0f8);border:2px solid #27ae60;">
      <span class="stat-icon">🎯</span>
      <div><strong>Allowed Range:</strong> ${user.bmr} – ${user.tdee} kcal/day</div>
    </div>`;
  }
  if (user.dietPlan) {
    html += `<div class="stat-card">
      <span class="stat-icon">🥗</span>
      <div><strong>Diet Plan:</strong> ${user.dietPlan}</div>
    </div>`;
  }
  html += '</div>';

  if (user.bodyStats) {
    html += `<p class="body-stats-line">
      <strong>Age:</strong> ${user.bodyStats.age || '—'} |
      <strong>Height:</strong> ${user.bodyStats.height || '—'} cm |
      <strong>Weight:</strong> ${user.bodyStats.weight || '—'} kg |
      <strong>Gender:</strong> ${user.bodyStats.gender === 'm' ? 'Male' : 'Female'} |
      <strong>Activity:</strong> ${user.bodyStats.activityLabel || '—'}
    </p>`;
  }

  html += `<p style="margin-top:10px;"><a href="bmi-bmr.html">📊 Recalculate BMI & BMR →</a></p>`;
  userStatsContent.innerHTML = html;
}

// ==================== WEEK SUMMARY ====================
function renderWeekSummaryAsync(username, currentDate, allMeals, allWorkouts) {
  const container = document.getElementById("weekSummary");
  let html = '<div class="week-grid">';

  for (let i = 6; i >= 0; i--) {
    const dateStr = shiftDate(currentDate, -i);
    const meals = getMealsForUserAndDate(allMeals, username, dateStr);
    const totals = computeDayTotals(meals);
    const workouts = getWorkoutsForDate(allWorkouts, dateStr);
    const isToday = dateStr === getTodayStr();
    const dayLabel = new Date(dateStr + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

    html += `
      <div class="week-day-card ${isToday ? 'today' : ''} ${meals.length === 0 ? 'empty' : ''}">
        <div class="week-day-label">${dayLabel}</div>
        <div class="week-day-cal">${totals.calories.toFixed(0)} kcal</div>
        <div class="week-day-detail">
          🍽️ ${meals.length} meal${meals.length !== 1 ? 's' : ''} · 💪 ${workouts.length} exercise${workouts.length !== 1 ? 's' : ''}
        </div>
      </div>
    `;
  }
  html += "</div>";
  container.innerHTML = html;
}

// ==================== MAIN REFRESH ====================
async function refreshTracker() {
  const username = getActiveUsername();

  if (!username) {
    notLoggedInSection.style.display = "block";
    profileSection.style.display = "none";
    trackerContent.style.display = "none";
    userStatsSection.style.display = "none";
    return;
  }

  // Load user from Firebase
  const user = await getActiveUser();
  if (!user) {
    notLoggedInSection.style.display = "block";
    profileSection.style.display = "none";
    trackerContent.style.display = "none";
    userStatsSection.style.display = "none";
    return;
  }

  // Logged in — show only this user's data
  notLoggedInSection.style.display = "none";
  profileSection.style.display = "block";
  document.getElementById("profileUsername").textContent = user.name;

  // Fill goals from database
  const goals = user.goals || { calories: 0, caloriesMin: 0, caloriesMax: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 };
  document.getElementById("editCalories").value = goals.calories || 0;
  document.getElementById("editProtein").value = goals.protein || 0;
  document.getElementById("editFat").value = goals.fat || 0;
  document.getElementById("editCarbs").value = goals.carbs || 0;
  document.getElementById("editFiber").value = goals.fiber || 0;

  // User stats (BMI/BMR/Diet)
  renderUserStats(user);

  // Show tracker
  trackerContent.style.display = "block";
  if (!trackerDate.value) trackerDate.value = getTodayStr();

  const dateStr = trackerDate.value;

  // Load meal history and workouts from Firebase
  const allMeals = await getMealHistory();
  const dayMealsData = getMealsForUserAndDate(allMeals, username, dateStr);
  const consumed = computeDayTotals(dayMealsData);

  const allWorkouts = await getWorkoutsForUser(username);
  const dayWorkoutsData = getWorkoutsForDate(allWorkouts, dateStr);

  // Donut chart
  const canvas = document.getElementById("macroDonut");
  const macros = drawDonutChart(canvas, consumed, goals);
  renderDonutLegend(macros);

  // Progress bars
  renderMacroProgress(goals, consumed);

  // Day meals & workouts
  renderDayMeals(dayMealsData);
  renderDayWorkouts(dayWorkoutsData);

  // Week summary (needs all meals for the week)
  renderWeekSummaryAsync(username, dateStr, allMeals, allWorkouts);
}

// --- Event Listeners ---
trackerDate.addEventListener("change", refreshTracker);

document.getElementById("todayBtn").addEventListener("click", () => {
  trackerDate.value = getTodayStr();
  refreshTracker();
});

document.getElementById("prevDayBtn").addEventListener("click", () => {
  if (trackerDate.value) {
    trackerDate.value = shiftDate(trackerDate.value, -1);
    refreshTracker();
  }
});

document.getElementById("nextDayBtn").addEventListener("click", () => {
  if (trackerDate.value) {
    trackerDate.value = shiftDate(trackerDate.value, 1);
    refreshTracker();
  }
});

updateGoalsBtn.addEventListener("click", async () => {
  const username = getActiveUsername();
  if (!username) return;
  await updateUserGoals(username, {
    calories: document.getElementById("editCalories").value,
    protein: document.getElementById("editProtein").value,
    fat: document.getElementById("editFat").value,
    carbs: document.getElementById("editCarbs").value,
    fiber: document.getElementById("editFiber").value,
  });
  alert("Goals updated and saved to database!");
  refreshTracker();
});

// --- Init ---
if (typeof waitForFirebase === "function") {
  waitForFirebase().then(() => refreshTracker());
} else {
  refreshTracker();
}
