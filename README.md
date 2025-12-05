
#  Spoonacular API Integration

A lightweight Node.js + Express service demonstrating API integration, data fetching from two endpoints, filtering, caching, and structured output.

---

## Features

* Fetches data from **two Spoonacular API endpoints**:

  * `/recipes/complexSearch`
  * `/recipes/{id}/information`
* Implements **query-based filtering**
* Provides **list view** + **detail view**
* Includes **in-memory caching with TTL**
* Automatically stores sample API responses to `./data/`
* Robust **error handling** (timeouts, invalid responses, malformed fields, upstream failures)
* Zero external dependencies (no Docker / no Redis required)

---

## Project Structure

```
src/
├─ server.js
├─ config.js
├─ routes/
│   └─ recipes.js
├─ controllers/
│   └─ recipesController.js
├─ services/
│   └─ spoonacularClient.js
├─ cache/
│   └─ redisClient.js   (in-memory cache version)
data/
```

---

## Setup & Installation

### **1. Clone the repository**

```bash
git clone <your-repo-url>
cd <project-folder>
```

### **2. Install dependencies**

```bash
npm install
```

### **3. Create `.env` file**

```bash
cp .env.example .env
```

Edit `.env` and set:

```
SPOONACULAR_KEY=your_api_key_here
PORT=3000
SEARCH_TTL_SECONDS=3600
DETAIL_TTL_SECONDS=86400
AXIOS_TIMEOUT_MS=5000
```

> **Note:** You must obtain a Spoonacular API key from
> [https://spoonacular.com/food-api](https://spoonacular.com/food-api)

### **4. Start the server**

```bash
npm start
# or 
npm run dev
```

Server will start at:
**[http://localhost:3000](http://localhost:3000)**

---

## API Endpoints

### ### **GET `/api/recipes`**

Returns a filtered list of recipes using Spoonacular’s `complexSearch` endpoint.

#### **Query Parameters (Filters)**

| Parameter      | Type       | Description                     |
| -------------- | ---------- | ------------------------------- |
| `q`            | string     | Search term                     |
| `ingredients`  | comma list | Filter by ingredients           |
| `cuisine`      | string     | Cuisine type                    |
| `diet`         | string     | Diet filter (e.g., vegan, keto) |
| `intolerances` | comma list | Food intolerances               |
| `maxReadyTime` | number     | Max preparation time (minutes)  |
| `sort`         | string     | Sorting option                  |
| `page`         | number     | Pagination page number          |
| `pageSize`     | number     | Items per page (max 100)        |

#### **Example**

```bash
curl "http://localhost:3000/api/recipes?q=pasta&page=1&pageSize=5"
```

---

### **GET `/api/recipes/:id`**

Returns detailed information about a single recipe using Spoonacular’s `/recipes/{id}/information` endpoint.

#### **Example**

```bash
curl "http://localhost:3000/api/recipes/716429"
```

---

## Caching Behavior

* Uses a **simple in-memory cache**.
* Cached responses persist **only while the server is running**.
* TTL is configurable via:

  ```
  SEARCH_TTL_SECONDS
  DETAIL_TTL_SECONDS
  ```
* Cache key is a hashed canonical representation of request parameters.

---

## Local Data Storage

On every cache miss, the application stores a sample JSON response under:

```
/data/search_<hash>.json
/data/detail_<id>.json
```


---

## Error Handling

The application includes robust error responses for:

* Spoonacular API timeouts (`504`)
* Invalid or missing fields (`502`)
* Rate limits (`429`)
* Network failures (`502`)
* Not found (`404`)
* Invalid query params (`400`)

---

## Assumptions / Notes

* The API does **not** require Redis or external databases; therefore caching is done in memory for simplicity.
* Spoonacular free-tier API has strict rate limits. Caching minimizes repeated calls.
* Pagination logic maps:

  ```
  page → offset
  pageSize → number
  ```
* Missing environment variables (e.g., `SPOONACULAR_KEY`) will not crash the app but will cause upstream request failures.
* Local data stored in `./data` is for demonstration and grading purposes only; it is not used as a database.

---
