/**
 * FatSecret Platform API Integration
 * Searches food items and retrieves nutritional data from FatSecret (fatsecret.se)
 *
 * API Docs: https://platform.fatsecret.com/api/
 *
 * ⚠️ FatSecret requires OAuth 2.0 and does NOT support CORS.
 *    You need a proxy (Cloudflare Worker, Vercel function, etc.)
 *    OR use the built-in proxy below during development.
 *
 * Setup:
 * 1. Register at https://platform.fatsecret.com/ to get Client ID & Client Secret
 * 2. Set your credentials below (or use environment variables via your proxy)
 */

// ============================================================
// CONFIGURATION — Set your FatSecret API credentials here
// ============================================================
const FATSECRET_CONFIG = {
  clientId: "375c33984a444db6860873f8237f0094",
  clientSecret: "8c4f122ee0dd481d83cd9955be4ae7f1",

  // Proxy URL — FatSecret doesn't allow direct browser calls (CORS).
  // Option A: Use the Cloudflare Worker proxy (see fatsecret-proxy/ folder)
  // Option B: Set to "" to try direct calls (only works in non-browser environments)
  proxyUrl: "http://localhost:8081",  // Local proxy (run: npm run proxy)
};

// ============================================================
// OAuth 2.0 Token Management
// ============================================================
let accessToken = null;
let tokenExpiry = 0;

/**
 * Get a valid OAuth 2.0 access token (Client Credentials flow)
 * If using a proxy, the proxy handles auth and this is skipped.
 */
async function getAccessToken() {
  if (FATSECRET_CONFIG.proxyUrl) {
    // Proxy handles authentication — no token needed client-side
    return "proxy";
  }

  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  if (!FATSECRET_CONFIG.clientId || !FATSECRET_CONFIG.clientSecret) {
    console.error("[FatSecret] Missing API credentials. Register at https://platform.fatsecret.com/");
    return null;
  }

  try {
    const response = await fetch("https://oauth.fatsecret.com/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + btoa(`${FATSECRET_CONFIG.clientId}:${FATSECRET_CONFIG.clientSecret}`),
      },
      body: "grant_type=client_credentials&scope=basic",
    });

    if (!response.ok) throw new Error(`Token error: ${response.status}`);

    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // Refresh 60s early
    return accessToken;
  } catch (err) {
    console.error("[FatSecret] OAuth token error:", err);
    return null;
  }
}

// ============================================================
// API Calls
// ============================================================

/**
 * Make an API call to FatSecret (via proxy or direct)
 */
async function fatSecretApiCall(method, params = {}) {
  if (FATSECRET_CONFIG.proxyUrl) {
    // Use proxy
    const url = new URL(FATSECRET_CONFIG.proxyUrl);
    url.searchParams.set("method", method);
    Object.entries(params).forEach(([key, val]) => url.searchParams.set(key, val));

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Proxy error: ${response.status}`);
    return response.json();
  } else {
    // Direct call (won't work from browser due to CORS, but works in Node/testing)
    const token = await getAccessToken();
    if (!token) throw new Error("No access token");

    const url = new URL("https://platform.fatsecret.com/rest/server.api");
    url.searchParams.set("method", method);
    url.searchParams.set("format", "json");
    Object.entries(params).forEach(([key, val]) => url.searchParams.set(key, val));

    const response = await fetch(url.toString(), {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  }
}

// ============================================================
// Public API Functions
// ============================================================

/**
 * Search for foods on FatSecret
 * @param {string} query - Search term (Swedish or English)
 * @param {number} maxResults - Max results to return (default 15)
 * @returns {Promise<Array>} - Array of food items with basic info
 */
export async function searchFatSecretFood(query, maxResults = 15) {
  if (!query || query.trim().length < 2) return [];

  if (!FATSECRET_CONFIG.proxyUrl && !FATSECRET_CONFIG.clientId) {
    console.warn("[FatSecret] Not configured. Set credentials in fatSecretAPI.js or deploy the proxy.");
    return [];
  }

  try {
    const data = await fatSecretApiCall("foods.search", {
      search_expression: query.trim(),
      max_results: maxResults.toString(),
    });

    const foods = data?.foods?.food;
    if (!foods) return [];

    const foodList = Array.isArray(foods) ? foods : [foods];

    return foodList.map(food => {
      // Parse nutrition from food_description string
      // Format: "Per XXg - Calories: XXXkcal | Fat: XXg | Carbs: XXg | Protein: XXg"
      const desc = food.food_description || "";
      const calories = parseFloat(desc.match(/Calories:\s*([\d.]+)/)?.[1] || 0);
      const fat = parseFloat(desc.match(/Fat:\s*([\d.]+)/)?.[1] || 0);
      const carbs = parseFloat(desc.match(/Carbs:\s*([\d.]+)/)?.[1] || 0);
      const protein = parseFloat(desc.match(/Protein:\s*([\d.]+)/)?.[1] || 0);

      return {
        id: food.food_id,
        name: food.food_name,
        brand: food.brand_name || "",
        type: food.food_type || "", // "Brand" or "Generic"
        description: desc,
        calories,
        protein,
        fat,
        carbs,
        fiber: 0, // Not available in v1 search results
        servingDescription: desc.match(/Per\s+([^\-]+)/)?.[1]?.trim() || "",
      };
    });
  } catch (err) {
    console.error("[FatSecret] Search error:", err);
    return [];
  }
}

/**
 * Get detailed nutrition for a specific food by ID
 * @param {string|number} foodId - FatSecret food_id
 * @returns {Promise<Object|null>} - Detailed nutrition info (per 100g)
 */
export async function getFatSecretFoodDetails(foodId) {
  try {
    const data = await fatSecretApiCall("food.get.v2", {
      food_id: foodId.toString(),
    });

    const food = data?.food;
    if (!food) return null;

    // Find the "per 100g" serving, or fall back to first serving
    const servings = food.servings?.serving;
    const servingList = Array.isArray(servings) ? servings : [servings];

    // Prefer "per 100g" or "100 g" serving
    let serving = servingList.find(s =>
      s.serving_description?.toLowerCase().includes("100") &&
      (s.serving_description?.toLowerCase().includes("g") || s.metric_serving_unit === "g")
    );

    // If no 100g serving, try to normalize from metric_serving_amount
    if (!serving) {
      serving = servingList.find(s => s.metric_serving_amount && s.metric_serving_unit === "g");
    }

    // Fall back to first serving
    if (!serving) {
      serving = servingList[0];
    }

    // Calculate per 100g values
    let multiplier = 1;
    if (serving && serving.metric_serving_amount) {
      const grams = parseFloat(serving.metric_serving_amount);
      if (grams > 0 && grams !== 100) {
        multiplier = 100 / grams;
      }
    }

    return {
      name: food.food_name,
      brand: food.brand_name || "",
      calories: parseFloat(serving?.calories || 0) * multiplier,
      protein: parseFloat(serving?.protein || 0) * multiplier,
      fat: parseFloat(serving?.fat || 0) * multiplier,
      carbs: parseFloat(serving?.carbohydrate || 0) * multiplier,
      fiber: parseFloat(serving?.fiber || 0) * multiplier,
      servingDescription: serving?.serving_description || "",
      source: "FatSecret",
    };
  } catch (err) {
    console.error("[FatSecret] Food detail error:", err);
    return null;
  }
}

/**
 * Check if FatSecret is configured and ready to use
 */
export function isFatSecretConfigured() {
  return !!(FATSECRET_CONFIG.proxyUrl || (FATSECRET_CONFIG.clientId && FATSECRET_CONFIG.clientSecret));
}



