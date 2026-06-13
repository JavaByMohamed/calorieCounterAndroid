/**
 * Internationalization (i18n) Module
 * Supports: English (en), Swedish (sv), Arabic (ar)
 */

const translations = {
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.bmiBmr": "BMI & BMR",
    "nav.ingredients": "Ingredients",
    "nav.addMeal": "Add Meal",
    "nav.mealHistory": "Meal History",
    "nav.dailyTracker": "Daily Tracker",
    "nav.workout": "Workout",
    "nav.calculateBmiBmr": "Calculate BMI and BMR",
    "nav.addAMeal": "Add a Meal",
    "nav.workoutTracker": "Workout Tracker",

    // Footer
    "footer.text": "© 2025 calorieCounter. Built for fitness and nutrition enthusiasts.",

    // Index page
    "home.welcome": "Welcome to CalorieCounter 👋",
    "home.welcomeDesc": "Log in or create your account to start tracking your nutrition and workouts.",
    "home.username": "Username or Email",
    "home.password": "Password",
    "home.usernamePlaceholder": "Enter your username or email",
    "home.passwordPlaceholder": "Enter your password",
    "home.login": "🔑 Log In",
    "home.createAccount": "+ Create Account",
    "home.forgotPassword": "Forgot your password?",
    "home.resetTitle": "🔒 Reset Your Password",
    "home.resetDesc": "Enter the email address associated with your account. We'll send a verification code to reset your password.",
    "home.emailAddress": "Email Address",
    "home.emailPlaceholder": "Enter your registered email",
    "home.sendResetCode": "📧 Send Reset Code",
    "home.cancel": "Cancel",
    "home.verificationSent": "✅ A 6-digit verification code has been sent to your email.",
    "home.demoNotice": "⚠️ Demo mode: The code is shown below since there's no email server.",
    "home.verificationCode": "Verification Code",
    "home.verificationCodePlaceholder": "Enter 6-digit code",
    "home.newPassword": "New Password",
    "home.newPasswordPlaceholder": "Enter new password",
    "home.confirmNewPassword": "Confirm New Password",
    "home.confirmNewPasswordPlaceholder": "Repeat new password",
    "home.resetPassword": "🔑 Reset Password",
    "home.verifyEmail": "📧 Verify Your Email",
    "home.verifyCodeLabel": "Enter Verification Code",
    "home.verifyComplete": "✅ Verify & Complete Registration",
    "home.resendCode": "🔄 Resend Code",
    "home.createYourAccount": "Create Your Account",
    "home.usernameLabel": "Username",
    "home.usernamePlaceholderCreate": "e.g. John",
    "home.emailLabel": "Email",
    "home.emailPlaceholderCreate": "e.g. john@example.com",
    "home.passwordLabel": "Password",
    "home.passwordPlaceholderCreate": "Choose a password",
    "home.confirmPasswordLabel": "Confirm Password",
    "home.confirmPasswordPlaceholder": "Repeat your password",
    "home.healthConditions": "Health Conditions",
    "home.healthConditionsNote": "(affects calorie recommendations)",
    "home.hypothyroid": "Hypothyroidism (underactive thyroid)",
    "home.hyperthyroid": "Hyperthyroidism (overactive thyroid)",
    "home.diabetes": "Diabetes",
    "home.highBP": "High Blood Pressure",
    "home.healthInfoTitle": "ℹ️ How do these conditions affect your nutrition goals?",
    "home.createAccountBtn": "💾 Create Account",
    "home.loggedInAs": "👤 Logged in as",
    "home.admin": "🔐 Admin",
    "home.logout": "Log Out",
    "home.trackCalories": "Track Your Calories, Achieve Your Goals",
    "home.trackDesc": "CalorieCounter is your personal nutrition assistant. Effortlessly log your meals, track your calorie intake, and gain insights into your diet.",
    "home.adminPanel": "🔐 Admin Panel",
    "home.adminDesc": "Manage all registered accounts.",
    "home.closeAdmin": "✕ Close",
    "home.quickAccess": "Quick Access",
    "home.cardBmiBmr": "BMI & BMR",
    "home.cardBmiBmrDesc": "Calculate your body mass index and metabolic rate",
    "home.cardIngredients": "Ingredients",
    "home.cardIngredientsDesc": "Browse, search & manage your ingredient database",
    "home.cardAddMeal": "Add a Meal",
    "home.cardAddMealDesc": "Log your meals and track calories",
    "home.cardWorkout": "Workout Tracker",
    "home.cardWorkoutDesc": "Track exercises, sets, reps & weights",
    "home.cardMealHistory": "Meal History",
    "home.cardMealHistoryDesc": "See what everyone is eating for inspiration",
    "home.cardDailyTracker": "My Daily Tracker",
    "home.cardDailyTrackerDesc": "Your personal daily meals, macros & progress",

    // BMI & BMR page
    "bmi.title": "Calculate Your BMI and BMR",
    "bmi.saveResults": "Save results to:",
    "bmi.notLoggedIn": "-- Not logged in --",
    "bmi.saveNote": "You can calculate freely without logging in. Log in from the Home page to save results to your profile.",
    "bmi.gender": "Gender",
    "bmi.male": "Male",
    "bmi.female": "Female",
    "bmi.age": "Age (years)",
    "bmi.agePlaceholder": "e.g. 25 years",
    "bmi.height": "Height (cm)",
    "bmi.heightPlaceholder": "e.g. 175 CM",
    "bmi.weight": "Weight (kg)",
    "bmi.weightPlaceholder": "e.g. 70 KG",
    "bmi.activityLevel": "Activity Level",
    "bmi.sedentary": "Sedentary (little or no exercise)",
    "bmi.lightlyActive": "Lightly active (1-3 days/week)",
    "bmi.moderatelyActive": "Moderately active (3-5 days/week)",
    "bmi.veryActive": "Very active (6-7 days/week)",
    "bmi.extraActive": "Extra active (very hard exercise/physical job)",
    "bmi.calculate": "Calculate BMI and BMR",
    "bmi.yourBmi": "Your BMI",
    "bmi.yourBmr": "Your BMR",
    "bmi.bmr": "BMR:",
    "bmi.tdee": "TDEE:",
    "bmi.kcalDay": "kcal/day",
    "bmi.chooseTarget": "Choose Your Calorie Target",
    "bmi.chooseTargetDesc": "Select which value to base your diet plan on:",
    "bmi.bmrOption": "BMR — Use if you want a strict deficit (rest-level calories)",
    "bmi.tdeeOption": "TDEE — Use for maintenance (includes activity)",
    "bmi.saveDiet": "💾 Save Diet Plan to Your Profile",
    "bmi.choosePlan": "Choose your plan:",
    "bmi.balanced": "Balanced Diet (Maintenance)",
    "bmi.highProtein": "High Protein (Fat Loss)",
    "bmi.muscleGain": "Muscle Gain (Higher Carbs)",
    "bmi.lowCarbs": "Low Carbs (Keto)",
    "bmi.saveBtn": "💾 Save BMI, BMR & Diet to Profile",

    // Language selector
    "lang.label": "🌐",
  },

  sv: {
    // Navigation
    "nav.home": "Hem",
    "nav.bmiBmr": "BMI & BMR",
    "nav.ingredients": "Ingredienser",
    "nav.addMeal": "Lägg till måltid",
    "nav.mealHistory": "Måltidshistorik",
    "nav.dailyTracker": "Daglig spårning",
    "nav.workout": "Träning",
    "nav.calculateBmiBmr": "Beräkna BMI och BMR",
    "nav.addAMeal": "Lägg till en måltid",
    "nav.workoutTracker": "Träningsspårare",

    // Footer
    "footer.text": "© 2025 calorieCounter. Byggd för fitness- och näringsentusiaster.",

    // Index page - abbreviated for space
    "home.welcome": "Välkommen till CalorieCounter 👋",
    "home.welcomeDesc": "Logga in eller skapa ditt konto för att börja spåra din kost och träning.",
    "home.username": "Användarnamn eller e-post",
    "home.password": "Lösenord",
    "home.login": "🔑 Logga in",
    "home.createAccount": "+ Skapa konto",
    "home.logout": "Logga ut",
    "lang.label": "🌐",
  },

  ar: {
    // Navigation
    "nav.home": "الرئيسية",
    "nav.bmiBmr": "BMI & BMR",
    "nav.ingredients": "المكونات",
    "nav.addMeal": "إضافة وجبة",
    "nav.mealHistory": "سجل الوجبات",
    "nav.dailyTracker": "المتابعة اليومية",
    "nav.workout": "التمارين",

    // Footer
    "footer.text": "© 2025 calorieCounter. مصمم لعشاق اللياقة والتغذية.",

    // Index page - abbreviated for space
    "home.welcome": "مرحباً بك في CalorieCounter 👋",
    "home.welcomeDesc": "سجل دخولك أو أنشئ حسابك لبدء تتبع تغذيتك وتمارينك.",
    "home.login": "🔑 تسجيل الدخول",
    "home.logout": "تسجيل الخروج",
    "lang.label": "🌐",
  }
};

