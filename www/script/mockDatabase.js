import { isCloudEnabled, saveToCloud, loadFromCloud } from './cloudStorage.js';

const defaultMockNutritionDB = {
  // === PROTEINS ===
  "chicken breast": { calories: 165, protein: 31, fat: 3.6, carbs: 0, fiber: 0 },
  "egg": { calories: 143, protein: 12.6, fat: 9.5, carbs: 0.7, fiber: 0 },
  "rice": { calories: 130, protein: 2.7, fat: 0.3, carbs: 28, fiber: 0.4 },

  // === VEGETABLES ===
  "broccoli": { calories: 34, protein: 2.8, fat: 0.4, carbs: 7, fiber: 2.6 },
  "spinach": { calories: 23, protein: 2.9, fat: 0.4, carbs: 3.6, fiber: 2.2 },
  "kale": { calories: 49, protein: 4.3, fat: 0.9, carbs: 8.8, fiber: 3.6 },
  "carrot": { calories: 41, protein: 0.9, fat: 0.2, carbs: 9.6, fiber: 2.8 },
  "tomato": { calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9, fiber: 1.2 },
  "cucumber": { calories: 15, protein: 0.7, fat: 0.1, carbs: 3.6, fiber: 0.5 },
  "bell pepper": { calories: 31, protein: 1, fat: 0.3, carbs: 6, fiber: 2.1 },
  "zucchini": { calories: 17, protein: 1.2, fat: 0.3, carbs: 3.1, fiber: 1 },
  "cauliflower": { calories: 25, protein: 1.9, fat: 0.3, carbs: 5, fiber: 2 },
  "sweet potato": { calories: 86, protein: 1.6, fat: 0.1, carbs: 20, fiber: 3 },
  "potato": { calories: 77, protein: 2, fat: 0.1, carbs: 17, fiber: 2.2 },
  "onion": { calories: 40, protein: 1.1, fat: 0.1, carbs: 9.3, fiber: 1.7 },
  "garlic": { calories: 149, protein: 6.4, fat: 0.5, carbs: 33, fiber: 2.1 },
  "mushroom": { calories: 22, protein: 3.1, fat: 0.3, carbs: 3.3, fiber: 1 },
  "asparagus": { calories: 20, protein: 2.2, fat: 0.1, carbs: 3.9, fiber: 2.1 },
  "green beans": { calories: 31, protein: 1.8, fat: 0.1, carbs: 7, fiber: 3.4 },
  "peas": { calories: 81, protein: 5.4, fat: 0.4, carbs: 14.5, fiber: 5.7 },
  "corn": { calories: 86, protein: 3.3, fat: 1.4, carbs: 19, fiber: 2.7 },
  "lettuce": { calories: 15, protein: 1.4, fat: 0.2, carbs: 2.9, fiber: 1.3 },
  "cabbage": { calories: 25, protein: 1.3, fat: 0.1, carbs: 5.8, fiber: 2.5 },
  "celery": { calories: 16, protein: 0.7, fat: 0.2, carbs: 3, fiber: 1.6 },
  "beetroot": { calories: 43, protein: 1.6, fat: 0.2, carbs: 10, fiber: 2.8 },
  "eggplant": { calories: 25, protein: 1, fat: 0.2, carbs: 6, fiber: 3 },
  "artichoke": { calories: 47, protein: 3.3, fat: 0.2, carbs: 11, fiber: 5.4 },
  "brussels sprouts": { calories: 43, protein: 3.4, fat: 0.3, carbs: 9, fiber: 3.8 },
  "radish": { calories: 16, protein: 0.7, fat: 0.1, carbs: 3.4, fiber: 1.6 },
  "turnip": { calories: 28, protein: 0.9, fat: 0.1, carbs: 6.4, fiber: 1.8 },
  "leek": { calories: 61, protein: 1.5, fat: 0.3, carbs: 14, fiber: 1.8 },
  "okra": { calories: 33, protein: 1.9, fat: 0.2, carbs: 7, fiber: 3.2 },

  // === FRUITS ===
  "apple": { calories: 52, protein: 0.3, fat: 0.2, carbs: 14, fiber: 2.4 },
  "banana": { calories: 89, protein: 1.1, fat: 0.3, carbs: 23, fiber: 2.6 },
  "orange": { calories: 47, protein: 0.9, fat: 0.1, carbs: 12, fiber: 2.4 },
  "strawberry": { calories: 32, protein: 0.7, fat: 0.3, carbs: 7.7, fiber: 2 },
  "blueberry": { calories: 57, protein: 0.7, fat: 0.3, carbs: 14, fiber: 2.4 },
  "raspberry": { calories: 52, protein: 1.2, fat: 0.7, carbs: 12, fiber: 6.5 },
  "grape": { calories: 69, protein: 0.7, fat: 0.2, carbs: 18, fiber: 0.9 },
  "watermelon": { calories: 30, protein: 0.6, fat: 0.2, carbs: 8, fiber: 0.4 },
  "mango": { calories: 60, protein: 0.8, fat: 0.4, carbs: 15, fiber: 1.6 },
  "pineapple": { calories: 50, protein: 0.5, fat: 0.1, carbs: 13, fiber: 1.4 },
  "peach": { calories: 39, protein: 0.9, fat: 0.3, carbs: 10, fiber: 1.5 },
  "pear": { calories: 57, protein: 0.4, fat: 0.1, carbs: 15, fiber: 3.1 },
  "cherry": { calories: 50, protein: 1, fat: 0.3, carbs: 12, fiber: 1.6 },
  "kiwi": { calories: 61, protein: 1.1, fat: 0.5, carbs: 15, fiber: 3 },
  "avocado": { calories: 160, protein: 2, fat: 15, carbs: 9, fiber: 7 },
  "pomegranate": { calories: 83, protein: 1.7, fat: 1.2, carbs: 19, fiber: 4 },
  "lemon": { calories: 29, protein: 1.1, fat: 0.3, carbs: 9, fiber: 2.8 },
  "lime": { calories: 30, protein: 0.7, fat: 0.2, carbs: 11, fiber: 2.8 },
  "grapefruit": { calories: 42, protein: 0.8, fat: 0.1, carbs: 11, fiber: 1.6 },
  "papaya": { calories: 43, protein: 0.5, fat: 0.3, carbs: 11, fiber: 1.7 },
  "coconut": { calories: 354, protein: 3.3, fat: 33, carbs: 15, fiber: 9 },
  "fig": { calories: 74, protein: 0.8, fat: 0.3, carbs: 19, fiber: 2.9 },
  "plum": { calories: 46, protein: 0.7, fat: 0.3, carbs: 11, fiber: 1.4 },
  "apricot": { calories: 48, protein: 1.4, fat: 0.4, carbs: 11, fiber: 2 },
  "cantaloupe": { calories: 34, protein: 0.8, fat: 0.2, carbs: 8, fiber: 0.9 },
  "blackberry": { calories: 43, protein: 1.4, fat: 0.5, carbs: 10, fiber: 5.3 },
  "cranberry": { calories: 46, protein: 0.4, fat: 0.1, carbs: 12, fiber: 4.6 },
  "passion fruit": { calories: 97, protein: 2.2, fat: 0.7, carbs: 23, fiber: 10.4 },
  "dragon fruit": { calories: 50, protein: 1.1, fat: 0.4, carbs: 11, fiber: 3 },
  "lychee": { calories: 66, protein: 0.8, fat: 0.4, carbs: 17, fiber: 1.3 },
};

