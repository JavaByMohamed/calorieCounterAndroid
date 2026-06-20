// Home page user login / create account logic
// All data saved to Firebase. Session stored in cookie.

// --- Cookie helpers ---
function setCookie(name, value, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : "";
}

function deleteCookie(name) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

// --- User helpers (Firebase as primary, in-memory cache) ---
let usersCache = {};

async function loadUsersFromDB() {
  if (typeof cloudLoadAllUsers === "function" && typeof isFirebaseReady === "function" && isFirebaseReady()) {
    const users = await cloudLoadAllUsers();
    if (users) usersCache = users;
  }
  return usersCache;
}

function getUsers() {
  return usersCache;
}

async function saveUsers(users) {
  usersCache = users;
  if (typeof cloudSaveUser === "function" && typeof isFirebaseReady === "function" && isFirebaseReady()) {
    for (const key in users) {
      await cloudSaveUser(key, users[key]);
    }
  }
}

async function saveOneUser(key, userData) {
  usersCache[key] = userData;
  if (typeof cloudSaveUser === "function" && typeof isFirebaseReady === "function" && isFirebaseReady()) {
    await cloudSaveUser(key, userData);
    console.log(`☁️ User "${key}" saved to database`);
  }
}

function getActiveUser() {
  return getCookie("activeUser");
}

function setActiveUser(username) {
  setCookie("activeUser", username, 30);
}

function clearActiveUser() {
  deleteCookie("activeUser");
}

// Simple hash for password (not cryptographically secure — demo only)
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

// Generate a 6-digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Pending registration data (stored temporarily until verified)
let pendingRegistration = null;
let pendingVerificationCode = null;

// Password reset state
let resetVerificationCode = null;
let resetTargetUserKey = null;

// UI
const loginSection = document.getElementById("loginSection");
const welcomeSection = document.getElementById("welcomeSection");
const activeUserBar = document.getElementById("activeUserBar");
const activeUserName = document.getElementById("activeUserName");

// (refreshHomeUI is defined in the admin panel section above)

// Login — supports username or email
document.getElementById("loginBtn").addEventListener("click", async () => {
  const input = document.getElementById("loginUsername").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  if (!input) { alert("Please enter your username or email."); return; }
  if (!password) { alert("Please enter your password."); return; }

  const users = await loadUsersFromDB();
  const hashedPw = simpleHash(password);

  // Find user by username or email
  let foundKey = null;
  if (users[input] && users[input].password === hashedPw) {
    foundKey = input;
  } else {
    // Search by email
    for (const key in users) {
      if (users[key].email === input && users[key].password === hashedPw) {
        foundKey = key;
        break;
      }
    }
  }

  if (!foundKey) {
    alert("Invalid username/email or password.");
    return;
  }

  setActiveUser(foundKey);
  // Redirect to daily tracker (profile view) after login
  window.location.href = "daily-tracker.html";
});

// Show create form
document.getElementById("showCreateBtn").addEventListener("click", () => {
  document.getElementById("createAccountForm").style.display = "block";
});

document.getElementById("cancelCreateBtn").addEventListener("click", () => {
  document.getElementById("createAccountForm").style.display = "none";
});

