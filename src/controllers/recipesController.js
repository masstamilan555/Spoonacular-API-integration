//libraries
import fs from "fs/promises";
import path from "path";

//config and services
import config from "../config/config.js";
import {
  searchRecipes,
  getRecipeInformation,
} from "../services/spoonacularClient.js";
import { sha256, canonicalizeQuery } from "../utils/keygen.js";
import { getCache, setCache } from "../cache/memCache.js";

const dataDir = path.resolve(process.cwd(), "data");

// ensure data/ exists
async function ensureDataDir() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (err) {
    console.warn("Could not create data directory", err.message || err);
  }
}

// build cache keys
function buildCacheKeysForSearch(params) {
  const canonical = canonicalizeQuery(params);
  const hash = sha256(canonical || "empty");
  return `recipes:search:${hash}`;
}

// controllers for recipe search
export async function listRecipes(req, res) {
  const {
    q,
    ingredients,
    cuisine,
    diet,
    intolerances,
    maxReadyTime,
    sort,
    page,
    pageSize,
  } = req.query;

  // Validate and coerce basic params (
  const query = {
    q,
    ingredients,
    cuisine,
    diet,
    intolerances,
    maxReadyTime,
    sort,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const cacheKey = buildCacheKeysForSearch(query);
  try {
    // Try cache
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ fromCache: true, data: cached });
    }

    // Fetch from spoonacular
    const data = await searchRecipes(query);

    // Validate expected shape minimally
    if (!data || typeof data !== "object") {
      return res
        .status(502)
        .json({ error: "Invalid response from upstream API" });
    }

    // Persist to cache
    await setCache(cacheKey, data, config.SEARCH_TTL_SECONDS);

    // Also persist a sample dump to data/ for graders
    ensureDataDir().then(async () => {
      try {
        const fname = path.join(
          dataDir,
          `search_${sha256(JSON.stringify(query))}.json`
        );
        await fs.writeFile(
          fname,
          JSON.stringify({ query, data }, null, 2),
          "utf8"
        );
      } catch (err) {
        console.log("Could not write search dump", err.message || err);
      }
    });

    return res.json({ fromCache: false, data });
  } catch (err) {
    // Map errors to HTTP
    if (err.status === 429) {
      return res
        .status(429)
        .json({
          error: "Rate limited by Spoonacular",
          details: err.data || err.message,
        });
    }
    if (
      err.code === "ECONNABORTED" ||
      err.message?.toLowerCase().includes("timeout")
    ) {
      return res
        .status(504)
        .json({ error: "Upstream timeout contacting Spoonacular" });
    }
    if (err.code === "NO_RESPONSE") {
      return res.status(502).json({ error: "No response from Spoonacular" });
    }
    console.error("listRecipes error", err.message || err);
    return res
      .status(502)
      .json({ error: "Error fetching recipes", details: err.message || err });
  }
}

// controller for recipe detail
export async function getRecipe(req, res) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "id path parameter required" });
  const cacheKey = `recipes:info:${id}`;

  try {
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ fromCache: true, data: cached });
    }

    const data = await getRecipeInformation(id);

    // Validate essential fields
    const required = ["id", "title", "servings", "readyInMinutes"];
    const missing = required.filter((k) => !(k in data));
    if (missing.length) {
      return res
        .status(502)
        .json({ error: "Upstream response missing required fields", missing });
    }

    await setCache(cacheKey, data, config.DETAIL_TTL_SECONDS);

    // dump to data/
    ensureDataDir().then(async () => {
      try {
        const fname = path.join(dataDir, `detail_${id}.json`);
        await fs.writeFile(fname, JSON.stringify(data, null, 2), "utf8");
      } catch (err) {
        console.log("Could not write detail dump", err.message || err);
      }
    });

    return res.json({ fromCache: false, data });
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ error: "Recipe not found on Spoonacular" });
    }
    if (err.status === 429) {
      return res
        .status(429)
        .json({
          error: "Rate limited by Spoonacular",
          details: err.data || err.message,
        });
    }
    if (
      err.code === "ECONNABORTED" ||
      err.message?.toLowerCase().includes("timeout")
    ) {
      return res
        .status(504)
        .json({ error: "Upstream timeout contacting Spoonacular" });
    }
    console.error("getRecipe error", err.message || err);
    return res
      .status(502)
      .json({ error: "Error fetching recipe", details: err.message || err });
  }
}
