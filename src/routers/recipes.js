//libraries
import express from 'express';
//controllers
import { listRecipes, getRecipe } from '../controllers/recipesController.js';

const router = express.Router();

/**
 * GET /api/recipes
 * Query params supported:
 *  - q (string)
 *  - ingredients (comma list)
 *  - cuisine (string)
 *  - diet (string)
 *  - intolerances (comma list)
 *  - maxReadyTime (int)
 *  - sort (string)
 *  - page (int)
 *  - pageSize (int)
 */
router.get('/', listRecipes);

/**
 * GET /api/recipes/:id
 * Returns detailed recipe info
 */
router.get('/:id', getRecipe);

export default router;