// Create account — Step 1: Validate and show email verification
document.getElementById("createAccountBtn").addEventListener("click", async () => {
  const name = document.getElementById("createUsername").value.trim();
  const email = document.getElementById("createEmail").value.trim().toLowerCase();
  const password = document.getElementById("createPassword").value;
  const passwordConfirm = document.getElementById("createPasswordConfirm").value;

  if (!name) { alert("Please enter a username."); return; }
  if (!email) { alert("Please enter an email."); return; }
  if (!password) { alert("Please enter a password."); return; }
  if (password.length < 4) { alert("Password must be at least 4 characters."); return; }
  if (password !== passwordConfirm) { alert("Passwords do not match."); return; }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert("Please enter a valid email address.");
    return;
  }

  // Collect health conditions
  const healthConditions = [];
  if (document.getElementById("condHypothyroid").checked) healthConditions.push("hypothyroid");
  if (document.getElementById("condHyperthyroid").checked) healthConditions.push("hyperthyroid");
  if (document.getElementById("condDiabetes").checked) healthConditions.push("diabetes");
  if (document.getElementById("condHighBP").checked) healthConditions.push("highBloodPressure");

  const key = name.toLowerCase();
  const users = getUsers();

  // Check username uniqueness
  if (users[key]) {
    alert("Username already taken. Please choose another.");
    return;
  }

  // Check email uniqueness
  for (const k in users) {
    if (users[k].email === email) {
      alert("An account with this email already exists. Please log in.");
      return;
    }
  }

  // Base goals
  let calories = 2000, protein = 150, fat = 65, carbs = 250, fiber = 30;

  // Adjust goals based on health conditions
  const tips = [];
  if (healthConditions.includes("hypothyroid")) {
    calories -= 200;
    carbs -= 30;
    fiber += 5;
    tips.push("🦋 Hypothyroidism: Reduced calorie & carb targets to support slower metabolism. Focus on fiber-rich foods.");
  }
  if (healthConditions.includes("hyperthyroid")) {
    calories += 300;
    protein += 20;
    carbs += 30;
    tips.push("🦋 Hyperthyroidism: Increased calorie & protein targets to compensate for faster metabolism.");
  }
  if (healthConditions.includes("diabetes")) {
    carbs -= 50;
    fiber += 5;
    fat -= 10;
    tips.push("🩸 Diabetes: Reduced carbs and increased fiber to help manage blood sugar levels.");
  }
  if (healthConditions.includes("highBloodPressure")) {
    fat -= 10;
    tips.push("❤️ High Blood Pressure: Reduced fat target. Remember to limit sodium intake to <2300mg/day.");
  }

  // Store pending registration (not saved until email verified)
  pendingRegistration = {
    key: key,
    name: name,
    email: email,
    password: simpleHash(password),
    healthConditions: healthConditions,
    goals: {
      calories: Math.max(calories, 1200),
      protein: Math.max(protein, 50),
      fat: Math.max(fat, 30),
      carbs: Math.max(carbs, 100),
      fiber: Math.max(fiber, 20),
    },
    tips: tips,
    createdAt: new Date().toISOString(),
  };

  // Generate and "send" verification code
  pendingVerificationCode = generateVerificationCode();

  // Show verification form
  document.getElementById("createAccountForm").style.display = "none";
  document.getElementById("emailVerificationForm").style.display = "block";
  document.getElementById("verifyEmailDisplay").textContent = email;
  document.getElementById("verifyCode").value = "";

  // Send email (or show code in demo mode)
  sendVerificationEmail(email, name, pendingVerificationCode, "verification").then((sent) => {
    if (sent) {
      // Real email sent — hide the demo code display
      document.getElementById("verifyCodeDisplay").style.display = "none";
      document.querySelector("#emailVerificationForm .sim-notice").style.display = "none";
    } else {
      // Demo mode — show code on screen
      document.getElementById("verifyCodeDisplay").style.display = "block";
      document.getElementById("verifyCodeDisplay").textContent = pendingVerificationCode;
      document.querySelector("#emailVerificationForm .sim-notice").style.display = "block";
    }
  });
});

// Create account — Step 2: Verify email code and complete registration
document.getElementById("confirmVerifyBtn").addEventListener("click", async () => {
  const enteredCode = document.getElementById("verifyCode").value.trim();

  if (!enteredCode) { alert("Please enter the verification code."); return; }
  if (enteredCode !== pendingVerificationCode) {
    alert("❌ Invalid verification code. Please try again.");
    return;
  }

  // Code is correct — save the user to Firebase
  const userData = {
    name: pendingRegistration.name,
    email: pendingRegistration.email,
    password: pendingRegistration.password,
    healthConditions: pendingRegistration.healthConditions,
    goals: {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      fiber: 0,
    },
    emailVerified: true,
    createdAt: pendingRegistration.createdAt,
  };

  await saveOneUser(pendingRegistration.key, userData);
  setActiveUser(pendingRegistration.key);

  document.getElementById("emailVerificationForm").style.display = "none";
  refreshHomeUI();

  alert(`Welcome, ${pendingRegistration.name}! Your email has been verified and account created. 🎉\n\nLet's set up your calorie goals by calculating your BMI and BMR.`);

  pendingRegistration = null;
  pendingVerificationCode = null;

  // Navigate to BMI/BMR calculator to set goals
  window.location.href = "bmi-bmr.html";
});

