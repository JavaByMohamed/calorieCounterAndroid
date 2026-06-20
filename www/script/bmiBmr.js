// 📊 BMI and BMR Calculation
const bmiBmrForm = document.getElementById("bmiBmrForm");
const bmiValue = document.getElementById("bmiValue");
const bmiCategory = document.getElementById("bmiCategory");
const bmiAdvice = document.getElementById("bmiAdvice");
const bmrValue = document.getElementById("bmrValue");
const bmrAdvice = document.getElementById("bmrAdvice");

// Cookie helper
function getBmiCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : "";
}

// Populate user dropdown with active user
function populateBmiUserDropdown() {
  const select = document.getElementById("bmiUsername");
  if (!select) return;
  const activeUser = getBmiCookie("activeUser");
  if (activeUser) {
    // Load user name from Firebase if available
    if (typeof cloudLoadUser === "function" && typeof isFirebaseReady === "function" && isFirebaseReady()) {
      cloudLoadUser(activeUser).then(user => {
        if (user) {
          select.innerHTML = `<option value="${activeUser}">${user.name}</option>`;
        } else {
          select.innerHTML = `<option value="${activeUser}">${activeUser}</option>`;
        }
      });
    } else {
      select.innerHTML = `<option value="${activeUser}">${activeUser}</option>`;
    }
  } else {
    select.innerHTML = '<option value="">-- Not logged in --</option>';
  }
}
if (typeof waitForFirebase === "function") {
  waitForFirebase().then(() => populateBmiUserDropdown());
} else {
  populateBmiUserDropdown();
}

// Store latest calculation results for saving
let latestBmiResults = {};

// 🧮 Handle BMI and BMR form submission
bmiBmrForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const gender = document.querySelector('input[name="sex"]:checked').value;
  const age = parseInt(document.getElementById("age").value);
  const height = parseFloat(document.getElementById("height").value);
  const weight = parseFloat(document.getElementById("weight").value);
  const activityLevel = parseFloat(document.getElementById("activityLevel").value);
  const activityLabel = document.getElementById("activityLevel").options[document.getElementById("activityLevel").selectedIndex].text;

  // Validate inputs
  if (age <= 0 || height <= 0 || weight <= 0) {
    alert("Please enter valid age, height, and weight values.");
    return;
  }

  // Calculate BMI
  const heightInMeters = height / 100;
  const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
  bmiValue.textContent = bmi;

  // Determine BMI category
  let bmiCat;
  if (bmi < 18.5) {
    bmiCat = "Underweight";
    bmiCategory.textContent = "Underweight";
    bmiAdvice.textContent = "Consider eating more nutritious meals.";
  } else if (bmi < 25) {
    bmiCat = "Normal weight";
    bmiCategory.textContent = "Normal weight";
    bmiAdvice.textContent = "Keep up the good work!";
  } else if (bmi < 30) {
    bmiCat = "Overweight";
    bmiCategory.textContent = "Overweight";
    bmiAdvice.textContent = "Consider a balanced diet and regular exercise.";
  } else {
    bmiCat = "Obese";
    bmiCategory.textContent = "Obese";
    bmiAdvice.textContent = "Consult a healthcare provider for guidance.";
  }

  // Calculate BMR using Mifflin-St Jeor Equation
  let bmr;
  if (gender === "m") {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
  bmrValue.textContent = bmr.toFixed(1);

  // Calculate TDEE
  const tdee = bmr * activityLevel;

  const tdeeValue = document.getElementById("tdeeValue");
  if (tdeeValue) tdeeValue.textContent = tdee.toFixed(1);
  bmrAdvice.textContent = `BMR is calories burned at complete rest. TDEE accounts for your activity level.`;

  // Store results for saving
  latestBmiResults = {
    bmi: bmi,
    bmiCategory: bmiCat,
    bmr: bmr.toFixed(1),
    tdee: tdee.toFixed(1),
    bodyStats: { age, height, weight, gender, activityLabel },
  };

  // Auto-update profile if logged in (save to Firebase directly)
  const activeUser = getBmiCookie("activeUser");
  if (activeUser && typeof cloudLoadUser === "function" && typeof isFirebaseReady === "function" && isFirebaseReady()) {
    cloudLoadUser(activeUser).then(user => {
      if (user) {
        user.bmi = bmi;
        user.bmiCategory = bmiCat;
        user.bmr = bmr.toFixed(1);
        user.tdee = tdee.toFixed(1);
        user.bodyStats = { age, height, weight, gender, activityLabel };
        if (!user.goals) user.goals = {};
        user.goals.calories = Math.round(tdee);
        user.goals.caloriesMin = Math.round(bmr);
        user.goals.caloriesMax = Math.round(tdee);
        cloudSaveUser(activeUser, user);
        console.log(`☁️ BMI/BMR auto-saved to database for "${activeUser}"`);
      }
    });
  }

  // Show save section if user is selected
  const saveDietSection = document.getElementById("saveDietSection");
  if (saveDietSection) {
    saveDietSection.style.display = "block";
  }

  // Show the calorie target selection
  const targetSelection = document.getElementById("calorieTargetSelection");
  if (targetSelection) {
    targetSelection.style.display = "block";
    document.getElementById("bmrLabel").textContent = `BMR (${bmr.toFixed(1)} kcal) — Use if you want a strict deficit (rest-level calories)`;
    document.getElementById("tdeeLabel").textContent = `TDEE (${tdee.toFixed(1)} kcal) — Use for maintenance (includes activity)`;
  }

  // Calculate diet based on selected target
  const selectedTarget = document.querySelector('input[name="calorieTarget"]:checked');
  const targetCalories = selectedTarget && selectedTarget.value === "tdee" ? tdee : bmr;
  calculateDietOptions(targetCalories);

  // Listen for target change
  document.querySelectorAll('input[name="calorieTarget"]').forEach((radio) => {
    radio.onchange = function () {
      const calories = this.value === "tdee" ? tdee : bmr;
      calculateDietOptions(calories);
    };
  });
});

