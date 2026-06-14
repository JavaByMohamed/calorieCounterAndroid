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

    // Ingredients page
    "ing.addNew": "➕ Add New Ingredient",
    "ing.addDesc": "Add a custom ingredient to your database (values per 100g).",
    "ing.name": "Ingredient Name",
    "ing.namePlaceholder": "e.g. Salmon",
    "ing.calories": "Calories",
    "ing.caloriesPlaceholder": "e.g. 208",
    "ing.fat": "Fat (g)",
    "ing.fatPlaceholder": "e.g. 13.2",
    "ing.carbs": "Carbs (g)",
    "ing.carbsPlaceholder": "e.g. 0.5",
    "ing.protein": "Protein (g)",
    "ing.proteinPlaceholder": "e.g. 20.5",
    "ing.fiber": "Fiber (g)",
    "ing.fiberPlaceholder": "e.g. 0",
    "ing.addBtn": "💾 Add Ingredient",
    "ing.list": "🥦 Ingredient List",
    "ing.listDesc": "Search, sort, edit or delete ingredients.",
    "ing.searchPlaceholder": "🔍 Search ingredients...",
    "ing.sortBy": "Sort by:",
    "ing.nameAZ": "Name (A–Z)",
    "ing.nameZA": "Name (Z–A)",
    "ing.caloriesHL": "Calories (High → Low)",
    "ing.caloriesLH": "Calories (Low → High)",
    "ing.proteinHL": "Protein (High → Low)",
    "ing.proteinLH": "Protein (Low → High)",
    "ing.carbsHL": "Carbs (High → Low)",
    "ing.carbsLH": "Carbs (Low → High)",
    "ing.fatHL": "Fat (High → Low)",
    "ing.fatLH": "Fat (Low → High)",
    "ing.fiberHL": "Fiber (High → Low)",
    "ing.fiberLH": "Fiber (Low → High)",
    "ing.thIngredient": "Ingredient",
    "ing.thCalories": "Calories",
    "ing.thProtein": "Protein (g)",
    "ing.thFat": "Fat (g)",
    "ing.thCarbs": "Carbs (g)",
    "ing.thFiber": "Fiber (g)",
    "ing.thActions": "Actions",
    "ing.editTitle": "✏️ Edit Ingredient",
    "ing.saveChanges": "💾 Save Changes",

    // Meal page
    "meal.addMeal": "Add a Meal",
    "meal.searchDb": "🔍 Search Food Database",
    "meal.searchDesc": "Search for products from Willys grocery store, the official Livsmedelsverket database, or FatSecret's large food database.",
    "meal.storeProducts": "🏪 Willys",
    "meal.fatSecret": "🍽️ FatSecret",
    "meal.livsmedelsverket": "📋 Livsmedelsverket",
    "meal.searchFood": "Search food item",
    "meal.searchPlaceholder": "e.g. kycklingbröst, havregryn, kvarg...",
    "meal.cantFind": "➕ Can't find your ingredient? Create it here",
    "meal.newName": "Name",
    "meal.newNamePlaceholder": "e.g. turkey mince",
    "meal.newCal": "Calories",
    "meal.newFat": "Fat (g)",
    "meal.newCarbs": "Carbs (g)",
    "meal.newProtein": "Protein (g)",
    "meal.newFiber": "Fiber (g)",
    "meal.per100g": "per 100g",
    "meal.addIngUse": "➕ Add Ingredient & Use It",
    "meal.ingredient": "Ingredient",
    "meal.amount": "Amount (grams)",
    "meal.amountPlaceholder": "e.g. 150",
    "meal.addToMeal": "Add to Meal",
    "meal.summary": "Meal Summary",
    "meal.noIngredients": "No ingredients added yet.",
    "meal.saveMeal": "Save Meal",
    "meal.mealName": "Meal Name",
    "meal.mealNamePlaceholder": "e.g. Monday Lunch",
    "meal.servings": "Servings (portions)",
    "meal.servingsPlaceholder": "e.g. 2",
    "meal.servingsNote": "How many portions does this meal make? Macros per serving will be calculated automatically.",
    "meal.saveToHistory": "💾 Save Meal to History",
    "meal.addToTracker": "📅 Add to Today's Tracker",
    "meal.addToTrackerDesc": "Log this meal as eaten today. This will save it to your daily intake tracker. Requires login.",
    "meal.servingsEaten": "Servings eaten",
    "meal.servingsEatenPlaceholder": "e.g. 1",
    "meal.servingsEatenNote": "How many servings of this meal did you eat?",
    "meal.addToTrackerBtn": "📅 Add to Today's Tracker",
    "meal.viewHistory": "📋 View Meal History",
    "meal.viewTracker": "📊 View Daily Tracker",

    // Meal History page
    "history.title": "📋 Saved Meals",
    "history.subtitle": "All saved meal recipes — reuse them anytime! 🍽️",
    "history.search": "Search:",
    "history.searchPlaceholder": "Search meal name...",
    "history.filterDate": "Filter by date:",
    "history.showAll": "Show All",
    "history.noMeals": "No saved meals yet.",

    // Daily Tracker page
    "tracker.pleaseLogin": "🔒 Please Log In",
    "tracker.loginDesc": "You need to log in to view your daily tracker.",
    "tracker.goHome": "Go to Home to log in →",
    "tracker.profile": "'s Profile",
    "tracker.macroGoals": "📏 Daily Macro Goals",
    "tracker.calories": "Calories (kcal)",
    "tracker.protein": "Protein (g)",
    "tracker.fat": "Fat (g)",
    "tracker.carbs": "Carbs (g)",
    "tracker.fiber": "Fiber (g)",
    "tracker.updateGoals": "✏️ Update Goals",
    "tracker.profileSummary": "📋 Your Profile Summary",
    "tracker.dailyView": "📅 Daily View",
    "tracker.date": "Date:",
    "tracker.today": "Today",
    "tracker.prev": "◀ Prev",
    "tracker.next": "Next ▶",
    "tracker.macroBreakdown": "Macro Breakdown",
    "tracker.dailyProgress": "Daily Progress",
    "tracker.noMeals": "No meals logged for this day.",
    "tracker.noWorkouts": "No workouts logged for this day.",
    "tracker.last7Days": "📆 Last 7 Days Overview",

    // Workout page
    "workout.title": "Workout Tracker",
    "workout.username": "Username",
    "workout.selectUser": "-- Select user --",
    "workout.loadUser": "Load User Data",
    "workout.logExercise": "Log Exercise",
    "workout.muscleGroup": "Muscle Group",
    "workout.selectMuscle": "-- Select --",
    "workout.chest": "Chest",
    "workout.back": "Back",
    "workout.shoulders": "Shoulders",
    "workout.biceps": "Biceps",
    "workout.triceps": "Triceps",
    "workout.legs": "Legs",
    "workout.glutes": "Glutes",
    "workout.abs": "Abs",
    "workout.forearms": "Forearms",
    "workout.calves": "Calves",
    "workout.exercise": "Exercise",
    "workout.selectMuscleFirst": "-- Select a muscle group first --",
    "workout.weight": "Weight (kg)",
    "workout.weightPlaceholder": "e.g. 60",
    "workout.sets": "Sets",
    "workout.setsPlaceholder": "e.g. 4",
    "workout.reps": "Reps",
    "workout.repsPlaceholder": "e.g. 10",
    "workout.date": "Date",
    "workout.dateToday": "Today",
    "workout.dateChoose": "Choose Date",
    "workout.saveExercise": "Save Exercise",
    "workout.history": "Workout History",
    "workout.filterMuscle": "Filter by Muscle Group",
    "workout.all": "All",
    "workout.plans": "📋 Workout Plans",
    "workout.plansDesc": "Create custom workout plans, save today's workout as a plan, or start a session from a saved plan.",
    "workout.myPlans": "My Plans",
    "workout.createPlan": "➕ Create Plan",
    "workout.saveToday": "📅 Save Today",
    "workout.noPlans": "No workout plans created yet.",
    "workout.planName": "Plan Name",
    "workout.planNamePlaceholder": "e.g. Push Day, Leg Day, Upper Body...",
    "workout.addExercisePlan": "Add Exercise to Plan",
    "workout.planSets": "Sets",
    "workout.planReps": "Reps",
    "workout.planWeight": "Weight (kg)",
    "workout.planWeightOptional": "(optional)",
    "workout.planWeightPlaceholder": "Fill in later",
    "workout.addExerciseBtn": "➕ Add Exercise",
    "workout.planExercises": "Plan Exercises",
    "workout.emptyPlan": "No exercises added yet. Start building your plan above.",
    "workout.savePlan": "💾 Save Plan",
    "workout.saveTodayBtn": "💾 Save Today's Workout as Plan",
    "workout.activeSession": "🏋️ Active Workout Session",
    "workout.finishSession": "✅ Finish & Log Workout",
    "workout.cancelSession": "✕ Cancel Session",

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

    // Index page
    "home.welcome": "Välkommen till CalorieCounter 👋",
    "home.welcomeDesc": "Logga in eller skapa ditt konto för att börja spåra din kost och träning.",
    "home.username": "Användarnamn eller e-post",
    "home.password": "Lösenord",
    "home.usernamePlaceholder": "Ange ditt användarnamn eller e-post",
    "home.passwordPlaceholder": "Ange ditt lösenord",
    "home.login": "🔑 Logga in",
    "home.createAccount": "+ Skapa konto",
    "home.forgotPassword": "Glömt ditt lösenord?",
    "home.resetTitle": "🔒 Återställ ditt lösenord",
    "home.resetDesc": "Ange e-postadressen kopplad till ditt konto. Vi skickar en verifieringskod för att återställa ditt lösenord.",
    "home.emailAddress": "E-postadress",
    "home.emailPlaceholder": "Ange din registrerade e-post",
    "home.sendResetCode": "📧 Skicka återställningskod",
    "home.cancel": "Avbryt",
    "home.verificationSent": "✅ En 6-siffrig verifieringskod har skickats till din e-post.",
    "home.demoNotice": "⚠️ Demoläge: Koden visas nedan eftersom det inte finns någon e-postserver.",
    "home.verificationCode": "Verifieringskod",
    "home.verificationCodePlaceholder": "Ange 6-siffrig kod",
    "home.newPassword": "Nytt lösenord",
    "home.newPasswordPlaceholder": "Ange nytt lösenord",
    "home.confirmNewPassword": "Bekräfta nytt lösenord",
    "home.confirmNewPasswordPlaceholder": "Upprepa nytt lösenord",
    "home.resetPassword": "🔑 Återställ lösenord",
    "home.verifyEmail": "📧 Verifiera din e-post",
    "home.verifyCodeLabel": "Ange verifieringskod",
    "home.verifyComplete": "✅ Verifiera & slutför registrering",
    "home.resendCode": "🔄 Skicka kod igen",
    "home.createYourAccount": "Skapa ditt konto",
    "home.usernameLabel": "Användarnamn",
    "home.usernamePlaceholderCreate": "t.ex. Johan",
    "home.emailLabel": "E-post",
    "home.emailPlaceholderCreate": "t.ex. johan@example.com",
    "home.passwordLabel": "Lösenord",
    "home.passwordPlaceholderCreate": "Välj ett lösenord",
    "home.confirmPasswordLabel": "Bekräfta lösenord",
    "home.confirmPasswordPlaceholder": "Upprepa ditt lösenord",
    "home.healthConditions": "Hälsotillstånd",
    "home.healthConditionsNote": "(påverkar kalorimål)",
    "home.hypothyroid": "Hypotyreos (underfunktion av sköldkörteln)",
    "home.hyperthyroid": "Hypertyreos (överfunktion av sköldkörteln)",
    "home.diabetes": "Diabetes",
    "home.highBP": "Högt blodtryck",
    "home.healthInfoTitle": "ℹ️ Hur påverkar dessa tillstånd dina näringsmål?",
    "home.createAccountBtn": "💾 Skapa konto",
    "home.loggedInAs": "👤 Inloggad som",
    "home.admin": "🔐 Admin",
    "home.logout": "Logga ut",
    "home.trackCalories": "Spåra dina kalorier, nå dina mål",
    "home.trackDesc": "CalorieCounter är din personliga näringsassistent. Logga enkelt dina måltider, spåra ditt kaloriintag och få insikter om din kost.",
    "home.adminPanel": "🔐 Adminpanel",
    "home.adminDesc": "Hantera alla registrerade konton.",
    "home.closeAdmin": "✕ Stäng",
    "home.quickAccess": "Snabbåtkomst",
    "home.cardBmiBmr": "BMI & BMR",
    "home.cardBmiBmrDesc": "Beräkna din kroppsmasseindex och ämnesomsättning",
    "home.cardIngredients": "Ingredienser",
    "home.cardIngredientsDesc": "Bläddra, sök och hantera din ingrediensdatabas",
    "home.cardAddMeal": "Lägg till en måltid",
    "home.cardAddMealDesc": "Logga dina måltider och spåra kalorier",
    "home.cardWorkout": "Träningsspårare",
    "home.cardWorkoutDesc": "Spåra övningar, set, repetitioner och vikter",
    "home.cardMealHistory": "Måltidshistorik",
    "home.cardMealHistoryDesc": "Se vad alla äter för inspiration",
    "home.cardDailyTracker": "Min dagliga spårning",
    "home.cardDailyTrackerDesc": "Dina personliga dagliga måltider, makros och framsteg",

    // BMI & BMR page
    "bmi.title": "Beräkna ditt BMI och BMR",
    "bmi.saveResults": "Spara resultat till:",
    "bmi.notLoggedIn": "-- Ej inloggad --",
    "bmi.saveNote": "Du kan beräkna fritt utan att logga in. Logga in från hemsidan för att spara resultat till din profil.",
    "bmi.gender": "Kön",
    "bmi.male": "Man",
    "bmi.female": "Kvinna",
    "bmi.age": "Ålder (år)",
    "bmi.agePlaceholder": "t.ex. 25 år",
    "bmi.height": "Längd (cm)",
    "bmi.heightPlaceholder": "t.ex. 175 CM",
    "bmi.weight": "Vikt (kg)",
    "bmi.weightPlaceholder": "t.ex. 70 KG",
    "bmi.activityLevel": "Aktivitetsnivå",
    "bmi.sedentary": "Stillasittande (lite eller ingen träning)",
    "bmi.lightlyActive": "Lätt aktiv (1-3 dagar/vecka)",
    "bmi.moderatelyActive": "Måttligt aktiv (3-5 dagar/vecka)",
    "bmi.veryActive": "Mycket aktiv (6-7 dagar/vecka)",
    "bmi.extraActive": "Extra aktiv (mycket hård träning/fysiskt jobb)",
    "bmi.calculate": "Beräkna BMI och BMR",
    "bmi.yourBmi": "Ditt BMI",
    "bmi.yourBmr": "Ditt BMR",
    "bmi.bmr": "BMR:",
    "bmi.tdee": "TDEE:",
    "bmi.kcalDay": "kcal/dag",
    "bmi.chooseTarget": "Välj ditt kalorimål",
    "bmi.chooseTargetDesc": "Välj vilket värde du vill basera din kostplan på:",
    "bmi.bmrOption": "BMR — Använd för strikt underskott (viloförbrukning)",
    "bmi.tdeeOption": "TDEE — Använd för underhåll (inkluderar aktivitet)",
    "bmi.saveDiet": "💾 Spara kostplan till din profil",
    "bmi.choosePlan": "Välj din plan:",
    "bmi.balanced": "Balanserad kost (Underhåll)",
    "bmi.highProtein": "Hög protein (Fettförlust)",
    "bmi.muscleGain": "Muskeluppbyggnad (Mer kolhydrater)",
    "bmi.lowCarbs": "Lågkolhydrat (Keto)",
    "bmi.saveBtn": "💾 Spara BMI, BMR & kostplan till profil",

    // Ingredients page & beyond - all translations mirror the EN versions but in Swedish
    "ing.addNew": "➕ Lägg till ny ingrediens",
    "ing.addDesc": "Lägg till en anpassad ingrediens i din databas (värden per 100g).",
    "ing.name": "Ingrediensnamn",
    "ing.namePlaceholder": "t.ex. Lax",
    "ing.calories": "Kalorier",
    "ing.caloriesPlaceholder": "t.ex. 208",
    "ing.fat": "Fett (g)",
    "ing.fatPlaceholder": "t.ex. 13.2",
    "ing.carbs": "Kolhydrater (g)",
    "ing.carbsPlaceholder": "t.ex. 0.5",
    "ing.protein": "Protein (g)",
    "ing.proteinPlaceholder": "t.ex. 20.5",
    "ing.fiber": "Fiber (g)",
    "ing.fiberPlaceholder": "t.ex. 0",
    "ing.addBtn": "💾 Lägg till ingrediens",
    "ing.list": "🥦 Ingredienslista",
    "ing.listDesc": "Sök, sortera, redigera eller ta bort ingredienser.",
    "ing.searchPlaceholder": "🔍 Sök ingredienser...",
    "ing.sortBy": "Sortera efter:",
    "ing.nameAZ": "Namn (A–Ö)",
    "ing.nameZA": "Namn (Ö–A)",
    "ing.caloriesHL": "Kalorier (Hög → Låg)",
    "ing.caloriesLH": "Kalorier (Låg → Hög)",
    "ing.proteinHL": "Protein (Hög → Låg)",
    "ing.proteinLH": "Protein (Låg → Hög)",
    "ing.carbsHL": "Kolhydrater (Hög → Låg)",
    "ing.carbsLH": "Kolhydrater (Låg → Hög)",
    "ing.fatHL": "Fett (Hög → Låg)",
    "ing.fatLH": "Fett (Låg → Hög)",
    "ing.fiberHL": "Fiber (Hög → Låg)",
    "ing.fiberLH": "Fiber (Låg → Hög)",
    "ing.thIngredient": "Ingrediens",
    "ing.thCalories": "Kalorier",
    "ing.thProtein": "Protein (g)",
    "ing.thFat": "Fett (g)",
    "ing.thCarbs": "Kolhydrater (g)",
    "ing.thFiber": "Fiber (g)",
    "ing.thActions": "Åtgärder",
    "ing.editTitle": "✏️ Redigera ingrediens",
    "ing.saveChanges": "💾 Spara ändringar",

    // ... (Continue with meal, history, tracker, workout translations in Swedish)
    "meal.addMeal": "Lägg till en måltid",
    "meal.searchDb": "🔍 Sök i livsmedelsdatabas",
    "meal.searchDesc": "Sök efter produkter från Willys, officiella Livsmedelsverket-databasen, eller FatSecrets stora livsmedelsdatabas.",
    "meal.storeProducts": "🏪 Willys",
    "meal.fatSecret": "🍽️ FatSecret",
    "meal.livsmedelsverket": "📋 Livsmedelsverket",
    "meal.searchFood": "Sök livsmedel",
    "meal.searchPlaceholder": "t.ex. kycklingbröst, havregryn, kvarg...",
    "meal.cantFind": "➕ Hittar du inte din ingrediens? Skapa den här",
    "meal.newName": "Namn",
    "meal.newNamePlaceholder": "t.ex. kalkonfjärs",
    "meal.newCal": "Kalorier",
    "meal.newFat": "Fett (g)",
    "meal.newCarbs": "Kolhydrater (g)",
    "meal.newProtein": "Protein (g)",
    "meal.newFiber": "Fiber (g)",
    "meal.per100g": "per 100g",
    "meal.addIngUse": "➕ Lägg till ingrediens & använd den",
    "meal.ingredient": "Ingrediens",
    "meal.amount": "Mängd (gram)",
    "meal.amountPlaceholder": "t.ex. 150",
    "meal.addToMeal": "Lägg till i måltid",
    "meal.summary": "Måltidsöversikt",
    "meal.noIngredients": "Inga ingredienser tillagda ännu.",
    "meal.saveMeal": "Spara måltid",
    "meal.mealName": "Måltidsnamn",
    "meal.mealNamePlaceholder": "t.ex. Måndagslunch",
    "meal.servings": "Portioner",
    "meal.servingsPlaceholder": "t.ex. 2",
    "meal.servingsNote": "Hur många portioner ger denna måltid? Makros per portion beräknas automatiskt.",
    "meal.saveToHistory": "💾 Spara måltid till historik",
    "meal.addToTracker": "📅 Lägg till i dagens spårning",
    "meal.addToTrackerDesc": "Logga denna måltid som äten idag. Den sparas i din dagliga intags-spårare. Kräver inloggning.",
    "meal.servingsEaten": "Portioner ätna",
    "meal.servingsEatenPlaceholder": "t.ex. 1",
    "meal.servingsEatenNote": "Hur många portioner av denna måltid åt du?",
    "meal.addToTrackerBtn": "📅 Lägg till i dagens spårning",
    "meal.viewHistory": "📋 Visa måltidshistorik",
    "meal.viewTracker": "📊 Visa daglig spårning",

    // Meal History page
    "history.title": "📋 Sparade måltider",
    "history.subtitle": "Alla sparade måltidsrecept — återanvänd dem när som helst! 🍽️",
    "history.search": "Sök:",
    "history.searchPlaceholder": "Sök måltidsnamn...",
    "history.filterDate": "Filtrera efter datum:",
    "history.showAll": "Visa alla",
    "history.noMeals": "Inga sparade måltider ännu.",

    // Daily Tracker page
    "tracker.pleaseLogin": "🔒 Vänligen logga in",
    "tracker.loginDesc": "Du måste logga in för att se din dagliga spårning.",
    "tracker.goHome": "Gå till Hem för att logga in →",
    "tracker.profile": "s profil",
    "tracker.macroGoals": "📏 Dagliga makromål",
    "tracker.calories": "Kalorier (kcal)",
    "tracker.protein": "Protein (g)",
    "tracker.fat": "Fett (g)",
    "tracker.carbs": "Kolhydrater (g)",
    "tracker.fiber": "Fiber (g)",
    "tracker.updateGoals": "✏️ Uppdatera mål",
    "tracker.profileSummary": "📋 Din profilöversikt",
    "tracker.dailyView": "📅 Daglig vy",
    "tracker.date": "Datum:",
    "tracker.today": "Idag",
    "tracker.prev": "◀ Föregående",
    "tracker.next": "Nästa ▶",
    "tracker.macroBreakdown": "Makrofördelning",
    "tracker.dailyProgress": "Dagliga framsteg",
    "tracker.noMeals": "Inga måltider loggade för denna dag.",
    "tracker.noWorkouts": "Inga träningspass loggade för denna dag.",
    "tracker.last7Days": "📆 Senaste 7 dagarna",

    // Workout page
    "workout.title": "Träningsspårare",
    "workout.username": "Användarnamn",
    "workout.selectUser": "-- Välj användare --",
    "workout.loadUser": "Ladda användardata",
    "workout.logExercise": "Logga övning",
    "workout.muscleGroup": "Muskelgrupp",
    "workout.selectMuscle": "-- Välj --",
    "workout.chest": "Bröst",
    "workout.back": "Rygg",
    "workout.shoulders": "Axlar",
    "workout.biceps": "Biceps",
    "workout.triceps": "Triceps",
    "workout.legs": "Ben",
    "workout.glutes": "Skinkor",
    "workout.abs": "Mage",
    "workout.forearms": "Underarmar",
    "workout.calves": "Vader",
    "workout.exercise": "Övning",
    "workout.selectMuscleFirst": "-- Välj muskelgrupp först --",
    "workout.weight": "Vikt (kg)",
    "workout.weightPlaceholder": "t.ex. 60",
    "workout.sets": "Set",
    "workout.setsPlaceholder": "t.ex. 4",
    "workout.reps": "Repetitioner",
    "workout.repsPlaceholder": "t.ex. 10",
    "workout.date": "Datum",
    "workout.dateToday": "Idag",
    "workout.dateChoose": "Välj datum",
    "workout.saveExercise": "Spara övning",
    "workout.history": "Träningshistorik",
    "workout.filterMuscle": "Filtrera efter muskelgrupp",
    "workout.all": "Alla",
    "workout.plans": "📋 Träningsplaner",
    "workout.plansDesc": "Skapa anpassade träningsplaner, spara dagens träning som en plan, eller starta en session från en sparad plan.",
    "workout.myPlans": "Mina planer",
    "workout.createPlan": "➕ Skapa plan",
    "workout.saveToday": "📅 Spara idag",
    "workout.noPlans": "Inga träningsplaner skapade ännu.",
    "workout.planName": "Plannamn",
    "workout.planNamePlaceholder": "t.ex. Pressdag, Bendag, Överkropp...",
    "workout.addExercisePlan": "Lägg till övning i plan",
    "workout.planSets": "Set",
    "workout.planReps": "Repetitioner",
    "workout.planWeight": "Vikt (kg)",
    "workout.planWeightOptional": "(valfritt)",
    "workout.planWeightPlaceholder": "Fyll i senare",
    "workout.addExerciseBtn": "➕ Lägg till övning",
    "workout.planExercises": "Planens övningar",
    "workout.emptyPlan": "Inga övningar tillagda ännu. Börja bygga din plan ovan.",
    "workout.savePlan": "💾 Spara plan",
    "workout.saveTodayBtn": "💾 Spara dagens träning som plan",
    "workout.activeSession": "🏋️ Aktiv träningssession",
    "workout.finishSession": "✅ Avsluta & logga träning",
    "workout.cancelSession": "✕ Avbryt session",

    // Language selector
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
    "nav.calculateBmiBmr": "حساب BMI و BMR",
    "nav.addAMeal": "إضافة وجبة",
    "nav.workoutTracker": "متتبع التمارين",

    // Footer
    "footer.text": "© 2025 calorieCounter. مصمم لعشاق اللياقة والتغذية.",

    // Index page
    "home.welcome": "مرحباً بك في CalorieCounter 👋",
    "home.welcomeDesc": "سجل دخولك أو أنشئ حسابك لبدء تتبع تغذيتك وتمارينك.",
    "home.username": "اسم المستخدم أو البريد الإلكتروني",
    "home.password": "كلمة المرور",
    "home.usernamePlaceholder": "أدخل اسم المستخدم أو البريد الإلكتروني",
    "home.passwordPlaceholder": "أدخل كلمة المرور",
    "home.login": "🔑 تسجيل الدخول",
    "home.createAccount": "+ إنشاء حساب",
    "home.forgotPassword": "نسيت كلمة المرور؟",
    "home.resetTitle": "🔒 إعادة تعيين كلمة المرور",
    "home.resetDesc": "أدخل البريد الإلكتروني المرتبط بحسابك. سنرسل رمز تحقق لإعادة تعيين كلمة المرور.",
    "home.emailAddress": "البريد الإلكتروني",
    "home.emailPlaceholder": "أدخل بريدك الإلكتروني المسجل",
    "home.sendResetCode": "📧 إرسال رمز إعادة التعيين",
    "home.cancel": "إلغاء",
    "home.verificationSent": "✅ تم إرسال رمز تحقق مكون من 6 أرقام إلى بريدك الإلكتروني.",
    "home.demoNotice": "⚠️ وضع تجريبي: الرمز معروض أدناه لعدم وجود خادم بريد إلكتروني.",
    "home.verificationCode": "رمز التحقق",
    "home.verificationCodePlaceholder": "أدخل الرمز المكون من 6 أرقام",
    "home.newPassword": "كلمة المرور الجديدة",
    "home.newPasswordPlaceholder": "أدخل كلمة المرور الجديدة",
    "home.confirmNewPassword": "تأكيد كلمة المرور الجديدة",
    "home.confirmNewPasswordPlaceholder": "أعد إدخال كلمة المرور الجديدة",
    "home.resetPassword": "🔑 إعادة تعيين كلمة المرور",
    "home.verifyEmail": "📧 تحقق من بريدك الإلكتروني",
    "home.verifyCodeLabel": "أدخل رمز التحقق",
    "home.verifyComplete": "✅ تحقق وأكمل التسجيل",
    "home.resendCode": "🔄 إعادة إرسال الرمز",
    "home.createYourAccount": "إنشاء حسابك",
    "home.usernameLabel": "اسم المستخدم",
    "home.usernamePlaceholderCreate": "مثال: أحمد",
    "home.emailLabel": "البريد الإلكتروني",
    "home.emailPlaceholderCreate": "مثال: ahmed@example.com",
    "home.passwordLabel": "كلمة المرور",
    "home.passwordPlaceholderCreate": "اختر كلمة مرور",
    "home.confirmPasswordLabel": "تأكيد كلمة المرور",
    "home.confirmPasswordPlaceholder": "أعد إدخال كلمة المرور",
    "home.healthConditions": "الحالات الصحية",
    "home.healthConditionsNote": "(تؤثر على توصيات السعرات)",
    "home.hypothyroid": "قصور الغدة الدرقية",
    "home.hyperthyroid": "فرط نشاط الغدة الدرقية",
    "home.diabetes": "السكري",
    "home.highBP": "ارتفاع ضغط الدم",
    "home.healthInfoTitle": "ℹ️ كيف تؤثر هذه الحالات على أهدافك الغذائية؟",
    "home.createAccountBtn": "💾 إنشاء حساب",
    "home.loggedInAs": "👤 مسجل الدخول كـ",
    "home.admin": "🔐 المسؤول",
    "home.logout": "تسجيل الخروج",
    "home.trackCalories": "تتبع سعراتك الحرارية، حقق أهدافك",
    "home.trackDesc": "CalorieCounter هو مساعدك الشخصي للتغذية. سجل وجباتك بسهولة، تتبع استهلاكك من السعرات، واحصل على رؤى حول نظامك الغذائي.",
    "home.adminPanel": "🔐 لوحة المسؤول",
    "home.adminDesc": "إدارة جميع الحسابات المسجلة.",
    "home.closeAdmin": "✕ إغلاق",
    "home.quickAccess": "وصول سريع",
    "home.cardBmiBmr": "BMI & BMR",
    "home.cardBmiBmrDesc": "احسب مؤشر كتلة الجسم ومعدل الأيض",
    "home.cardIngredients": "المكونات",
    "home.cardIngredientsDesc": "تصفح وابحث وأدر قاعدة بيانات المكونات",
    "home.cardAddMeal": "إضافة وجبة",
    "home.cardAddMealDesc": "سجل وجباتك وتتبع السعرات",
    "home.cardWorkout": "متتبع التمارين",
    "home.cardWorkoutDesc": "تتبع التمارين والمجموعات والتكرارات والأوزان",
    "home.cardMealHistory": "سجل الوجبات",
    "home.cardMealHistoryDesc": "شاهد ما يأكله الجميع للإلهام",
    "home.cardDailyTracker": "متابعتي اليومية",
    "home.cardDailyTrackerDesc": "وجباتك اليومية الشخصية والماكروز والتقدم",

    // BMI & BMR page
    "bmi.title": "احسب BMI و BMR الخاص بك",
    "bmi.saveResults": "حفظ النتائج إلى:",
    "bmi.notLoggedIn": "-- غير مسجل الدخول --",
    "bmi.saveNote": "يمكنك الحساب بحرية بدون تسجيل الدخول. سجل دخولك من الصفحة الرئيسية لحفظ النتائج في ملفك الشخصي.",
    "bmi.gender": "الجنس",
    "bmi.male": "ذكر",
    "bmi.female": "أنثى",
    "bmi.age": "العمر (سنوات)",
    "bmi.agePlaceholder": "مثال: 25 سنة",
    "bmi.height": "الطول (سم)",
    "bmi.heightPlaceholder": "مثال: 175 سم",
    "bmi.weight": "الوزن (كجم)",
    "bmi.weightPlaceholder": "مثال: 70 كجم",
    "bmi.activityLevel": "مستوى النشاط",
    "bmi.sedentary": "خامل (قليل أو بدون تمرين)",
    "bmi.lightlyActive": "نشاط خفيف (1-3 أيام/أسبوع)",
    "bmi.moderatelyActive": "نشاط معتدل (3-5 أيام/أسبوع)",
    "bmi.veryActive": "نشاط عالي (6-7 أيام/أسبوع)",
    "bmi.extraActive": "نشاط إضافي (تمرين شاق جداً/عمل بدني)",
    "bmi.calculate": "احسب BMI و BMR",
    "bmi.yourBmi": "مؤشر كتلة جسمك",
    "bmi.yourBmr": "معدل الأيض الأساسي",
    "bmi.bmr": "BMR:",
    "bmi.tdee": "TDEE:",
    "bmi.kcalDay": "سعرة/يوم",
    "bmi.chooseTarget": "اختر هدف السعرات الحرارية",
    "bmi.chooseTargetDesc": "اختر القيمة التي تريد بناء خطتك الغذائية عليها:",
    "bmi.bmrOption": "BMR — استخدم للعجز الصارم (سعرات الراحة)",
    "bmi.tdeeOption": "TDEE — استخدم للمحافظة (يشمل النشاط)",
    "bmi.saveDiet": "💾 حفظ خطة النظام الغذائي في ملفك",
    "bmi.choosePlan": "اختر خطتك:",
    "bmi.balanced": "نظام غذائي متوازن (محافظة)",
    "bmi.highProtein": "بروتين عالي (خسارة دهون)",
    "bmi.muscleGain": "بناء عضلات (كربوهيدرات أعلى)",
    "bmi.lowCarbs": "كربوهيدرات منخفضة (كيتو)",
    "bmi.saveBtn": "💾 حفظ BMI و BMR والنظام الغذائي في الملف",

    // Ingredients page
    "ing.addNew": "➕ إضافة مكون جديد",
    "ing.addDesc": "أضف مكوناً مخصصاً إلى قاعدة بياناتك (القيم لكل 100 جرام).",
    "ing.name": "اسم المكون",
    "ing.namePlaceholder": "مثال: سلمون",
    "ing.calories": "السعرات",
    "ing.caloriesPlaceholder": "مثال: 208",
    "ing.fat": "الدهون (جم)",
    "ing.fatPlaceholder": "مثال: 13.2",
    "ing.carbs": "الكربوهيدرات (جم)",
    "ing.carbsPlaceholder": "مثال: 0.5",
    "ing.protein": "البروتين (جم)",
    "ing.proteinPlaceholder": "مثال: 20.5",
    "ing.fiber": "الألياف (جم)",
    "ing.fiberPlaceholder": "مثال: 0",
    "ing.addBtn": "💾 إضافة مكون",
    "ing.list": "🥦 قائمة المكونات",
    "ing.listDesc": "بحث، ترتيب، تعديل أو حذف المكونات.",
    "ing.searchPlaceholder": "🔍 بحث عن مكونات...",
    "ing.sortBy": "ترتيب حسب:",
    "ing.nameAZ": "الاسم (أ–ي)",
    "ing.nameZA": "الاسم (ي–أ)",
    "ing.caloriesHL": "السعرات (عالي → منخفض)",
    "ing.caloriesLH": "السعرات (منخفض → عالي)",
    "ing.proteinHL": "البروتين (عالي → منخفض)",
    "ing.proteinLH": "البروتين (منخفض → عالي)",
    "ing.carbsHL": "الكربوهيدرات (عالي → منخفض)",
    "ing.carbsLH": "الكربوهيدرات (منخفض → عالي)",
    "ing.fatHL": "الدهون (عالي → منخفض)",
    "ing.fatLH": "الدهون (منخفض → عالي)",
    "ing.fiberHL": "الألياف (عالي → منخفض)",
    "ing.fiberLH": "الألياف (منخفض → عالي)",
    "ing.thIngredient": "المكون",
    "ing.thCalories": "السعرات",
    "ing.thProtein": "البروتين (جم)",
    "ing.thFat": "الدهون (جم)",
    "ing.thCarbs": "الكربوهيدرات (جم)",
    "ing.thFiber": "الألياف (جم)",
    "ing.thActions": "إجراءات",
    "ing.editTitle": "✏️ تعديل المكون",
    "ing.saveChanges": "💾 حفظ التغييرات",

    // Meal page
    "meal.addMeal": "إضافة وجبة",
    "meal.searchDb": "🔍 بحث في قاعدة بيانات الأغذية",
    "meal.searchDesc": "ابحث عن منتجات من متاجر البقالة السويدية، قاعدة بيانات Livsmedelsverket الرسمية، أو قاعدة بيانات FatSecret الكبيرة.",
    "meal.storeProducts": "🏪 Willys",
    "meal.fatSecret": "🍽️ FatSecret",
    "meal.livsmedelsverket": "📋 Livsmedelsverket",
    "meal.searchFood": "بحث عن طعام",
    "meal.searchPlaceholder": "مثال: صدر دجاج، شوفان، زبادي...",
    "meal.cantFind": "➕ لم تجد المكون؟ أنشئه هنا",
    "meal.newName": "الاسم",
    "meal.newNamePlaceholder": "مثال: ديك رومي مفروم",
    "meal.newCal": "السعرات",
    "meal.newFat": "الدهون (جم)",
    "meal.newCarbs": "الكربوهيدرات (جم)",
    "meal.newProtein": "البروتين (جم)",
    "meal.newFiber": "الألياف (جم)",
    "meal.per100g": "لكل 100 جم",
    "meal.addIngUse": "➕ إضافة مكون واستخدامه",
    "meal.ingredient": "المكون",
    "meal.amount": "الكمية (جرام)",
    "meal.amountPlaceholder": "مثال: 150",
    "meal.addToMeal": "إضافة للوجبة",
    "meal.summary": "ملخص الوجبة",
    "meal.noIngredients": "لم تتم إضافة مكونات بعد.",
    "meal.saveMeal": "حفظ الوجبة",
    "meal.mealName": "اسم الوجبة",
    "meal.mealNamePlaceholder": "مثال: غداء الاثنين",
    "meal.servings": "الحصص (أجزاء)",
    "meal.servingsPlaceholder": "مثال: 2",
    "meal.servingsNote": "كم حصة تصنع هذه الوجبة؟ سيتم حساب الماكروز لكل حصة تلقائياً.",
    "meal.saveToHistory": "💾 حفظ الوجبة في السجل",
    "meal.addToTracker": "📅 إضافة لمتابعة اليوم",
    "meal.addToTrackerDesc": "سجل هذه الوجبة كمأكولة اليوم. سيتم حفظها في متتبع استهلاكك اليومي. يتطلب تسجيل الدخول.",
    "meal.servingsEaten": "الحصص المأكولة",
    "meal.servingsEatenPlaceholder": "مثال: 1",
    "meal.servingsEatenNote": "كم حصة من هذه الوجبة أكلت؟",
    "meal.addToTrackerBtn": "📅 إضافة لمتابعة اليوم",
    "meal.viewHistory": "📋 عرض سجل الوجبات",
    "meal.viewTracker": "📊 عرض المتابعة اليومية",

    // Meal History page
    "history.title": "📋 الوجبات المحفوظة",
    "history.subtitle": "جميع وصفات الوجبات المحفوظة — أعد استخدامها في أي وقت! 🍽️",
    "history.search": "بحث:",
    "history.searchPlaceholder": "بحث عن اسم وجبة...",
    "history.filterDate": "تصفية حسب التاريخ:",
    "history.showAll": "عرض الكل",
    "history.noMeals": "لا توجد وجبات محفوظة بعد.",

    // Daily Tracker page
    "tracker.pleaseLogin": "🔒 يرجى تسجيل الدخول",
    "tracker.loginDesc": "تحتاج لتسجيل الدخول لعرض متابعتك اليومية.",
    "tracker.goHome": "اذهب للرئيسية لتسجيل الدخول ←",
    "tracker.profile": " الملف الشخصي",
    "tracker.macroGoals": "📏 أهداف الماكروز اليومية",
    "tracker.calories": "السعرات (كيلو كالوري)",
    "tracker.protein": "البروتين (جم)",
    "tracker.fat": "الدهون (جم)",
    "tracker.carbs": "الكربوهيدرات (جم)",
    "tracker.fiber": "الألياف (جم)",
    "tracker.updateGoals": "✏️ تحديث الأهداف",
    "tracker.profileSummary": "📋 ملخص ملفك الشخصي",
    "tracker.dailyView": "📅 العرض اليومي",
    "tracker.date": "التاريخ:",
    "tracker.today": "اليوم",
    "tracker.prev": "◀ السابق",
    "tracker.next": "التالي ▶",
    "tracker.macroBreakdown": "توزيع الماكروز",
    "tracker.dailyProgress": "التقدم اليومي",
    "tracker.noMeals": "لا توجد وجبات مسجلة لهذا اليوم.",
    "tracker.noWorkouts": "لا توجد تمارين مسجلة لهذا اليوم.",
    "tracker.last7Days": "📆 آخر 7 أيام",

    // Workout page
    "workout.title": "متتبع التمارين",
    "workout.username": "اسم المستخدم",
    "workout.selectUser": "-- اختر مستخدم --",
    "workout.loadUser": "تحميل بيانات المستخدم",
    "workout.logExercise": "تسجيل تمرين",
    "workout.muscleGroup": "مجموعة العضلات",
    "workout.selectMuscle": "-- اختر --",
    "workout.chest": "الصدر",
    "workout.back": "الظهر",
    "workout.shoulders": "الأكتاف",
    "workout.biceps": "البايسبس",
    "workout.triceps": "الترايسبس",
    "workout.legs": "الأرجل",
    "workout.glutes": "الأرداف",
    "workout.abs": "البطن",
    "workout.forearms": "الساعدان",
    "workout.calves": "السمانة",
    "workout.exercise": "التمرين",
    "workout.selectMuscleFirst": "-- اختر مجموعة عضلية أولاً --",
    "workout.weight": "الوزن (كجم)",
    "workout.weightPlaceholder": "مثال: 60",
    "workout.sets": "مجموعات",
    "workout.setsPlaceholder": "مثال: 4",
    "workout.reps":  "تكرارات",
    "workout.repsPlaceholder": "مثال: 10",
    "workout.date": "التاريخ",
    "workout.dateToday": "اليوم",
    "workout.dateChoose": "اختر تاريخ",
    "workout.saveExercise": "حفظ التمرين",
    "workout.history": "سجل التمارين",
    "workout.filterMuscle": "تصفية حسب مجموعة العضلات",
    "workout.all": "الكل",
    "workout.plans": "📋 خطط التمارين",
    "workout.plansDesc": "أنشئ خطط تمارين مخصصة، احفظ تمرين اليوم كخطة، أو ابدأ جلسة من خطة محفوظة.",
    "workout.myPlans": "خططي",
    "workout.createPlan": "➕ إنشاء خطة",
    "workout.saveToday": "📅 حفظ اليوم",
    "workout.noPlans": "لم يتم إنشاء خطط تمارين بعد.",
    "workout.planName": "اسم الخطة",
    "workout.planNamePlaceholder": "مثال: يوم الضغط، يوم الأرجل، الجزء العلوي...",
    "workout.addExercisePlan": "إضافة تمرين للخطة",
    "workout.planSets": "مجموعات",
    "workout.planReps": "تكرارات",
    "workout.planWeight": "الوزن (كجم)",
    "workout.planWeightOptional": "(اختياري)",
    "workout.planWeightPlaceholder": "أملأه لاحقاً",
    "workout.addExerciseBtn": "➕ إضافة تمرين",
    "workout.planExercises": "تمارين الخطة",
    "workout.emptyPlan": "لم تتم إضافة تمارين بعد. ابدأ ببناء خطتك أعلاه.",
    "workout.savePlan": "💾 حفظ الخطة",
    "workout.saveTodayBtn": "💾 حفظ تمرين اليوم كخطة",
    "workout.activeSession": "🏋️ جلسة تمرين نشطة",
    "workout.finishSession": "✅ إنهاء وتسجيل التمرين",
    "workout.cancelSession": "✕ إلغاء الجلسة",

    // Language selector
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


