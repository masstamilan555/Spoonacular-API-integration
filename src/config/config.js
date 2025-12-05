import dotenv from 'dotenv';
dotenv.config();

// load config from environment with defaults
const {
  SPOONACULAR_KEY,
  PORT = 3000,
  SEARCH_TTL_SECONDS = 3600,
  DETAIL_TTL_SECONDS = 86400,
  AXIOS_TIMEOUT_MS = 5000
} = process.env;

// spoonacular key is missing
if (!SPOONACULAR_KEY) {
  console.error('Missing SPOONACULAR_KEY in environment');
}

export default {
  SPOONACULAR_KEY,
  PORT: Number(PORT),
  SEARCH_TTL_SECONDS: Number(SEARCH_TTL_SECONDS),
  DETAIL_TTL_SECONDS: Number(DETAIL_TTL_SECONDS),
  AXIOS_TIMEOUT_MS: Number(AXIOS_TIMEOUT_MS)
};
