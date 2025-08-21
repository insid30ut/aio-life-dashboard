import { api, APIError } from "encore.dev/api";
import { mealsDB } from "./db";
import type { Recipe, RecipeIngredient, RecipeWithIngredients } from "./types";

export interface CreateRecipeRequest {
  name: string;
  instructions: string;
  ingredients: { name: string; quantity: string }[];
}

export interface CreateRecipeResponse {
  recipe: RecipeWithIngredients;
}

export interface GetRecipesResponse {
  recipes: Recipe[];
}

export interface GetRecipeResponse {
  recipe: RecipeWithIngredients;
}

export interface UpdateRecipeRequest {
  id: number;
  name?: string;
  instructions?: string;
  ingredients?: { name: string; quantity: string }[];
}

export interface UpdateRecipeResponse {
  recipe: RecipeWithIngredients;
}

// Creates a new recipe.
export const createRecipe = api<CreateRecipeRequest, CreateRecipeResponse>(
  { expose: true, method: "POST", path: "/recipes" },
  async (req) => {
    const recipe = await mealsDB.queryRow<Recipe>`
      INSERT INTO recipes (name, instructions, user_id)
      VALUES (${req.name}, ${req.instructions}, ${'anonymous'})
      RETURNING *
    `;
    
    if (!recipe) {
      throw APIError.internal("failed to create recipe");
    }
    
    const ingredients: RecipeIngredient[] = [];
    for (let i = 0; i < req.ingredients.length; i++) {
      const ingredient = req.ingredients[i];
      const dbIngredient = await mealsDB.queryRow<RecipeIngredient>`
        INSERT INTO recipe_ingredients (name, quantity, recipe_id, position)
        VALUES (${ingredient.name}, ${ingredient.quantity}, ${recipe.id}, ${i + 1})
        RETURNING *
      `;
      if (dbIngredient) {
        ingredients.push(dbIngredient);
      }
    }
    
    const recipeWithIngredients: RecipeWithIngredients = {
      ...recipe,
      ingredients
    };
    
    return { recipe: recipeWithIngredients };
  }
);

// Gets all recipes for the current user.
export const getRecipes = api<void, GetRecipesResponse>(
  { expose: true, method: "GET", path: "/recipes" },
  async () => {
    const recipes = await mealsDB.queryAll<Recipe>`
      SELECT * FROM recipes
      WHERE user_id = ${'anonymous'}
      ORDER BY name ASC
    `;
    
    return { recipes };
  }
);

// Gets a specific recipe with ingredients.
export const getRecipe = api<{ id: number }, GetRecipeResponse>(
  { expose: true, method: "GET", path: "/recipes/:id" },
  async (req) => {
    const recipe = await mealsDB.queryRow<Recipe>`
      SELECT * FROM recipes
      WHERE id = ${req.id} AND user_id = ${'anonymous'}
    `;
    
    if (!recipe) {
      throw APIError.notFound("recipe not found");
    }
    
    const ingredients = await mealsDB.queryAll<RecipeIngredient>`
      SELECT * FROM recipe_ingredients
      WHERE recipe_id = ${req.id}
      ORDER BY position ASC
    `;
    
    const recipeWithIngredients: RecipeWithIngredients = {
      ...recipe,
      ingredients
    };
    
    return { recipe: recipeWithIngredients };
  }
);

// Updates a recipe.
export const updateRecipe = api<UpdateRecipeRequest, UpdateRecipeResponse>(
  { expose: true, method: "PUT", path: "/recipes/:id" },
  async (req) => {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (req.name !== undefined) {
      updates.push(`name = $${values.length + 1}`);
      values.push(req.name);
    }
    
    if (req.instructions !== undefined) {
      updates.push(`instructions = $${values.length + 1}`);
      values.push(req.instructions);
    }
    
    updates.push(`updated_at = NOW()`);
    
    if (updates.length > 1) { // More than just updated_at
      const query = `
        UPDATE recipes 
        SET ${updates.join(', ')}
        WHERE id = $${values.length + 1} AND user_id = $${values.length + 2}
        RETURNING *
      `;
      values.push(req.id, 'anonymous');
      
      const recipe = await mealsDB.rawQueryRow<Recipe>(query, ...values);
      
      if (!recipe) {
        throw APIError.notFound("recipe not found");
      }
    }
    
    // Update ingredients if provided
    if (req.ingredients !== undefined) {
      // Delete existing ingredients
      await mealsDB.exec`
        DELETE FROM recipe_ingredients
        WHERE recipe_id = ${req.id}
      `;
      
      // Insert new ingredients
      for (let i = 0; i < req.ingredients.length; i++) {
        const ingredient = req.ingredients[i];
        await mealsDB.exec`
          INSERT INTO recipe_ingredients (name, quantity, recipe_id, position)
          VALUES (${ingredient.name}, ${ingredient.quantity}, ${req.id}, ${i + 1})
        `;
      }
    }
    
    // Get the updated recipe with ingredients
    const recipe = await mealsDB.queryRow<Recipe>`
      SELECT * FROM recipes
      WHERE id = ${req.id} AND user_id = ${'anonymous'}
    `;
    
    if (!recipe) {
      throw APIError.notFound("recipe not found");
    }
    
    const ingredients = await mealsDB.queryAll<RecipeIngredient>`
      SELECT * FROM recipe_ingredients
      WHERE recipe_id = ${req.id}
      ORDER BY position ASC
    `;
    
    const recipeWithIngredients: RecipeWithIngredients = {
      ...recipe,
      ingredients
    };
    
    return { recipe: recipeWithIngredients };
  }
);

// Deletes a recipe.
export const deleteRecipe = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/recipes/:id" },
  async (req) => {
    await mealsDB.exec`
      DELETE FROM recipes
      WHERE id = ${req.id} AND user_id = ${'anonymous'}
    `;
  }
);