// 💾 Save BMI/BMR/Diet to user profile (Firebase only)
document.getElementById("saveDietBtn").addEventListener("click", async function () {
  const username = document.getElementById("bmiUsername").value || getBmiCookie("activeUser") || "";
  if (!username) {
    alert("Please log in from the Home page to save your diet plan to your profile.");
    return;
  }

  if (typeof cloudLoadUser !== "function" || typeof isFirebaseReady !== "function" || !isFirebaseReady()) {
    alert("Database not ready. Please try again in a moment.");
    return;
  }

  const user = await cloudLoadUser(username);
  if (!user) {
    alert("User not found in database. Please create a profile first on the Home page.");
    return;
  }

  const dietPlan = document.getElementById("selectedDietPlan").value;

  // Save all stats to user profile
  user.bmi = latestBmiResults.bmi;
  user.bmiCategory = latestBmiResults.bmiCategory;
  user.bmr = latestBmiResults.bmr;
  user.tdee = latestBmiResults.tdee;
  user.dietPlan = dietPlan;
  user.bodyStats = latestBmiResults.bodyStats;

  // Also update macro goals based on diet plan and TDEE
  const tdee = parseFloat(latestBmiResults.tdee);
  const dietMacros = {
    "Balanced Diet (Maintenance)": { carbs: 40, protein: 30, fat: 30 },
    "High Protein (Fat Loss)": { carbs: 30, protein: 40, fat: 30 },
    "Muscle Gain (Higher Carbs)": { carbs: 50, protein: 30, fat: 20 },
    "Low Carbs (Keto)": { carbs: 5, protein: 20, fat: 75 },
  };
  const plan = dietMacros[dietPlan] || dietMacros["Balanced Diet (Maintenance)"];
  const bmrVal = parseFloat(latestBmiResults.bmr);
  user.goals = {
    calories: Math.round(tdee),
    caloriesMin: Math.round(bmrVal),
    caloriesMax: Math.round(tdee),
    protein: Math.round((tdee * plan.protein / 100) / 4),
    fat: Math.round((tdee * plan.fat / 100) / 9),
    carbs: Math.round((tdee * plan.carbs / 100) / 4),
    fiber: user.goals?.fiber || 30,
  };

  // Save to Firebase only
  await cloudSaveUser(username, user);
  console.log(`☁️ Diet plan saved to database for "${username}"`);

  alert(`Saved to ${user.name}'s profile!\n\nBMI: ${latestBmiResults.bmi} (${latestBmiResults.bmiCategory})\nBMR: ${latestBmiResults.bmr} kcal (minimum)\nTDEE: ${latestBmiResults.tdee} kcal (maximum)\nDiet: ${dietPlan}\n\nYour allowed calorie range is ${Math.round(bmrVal)}–${Math.round(tdee)} kcal/day.\nDaily macro goals have been auto-calculated.`);
});

// 🍽️ Diet Options Calculation
function calculateDietOptions(tdee) {

  const dietOptions = [
    { name: "Balanced Diet (Maintenance)", carbs: 40, protein: 30, fat: 30 },
    { name: "High Protein (Fat Loss)", carbs: 30, protein: 40, fat: 30 },
    { name: "Muscle Gain (Higher Carbs)", carbs: 50, protein: 30, fat: 20 },
    { name: "Low Carbs (Keto)", carbs: 5, protein: 20, fat: 75 },
  ];

  let html = `
    <h2>Choose Your Diet Plan</h2>
    <p>Based on your BMI and BMR, we recommend the following diet plans:</p>
    <ul>
  `;

  dietOptions.forEach((option, index) => {
    const carbCalories = (tdee * option.carbs) / 100;
    const proteinCalories = (tdee * option.protein) / 100;
    const fatCalories = (tdee * option.fat) / 100;

    const carbGrams = (carbCalories / 4).toFixed(1);
    const proteinGrams = (proteinCalories / 4).toFixed(1);
    const fatGrams = (fatCalories / 9).toFixed(1);

    html += `
      <li>
        <h4 class="diet-title" data-index="${index}">${option.name}</h4>
        <div class="diet-details" id="dietDetails-${index}" style="display: none;">
          <p>
            <strong>Calories:</strong> ${tdee.toFixed(1)} kcal<br>
            <strong>Carbs:</strong> ${carbCalories.toFixed(1)} kcal (${carbGrams} g, ${option.carbs}% of total)<br>
            <strong>Protein:</strong> ${proteinCalories.toFixed(1)} kcal (${proteinGrams} g, ${option.protein}% of total)<br>
            <strong>Fat:</strong> ${fatCalories.toFixed(1)} kcal (${fatGrams} g, ${option.fat}% of total)
          </p>
        </div>
      </li>
    `;
  });

  html += "</ul>";

  const dietResults = document.getElementById("dietResults");
  if (!dietResults) {
    console.error("Element with id 'dietResults' not found.");
    return;
  }
  dietResults.innerHTML = html;

  const dietOptionsSection = document.getElementById("dietOptions");
  if (dietOptionsSection) {
    dietOptionsSection.style.display = "block";
  }

  document.querySelectorAll(".diet-title").forEach((title) => {
    title.addEventListener("click", function () {
      const index = this.getAttribute("data-index");
      const details = document.getElementById(`dietDetails-${index}`);
      details.style.display = details.style.display === "none" ? "block" : "none";
    });
  });
}