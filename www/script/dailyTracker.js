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
    const mealDate = meal.entryDate || (meal.date ? meal.date.substring(0, 10) : "");
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
const weeklyBmrSummary = document.getElementById("weeklyBmrSummary");
const quickEntryForm = document.getElementById("quickEntryForm");
const savedMealLogForm = document.getElementById("savedMealLogForm");
const trackerSavedMealSearch = document.getElementById("trackerSavedMealSearch");
const trackerSavedMealResults = document.getElementById("trackerSavedMealResults");
const trackerSavedMealPreview = document.getElementById("trackerSavedMealPreview");
const openMealViewBtn = document.getElementById("openMealViewBtn");
let selectedTrackerSavedMeal = null;

function t(key, fallback) {
  return typeof window.getTranslation === "function" ? window.getTranslation(key, fallback) : fallback;
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(dateStr) {
  const [year, month, day] = String(dateStr).split("-").map(Number);
  return new Date(year || 1970, (month || 1) - 1, day || 1, 12, 0, 0, 0);
}

function getTodayStr() {
  return formatLocalDate(new Date());
}

function isValidDateInput(dateStr) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(dateStr || ""));
}

function shiftDate(dateStr, days) {
  const d = parseDateInput(dateStr);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}

function buildTrackerIso(dateStr) {
  return parseDateInput(dateStr).toISOString();
}

function getStartOfWeek(dateStr) {
  const date = parseDateInput(dateStr);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diffToMonday);
  return formatLocalDate(date);
}

function getWeekDates(dateStr) {
  const start = getStartOfWeek(dateStr);
  return Array.from({ length: 7 }, (_, index) => shiftDate(start, index));
}

function getRequestedTrackerDate() {
  const requestedDate = new URLSearchParams(window.location.search).get("date");
  return isValidDateInput(requestedDate) ? requestedDate : "";
}