// Resend verification code
document.getElementById("resendVerifyBtn").addEventListener("click", () => {
  pendingVerificationCode = generateVerificationCode();
  document.getElementById("verifyCode").value = "";

  sendVerificationEmail(pendingRegistration.email, pendingRegistration.name, pendingVerificationCode, "verification").then((sent) => {
    if (sent) {
      document.getElementById("verifyCodeDisplay").style.display = "none";
      document.querySelector("#emailVerificationForm .sim-notice").style.display = "none";
      alert("🔄 A new verification code has been sent to your email.");
    } else {
      document.getElementById("verifyCodeDisplay").style.display = "block";
      document.getElementById("verifyCodeDisplay").textContent = pendingVerificationCode;
      alert("🔄 A new verification code has been generated (demo mode).");
    }
  });
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  clearActiveUser();
  refreshHomeUI();
});

// === FORGOT PASSWORD ===
document.getElementById("forgotPasswordLink").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("forgotPasswordForm").style.display = "block";
  document.getElementById("resetCodeSection").style.display = "none";
  document.getElementById("resetEmail").value = "";
});

document.getElementById("cancelResetBtn").addEventListener("click", () => {
  document.getElementById("forgotPasswordForm").style.display = "none";
  resetVerificationCode = null;
  resetTargetUserKey = null;
});

// Send reset code
document.getElementById("sendResetCodeBtn").addEventListener("click", async () => {
  const email = document.getElementById("resetEmail").value.trim().toLowerCase();
  if (!email) { alert("Please enter your email address."); return; }

  const users = await loadUsersFromDB();
  let foundKey = null;
  for (const key in users) {
    if (users[key].email === email) {
      foundKey = key;
      break;
    }
  }

  if (!foundKey) {
    alert("No account found with that email address.");
    return;
  }

  // Generate and "send" reset code
  resetVerificationCode = generateVerificationCode();
  resetTargetUserKey = foundKey;

  document.getElementById("resetCodeSection").style.display = "block";
  document.getElementById("resetCode").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("newPasswordConfirm").value = "";

  sendVerificationEmail(email, users[foundKey].name, resetVerificationCode, "reset").then((sent) => {
    if (sent) {
      document.getElementById("resetCodeDisplay").style.display = "none";
      document.querySelector("#forgotPasswordForm .sim-notice").style.display = "none";
      alert("📧 A reset code has been sent to your email.");
    } else {
      document.getElementById("resetCodeDisplay").style.display = "block";
      document.getElementById("resetCodeDisplay").textContent = resetVerificationCode;
      if (document.querySelector("#forgotPasswordForm .sim-notice")) {
        document.querySelector("#forgotPasswordForm .sim-notice").style.display = "block";
      }
    }
  });
});

// Confirm reset
document.getElementById("confirmResetBtn").addEventListener("click", async () => {
  const code = document.getElementById("resetCode").value.trim();
  const newPw = document.getElementById("newPassword").value;
  const newPwConfirm = document.getElementById("newPasswordConfirm").value;

  if (!code) { alert("Please enter the verification code."); return; }
  if (code !== resetVerificationCode) { alert("❌ Invalid verification code."); return; }
  if (!newPw) { alert("Please enter a new password."); return; }
  if (newPw.length < 4) { alert("Password must be at least 4 characters."); return; }
  if (newPw !== newPwConfirm) { alert("Passwords do not match."); return; }

  // Update password in database
  const users = getUsers();
  users[resetTargetUserKey].password = simpleHash(newPw);
  await saveOneUser(resetTargetUserKey, users[resetTargetUserKey]);

  document.getElementById("forgotPasswordForm").style.display = "none";
  resetVerificationCode = null;
  resetTargetUserKey = null;

  alert(`✅ Password has been reset successfully. You can now log in with your new password.`);
});