/**
 * Get the current language from localStorage, default to 'en'
 */
function getCurrentLang() {
  return localStorage.getItem("selectedLang") || "en";
}

/**
 * Set the language and apply translations
 */
function setLanguage(lang) {
  localStorage.setItem("selectedLang", lang);
  applyTranslations(lang);
  applyDirection(lang);
  updateLangSelector(lang);
}

/**
 * Apply RTL direction for Arabic
 */
function applyDirection(lang) {
  if (lang === "ar") {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar");
  } else {
    document.documentElement.setAttribute("dir", "ltr");
    document.documentElement.setAttribute("lang", lang);
  }
}

/**
 * Apply translations to all elements with data-i18n attribute
 */
function applyTranslations(lang) {
  const dict = translations[lang] || translations["en"];

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  // Handle placeholders
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key]) {
      el.setAttribute("placeholder", dict[key]);
    }
  });

  // Handle title attributes
  document.querySelectorAll("[data-i18n-title]").forEach(el => {
    const key = el.getAttribute("data-i18n-title");
    if (dict[key]) {
      el.setAttribute("title", dict[key]);
    }
  });

  // Handle innerHTML (for elements with mixed content)
  document.querySelectorAll("[data-i18n-html]").forEach(el => {
    const key = el.getAttribute("data-i18n-html");
    if (dict[key]) {
      el.innerHTML = dict[key];
    }
  });
}

