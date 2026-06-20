/**
 * Swedish Food Agency (Livsmedelsverket) API Integration
 * Fetches nutritional data per 100g from Sweden's official food database.
 * API docs: https://dataportal.livsmedelsverket.se/livsmedel/api/v1/
 */

const API_BASE = "https://dataportal.livsmedelsverket.se/livsmedel/api/v1";

// Cache all food items since the API doesn't support server-side text search
let cachedFoods = null;
let cachePromise = null;

/**
 * Load and cache the full food list from the API (2575 items, loaded once)
 */
function loadFoodCache() {
  if (cachePromise) return cachePromise;
  cachePromise = fetch(`${API_BASE}/livsmedel?offset=0&limit=3000&sprak=1`)
    .then(res => {
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    })
    .then(data => {
      cachedFoods = (data.livsmedel || []).map(item => ({
        id: item.nummer,
        name: item.namn,
      }));
      console.log(`Swedish Food DB loaded: ${cachedFoods.length} items cached.`);
      return cachedFoods;
    })
    .catch(err => {
      console.error("Failed to load Swedish food database:", err);
      cachePromise = null; // Allow retry
      cachedFoods = [];
      return [];
    });
  return cachePromise;
}

/**
 * Search for foods by name (Swedish) — filters cached list client-side
 * @param {string} query - Search term
 * @returns {Promise<Array>} - Array of food items with basic info
 */
export async function searchSwedishFood(query) {
  if (!query || query.trim().length < 2) return [];

  const foods = cachedFoods || await loadFoodCache();
  const q = query.trim().toLowerCase();

  return foods
    .filter(item => item.name && item.name.toLowerCase().includes(q))
    .slice(0, 20);
}

// Start loading the cache immediately on import
loadFoodCache();

// ============================================================
// Willys (Axfood) API + Open Food Facts — Swedish grocery store products
// ============================================================

/**
 * Extract EAN barcode from a Willys product image URL.
 * Image URLs look like: https://assets.axfood.se/image/upload/.../07340083459979_C1L1_s02
 * The EAN is the 13-14 digit number before the underscore.
 */
function extractEanFromImageUrl(url) {
  if (!url) return "";
  const parts = url.split("/");
  for (const part of parts) {
    if (part.length >= 13 && /^\d/.test(part)) {
      const ean = part.split("_")[0];
      if (/^\d{8,14}$/.test(ean)) return ean;
    }
  }
  return "";
}

/**
 * Look up nutrition data from Open Food Facts by EAN barcode.
 * Returns per 100g values or null if not found.
 */
async function getNutritionByBarcode(ean) {
  if (!ean) return null;
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${ean}?fields=nutriments`
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (data.status === 0 || !data.product) return null;
    const n = data.product.nutriments || {};
    return {
      calories: Math.round(n["energy-kcal_100g"] || 0),
      protein: Math.round((n["proteins_100g"] || 0) * 10) / 10,
      fat: Math.round((n["fat_100g"] || 0) * 10) / 10,
      carbs: Math.round((n["carbohydrates_100g"] || 0) * 10) / 10,
      fiber: Math.round((n["fiber_100g"] || 0) * 10) / 10,
    };
  } catch {
    return null;
  }
}

/**
 * Search Open Food Facts by product name (text search).
 * Used as fallback when barcode lookup fails.
 * Prefers Swedish products but accepts any country.
 * @param {string} name - Product name to search for
 * @returns {Promise<Object|null>} - Nutrition per 100g or null
 */
async function getNutritionByNameSearch(name) {
  if (!name) return null;
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(name)}&search_simple=1&json=1&page_size=5`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    const products = data.products || [];
    if (products.length === 0) return null;

    // Prefer Swedish products, then any with nutrition data
    const withNutrition = products.filter(p => {
      const n = p.nutriments || {};
      return n["energy-kcal_100g"] != null || n["proteins_100g"] != null;
    });
    if (withNutrition.length === 0) return null;

    const swedish = withNutrition.find(p =>
      (p.countries || "").toLowerCase().includes("sweden") ||
      (p.countries_tags || []).some(t => t.includes("sweden"))
    );
    const best = swedish || withNutrition[0];
    const n = best.nutriments || {};

    return {
      calories: Math.round(n["energy-kcal_100g"] || 0),
      protein: Math.round((n["proteins_100g"] || 0) * 10) / 10,
      fat: Math.round((n["fat_100g"] || 0) * 10) / 10,
      carbs: Math.round((n["carbohydrates_100g"] || 0) * 10) / 10,
      fiber: Math.round((n["fiber_100g"] || 0) * 10) / 10,
      _source: swedish ? "Open Food Facts (Sweden)" : "Open Food Facts",
      _matchedName: best.product_name || "",
    };
  } catch {
    return null;
  }
}

/**
 * Search Willys.se for grocery products, then enrich with Open Food Facts nutrition.
 * Returns products actually sold at Willys/Hemköp with real prices and nutrition.
 *
 * ⚠️ Willys blocks CORS, so requests go through the local proxy (localhost:8081/willys).
 *
 * @param {string} query - Search term in Swedish (e.g. "kycklingbröst eldorado")
 * @returns {Promise<Array>} - Array of products with nutrition info (per 100g)
 */
