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
    const rows = await mealsDB.queryAll<{
        recipe_id: number;
        recipe_name: string;
        recipe_instructions: string;
        recipe_user_id: string;
        recipe_created_at: Date;
        recipe_updated_at: Date;
        ingredient_id: number | null;
        ingredient_name: string | null;
        ingredient_quantity: string | null;
        ingredient_recipe_id: number | null;
        ingredient_position: number | null;
        ingredient_created_at: Date | null;
    }>`
        SELECT
            r.id AS recipe_id,
            r.name AS recipe_name,
            r.instructions AS recipe_instructions,
            r.user_id AS recipe_user_id,
            r.created_at AS recipe_created_at,
            r.updated_at AS recipe_updated_at,
            ri.id AS ingredient_id,
            ri.name AS ingredient_name,
            ri.quantity AS ingredient_quantity,
            ri.recipe_id AS ingredient_recipe_id,
            ri.position AS ingredient_position,
            ri.created_at AS ingredient_created_at
        FROM
            recipes r
        LEFT JOIN
            recipe_ingredients ri ON r.id = ri.recipe_id
        WHERE
            r.id = ${req.id} AND r.user_id = ${'anonymous'}
        ORDER BY
            ri.position ASC
    `;

    if (rows.length === 0) {
        const recipe = await mealsDB.queryRow<Recipe>`
            SELECT * FROM recipes WHERE id = ${req.id} AND user_id = ${'anonymous'}
        `;
        if (!recipe) {
            throw APIError.notFound("recipe not found");
        }
        return { recipe: { ...recipe, ingredients: [] } };
    }

    const firstRow = rows[0];
    const recipeWithIngredients: RecipeWithIngredients = {
        id: firstRow.recipe_id,
        name: firstRow.recipe_name,
        instructions: firstRow.recipe_instructions,
        user_id: firstRow.recipe_user_id,
        created_at: firstRow.recipe_created_at,
        updated_at: firstRow.recipe_updated_at,
        ingredients: [],
    };

    for (const row of rows) {
        if (row.ingredient_id) {
            recipeWithIngredients.ingredients.push({
                id: row.ingredient_id,
                name: row.ingredient_name!,
                quantity: row.ingredient_quantity!,
                recipe_id: row.ingredient_recipe_id!,
                position: row.ingredient_position!,
                created_at: row.ingredient_created_at!,
            });
        }
    }

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
    
    // Re-fetch the fully updated recipe with its ingredients using the optimized getRecipe function.
    return getRecipe({ id: req.id });
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
