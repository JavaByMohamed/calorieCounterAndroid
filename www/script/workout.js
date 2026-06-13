// Workout Tracker - stores data in Firebase database

// 🏋️ Predefined exercise database by muscle group
const exerciseDatabase = {
  chest: [
    "Bench Press", "Incline Bench Press", "Decline Bench Press",
    "Dumbbell Fly", "Incline Dumbbell Fly", "Cable Crossover",
    "Push-Ups", "Chest Dips", "Machine Chest Press",
    "Pec Deck Machine", "Landmine Press"
  ],
  back: [
    "Pull-Ups", "Chin-Ups", "Lat Pulldown",
    "Barbell Row", "Dumbbell Row", "Seated Cable Row",
    "T-Bar Row", "Face Pulls", "Deadlift",
    "Rack Pull", "Straight Arm Pulldown", "Inverted Row"
  ],
  shoulders: [
    "Overhead Press", "Dumbbell Shoulder Press", "Arnold Press",
    "Lateral Raise", "Front Raise", "Rear Delt Fly",
    "Upright Row", "Cable Lateral Raise", "Machine Shoulder Press",
    "Shrugs", "Barbell Shrug", "Dumbbell Shrug"
  ],
  biceps: [
    "Barbell Curl", "Dumbbell Curl", "Hammer Curl",
    "Preacher Curl", "Concentration Curl", "Cable Curl",
    "Incline Dumbbell Curl", "EZ-Bar Curl", "Spider Curl",
    "Reverse Curl", "Zottman Curl"
  ],
  triceps: [
    "Tricep Pushdown", "Overhead Tricep Extension", "Skull Crushers",
    "Close-Grip Bench Press", "Dips", "Kickbacks",
    "Cable Overhead Extension", "Diamond Push-Ups", "JM Press"
  ],
  legs: [
    "Squat", "Front Squat", "Leg Press",
    "Leg Extension", "Leg Curl", "Romanian Deadlift",
    "Bulgarian Split Squat", "Lunges", "Walking Lunges",
    "Hack Squat", "Goblet Squat", "Step-Ups",
    "Hip Thrust", "Sumo Deadlift"
  ],
  glutes: [
    "Hip Thrust", "Barbell Hip Thrust", "Glute Bridge",
    "Cable Kickback", "Donkey Kicks", "Fire Hydrants",
    "Sumo Squat", "Step-Ups", "Bulgarian Split Squat",
    "Good Morning"
  ],
  abs: [
    "Crunches", "Sit-Ups", "Leg Raises",
    "Hanging Leg Raise", "Plank", "Side Plank",
    "Russian Twist", "Cable Crunch", "Ab Rollout",
    "Mountain Climbers", "Bicycle Crunches", "Toe Touches"
  ],
  forearms: [
    "Wrist Curl", "Reverse Wrist Curl", "Farmer's Walk",
    "Dead Hang", "Plate Pinch", "Towel Pull-Up",
    "Grip Squeeze", "Reverse Curl"
  ],
  calves: [
    "Standing Calf Raise", "Seated Calf Raise", "Donkey Calf Raise",
    "Single-Leg Calf Raise", "Smith Machine Calf Raise",
    "Leg Press Calf Raise", "Jump Rope"
  ]
};

let currentUser = "";
let workoutsCache = [];

// Cookie helper
function getWorkoutCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : "";
}

