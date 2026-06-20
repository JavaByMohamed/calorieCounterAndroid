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
let workoutsCache = []; // In-memory cache

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
  // Load workouts from Firebase
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

  // Sort by date descending
  workouts.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Group by date
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

  // Default placeholder
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "-- Select an exercise --";
  placeholder.disabled = true;
  placeholder.selected = true;
  exerciseSelect.appendChild(placeholder);

  // Load custom exercises for this muscle group
  const customExercises = getCustomExercises(muscleGroup);
  const allExercises = [...(exerciseDatabase[muscleGroup] || []), ...customExercises].sort();

  allExercises.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    exerciseSelect.appendChild(opt);
  });

  // "Add custom..." option
  const customOpt = document.createElement("option");
  customOpt.value = "__custom__";
  customOpt.textContent = "➕ Add custom exercise...";
  exerciseSelect.appendChild(customOpt);
}

// Handle custom exercise selection
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

// Custom exercise persistence (in-memory, derived from workout history)
function getCustomExercises(muscleGroup) {
  // Extract unique exercise names from workout history that aren't in the default database
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
  // Custom exercises are automatically preserved because they're saved as part of workout entries
  // No additional storage needed
}

// ✏️ Toggle inline editing of a workout entry
async function toggleEditExercise(btn, id) {
  const row = btn.closest("tr");
  const inputs = row.querySelectorAll(".edit-workout-field");
  const isEditing = !inputs[0].disabled;

  if (isEditing) {
    // Save changes
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
    // Enable editing
    inputs.forEach(input => input.disabled = false);
    btn.textContent = "💾";
    inputs[0].focus();
  }
}

// ============================================================
// 📋 Workout Plans — Pre-create reusable workout templates
// ============================================================

let workoutPlans = [];
let planBuilderExercises = []; // Temp list while building a plan
let activeSession = null; // Current active workout session

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

  const customExercises = getCustomExercises(muscleGroup);
  const allExercises = [...(exerciseDatabase[muscleGroup] || []), ...customExercises].sort();

  allExercises.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    exerciseSelect.appendChild(opt);
  });

  // "Add custom..." option
  const customOpt = document.createElement("option");
  customOpt.value = "__custom__";
  customOpt.textContent = "➕ Add custom exercise...";
  exerciseSelect.appendChild(customOpt);
});

// Handle custom exercise in plan builder
document.getElementById("planExerciseName").addEventListener("change", function () {
  if (this.value === "__custom__") {
    const customName = prompt("Enter custom exercise name:");
    if (customName && customName.trim()) {
      const muscleGroup = document.getElementById("planMuscleGroup").value;
      saveCustomExercise(muscleGroup, customName.trim());
      // Refresh dropdown
      document.getElementById("planMuscleGroup").dispatchEvent(new Event("change"));
      this.value = customName.trim();
    } else {
      this.value = "";
    }
  }
});

// --- Add Exercise to Plan Builder ---
document.getElementById("addExerciseToPlanBtn").addEventListener("click", function () {
  const muscleGroup = document.getElementById("planMuscleGroup").value;
  const exerciseName = document.getElementById("planExerciseName").value;
  const sets = parseInt(document.getElementById("planSets").value);
  const reps = parseInt(document.getElementById("planReps").value);
  const weight = document.getElementById("planWeight").value ? parseFloat(document.getElementById("planWeight").value) : null;

  if (!muscleGroup || !exerciseName || !sets || !reps) {
    alert("Please select a muscle group, exercise, sets, and reps.");
    return;
  }

  planBuilderExercises.push({ muscleGroup, name: exerciseName, sets, reps, weight });
  renderPlanBuilder();

  // Reset exercise inputs (keep muscle group)
  document.getElementById("planExerciseName").value = "";
  document.getElementById("planSets").value = "";
  document.getElementById("planReps").value = "";
  document.getElementById("planWeight").value = "";
});

