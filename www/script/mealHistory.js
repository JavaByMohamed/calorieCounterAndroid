const historyOutput = document.getElementById("historyOutput");
const dailySummary = document.getElementById("dailySummary");
const filterDate = document.getElementById("filterDate");
const searchMeal = document.getElementById("searchMeal");

// Firebase-only meal history
async function getMealHistory() {
  if (typeof cloudLoadAllMealHistory === "function" && typeof isFirebaseReady === "function" && isFirebaseReady()) {
    const meals = await cloudLoadAllMealHistory();
    return meals || [];
  }
  // If Firebase isn't ready yet, wait briefly and retry once (helps on slow mobile connections)
  if (typeof waitForFirebase === "function") {
    console.warn("⚠️ Firebase not ready for meal history, retrying...");
    await waitForFirebase();
    if (typeof cloudLoadAllMealHistory === "function" && typeof isFirebaseReady === "function" && isFirebaseReady()) {
      const meals = await cloudLoadAllMealHistory();
      return meals || [];
    }
  }
  console.warn("⚠️ Could not load meal history — Firebase unavailable");
  return [];
}

async function saveMealHistory(history) {
  if (typeof cloudSaveAllMealHistory === "function" && typeof isFirebaseReady === "function" && isFirebaseReady()) {
    await cloudSaveAllMealHistory(history);
    console.log("☁️ Meal history saved to database");
  }
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

async function displayHistory(filterDateStr, searchQuery) {
  let history = await getMealHistory();

  // Only show saved meals (recipes), NOT eaten/tracker entries
  history = history.filter((meal) => !meal.addedToTracker);

  if (filterDateStr) {
    history = history.filter((meal) => meal.date.startsWith(filterDateStr));
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    history = history.filter((meal) => meal.name.toLowerCase().includes(query));
  }

  if (history.length === 0) {
    historyOutput.innerHTML = "<p>No saved meals found.</p>";
    dailySummary.innerHTML = "";
    return;
  }

  // Daily totals
  const dayTotals = { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 };
  history.forEach((meal) => {
    dayTotals.calories += meal.totals.calories;
    dayTotals.protein += meal.totals.protein;
    dayTotals.fat += meal.totals.fat;
    dayTotals.carbs += meal.totals.carbs;
    dayTotals.fiber += (meal.totals.fiber || 0);
  });

  const label = filterDateStr ? "Day" : "All Time";
  dailySummary.innerHTML = `
    <div class="daily-totals">
      <h4>📊 ${label} Totals (${history.length} meal${history.length > 1 ? "s" : ""})</h4>
      <p>
        <strong>Calories:</strong> ${dayTotals.calories.toFixed(1)} |
        <strong>Protein:</strong> ${dayTotals.protein.toFixed(1)}g |
        <strong>Fat:</strong> ${dayTotals.fat.toFixed(1)}g |
        <strong>Carbs:</strong> ${dayTotals.carbs.toFixed(1)}g |
        <strong>Fiber:</strong> ${dayTotals.fiber.toFixed(1)}g
      </p>
    </div>
  `;

  let html = "";
  history.forEach((meal) => {
    const totalServingWeight = meal.items.reduce((sum, item) => sum + item.amount, 0);

    html += `
      <div class="saved-meal-card">
        <div class="meal-card-header">
          <h4>${meal.name}</h4>
          <span class="meal-date">${formatDate(meal.date)}</span>
          <span class="serving-badge">🍽️ ${totalServingWeight.toFixed(0)}g total${meal.servings > 1 ? ` · ${meal.servings} servings · ${(totalServingWeight / meal.servings).toFixed(0)}g/serving` : ''}</span>
          <button class="edit-meal-btn" data-id="${meal.id}" title="Edit this meal">✏️ Edit</button>
          <button class="reuse-meal-btn" data-id="${meal.id}" title="Reuse this meal">♻️ Reuse</button>
          <button class="delete-btn delete-meal-btn" data-id="${meal.id}">🗑️ Delete</button>
        </div>
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
            </tr>
          </thead>
          <tbody>
    `;
    meal.items.forEach((item) => {
      html += `
        <tr>
          <td>${item.name}</td>
          <td>${item.amount.toFixed(1)}</td>
          <td>${item.calories.toFixed(1)}</td>
          <td>${item.protein.toFixed(1)}</td>
          <td>${item.fat.toFixed(1)}</td>
          <td>${item.carbs.toFixed(1)}</td>
          <td>${(item.fiber || 0).toFixed(1)}</td>
        </tr>
      `;
    });
    html += `
          </tbody>
        </table>
        <p class="meal-totals">
          <strong>Total:</strong> ${meal.totals.calories.toFixed(1)} cal |
          ${meal.totals.protein.toFixed(1)}g protein |
          ${meal.totals.fat.toFixed(1)}g fat |
          ${meal.totals.carbs.toFixed(1)}g carbs |
          ${(meal.totals.fiber || 0).toFixed(1)}g fiber
        </p>
        ${meal.servings > 1 ? `<p class="meal-totals"><strong>Per Serving (1/${meal.servings}):</strong> ${(meal.totals.calories / meal.servings).toFixed(1)} cal | ${(meal.totals.protein / meal.servings).toFixed(1)}g protein | ${(meal.totals.fat / meal.servings).toFixed(1)}g fat | ${(meal.totals.carbs / meal.servings).toFixed(1)}g carbs | ${((meal.totals.fiber || 0) / meal.servings).toFixed(1)}g fiber</p>` : ''}
      </div>
    `;
  });

  historyOutput.innerHTML = html;

  // Delete buttons
  document.querySelectorAll(".delete-meal-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const id = parseInt(this.getAttribute("data-id"));
      if (confirm("Delete this saved meal?")) {
        let h = await getMealHistory();
        h = h.filter((m) => m.id !== id);
        await saveMealHistory(h);
        displayHistory(filterDate.value || null, searchMeal.value.trim() || null);
      }
    });
  });

  // Reuse buttons — load meal into meal form page with portion selection
  document.querySelectorAll(".reuse-meal-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const id = parseInt(this.getAttribute("data-id"));
      const h = await getMealHistory();
      const meal = h.find((m) => m.id === id);
      if (meal) {
        const totalServings = meal.servings || 1;
        let portionsToLog = 1;

        if (totalServings > 1 && meal.perServing) {
          const input = prompt(
            `This recipe makes ${totalServings} portions.\nHow many portions do you want to log?`,
            "1"
          );
          if (input === null) return;
          portionsToLog = Math.max(1, parseInt(input) || 1);
        }

        // Store meal data with portion selection in sessionStorage
        const reuseData = {
          ...meal,
          _requestedPortions: portionsToLog,
        };
        sessionStorage.setItem("reuseMeal", JSON.stringify(reuseData));
        window.location.href = "meal.html";
      }
    });
  });

  // Edit buttons — open meal form in edit mode
  document.querySelectorAll(".edit-meal-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const id = parseInt(this.getAttribute("data-id"));
      const h = await getMealHistory();
      const meal = h.find((m) => m.id === id);
      if (!meal) return;

      sessionStorage.removeItem("reuseMeal");
      sessionStorage.setItem("editMeal", JSON.stringify(meal));
      window.location.href = "meal.html";
    });
  });
}

// Filters
filterDate.addEventListener("change", function () {
  displayHistory(this.value || null, searchMeal.value.trim() || null);
});

let searchDebounce = null;
searchMeal.addEventListener("input", function () {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    displayHistory(filterDate.value || null, this.value.trim() || null);
  }, 300);
});

document.getElementById("clearFilterBtn").addEventListener("click", function () {
  filterDate.value = "";
  searchMeal.value = "";
  displayHistory(null, null);
});

// Init — wait for Firebase to be ready
async function initMealHistory() {
  // Show loading state
  if (historyOutput) {
    historyOutput.innerHTML = '<p>⏳ Loading saved meals...</p>';
  }

  if (typeof waitForFirebase === "function") {
    await waitForFirebase();
  }

  // Check if Firebase is available
  if (typeof isFirebaseReady === "function" && !isFirebaseReady()) {
    if (historyOutput) {
      historyOutput.innerHTML = '<p style="color:#e67e22;">⚠️ Could not connect to database. Check your internet connection and reload the page.</p>';
    }
    return;
  }

  await displayHistory(null);
}
initMealHistory();