// Allow Enter key on login inputs
document.getElementById("loginUsername").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("loginPassword").focus();
});
document.getElementById("loginPassword").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("loginBtn").click();
});

// === ADMIN PANEL ===
const ADMIN_USERS = ["mohamed"]; // Add admin usernames here (lowercase)

function isAdmin() {
  return ADMIN_USERS.includes(getActiveUser().toLowerCase());
}

function refreshHomeUI() {
  const active = getActiveUser();
  const users = getUsers();

  if (active && users[active]) {
    loginSection.style.display = "none";
    welcomeSection.style.display = "block";
    activeUserBar.style.display = "flex";
    activeUserName.textContent = users[active].name;
    document.getElementById("adminBtn").style.display = isAdmin() ? "inline-block" : "none";
  } else {
    clearActiveUser();
    loginSection.style.display = "block";
    welcomeSection.style.display = "none";
    activeUserBar.style.display = "none";
    document.getElementById("adminSection").style.display = "none";
  }
}

document.getElementById("adminBtn").addEventListener("click", async () => {
  if (!isAdmin()) {
    alert("❌ You do not have admin access.");
    return;
  }
  // Load latest data from Firebase
  await loadUsersFromDB();
  renderAdminPanel();
  document.getElementById("adminSection").style.display = "block";
});

document.getElementById("closeAdminBtn").addEventListener("click", () => {
  document.getElementById("adminSection").style.display = "none";
});

document.getElementById("adminSearchInput").addEventListener("input", () => {
  renderAdminAccountList();
});

function renderAdminPanel() {
  const users = getUsers();
  const keys = Object.keys(users);

  // Stats
  const statsDiv = document.getElementById("adminStats");
  const verified = keys.filter(k => users[k].emailVerified).length;
  statsDiv.innerHTML = `
    <div style="background:#e8f8f0;padding:12px 20px;border-radius:10px;text-align:center;flex:1;min-width:120px;">
      <div style="font-size:24px;font-weight:bold;color:#27ae60;">${keys.length}</div>
      <div style="font-size:13px;color:#555;">Total Accounts</div>
    </div>
    <div style="background:#e8f0f8;padding:12px 20px;border-radius:10px;text-align:center;flex:1;min-width:120px;">
      <div style="font-size:24px;font-weight:bold;color:#2980b9;">${verified}</div>
      <div style="font-size:13px;color:#555;">Verified</div>
    </div>
  `;

  renderAdminAccountList();
}