// Populate username dropdown with active user only
function populateWorkoutUserDropdown() {
  const select = document.getElementById("workoutUsername");
  if (!select) return;
  const activeUser = getWorkoutCookie("activeUser");
  if (activeUser) {
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
  waitForFirebase().then(() => populateWorkoutUserDropdown());
} else {
  populateWorkoutUserDropdown();
}

document.getElementById("loadUserBtn").addEventListener("click", loadUser);
document.getElementById("exerciseForm").addEventListener("submit", saveExercise);
document.getElementById("filterMuscle").addEventListener("change", renderHistory);
document.getElementById("muscleGroup").addEventListener("change", populateExerciseDropdown);

async function loadUser() {
  const username = document.getElementById("workoutUsername").value;
  if (!username) {
    alert("Please select a user.");
    return;
  }
  currentUser = username;
  if (typeof waitForFirebase === "function") {
    await waitForFirebase();
  }
  if (typeof cloudLoadWorkouts === "function" && typeof isFirebaseReady === "function" && isFirebaseReady()) {
    workoutsCache = await cloudLoadWorkouts(currentUser) || [];
  }
  document.getElementById("workoutContent").style.display = "block";
  renderHistory();
  await loadWorkoutPlans();
  renderWorkoutPlans();
}

function getWorkouts() {
  return workoutsCache;
}

async function saveWorkoutsToDb(workouts) {
  workoutsCache = workouts;
  if (typeof cloudSaveWorkouts === "function" && typeof isFirebaseReady === "function" && isFirebaseReady() && currentUser) {
    await cloudSaveWorkouts(currentUser, workouts);
    console.log("☁️ Workouts saved to database");
  }
}

function toggleDateInput() {
  const manual = document.querySelector('input[name="dateOption"][value="manual"]').checked;
  document.getElementById("exerciseDate").style.display = manual ? "block" : "none";
}

function getSelectedDate() {
  const manual = document.querySelector('input[name="dateOption"][value="manual"]').checked;
  if (manual) {
    return document.getElementById("exerciseDate").value;
  }
  return new Date().toISOString().split("T")[0];
}

async function saveExercise(e) {
  e.preventDefault();
  const date = getSelectedDate();
  if (!date) {
    alert("Please select a date.");
    return;
  }
  const exerciseName = document.getElementById("exerciseName").value;
  if (!exerciseName) {
    alert("Please select an exercise.");
    return;
  }
  const exercise = {
    id: Date.now(),
    muscleGroup: document.getElementById("muscleGroup").value,
    name: exerciseName,
    weight: parseFloat(document.getElementById("exerciseWeight").value),
    sets: parseInt(document.getElementById("exerciseSets").value),
    reps: parseInt(document.getElementById("exerciseReps").value),
    date: date,
  };

  const workouts = getWorkouts();
  workouts.push(exercise);
  await saveWorkoutsToDb(workouts);

  document.getElementById("exerciseForm").reset();
  document.getElementById("exerciseDate").style.display = "none";
  renderHistory();
}

function renderHistory() {
  const filter = document.getElementById("filterMuscle").value;
  let workouts = getWorkouts();

  if (filter !== "all") {
    workouts = workouts.filter((w) => w.muscleGroup === filter);
  }

  workouts.sort((a, b) => new Date(b.date) - new Date(a.date));

  const grouped = {};
  workouts.forEach((w) => {
    if (!grouped[w.date]) grouped[w.date] = [];
    grouped[w.date].push(w);
  });

  const container = document.getElementById("workoutHistoryList");

  if (workouts.length === 0) {
    container.innerHTML = "<p>No exercises logged yet.</p>";
    return;
  }

  let html = "";
  for (const date in grouped) {
    html += `<div class="workout-day"><h4>${date}</h4><table class="workout-table"><thead><tr><th>Muscle</th><th>Exercise</th><th>Weight (kg)</th><th>Sets</th><th>Reps</th><th></th></tr></thead><tbody>`;
    grouped[date].forEach((w) => {
      html += `<tr data-id="${w.id}">
        <td><span class="muscle-tag ${w.muscleGroup}">${capitalize(w.muscleGroup)}</span></td>
        <td>${w.name}</td>
        <td><input type="number" class="edit-workout-field" data-field="weight" value="${w.weight}" step="0.5" disabled /></td>
        <td><input type="number" class="edit-workout-field" data-field="sets" value="${w.sets}" min="1" disabled /></td>
        <td><input type="number" class="edit-workout-field" data-field="reps" value="${w.reps}" min="1" disabled /></td>
        <td>
          <button class="edit-workout-btn" onclick="toggleEditExercise(this, ${w.id})">✏️</button>
          <button class="delete-btn" onclick="deleteExercise(${w.id})">✕</button>
        </td>
      </tr>`;
    });
    html += `</tbody></table></div>`;
  }

  container.innerHTML = html;
}

async function deleteExercise(id) {
  let workouts = getWorkouts();
  workouts = workouts.filter((w) => w.id !== id);
  await saveWorkoutsToDb(workouts);
  renderHistory();
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function populateExerciseDropdown() {
  const muscleGroup = document.getElementById("muscleGroup").value;
  const exerciseSelect = document.getElementById("exerciseName");
  exerciseSelect.innerHTML = "";

  if (!muscleGroup) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "-- Select a muscle group first --";
    opt.disabled = true;
    opt.selected = true;
    exerciseSelect.appendChild(opt);
    return;
  }

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "-- Select an exercise --";
  placeholder.disabled = true;
  placeholder.selected = true;
  exerciseSelect.appendChild(placeholder);

  const customExercises = getCustomExercises(muscleGroup);
  const allExercises = [...(exerciseDatabase[muscleGroup] || []), ...customExercises].sort();

  allExercises.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    exerciseSelect.appendChild(opt);
  });

  const customOpt = document.createElement("option");
  customOpt.value = "__custom__";
  customOpt.textContent = "➕ Add custom exercise...";
  exerciseSelect.appendChild(customOpt);
}

