import axios from "axios";
// config
import config from "../config/config.js";

/**
 * Simple axios wrapper for Spoonacular
 * Includes timeout and some basic error normalization.
 */

const baseURL = "https://api.spoonacular.com";

const instance = axios.create({
  baseURL,
  timeout: config.AXIOS_TIMEOUT_MS,
  params: {
    apiKey: config.SPOONACULAR_KEY,
  },
});

// Response interceptor can be extended
instance.interceptors.response.use(
  (resp) => resp,
  (error) => {
    // Normalize errors
    if (error.response) {
      // API responded with non-2xx
      const { status, data } = error.response;
      const err = new Error(`Spoonacular API error: ${status}`);
      err.status = status;
      err.data = data;
      throw err;
    } else if (error.request) {
      // No response
      const err = new Error("No response from Spoonacular");
      err.code = "NO_RESPONSE";
      throw err;
    } else {
      throw error;
    }
  }
);

/**
 * Search recipes using complexSearch
 * params: maps to spoonacular query - see README for mapping
 */
export async function searchRecipes(params = {}) {
  // Map our params to Spoonacular params. Basic mapping:
  const map = {};
  if (params.q) map.query = params.q;
  if (params.ingredients) map.includeIngredients = params.ingredients;
  if (params.cuisine) map.cuisine = params.cuisine;
  if (params.diet) map.diet = params.diet;
  if (params.intolerances) map.intolerances = params.intolerances;
  if (params.maxReadyTime) map.maxReadyTime = params.maxReadyTime;
  if (params.sort) map.sort = params.sort;
  // pagination: spoonacular uses offset & number
  const page = Math.max(1, Number(params.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize || 10)));
  map.number = pageSize;
  map.offset = (page - 1) * pageSize;

  // request fields: allow more info in response if needed (we will rely on defaults)
  try {
    const response = await instance.get("/recipes/complexSearch", {
      params: map,
    });
    return response.data;
  } catch (err) {
    // rethrow normalized error
    throw err;
  }
}

// Get detailed recipe information by id
export async function getRecipeInformation(id) {
  if (!id) throw new Error("id required for getRecipeInformation");
  try {
    const response = await instance.get(
      `/recipes/${encodeURIComponent(id)}/information`
    );
    return response.data;
  } catch (err) {
    throw err;
  }
}