function renderAdminAccountList() {
  const users = getUsers();
  const keys = Object.keys(users);
  const search = (document.getElementById("adminSearchInput").value || "").toLowerCase();
  const container = document.getElementById("adminAccountList");

  const filtered = keys.filter(k => {
    if (!search) return true;
    return k.includes(search) || (users[k].email || "").includes(search) || (users[k].name || "").includes(search);
  });

  if (filtered.length === 0) {
    container.innerHTML = `<p style="color:#999;text-align:center;">No accounts found.</p>`;
    return;
  }

  container.innerHTML = filtered.map(k => {
    const u = users[k];
    const created = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Unknown";
    const conditions = (u.healthConditions && u.healthConditions.length > 0) ? u.healthConditions.join(", ") : "None";
    return `
      <div class="admin-account-card" style="background:#fafafa;border:1px solid #eee;border-radius:12px;padding:15px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div>
            <strong style="font-size:16px;">${u.name || k}</strong>
            ${u.emailVerified ? '<span style="color:#27ae60;font-size:12px;margin-left:6px;">✅ Verified</span>' : '<span style="color:#e67e22;font-size:12px;margin-left:6px;">⚠️ Unverified</span>'}
          </div>
          <button onclick="adminDeleteUser('${k}')" style="background:#e74c3c;color:white;border:none;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:13px;">🗑️ Delete</button>
        </div>
        <div style="margin-top:8px;font-size:13px;color:#666;line-height:1.8;">
          <div>📧 <strong>Email:</strong> ${u.email || "N/A"}</div>
          <div>🔑 <strong>Username:</strong> ${k}</div>
          <div>📅 <strong>Created:</strong> ${created}</div>
          <div>🏥 <strong>Health Conditions:</strong> ${conditions}</div>
          <div>🎯 <strong>Goals:</strong> ${u.goals ? (u.goals.caloriesMin && u.goals.caloriesMax ? `${u.goals.caloriesMin}–${u.goals.caloriesMax} kcal range | P: ${u.goals.protein}g | F: ${u.goals.fat}g | C: ${u.goals.carbs}g` : (u.goals.calories > 0 ? `${u.goals.calories} kcal | P: ${u.goals.protein}g | F: ${u.goals.fat}g | C: ${u.goals.carbs}g` : '⚠️ Not set — needs BMI/BMR calculation')) : "⚠️ Not set"}</div>
        </div>
      </div>
    `;
  }).join("");
}

async function adminDeleteUser(userKey) {
  if (!confirm(`Are you sure you want to PERMANENTLY delete the account "${userKey}"?\n\nThis will remove:\n• User profile\n• All workouts\n\nMeal history will be kept but shown as "Anonymous".\nThe username and email will become available for re-registration.\n\nThis cannot be undone.`)) return;

  // 1. Delete from Firebase FIRST (so sync doesn't bring it back)
  if (typeof isFirebaseReady === "function" && isFirebaseReady()) {
    try {
      // Delete user profile from cloud
      if (typeof cloudDeleteUser === "function") {
        await cloudDeleteUser(userKey);
        console.log(`☁️ User "${userKey}" deleted from Firebase`);
      }
      // Delete user's workouts from cloud
      if (firebaseDb) {
        try {
          await firebaseDb.collection("workouts").doc(userKey).delete();
          console.log(`☁️ Workouts for "${userKey}" deleted from Firebase`);
        } catch (e) { console.warn("Could not delete cloud workouts:", e); }
      }
      // Anonymize user's meals in cloud meal history
      if (firebaseDb && typeof cloudLoadAllMealHistory === "function" && typeof cloudSaveAllMealHistory === "function") {
        try {
          const cloudMeals = await cloudLoadAllMealHistory();
          if (cloudMeals && cloudMeals.length > 0) {
            const updated = cloudMeals.map(m => {
              if ((m.user || "").toLowerCase() === userKey || (m.username || "").toLowerCase() === userKey) {
                return { ...m, user: "anonymous", username: "Anonymous" };
              }
              return m;
            });
            await cloudSaveAllMealHistory(updated);
            console.log(`☁️ Meal history for "${userKey}" anonymized in Firebase`);
          }
        } catch (e) { console.warn("Could not anonymize cloud meals:", e); }
      }
    } catch (error) {
      console.error("❌ Cloud deletion failed:", error);
      if (!confirm("⚠️ Failed to delete from cloud. Delete locally anyway?")) return;
    }
  }

  // 2. Delete from in-memory cache
  const users = getUsers();
  delete users[userKey];
  usersCache = users;

  // 3. Anonymize user's meals in cloud meal history
  // (already done above in Firebase section)

  // 4. If deleted user was active, log out
  if (getActiveUser() === userKey) {
    clearActiveUser();
    refreshHomeUI();
  }

  renderAdminPanel();
  alert(`✅ Account "${userKey}" has been permanently deleted.\n\nThe username and email are now available for re-registration.`);
}

// Init
initEmailService();
initFirebase().then(async () => {
  await loadUsersFromDB();
  refreshHomeUI();
});
