// ============================================================
// Firebase Cloud Storage Integration
// Provides permanent cloud-based storage for user accounts,
// meals, and workouts using Firebase Firestore.
//
// SETUP INSTRUCTIONS:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project (e.g., "calorieCounter")
// 3. Add a Web App (Project Settings > General > Your Apps > Add App > Web)
// 4. Copy your Firebase config below
// 5. Enable Firestore Database (Build > Firestore Database > Create)
//    - Choose "Start in test mode" for development
// 6. Enable Authentication (Build > Authentication > Get Started)
//    - Enable "Email/Password" sign-in method
// ============================================================

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBQqGp1jcqqKEopkb1X37-z91tEIO73XSs",
  authDomain: "caloriecounter-7411c.firebaseapp.com",
  projectId: "caloriecounter-7411c",
  storageBucket: "caloriecounter-7411c.firebasestorage.app",
  messagingSenderId: "599834101168",
  appId: "1:599834101168:web:156656bfefa14ca35bc275",
};

// ============================================================
// Firebase Initialization
// ============================================================

let firebaseApp = null;
let firebaseDb = null;
let firebaseAuth = null;
let firebaseReady = false;

async function initFirebase() {
  if (FIREBASE_CONFIG.apiKey === "YOUR_API_KEY") {
    console.warn("⚠️ Firebase not configured. Using localStorage only.");
    return false;
  }

  // Wait for Firebase SDK to be available (handles slow CDN loading on mobile)
  const maxWait = 5000; // 5 seconds max wait for SDK
  const startTime = Date.now();
  while (typeof firebase === "undefined" && (Date.now() - startTime) < maxWait) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  if (typeof firebase === "undefined") {
    console.error("❌ Firebase SDK not loaded (CDN blocked or network issue).");
    return false;
  }

  try {
    // Initialize Firebase app
    if (!firebase.apps.length) {
      firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    } else {
      firebaseApp = firebase.apps[0];
    }

    firebaseDb = firebase.firestore();

    // Enable persistence for offline support (important for mobile)
    try {
      await firebaseDb.enablePersistence({ synchronizeTabs: true });
      console.log("✅ Firestore offline persistence enabled");
    } catch (persistErr) {
      // Persistence may fail if multiple tabs are open or browser doesn't support it
      if (persistErr.code === 'failed-precondition') {
        console.warn("⚠️ Firestore persistence unavailable (multiple tabs open)");
      } else if (persistErr.code === 'unimplemented') {
        console.warn("⚠️ Firestore persistence not supported in this browser");
      }
    }

    firebaseAuth = firebase.auth();

    // Sign in anonymously so Firestore rules can verify requests come from the app
    try {
      await firebaseAuth.signInAnonymously();
      console.log("✅ Firebase anonymous auth successful");
    } catch (authError) {
      console.warn("⚠️ Anonymous auth failed:", authError.message, "— Firestore may still work in test mode");
    }

    firebaseReady = true;
    console.log("✅ Firebase initialized — cloud storage active");
    return true;
  } catch (error) {
    console.error("❌ Firebase initialization failed:", error);
    return false;
  }
}

function isFirebaseReady() {
  return firebaseReady && firebaseDb !== null;
}

// ============================================================
// Cloud User Account Management
// ============================================================

/**
 * Save a user profile to Firestore
 */
async function cloudSaveUser(userKey, userData) {
  if (!isFirebaseReady()) return false;
  try {
    await firebaseDb.collection("users").doc(userKey).set(userData, { merge: true });
    console.log(`☁️ User "${userKey}" saved to cloud`);
    return true;
  } catch (error) {
    console.error("❌ Cloud save user failed:", error);
    return false;
  }
}

/**
 * Load a user profile from Firestore
 */
async function cloudLoadUser(userKey) {
  if (!isFirebaseReady()) return null;
  try {
    const doc = await firebaseDb.collection("users").doc(userKey).get();
    if (doc.exists) {
      console.log(`☁️ User "${userKey}" loaded from cloud`);
      return doc.data();
    }
    return null;
  } catch (error) {
    console.error("❌ Cloud load user failed:", error);
    return null;
  }
}

/**
 * Load all users from Firestore
 */
async function cloudLoadAllUsers() {
  if (!isFirebaseReady()) return null;
  try {
    const snapshot = await firebaseDb.collection("users").get();
    const users = {};
    snapshot.forEach((doc) => {
      users[doc.id] = doc.data();
    });
    console.log(`☁️ Loaded ${Object.keys(users).length} users from cloud`);
    return users;
  } catch (error) {
    console.error("❌ Cloud load all users failed:", error);
    return null;
  }
}

/**
 * Delete a user from Firestore
 */