document.getElementById("exerciseName").addEventListener("change", function () {
  if (this.value === "__custom__") {
    const customName = prompt("Enter custom exercise name:");
    if (customName && customName.trim()) {
      const muscleGroup = document.getElementById("muscleGroup").value;
      saveCustomExercise(muscleGroup, customName.trim());
      populateExerciseDropdown();
      this.value = customName.trim();
    } else {
      this.value = "";
    }
  }
});

function getCustomExercises(muscleGroup) {
  const defaults = exerciseDatabase[muscleGroup] || [];
  const workouts = getWorkouts();
  const custom = new Set();
  workouts.forEach(w => {
    if (w.muscleGroup === muscleGroup && !defaults.includes(w.name)) {
      custom.add(w.name);
    }
  });
  return [...custom];
}

function saveCustomExercise(muscleGroup, name) {
  // Custom exercises are automatically preserved as part of workout entries
}

async function toggleEditExercise(btn, id) {
  const row = btn.closest("tr");
  const inputs = row.querySelectorAll(".edit-workout-field");
  const isEditing = !inputs[0].disabled;

  if (isEditing) {
    const workouts = getWorkouts();
    const workout = workouts.find(w => w.id === id);
    if (workout) {
      inputs.forEach(input => {
        const field = input.getAttribute("data-field");
        workout[field] = parseFloat(input.value);
        input.disabled = true;
      });
      await saveWorkoutsToDb(workouts);
      btn.textContent = "✏️";
    }
  } else {
    inputs.forEach(input => input.disabled = false);
    btn.textContent = "💾";
    inputs[0].focus();
  }
}

// ============================================================
// 📋 Workout Plans — Pre-create reusable workout templates
// ============================================================

let workoutPlans = [];
let planBuilderExercises = [];
let activeSession = null;

async function loadWorkoutPlans() {
  if (typeof isFirebaseReady === "function" && isFirebaseReady() && currentUser) {
    try {
      const doc = await firebaseDb.collection("workoutPlans").doc(currentUser).get();
      if (doc.exists) {
        workoutPlans = doc.data().plans || [];
      }
    } catch (e) {
      console.error("Failed to load workout plans:", e);
    }
  }
}

async function saveWorkoutPlans() {
  if (typeof isFirebaseReady === "function" && isFirebaseReady() && currentUser) {
    try {
      await firebaseDb.collection("workoutPlans").doc(currentUser).set({ plans: workoutPlans });
      console.log("☁️ Workout plans saved");
    } catch (e) {
      console.error("Failed to save workout plans:", e);
    }
  }
}

// --- Plan Tabs ---
document.querySelectorAll(".plan-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".plan-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".plan-tab-content").forEach(c => c.classList.remove("active"));
    tab.classList.add("active");
    const target = tab.getAttribute("data-tab");
    document.getElementById("tab-" + target).classList.add("active");
  });
});

// --- Plan Builder: Muscle group → exercise dropdown ---
document.getElementById("planMuscleGroup").addEventListener("change", function () {
  const muscleGroup = this.value;
  const exerciseSelect = document.getElementById("planExerciseName");
  exerciseSelect.innerHTML = "";

  if (!muscleGroup) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "-- Select a muscle group first --";
    opt.disabled = true;
    opt.selected = true;
    exerciseSelect.appendChild(opt);
    return;
  }

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "-- Select an exercise --";
  placeholder.disabled = true;
  placeholder.selected = true;
  exerciseSelect.appendChild(placeholder);

  const allExercises = (exerciseDatabase[muscleGroup] || []).sort();

  allExercises.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    exerciseSelect.appendChild(opt);
  });
});

// --- Add exercise to plan ---
document.getElementById("addExerciseToPlanbtn") && document.getElementById("addExerciseToPlanbtn").addEventListener("click", function () {
  const muscleGroup = document.getElementById("planMuscleGroup").value;
  const exerciseName = document.getElementById("planExerciseName").value;
  const sets = parseInt(document.getElementById("planSets").value) || 3;
  const reps = parseInt(document.getElementById("planReps").value) || 10;
  const weight = parseFloat(document.getElementById("planWeight").value) || 0;

  if (!muscleGroup || !exerciseName) {
    alert("Please select a muscle group and exercise.");
    return;
  }

  planBuilderExercises.push({ muscleGroup, exerciseName, sets, reps, weight });
  document.getElementById("planExerciseList").innerHTML = planBuilderExercises.map((e, i) =>
    `<div>${e.exerciseName} - ${e.sets}x${e.reps} @ ${e.weight}kg <button onclick="removePlanExercise(${i})">✕</button></div>`
  ).join("");

  document.getElementById("planMuscleGroup").value = "";
  document.getElementById("planExerciseName").innerHTML = "";
  document.getElementById("planWeight").value = "";
});

