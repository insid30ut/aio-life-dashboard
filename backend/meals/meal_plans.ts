import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { mealsDB } from "./db";
import type { MealPlan, MealPlanEntry, MealPlanWithEntries, MealPlanEntryWithRecipe, Recipe } from "./types";

export interface GetMealPlanRequest {
  week_of: string; // YYYY-MM-DD format
}

export interface GetMealPlanResponse {
  meal_plan: MealPlanWithEntries;
}

export interface SetMealRequest {
  week_of: string;
  day_of_week: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  recipe_id?: number;
  custom_meal?: string;
}

export interface SetMealResponse {
  entry: MealPlanEntryWithRecipe;
}

export interface GetWeekIngredientsRequest {
  week_of: string;
}

export interface GetWeekIngredientsResponse {
  ingredients: string[];
}

// Gets or creates a meal plan for a specific week.
export const getMealPlan = api<GetMealPlanRequest, GetMealPlanResponse>(
  { auth: true, expose: true, method: "GET", path: "/meal-plans" },
  async (req) => {
    const auth = getAuthData()!;
    const weekDate = new Date(req.week_of);
    
    // Try to get existing meal plan
    let mealPlan = await mealsDB.queryRow<MealPlan>`
      SELECT * FROM meal_plans
      WHERE week_of = ${weekDate} AND user_id = ${auth.userID}
    `;
    
    // Create if doesn't exist
    if (!mealPlan) {
      mealPlan = await mealsDB.queryRow<MealPlan>`
        INSERT INTO meal_plans (week_of, user_id)
        VALUES (${weekDate}, ${auth.userID})
        RETURNING *
      `;
      
      if (!mealPlan) {
        throw APIError.internal("failed to create meal plan");
      }
    }
    
    // Get all entries for this meal plan
    const entries = await mealsDB.queryAll<MealPlanEntry>`
      SELECT * FROM meal_plan_entries
      WHERE meal_plan_id = ${mealPlan.id}
      ORDER BY day_of_week ASC, meal_type ASC
    `;
    
    const mealPlanWithEntries: MealPlanWithEntries = {
      ...mealPlan,
      entries
    };
    
    return { meal_plan: mealPlanWithEntries };
  }
);

// Sets a meal for a specific day and meal type.
export const setMeal = api<SetMealRequest, SetMealResponse>(
  { auth: true, expose: true, method: "POST", path: "/meal-plans/meals" },
  async (req) => {
    const auth = getAuthData()!;
    const weekDate = new Date(req.week_of);
    
    // Get or create meal plan
    let mealPlan = await mealsDB.queryRow<MealPlan>`
      SELECT * FROM meal_plans
      WHERE week_of = ${weekDate} AND user_id = ${auth.userID}
    `;
    
    if (!mealPlan) {
      mealPlan = await mealsDB.queryRow<MealPlan>`
        INSERT INTO meal_plans (week_of, user_id)
        VALUES (${weekDate}, ${auth.userID})
        RETURNING *
      `;
      
      if (!mealPlan) {
        throw APIError.internal("failed to create meal plan");
      }
    }
    
    // Upsert the meal entry
    const entry = await mealsDB.queryRow<MealPlanEntry>`
      INSERT INTO meal_plan_entries (meal_plan_id, day_of_week, meal_type, recipe_id, custom_meal)
      VALUES (${mealPlan.id}, ${req.day_of_week}, ${req.meal_type}, ${req.recipe_id || null}, ${req.custom_meal || null})
      ON CONFLICT (meal_plan_id, day_of_week, meal_type)
      DO UPDATE SET
        recipe_id = EXCLUDED.recipe_id,
        custom_meal = EXCLUDED.custom_meal,
        updated_at = NOW()
      RETURNING *
    `;
    
    if (!entry) {
      throw APIError.internal("failed to set meal");
    }
    
    // Get recipe if recipe_id is set
    let recipe: Recipe | undefined;
    if (entry.recipe_id) {
      recipe = await mealsDB.queryRow<Recipe>`
        SELECT * FROM recipes
        WHERE id = ${entry.recipe_id} AND user_id = ${auth.userID}
      ` || undefined;
    }
    
    const entryWithRecipe: MealPlanEntryWithRecipe = {
      ...entry,
      recipe
    };
    
    return { entry: entryWithRecipe };
  }
);

// Removes a meal from a specific day and meal type.
export const removeMeal = api<SetMealRequest, void>(
  { auth: true, expose: true, method: "DELETE", path: "/meal-plans/meals" },
  async (req) => {
    const auth = getAuthData()!;
    const weekDate = new Date(req.week_of);
    
    await mealsDB.exec`
      DELETE FROM meal_plan_entries
      WHERE meal_plan_id IN (
        SELECT id FROM meal_plans
        WHERE week_of = ${weekDate} AND user_id = ${auth.userID}
      )
      AND day_of_week = ${req.day_of_week}
      AND meal_type = ${req.meal_type}
    `;
  }
);

// Gets all ingredients needed for a week's meal plan.
export const getWeekIngredients = api<GetWeekIngredientsRequest, GetWeekIngredientsResponse>(
  { auth: true, expose: true, method: "GET", path: "/meal-plans/ingredients" },
  async (req) => {
    const auth = getAuthData()!;
    const weekDate = new Date(req.week_of);
    
    const ingredients = await mealsDB.queryAll<{ name: string; quantity: string }>`
      SELECT DISTINCT ri.name, ri.quantity
      FROM recipe_ingredients ri
      JOIN recipes r ON ri.recipe_id = r.id
      JOIN meal_plan_entries mpe ON mpe.recipe_id = r.id
      JOIN meal_plans mp ON mpe.meal_plan_id = mp.id
      WHERE mp.week_of = ${weekDate} AND mp.user_id = ${auth.userID}
      ORDER BY ri.name ASC
    `;
    
    const ingredientStrings = ingredients.map(ing => `${ing.name} (${ing.quantity})`);
    
    return { ingredients: ingredientStrings };
  }
);