/**
 * Update the language selector to show the current language
 */
function updateLangSelector(lang) {
  const selector = document.getElementById("langSelector");
  if (selector) {
    selector.value = lang;
  }
}

/**
 * Create and inject the language selector into the header
 */
function injectLangSelector() {
  const nav = document.querySelector(".topnav");
  if (!nav || document.getElementById("langSelector")) return;

  const langDiv = document.createElement("div");
  langDiv.className = "lang-selector-wrapper";
  langDiv.innerHTML = `
    <select id="langSelector" class="lang-selector" aria-label="Select language">
      <option value="en">🇬🇧 EN</option>
      <option value="sv">🇸🇪 SV</option>
      <option value="ar">🇪🇬 AR</option>
    </select>
  `;

  // Insert before the hamburger menu
  const hamburger = nav.querySelector(".container");
  if (hamburger) {
    nav.insertBefore(langDiv, hamburger);
  } else {
    nav.appendChild(langDiv);
  }

  const selector = document.getElementById("langSelector");
  selector.value = getCurrentLang();
  selector.addEventListener("change", (e) => {
    setLanguage(e.target.value);
  });
}

/**
 * Initialize i18n on page load
 */
function initI18n() {
  const lang = getCurrentLang();
  applyDirection(lang);
  applyTranslations(lang);
  injectLangSelector();
}

// Run after header is loaded (observe DOM changes)
const i18nObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === "childList") {
      const nav = document.querySelector(".topnav");
      if (nav && !document.getElementById("langSelector")) {
        injectLangSelector();
        applyTranslations(getCurrentLang());
        i18nObserver.disconnect();
        break;
      }
    }
  }
});

// Start observing
document.addEventListener("DOMContentLoaded", () => {
  initI18n();
  // Also observe for dynamically loaded header
  i18nObserver.observe(document.body, { childList: true, subtree: true });
});