window.removePlanExercise = function(index) {
  planBuilderExercises.splice(index, 1);
  document.getElementById("planExerciseList").innerHTML = planBuilderExercises.map((e, i) =>
    `<div>${e.exerciseName} - ${e.sets}x${e.reps} @ ${e.weight}kg <button onclick="removePlanExercise(${i})">✕</button></div>`
  ).join("");
};

// --- Save Plan ---
document.getElementById("savePlanBtn") && document.getElementById("savePlanBtn").addEventListener("click", async function () {
  const planName = document.getElementById("planName").value.trim();

  if (!planName || planBuilderExercises.length === 0) {
    alert("Please enter a plan name and add at least one exercise.");
    return;
  }

  workoutPlans.push({ id: Date.now(), name: planName, exercises: [...planBuilderExercises] });
  await saveWorkoutPlans();

  planBuilderExercises = [];
  document.getElementById("planName").value = "";
  document.getElementById("planExerciseList").innerHTML = "";
  alert(`Plan "${planName}" saved!`);
  renderWorkoutPlans();
});

function renderWorkoutPlans() {
  const container = document.getElementById("savedPlans");
  if (!container) return;

  if (workoutPlans.length === 0) {
    container.innerHTML = "<p>No workout plans yet.</p>";
    return;
  }

  container.innerHTML = workoutPlans.map(plan =>
    `<div class="plan-card">
      <h4>${plan.name}</h4>
      <p>${plan.exercises.length} exercises</p>
      <button onclick="startWorkoutSession(${plan.id})">Start</button>
      <button onclick="deletePlan(${plan.id})">Delete</button>
    </div>`
  ).join("");
}

window.startWorkoutSession = function(planId) {
  const plan = workoutPlans.find(p => p.id === planId);
  if (plan) {
    activeSession = { ...plan, startedAt: new Date() };
    const sessionDiv = document.getElementById("activeSession");
    if (sessionDiv) {
      sessionDiv.style.display = "block";
      sessionDiv.innerHTML = `
        <h3>🏋️ ${plan.name}</h3>
        <table>
          <thead><tr><th>Exercise</th><th>Sets</th><th>Reps</th><th>Weight (kg)</th></tr></thead>
          <tbody>
            ${plan.exercises.map((e, i) => `
              <tr>
                <td>${e.exerciseName}</td>
                <td><input type="number" class="session-sets session-input-${i}" value="${e.sets}" /></td>
                <td><input type="number" class="session-reps session-input-${i}" value="${e.reps}" /></td>
                <td><input type="number" class="session-weight session-input-${i}" value="${e.weight}" /></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <button onclick="finishSession()">Finish & Log</button>
        <button onclick="cancelSession()">Cancel</button>
      `;
    }
  }
};

window.finishSession = async function() {
  if (!activeSession) return;
  const workouts = getWorkouts();
  const today = new Date().toISOString().split("T")[0];

  activeSession.exercises.forEach((e, i) => {
    workouts.push({
      id: Date.now() + i,
      muscleGroup: e.muscleGroup,
      name: e.exerciseName,
      weight: parseFloat(document.querySelector(`.session-weight.session-input-${i}`)?.value || e.weight),
      sets: parseInt(document.querySelector(`.session-sets.session-input-${i}`)?.value || e.sets),
      reps: parseInt(document.querySelector(`.session-reps.session-input-${i}`)?.value || e.reps),
      date: today,
    });
  });

  await saveWorkoutsToDb(workouts);
  activeSession = null;
  alert("✅ Workout logged!");
  location.reload();
};

window.cancelSession = function() {
  activeSession = null;
  const sessionDiv = document.getElementById("activeSession");
  if (sessionDiv) sessionDiv.style.display = "none";
};

window.deletePlan = async function(planId) {
  if (confirm("Delete this plan?")) {
    workoutPlans = workoutPlans.filter(p => p.id !== planId);
    await saveWorkoutPlans();
    renderWorkoutPlans();
  }
};