export async function searchSwedishStoreProducts(query) {
  if (!query || query.trim().length < 2) return [];

  // Route through local proxy to avoid CORS block
  const proxyUrl = `http://localhost:8081/willys?q=${encodeURIComponent(query.trim())}`;

  try {
    console.log("[Store Search] Willys via proxy:", proxyUrl);
    const response = await fetch(proxyUrl);
    console.log("[Store Search] Willys Status:", response.status);
    if (!response.ok) {
      console.warn("[Store Search] Willys proxy returned", response.status, "— trying fallback");
      return searchOpenFoodFactsFallback(query);
    }

    const data = await response.json();
    const allProducts = [
      ...(data.results || []),
      ...(data.relatedResults || []),
    ];
    console.log("[Store Search] Willys products found:", allProducts.length);

    if (allProducts.length === 0) return [];

    // Map products & extract EAN barcodes from image URLs
    const mapped = allProducts.slice(0, 15).map(p => {
      const imageUrl = p.image?.url || p.thumbnail?.url || "";
      const ean = extractEanFromImageUrl(imageUrl);
      return {
        id: ean || p.code || "",
        ean,
        name: p.name || "",
        brand: p.manufacturer || "",
        stores: "Willys",
        price: p.price || "",
        volume: p.displayVolume || "",
        imageUrl: imageUrl ? imageUrl.replace("t_100", "t_200").replace("t_200", "t_200") : "",
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        fiber: 0,
        source: "Willys + Open Food Facts",
        _nutritionLoaded: false,
      };
    });

    // Fetch nutrition for all products in parallel:
    // 1st try: Open Food Facts barcode lookup (fast, exact)
    // 2nd try: Open Food Facts text search by product name (slower, fuzzy)
    const nutritionPromises = mapped.map(async (product) => {
      // Try barcode lookup first
      let nutrition = await getNutritionByBarcode(product.ean);

      // Fallback: text search by product name if barcode failed
      if (!nutrition && product.name) {
        const searchName = product.brand
          ? `${product.name} ${product.brand}`
          : product.name;
        console.log(`[Store Search] Barcode miss for "${product.name}", trying text search...`);
        nutrition = await getNutritionByNameSearch(searchName);
        if (nutrition) {
          product.source = nutrition._source || "Open Food Facts (text search)";
          console.log(`[Store Search] Text search found: "${nutrition._matchedName}" for "${product.name}"`);
        }
      }

      if (nutrition) {
        product.calories = nutrition.calories;
        product.protein = nutrition.protein;
        product.fat = nutrition.fat;
        product.carbs = nutrition.carbs;
        product.fiber = nutrition.fiber;
        product._nutritionLoaded = true;
      }
      return product;
    });

    const results = await Promise.all(nutritionPromises);
    console.log("[Store Search] Nutrition loaded for",
      results.filter(r => r._nutritionLoaded).length, "/", results.length, "products");

    return results;
  } catch (err) {
    console.error("[Store Search] Willys search failed:", err.message);
    // Fallback: try Open Food Facts v2 API directly
    return searchOpenFoodFactsFallback(query);
  }
}

/**
 * Fallback: search Open Food Facts v2 API directly (in case Willys API is blocked/down)
 * Uses text search first, then category search as a second attempt.
 */
async function searchOpenFoodFactsFallback(query) {
  try {
    // Try text search first (more reliable than category search)
    const textUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query.trim())}&search_simple=1&json=1&page_size=10`;
    console.log("[Store Search] Fallback text search:", textUrl);
    let response = await fetch(textUrl);
    let data = response.ok ? await response.json() : { products: [] };

    // If text search returns nothing, try category search
    if (!data.products || data.products.length === 0) {
      const catUrl = `https://world.openfoodfacts.org/api/v2/search?categories_tags_en=${encodeURIComponent(query.trim())}&countries_tags_en=sweden&fields=product_name,brands,stores,nutriments,code&page_size=10`;
      console.log("[Store Search] Fallback category search:", catUrl);
      response = await fetch(catUrl);
      if (!response.ok) return [];
      data = await response.json();
    }

    return (data.products || [])
      .filter(p => p.product_name)
      .map(p => ({
        id: p.code || "",
        name: p.product_name,
        brand: p.brands || "",
        stores: p.stores || "Sweden",
        calories: Math.round(p.nutriments?.["energy-kcal_100g"] || 0),
        protein: Math.round((p.nutriments?.["proteins_100g"] || 0) * 10) / 10,
        fat: Math.round((p.nutriments?.["fat_100g"] || 0) * 10) / 10,
        carbs: Math.round((p.nutriments?.["carbohydrates_100g"] || 0) * 10) / 10,
        fiber: Math.round((p.nutriments?.["fiber_100g"] || 0) * 10) / 10,
        source: "Open Food Facts",
      }));
  } catch (err) {
    console.error("[Store Search] Fallback also failed:", err.message);
    return [];
  }
}

/**
 * Get full nutritional info for a food item by its ID
 * @param {number|string} foodId
 * @returns {Promise<Object|null>} - { name, calories, protein, fat, carbs, fiber } per 100g
 */
export async function getFoodNutrition(foodId) {
  try {
    const response = await fetch(`${API_BASE}/livsmedel/${foodId}/naringsvarden?sprak=1`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const nutrients = await response.json();

    const nutrientList = Array.isArray(nutrients) ? nutrients : nutrients.naringsvarden || [];

    const getValue = (abbr, unit) => {
      const n = nutrientList.find(item =>
        (item.forkortning || "").toLowerCase() === abbr.toLowerCase() &&
        (!unit || (item.enhet || "").toLowerCase() === unit.toLowerCase())
      );
      return n ? parseFloat(n.varde || 0) : 0;
    };

    // Get name from cache
    const foods = cachedFoods || await loadFoodCache();
    const foodItem = foods.find(f => f.id == foodId);

    return {
      name: foodItem ? foodItem.name : "Unknown",
      calories: getValue("Ener", "kcal"),
      protein: getValue("Prot"),
      fat: getValue("Fett"),
      carbs: getValue("Kolh"),
      fiber: getValue("Fibe"),
      source: "Livsmedelsverket (Swedish Food Agency)",
    };
  } catch (err) {
    console.error("Swedish Food API nutrition error:", err);
    return null;
  }
}