function renderPlanBuilder() {
  const container = document.getElementById("planBuilderList");
  if (planBuilderExercises.length === 0) {
    container.innerHTML = '<p class="empty-plan-msg">No exercises added yet. Start building your plan above.</p>';
    return;
  }

  let html = '<table class="workout-table"><thead><tr><th>Muscle</th><th>Exercise</th><th>Sets</th><th>Reps</th><th>Weight</th><th></th></tr></thead><tbody>';
  planBuilderExercises.forEach((ex, idx) => {
    html += `<tr>
      <td><span class="muscle-tag ${ex.muscleGroup}">${capitalize(ex.muscleGroup)}</span></td>
      <td>${ex.name}</td>
      <td>${ex.sets}</td>
      <td>${ex.reps}</td>
      <td>${ex.weight !== null ? ex.weight + ' kg' : '<em>—</em>'}</td>
      <td>
        <button class="delete-btn" onclick="removePlanBuilderExercise(${idx})">✕</button>
        <button class="move-up-btn" onclick="movePlanExercise(${idx}, -1)" ${idx === 0 ? 'disabled' : ''}>⬆️</button>
        <button class="move-down-btn" onclick="movePlanExercise(${idx}, 1)" ${idx === planBuilderExercises.length - 1 ? 'disabled' : ''}>⬇️</button>
      </td>
    </tr>`;
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}

function removePlanBuilderExercise(idx) {
  planBuilderExercises.splice(idx, 1);
  renderPlanBuilder();
}

function movePlanExercise(idx, direction) {
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= planBuilderExercises.length) return;
  const temp = planBuilderExercises[idx];
  planBuilderExercises[idx] = planBuilderExercises[newIdx];
  planBuilderExercises[newIdx] = temp;
  renderPlanBuilder();
}

// --- Save Custom Plan ---
document.getElementById("saveCustomPlanBtn").addEventListener("click", async function () {
  const planName = document.getElementById("customPlanName").value.trim();
  if (!planName) {
    alert("Please enter a plan name.");
    return;
  }
  if (planBuilderExercises.length === 0) {
    alert("Please add at least one exercise to the plan.");
    return;
  }

  workoutPlans.push({
    name: planName,
    exercises: [...planBuilderExercises],
    createdAt: new Date().toISOString()
  });
  await saveWorkoutPlans();

  // Reset builder
  document.getElementById("customPlanName").value = "";
  planBuilderExercises = [];
  renderPlanBuilder();
  renderWorkoutPlans();

  // Switch to My Plans tab
  document.querySelectorAll(".plan-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".plan-tab-content").forEach(c => c.classList.remove("active"));
  document.querySelector('.plan-tab[data-tab="my-plans"]').classList.add("active");
  document.getElementById("tab-my-plans").classList.add("active");

  alert(`✅ Plan "${planName}" saved with ${workoutPlans[workoutPlans.length - 1].exercises.length} exercises!`);
});

// --- Render Saved Plans ---
function renderWorkoutPlans() {
  const container = document.getElementById("workoutPlansContainer");
  if (!container) return;

  if (workoutPlans.length === 0) {
    container.innerHTML = "<p>No workout plans created yet.</p>";
    return;
  }

  let html = "";
  workoutPlans.forEach((plan, planIdx) => {
    html += `<div class="workout-plan-card">
      <div class="plan-header">
        <h4>${plan.name}</h4>
        <div class="plan-actions">
          <button class="use-plan-btn" onclick="startWorkoutSession(${planIdx})" title="Start a workout session with this plan">▶️ Start</button>
          <button class="use-plan-btn quick-log-btn" onclick="usePlan(${planIdx})" title="Quick log all exercises with saved weights">⚡ Quick Log</button>
          <button class="edit-plan-btn" onclick="editPlan(${planIdx})" title="Edit this plan">✏️</button>
          <button class="delete-btn" onclick="deletePlan(${planIdx})">🗑️</button>
        </div>
      </div>
      <table class="workout-table"><thead><tr><th>Muscle</th><th>Exercise</th><th>Sets</th><th>Reps</th><th>Weight</th></tr></thead><tbody>`;
    plan.exercises.forEach(ex => {
      html += `<tr>
        <td><span class="muscle-tag ${ex.muscleGroup}">${capitalize(ex.muscleGroup)}</span></td>
        <td>${ex.name}</td>
        <td>${ex.sets}</td>
        <td>${ex.reps}</td>
        <td>${ex.weight !== null && ex.weight !== undefined ? ex.weight + ' kg' : '<em>—</em>'}</td>
      </tr>`;
    });
    html += `</tbody></table></div>`;
  });

  container.innerHTML = html;
}

// --- Start Active Workout Session (from a plan) ---
function startWorkoutSession(planIdx) {
  const plan = workoutPlans[planIdx];
  if (!plan) return;

  activeSession = {
    planIdx,
    planName: plan.name,
    exercises: plan.exercises.map(ex => ({
      ...ex,
      weight: ex.weight || "",
      completed: false
    }))
  };

  renderActiveSession();
  document.getElementById("activeWorkoutSession").style.display = "block";
  document.getElementById("activeWorkoutSession").scrollIntoView({ behavior: "smooth" });
}

function renderActiveSession() {
  if (!activeSession) return;

  const container = document.getElementById("sessionExerciseList");
  document.querySelector(".session-plan-name").textContent = `Plan: ${activeSession.planName}`;

  let html = '<table class="workout-table session-table"><thead><tr><th></th><th>Muscle</th><th>Exercise</th><th>Sets</th><th>Reps</th><th>Weight (kg)</th></tr></thead><tbody>';
  activeSession.exercises.forEach((ex, idx) => {
    const checkedClass = ex.completed ? "session-row-done" : "";
    html += `<tr class="${checkedClass}" data-session-idx="${idx}">
      <td><input type="checkbox" class="session-check" ${ex.completed ? "checked" : ""} onchange="toggleSessionExercise(${idx})" /></td>
      <td><span class="muscle-tag ${ex.muscleGroup}">${capitalize(ex.muscleGroup)}</span></td>
      <td>${ex.name}</td>
      <td><input type="number" class="session-field" value="${ex.sets}" min="1" onchange="updateSessionField(${idx}, 'sets', this.value)" /></td>
      <td><input type="number" class="session-field" value="${ex.reps}" min="1" onchange="updateSessionField(${idx}, 'reps', this.value)" /></td>
      <td><input type="number" class="session-field session-weight" value="${ex.weight}" step="0.5" placeholder="Enter weight" onchange="updateSessionField(${idx}, 'weight', this.value)" /></td>
    </tr>`;
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}

function toggleSessionExercise(idx) {
  if (!activeSession) return;
  activeSession.exercises[idx].completed = !activeSession.exercises[idx].completed;
  renderActiveSession();
}

function updateSessionField(idx, field, value) {
  if (!activeSession) return;
  activeSession.exercises[idx][field] = field === "weight" ? (value ? parseFloat(value) : "") : parseInt(value);
}

// Finish session → log all completed exercises
document.getElementById("finishSessionBtn").addEventListener("click", async function () {
  if (!activeSession) return;

  const completedExercises = activeSession.exercises.filter(ex => ex.completed && ex.weight);
  if (completedExercises.length === 0) {
    alert("Please complete at least one exercise with a weight before finishing.");
    return;
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const workouts = getWorkouts();

  completedExercises.forEach(ex => {
    workouts.push({
      id: Date.now() + Math.random(),
      muscleGroup: ex.muscleGroup,
      name: ex.name,
      weight: parseFloat(ex.weight),
      sets: ex.sets,
      reps: ex.reps,
      date: todayStr,
    });
  });

  await saveWorkoutsToDb(workouts);

  // Update plan with latest weights used
  const plan = workoutPlans[activeSession.planIdx];
  if (plan) {
    activeSession.exercises.forEach((sessionEx, idx) => {
      if (sessionEx.weight && plan.exercises[idx]) {
        plan.exercises[idx].weight = parseFloat(sessionEx.weight);
      }
    });
    await saveWorkoutPlans();
    renderWorkoutPlans();
  }

  renderHistory();
  document.getElementById("activeWorkoutSession").style.display = "none";
  activeSession = null;
  alert(`✅ ${completedExercises.length} exercises logged for today!`);
});

// Cancel session
document.getElementById("cancelSessionBtn").addEventListener("click", function () {
  if (!confirm("Cancel this workout session? Unsaved progress will be lost.")) return;
  document.getElementById("activeWorkoutSession").style.display = "none";
  activeSession = null;
});

// --- Edit Plan (load into builder) ---
function editPlan(planIdx) {
  const plan = workoutPlans[planIdx];
  if (!plan) return;

  if (!confirm(`Edit "${plan.name}"? This will load it into the plan builder.`)) return;

  // Switch to create tab
  document.querySelectorAll(".plan-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".plan-tab-content").forEach(c => c.classList.remove("active"));
  document.querySelector('.plan-tab[data-tab="create-plan"]').classList.add("active");
  document.getElementById("tab-create-plan").classList.add("active");

  // Load plan into builder
  document.getElementById("customPlanName").value = plan.name;
  planBuilderExercises = plan.exercises.map(ex => ({ ...ex }));
  renderPlanBuilder();

  // Remove the old plan
  workoutPlans.splice(planIdx, 1);
  saveWorkoutPlans();
  renderWorkoutPlans();
}

// --- Save today as plan (existing feature) ---
async function saveTodayAsPlan() {
  const planName = document.getElementById("planName").value.trim();
  if (!planName) {
    alert("Please enter a plan name.");
    return;
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const todayWorkouts = getWorkouts().filter(w => w.date === todayStr);

  if (todayWorkouts.length === 0) {
    alert("No exercises logged today. Log some exercises first, then save as a plan.");
    return;
  }

  const planExercises = todayWorkouts.map(w => ({
    muscleGroup: w.muscleGroup,
    name: w.name,
    weight: w.weight,
    sets: w.sets,
    reps: w.reps,
  }));

  workoutPlans.push({ name: planName, exercises: planExercises, createdAt: new Date().toISOString() });
  await saveWorkoutPlans();
  document.getElementById("planName").value = "";
  renderWorkoutPlans();

  // Switch to My Plans tab
  document.querySelectorAll(".plan-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".plan-tab-content").forEach(c => c.classList.remove("active"));
  document.querySelector('.plan-tab[data-tab="my-plans"]').classList.add("active");
  document.getElementById("tab-my-plans").classList.add("active");

  alert(`✅ Plan "${planName}" saved with ${planExercises.length} exercises!`);
}

// --- Quick log a plan (original behavior) ---
async function usePlan(planIdx) {
  const plan = workoutPlans[planIdx];
  if (!plan) return;

  const hasWeights = plan.exercises.every(ex => ex.weight);
  if (!hasWeights) {
    alert("Some exercises have no weight set. Use '▶️ Start' to begin a session and fill in weights.");
    return;
  }

  if (!confirm(`Quick log all ${plan.exercises.length} exercises from "${plan.name}" as today's workout?`)) return;

  const todayStr = new Date().toISOString().split("T")[0];
  const workouts = getWorkouts();

  plan.exercises.forEach(ex => {
    workouts.push({
      id: Date.now() + Math.random(),
      muscleGroup: ex.muscleGroup,
      name: ex.name,
      weight: ex.weight,
      sets: ex.sets,
      reps: ex.reps,
      date: todayStr,
    });
  });

  await saveWorkoutsToDb(workouts);
  renderHistory();
  alert(`✅ "${plan.name}" logged for today!`);
}

async function deletePlan(planIdx) {
  if (!confirm("Delete this workout plan?")) return;
  workoutPlans.splice(planIdx, 1);
  await saveWorkoutPlans();
  renderWorkoutPlans();
}

