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
        source: "Willys API",
      };
    });

    // Enrich with nutrition data
    for (const product of mapped) {
      if (product.ean) {
        const nutrition = await getNutritionByBarcode(product.ean);
        if (nutrition) {
          Object.assign(product, nutrition, { source: "Willys + Open Food Facts" });
          continue;
        }
      }
      const nutrition = await getNutritionByNameSearch(product.name);
      if (nutrition) {
        Object.assign(product, nutrition, { source: nutrition._source });
      }
    }

    return mapped;
  } catch (err) {
    console.error("[Store Search] Error:", err);
    return searchOpenFoodFactsFallback(query);
  }
}

/**
 * Fallback: Search Open Food Facts directly when Willys is blocked
 */
async function searchOpenFoodFactsFallback(query) {
  try {
    const nutrition = await getNutritionByNameSearch(query);
    if (nutrition) {
      return [{
        name: nutrition._matchedName || query,
        stores: "Open Food Facts",
        calories: nutrition.calories,
        protein: nutrition.protein,
        fat: nutrition.fat,
        carbs: nutrition.carbs,
        fiber: nutrition.fiber,
        source: nutrition._source,
      }];
    }
  } catch (err) {
    console.error("[Fallback] Error:", err);
  }
  return [];
}

/**
 * Get detailed nutrition for a specific Swedish food by ID
 */
export async function getFoodNutrition(foodId) {
  try {
    const response = await fetch(`${API_BASE}/livsmedel-näringsämnen/${foodId}`);
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.näringsämnen) return null;

    const n = data.näringsämnen;
    return {
      name: data.namn || "",
      calories: Math.round(n.energi || 0),
      protein: Math.round((n.protein || 0) * 10) / 10,
      fat: Math.round((n.fett || 0) * 10) / 10,
      carbs: Math.round((n.kolhydrater || 0) * 10) / 10,
      fiber: Math.round((n.fiber || 0) * 10) / 10,
      source: "Livsmedelsverket",
    };
  } catch (err) {
    console.error("[Livsmedelsverket] Food detail error:", err);
    return null;
  }
}