async function cloudDeleteUser(userKey) {
  if (!isFirebaseReady()) return false;
  try {
    await firebaseDb.collection("users").doc(userKey).delete();
    console.log(`☁️ User "${userKey}" deleted from cloud`);
    return true;
  } catch (error) {
    console.error("❌ Cloud delete user failed:", error);
    return false;
  }
}

/**
 * Check if a user exists in the cloud by email
 */
async function cloudFindUserByEmail(email) {
  if (!isFirebaseReady()) return null;
  try {
    const snapshot = await firebaseDb.collection("users")
      .where("email", "==", email.toLowerCase())
      .limit(1)
      .get();
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { key: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error("❌ Cloud find user by email failed:", error);
    return null;
  }
}

// ============================================================
// Cloud Meal History Management
// ============================================================

/**
 * Save meal history to Firestore (per user)
 */
async function cloudSaveMealHistory(userKey, meals) {
  if (!isFirebaseReady()) return false;
  try {
    await firebaseDb.collection("mealHistory").doc(userKey).set({ meals: meals });
    console.log(`☁️ Meal history for "${userKey}" saved to cloud`);
    return true;
  } catch (error) {
    console.error("❌ Cloud save meal history failed:", error);
    return false;
  }
}

/**
 * Load meal history from Firestore (per user)
 */
async function cloudLoadMealHistory(userKey) {
  if (!isFirebaseReady()) return null;
  try {
    const doc = await firebaseDb.collection("mealHistory").doc(userKey).get();
    if (doc.exists) {
      return doc.data().meals || [];
    }
    return [];
  } catch (error) {
    console.error("❌ Cloud load meal history failed:", error);
    return null;
  }
}

/**
 * Save all meal history (for all users combined)
 */
async function cloudSaveAllMealHistory(mealHistory) {
  if (!isFirebaseReady()) return false;
  try {
    await firebaseDb.collection("mealHistory").doc("_all").set({ meals: mealHistory });
    console.log(`☁️ Full meal history saved to cloud`);
    return true;
  } catch (error) {
    console.error("❌ Cloud save all meal history failed:", error);
    return false;
  }
}

/**
 * Load all meal history
 */
async function cloudLoadAllMealHistory() {
  if (!isFirebaseReady()) return null;
  try {
    const doc = await firebaseDb.collection("mealHistory").doc("_all").get();
    if (doc.exists) {
      return doc.data().meals || [];
    }
    return [];
  } catch (error) {
    console.error("❌ Cloud load all meal history failed:", error);
    return null;
  }
}

// ============================================================
// Cloud Workout Management
// ============================================================

/**
 * Save workouts to Firestore (per user)
 */
async function cloudSaveWorkouts(userKey, workouts) {
  if (!isFirebaseReady()) return false;
  try {
    await firebaseDb.collection("workouts").doc(userKey).set({ workouts: workouts });
    console.log(`☁️ Workouts for "${userKey}" saved to cloud`);
    return true;
  } catch (error) {
    console.error("❌ Cloud save workouts failed:", error);
    return false;
  }
}

/**
 * Load workouts from Firestore (per user)
 */
async function cloudLoadWorkouts(userKey) {
  if (!isFirebaseReady()) return null;
  try {
    const doc = await firebaseDb.collection("workouts").doc(userKey).get();
    if (doc.exists) {
      return doc.data().workouts || [];
    }
    return [];
  } catch (error) {
    console.error("❌ Cloud load workouts failed:", error);
    return null;
  }
}

// ============================================================
// Cloud Ingredients Management
// ============================================================

/**
 * Save custom ingredients to Firestore
 */
async function cloudSaveIngredients(ingredients) {
  if (!isFirebaseReady()) return false;
  try {
    await firebaseDb.collection("app").doc("ingredients").set({ data: ingredients });
    console.log("☁️ Ingredients saved to cloud");
    return true;
  } catch (error) {
    console.error("❌ Cloud save ingredients failed:", error);
    return false;
  }
}

/**
 * Load custom ingredients from Firestore
 */
async function cloudLoadIngredients() {
  if (!isFirebaseReady()) return null;
  try {
    const doc = await firebaseDb.collection("app").doc("ingredients").get();
    if (doc.exists) {
      return doc.data().data || {};
    }
    return null;
  } catch (error) {
    console.error("❌ Cloud load ingredients failed:", error);
    return null;
  }
}

// ============================================================
// Auto-initialize Firebase when this script loads
// ============================================================

// Auto-initialize Firebase when this script loads
const firebaseInitPromise = initFirebase();

/** Wait until Firebase is initialized */
function waitForFirebase() {
  return firebaseInitPromise;
}