function updateTrackerUrl(dateStr) {
  if (!isValidDateInput(dateStr) || !window.history?.replaceState) return;
  const url = new URL(window.location.href);
  url.searchParams.set("date", dateStr);
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

function buildMealPageUrl(dateStr) {
  const url = new URL("meal.html", window.location.href);
  if (isValidDateInput(dateStr)) {
    url.searchParams.set("date", dateStr);
  }
  url.searchParams.set("return", "daily-tracker.html");
  return url.toString();
}

function formatRangeStatus(consumedCalories, minCalories, maxCalories, lowerLabel, upperLabel) {
  if (maxCalories <= 0) {
    return {
      state: "none",
      message: t("tracker.logsToSelectedDate", "Entries are saved to the currently selected date above."),
      progressPct: 0,
      markerPct: 0,
      barColor: "#e74c3c",
    };
  }

  const progressPct = Math.min(100, (consumedCalories / maxCalories) * 100);
  const markerPct = minCalories > 0 ? (minCalories / maxCalories) * 100 : 0;
  if (consumedCalories > maxCalories) {
    return {
      state: "over",
      message: `⚠️ Over ${upperLabel} by ${(consumedCalories - maxCalories).toFixed(0)} kcal`,
      progressPct,
      markerPct,
      barColor: "#e74c3c",
    };
  }
  if (minCalories > 0 && consumedCalories < minCalories) {
    return {
      state: "below",
      message: `⚠️ Below ${lowerLabel} — ${(minCalories - consumedCalories).toFixed(0)} kcal to go`,
      progressPct,
      markerPct,
      barColor: "#f39c12",
    };
  }
  return {
    state: "in-range",
    message: `✅ In range — ${(maxCalories - consumedCalories).toFixed(0)} kcal left until ${upperLabel}`,
    progressPct,
    markerPct,
    barColor: "#27ae60",
  };
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
function createMacroProgressHtml(goals, consumed, options = {}) {
  const caloriesMin = goals.caloriesMin || 0;
  const caloriesMax = goals.caloriesMax || goals.calories || 0;
  const calEaten = consumed.calories || 0;
  const calorieLabel = options.calorieLabel || "Calories";
  const lowerLabel = options.lowerLabel || "BMR";
  const upperLabel = options.upperLabel || "TDEE";
  const zeroGoalMessage = options.zeroGoalMessage || '⚠️ <a href="bmi-bmr.html">Calculate BMI & BMR</a> to set your calorie range';

  const macros = [
    { label: "Protein", key: "protein", unit: "g", color: "#3498db" },
    { label: "Fat", key: "fat", unit: "g", color: "#f39c12" },
    { label: "Carbs", key: "carbs", unit: "g", color: "#9b59b6" },
    { label: "Fiber", key: "fiber", unit: "g", color: "#1abc9c" },
  ];
  const hasCalorieRange = caloriesMin > 0 && caloriesMax > 0;
  const rangeFactor = hasCalorieRange ? Math.min(1, caloriesMin / caloriesMax) : 0;

  let html = '<div class="macro-progress-container">';

  // Calorie range bar (BMR – TDEE)
  if (caloriesMin > 0 && caloriesMax > 0) {
    const rangeStatus = formatRangeStatus(calEaten, caloriesMin, caloriesMax, lowerLabel, upperLabel);

    html += `
      <div class="macro-row">
        <div class="macro-label">
          <strong>${calorieLabel}</strong>
          <span class="macro-numbers">${calEaten.toFixed(0)} kcal</span>
        </div>
        <div class="macro-bar-bg" style="position:relative;">
          <div class="macro-bar-fill macro-range-${rangeStatus.state}" style="width:${rangeStatus.progressPct}%; background:${rangeStatus.barColor};"></div>
          <div class="calorie-range-marker" style="position:absolute; left:${rangeStatus.markerPct}%; top:0; bottom:0; width:2px; background:#333; opacity:0.5;" title="${lowerLabel} (${caloriesMin} kcal)"></div>
        </div>
        <div class="macro-range-labels" style="display:flex; justify-content:space-between; font-size:11px; color:#888; margin-top:2px;">
          <span>${lowerLabel}: ${caloriesMin} kcal</span>
          <span>${upperLabel}: ${caloriesMax} kcal</span>
        </div>
        <div class="macro-remaining ${rangeStatus.state === 'over' ? 'over-text' : ''}" style="margin-top:2px;">
          ${rangeStatus.message}
        </div>
      </div>
    `;
  } else {
    // No BMR/TDEE set — show basic calorie bar
    const goal = goals.calories || 0;
    const visualMax = goal > 0 ? Math.max(goal, calEaten) : 0;
    const pct = visualMax > 0 ? Math.min(100, (calEaten / visualMax) * 100) : 0;
    const markerPct = goal > 0 && visualMax > 0 ? (goal / visualMax) * 100 : 0;
    const over = calEaten > goal && goal > 0;
    html += `
      <div class="macro-row">
        <div class="macro-label">
          <strong>${calorieLabel}</strong>
          <span class="macro-numbers">${calEaten.toFixed(1)} / ${goal.toFixed(0)} kcal</span>
        </div>
        <div class="macro-bar-bg" style="position:relative;">
          <div class="macro-bar-fill ${over ? 'over' : ''}" style="width:${pct}%; background:${over ? '#e74c3c' : '#e74c3c'};"></div>
          ${goal > 0 ? `<div class="calorie-range-marker" style="position:absolute; left:${markerPct}%; top:0; bottom:0; width:2px; background:#333; opacity:0.5;" title="Target (${goal} kcal)"></div>` : ""}
        </div>
        <div class="macro-remaining">
          ${goal === 0 ? zeroGoalMessage : (over ? `⚠️ Over by ${(calEaten - goal).toFixed(1)} kcal` : `✅ ${(goal - calEaten).toFixed(1)} kcal left`)}
        </div>
      </div>
    `;
  }

  // Other macros
  macros.forEach((m) => {
    const goal = goals[m.key] || 0;
    const eaten = consumed[m.key] || 0;
    if (goal === 0) {
      html += `
        <div class="macro-row">
          <div class="macro-label">
            <strong>${m.label}</strong>
            <span class="macro-numbers">${eaten.toFixed(1)} / 0 ${m.unit}</span>
          </div>
          <div class="macro-bar-bg"></div>
          <div class="macro-remaining">—</div>
        </div>
      `;
      return;
    }

    if (hasCalorieRange) {
      const lowerGoal = +(goal * rangeFactor).toFixed(1);
      const upperGoal = goal;
      const progressPct = upperGoal > 0 ? Math.min(100, (eaten / upperGoal) * 100) : 0;
      const markerPct = upperGoal > 0 ? (lowerGoal / upperGoal) * 100 : 0;
      const isOver = eaten > upperGoal;
      const isBelow = eaten < lowerGoal;
      const state = isOver ? "over" : (isBelow ? "below" : "in-range");
      const message = isOver
        ? `⚠️ Over ${upperLabel} by ${(eaten - upperGoal).toFixed(1)} ${m.unit}`
        : (isBelow
          ? `⚠️ Below ${lowerLabel} - ${(lowerGoal - eaten).toFixed(1)} ${m.unit} to go`
          : `✅ In range - ${(upperGoal - eaten).toFixed(1)} ${m.unit} left until ${upperLabel}`);

      html += `
        <div class="macro-row">
          <div class="macro-label">
            <strong>${m.label}</strong>
            <span class="macro-numbers">${eaten.toFixed(1)} ${m.unit}</span>
          </div>
          <div class="macro-bar-bg" style="position:relative;">
                <div class="macro-bar-fill macro-range-${state}" style="width:${progressPct}%; background:${m.color};"></div>
            <div class="calorie-range-marker" style="position:absolute; left:${markerPct}%; top:0; bottom:0; width:2px; background:#333; opacity:0.5;" title="${lowerLabel} ${m.label} (${lowerGoal.toFixed(1)} ${m.unit})"></div>
          </div>
          <div class="macro-range-labels" style="display:flex; justify-content:space-between; font-size:11px; color:#888; margin-top:2px;">
            <span>${lowerLabel}: ${lowerGoal.toFixed(1)} ${m.unit}</span>
            <span>${upperLabel}: ${upperGoal.toFixed(1)} ${m.unit}</span>
          </div>
          <div class="macro-remaining ${state === 'over' ? 'over-text' : ''}">${message}</div>
        </div>
      `;
      return;
    }

    const remaining = Math.max(0, goal - eaten);
    const visualMax = Math.max(goal, eaten);
    const pct = visualMax > 0 ? Math.min(100, (eaten / visualMax) * 100) : 0;
    const markerPct = visualMax > 0 ? (goal / visualMax) * 100 : 0;
    const over = eaten > goal;

    html += `
      <div class="macro-row">
        <div class="macro-label">
          <strong>${m.label}</strong>
          <span class="macro-numbers">${eaten.toFixed(1)} / ${goal.toFixed(0)} ${m.unit}</span>
        </div>
        <div class="macro-bar-bg" style="position:relative;">
          <div class="macro-bar-fill" style="width:${pct}%; background:${m.color};"></div>
          <div class="calorie-range-marker" style="position:absolute; left:${markerPct}%; top:0; bottom:0; width:2px; background:#333; opacity:0.5;" title="${m.label} target (${goal} ${m.unit})"></div>
        </div>
        <div class="macro-remaining ${over ? 'over-text' : ''}">
          ${over ? `⚠️ Over by ${(eaten - goal).toFixed(1)} ${m.unit}` : `✅ ${remaining.toFixed(1)} ${m.unit} left`}
        </div>
      </div>
    `;
  });
  html += "</div>";
  return html;
}

function renderMacroProgress(goals, consumed) {
  macroProgress.innerHTML = createMacroProgressHtml(goals, consumed);
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
  const targetDate = trackerDate?.value || getRequestedTrackerDate() || getTodayStr();
  const addMealUrl = buildMealPageUrl(targetDate);
  if (meals.length === 0) {
    dayMeals.innerHTML = `<p>No meals logged for this day. <a href="${addMealUrl}">Add a meal →</a></p>`;
    return;
  }

  let html = `<h4>🍽️ Meals Eaten (${meals.length})</h4>`;
  meals.forEach((meal) => {
    const time = new Date(meal.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const servingsEaten = meal.servingsEaten || 1;
    const totalServings = meal.servings || 1;

    if (meal.quickEntry) {
      html += `
        <div class="saved-meal-card quick-entry-card" id="mealCard_${meal.id}">
          <div class="meal-card-header">
            <h4>${meal.name}</h4>
            <span class="meal-date">🕐 ${time}</span>
            <span class="serving-badge">⚡ Quick entry</span>
            <div class="meal-card-actions">
              <button class="delete-btn delete-tracker-meal-btn" data-id="${meal.id}" title="Remove from tracker">🗑️ Delete</button>
            </div>
          </div>
          <p class="meal-totals quick-entry-summary">
            <strong>${meal.totals.calories.toFixed(1)} cal</strong> |
            ${meal.totals.protein.toFixed(1)}g protein |
            ${meal.totals.fat.toFixed(1)}g fat |
            ${meal.totals.carbs.toFixed(1)}g carbs |
            ${(meal.totals.fiber || 0).toFixed(1)}g fiber
          </p>
        </div>`;
      return;
    }

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
      window.location.href = buildMealPageUrl(trackerDate?.value || meal.entryDate || getTodayStr());
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

  // Strip internal _perGram helpers before saving to Firebase
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

function resetTrackerSavedMealSelection() {
  selectedTrackerSavedMeal = null;
  if (trackerSavedMealPreview) {
    trackerSavedMealPreview.style.display = "none";
    trackerSavedMealPreview.innerHTML = "";
  }
  const portionsInput = document.getElementById("trackerSavedMealPortions");
  if (portionsInput) portionsInput.value = 1;
}

function showTrackerSavedMealPreview(meal) {
  if (!trackerSavedMealPreview) return;
  const totals = meal?.totals || {};
  const servings = meal?.servings || 1;
  trackerSavedMealPreview.style.display = "block";
  trackerSavedMealPreview.innerHTML = `
    <h5>📚 ${meal.name}</h5>
    <p>
      <strong>Total:</strong> ${(totals.calories || 0).toFixed(1)} kcal |
      ${(totals.protein || 0).toFixed(1)}g protein |
      ${(totals.fat || 0).toFixed(1)}g fat |
      ${(totals.carbs || 0).toFixed(1)}g carbs |
      ${(totals.fiber || 0).toFixed(1)}g fiber
    </p>
    <p><small>Recipe servings: ${servings}</small></p>
  `;
}

function initTrackerSavedMealSearch() {
  if (!trackerSavedMealSearch || !trackerSavedMealResults) return;

  let debounceTimer = null;
  trackerSavedMealSearch.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    const query = this.value.trim().toLowerCase();
    resetTrackerSavedMealSelection();

    if (query.length < 2) {
      trackerSavedMealResults.style.display = "none";
      return;
    }

    debounceTimer = setTimeout(async () => {
      trackerSavedMealResults.innerHTML = '<div class="ingredient-option disabled">Searching saved meals...</div>';
      trackerSavedMealResults.style.display = "block";

      const allMeals = await getMealHistory();
      const savedMeals = allMeals.filter((meal) => !meal.addedToTracker);
      const filtered = savedMeals.filter((meal) => {
        const mealName = (meal.name || "").toLowerCase();
        const ingredientMatch = Array.isArray(meal.items)
          && meal.items.some((item) => (item.name || "").toLowerCase().includes(query));
        return mealName.includes(query) || ingredientMatch;
      });

      if (filtered.length === 0) {
        trackerSavedMealResults.innerHTML = '<div class="ingredient-option disabled">No saved meals found.</div>';
        return;
      }

      window._trackerSavedMealResults = filtered;
      trackerSavedMealResults.innerHTML = filtered.map((meal, index) => `
        <div class="ingredient-option" data-index="${index}">
          <strong>${meal.name}</strong><br>
          <small>🍽️ ${meal.servings || 1} serving${(meal.servings || 1) !== 1 ? "s" : ""} · ${(meal.totals?.calories || 0).toFixed(1)} kcal</small>
        </div>
      `).join("");

      trackerSavedMealResults.querySelectorAll(".ingredient-option:not(.disabled)").forEach((option) => {
        option.addEventListener("click", () => {
          const meal = window._trackerSavedMealResults?.[parseInt(option.getAttribute("data-index"), 10)];
          if (!meal) return;
          selectedTrackerSavedMeal = meal;
          trackerSavedMealSearch.value = meal.name || "";
          trackerSavedMealResults.style.display = "none";
          const portionsInput = document.getElementById("trackerSavedMealPortions");
          if (portionsInput) portionsInput.value = 1;
          showTrackerSavedMealPreview(meal);
        });
      });
    }, 250);
  });

  document.addEventListener("click", (event) => {
    if (!trackerSavedMealSearch.parentElement.contains(event.target)) {
      trackerSavedMealResults.style.display = "none";
    }
  });
}

// ==================== WEEK SUMMARY ====================
function renderWeekSummaryAsync(username, currentDate, allMeals, allWorkouts, goals) {
  const container = document.getElementById("weekSummary");
  const weekDates = getWeekDates(currentDate);
  const weekLabel = `${new Date(weekDates[0] + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${new Date(weekDates[6] + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  const daySummaries = weekDates.map((dateStr) => {
    const meals = getMealsForUserAndDate(allMeals, username, dateStr);
    const totals = computeDayTotals(meals);
    const workouts = getWorkoutsForDate(allWorkouts, dateStr);
    return { dateStr, meals, totals, workouts };
  });

  const weeklyTotals = daySummaries.reduce((acc, day) => {
    acc.calories += day.totals.calories;
    acc.protein += day.totals.protein;
    acc.fat += day.totals.fat;
    acc.carbs += day.totals.carbs;
    acc.fiber += day.totals.fiber;
    return acc;
  }, { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 });

  const weeklyGoals = {
    calories: (goals.calories || 0) * 7,
    caloriesMin: (goals.caloriesMin || 0) * 7,
    caloriesMax: (goals.caloriesMax || goals.calories || 0) * 7,
    protein: (goals.protein || 0) * 7,
    fat: (goals.fat || 0) * 7,
    carbs: (goals.carbs || 0) * 7,
    fiber: (goals.fiber || 0) * 7,
  };

  if (weeklyBmrSummary) {
    const weeklyTargetBaseline = weeklyGoals.caloriesMin || weeklyGoals.caloriesMax || weeklyGoals.calories;
    const weeklyTargetLabel = weeklyTargetBaseline > 0
      ? `${weeklyTotals.calories.toFixed(0)} kcal eaten / ${weeklyTargetBaseline.toFixed(0)} kcal target`
      : `${weeklyTotals.calories.toFixed(0)} kcal eaten this week`;
    const weeklyRemainingMessage = weeklyTargetBaseline > 0
      ? (weeklyTotals.calories <= weeklyTargetBaseline
        ? `✅ You have ${(weeklyTargetBaseline - weeklyTotals.calories).toFixed(0)} kcal left for this week.`
        : `⚠️ You are ${(weeklyTotals.calories - weeklyTargetBaseline).toFixed(0)} kcal over for this week.`)
      : "";

    weeklyBmrSummary.innerHTML = `
      <div class="week-progress-card week-overview-card">
        <div>
          <h5>Week window: ${weekLabel}</h5>
          <p class="week-progress-range">Mon 00:00 to Sun 23:59</p>
        </div>
        <div class="week-progress-total-line">
          <strong>${weeklyTargetLabel}</strong>
          ${weeklyRemainingMessage ? `<div class="macro-remaining ${weeklyTotals.calories > weeklyTargetBaseline ? 'over-text' : ''}">${weeklyRemainingMessage}</div>` : ""}
        </div>
      </div>

    `;
  }

  let html = '<div class="week-grid">';
  daySummaries.forEach(({ dateStr, meals, totals, workouts }) => {
    const isToday = dateStr === getTodayStr();
    const isSelected = dateStr === currentDate;
    const dayLabel = new Date(dateStr + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

    html += `
      <button type="button" class="week-day-card ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${meals.length === 0 ? 'empty' : ''}" data-date="${dateStr}">
        <div class="week-day-label">${dayLabel}</div>
        <div class="week-day-cal">${totals.calories.toFixed(0)} kcal</div>
        <div class="week-day-detail">
          🍽️ ${meals.length} meal${meals.length !== 1 ? 's' : ''} · 💪 ${workouts.length} exercise${workouts.length !== 1 ? 's' : ''}
        </div>
      </button>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;

  container.querySelectorAll(".week-day-card").forEach((button) => {
    button.addEventListener("click", () => {
      const nextDate = button.getAttribute("data-date");
      if (!isValidDateInput(nextDate)) return;
      trackerDate.value = nextDate;
      refreshTracker();
    });
  });
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
  if (!trackerDate.value) trackerDate.value = getRequestedTrackerDate() || getTodayStr();

  const dateStr = trackerDate.value;
  updateTrackerUrl(dateStr);

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
  renderWeekSummaryAsync(username, dateStr, allMeals, allWorkouts, goals);
}

// --- Event Listeners ---
trackerDate.addEventListener("change", refreshTracker);

if (quickEntryForm) {
  quickEntryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = getActiveUsername();
    if (!username) return;

    const entryName = (document.getElementById("quickEntryName")?.value || "").trim() || "Quick entry";
    const calories = parseFloat(document.getElementById("quickEntryCalories")?.value);
    const protein = parseFloat(document.getElementById("quickEntryProtein")?.value) || 0;
    const fat = parseFloat(document.getElementById("quickEntryFat")?.value) || 0;
    const carbs = parseFloat(document.getElementById("quickEntryCarbs")?.value) || 0;
    const fiber = parseFloat(document.getElementById("quickEntryFiber")?.value) || 0;

    if (isNaN(calories) || calories < 0) {
      alert("Enter a valid calorie amount.");
      return;
    }

    const targetDate = trackerDate.value || getTodayStr();
    const quickEntry = {
      id: Date.now(),
      username,
      name: entryName,
      servings: 1,
      servingsEaten: 1,
      entryDate: targetDate,
      date: buildTrackerIso(targetDate),
      addedToTracker: true,
      quickEntry: true,
      items: [{ name: entryName.toLowerCase(), amount: 1, calories, protein, fat, carbs, fiber }],
      totals: { calories, protein, fat, carbs, fiber },
      perServing: { calories, protein, fat, carbs, fiber },
    };

    const allHistory = await getMealHistory();
    allHistory.unshift(quickEntry);
    await saveMealHistory(allHistory);
    quickEntryForm.reset();
    ["quickEntryProtein", "quickEntryFat", "quickEntryCarbs", "quickEntryFiber"].forEach((id) => {
      const input = document.getElementById(id);
      if (input) input.value = 0;
    });
    refreshTracker();
  });
}

if (openMealViewBtn) {
  openMealViewBtn.addEventListener("click", () => {
    window.location.href = buildMealPageUrl(trackerDate.value || getRequestedTrackerDate() || getTodayStr());
  });
}

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