// The live database starts with defaults, cloud data is merged on sync
export const mockNutritionDB = { ...defaultMockNutritionDB };

// Save the database to Firebase (cloud only, no localStorage)
export function saveMockNutritionDB() {
  // Save to Firebase if available
  if (typeof cloudSaveIngredients === "function" && typeof isFirebaseReady === "function" && isFirebaseReady()) {
    cloudSaveIngredients(mockNutritionDB);
    console.log("☁️ Ingredients saved to database");
  } else if (isCloudEnabled()) {
    saveToCloud(mockNutritionDB);
  }
}

// Function to add a new ingredient to the database
export function addIngredient(name, calories, protein, fat, carbs, fiber = 0, servingUnits = null) {
  const key = name.toLowerCase();
  const existing = mockNutritionDB[key];
  mockNutritionDB[key] = {
    calories: parseFloat(calories),
    protein: parseFloat(protein),
    fat: parseFloat(fat),
    carbs: parseFloat(carbs),
    fiber: parseFloat(fiber) || 0,
  };
  // Preserve or set serving units
  if (servingUnits !== null) {
    mockNutritionDB[key].servingUnits = servingUnits;
  } else if (existing && existing.servingUnits) {
    mockNutritionDB[key].servingUnits = existing.servingUnits;
  }
  saveMockNutritionDB();
}

// Function to update serving units for an ingredient
export function setServingUnits(name, units) {
  const key = name.toLowerCase();
  if (mockNutritionDB[key]) {
    mockNutritionDB[key].servingUnits = units; // [{name: "slice", grams: 30}, ...]
    saveMockNutritionDB();
  }
}

// Sync from cloud on startup — merges cloud ingredients with defaults
export async function syncFromCloud() {
  // Try Firebase first
  if (typeof cloudLoadIngredients === "function" && typeof isFirebaseReady === "function" && isFirebaseReady()) {
    const cloudData = await cloudLoadIngredients();
    if (cloudData) {
      Object.keys(cloudData).forEach((key) => {
        mockNutritionDB[key] = cloudData[key];
      });
      console.log("☁️ Synced ingredients from database");
      return true;
    }
  }
  // Fallback to JSONBin
  if (!isCloudEnabled()) return false;
  const cloudData = await loadFromCloud();
  if (cloudData) {
    Object.keys(cloudData).forEach((key) => {
      mockNutritionDB[key] = cloudData[key];
    });
    console.log("☁️ Synced ingredients from cloud");
    return true;
  }
  return false;
}