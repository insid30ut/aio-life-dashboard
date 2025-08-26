import { api, APIError } from "encore.dev/api";
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
  { expose: true, method: "GET", path: "/meal-plans" },
  async (req) => {
    const weekDate = new Date(req.week_of);

    // First, ensure a meal plan exists for the week, creating it if necessary.
    let mealPlan = await mealsDB.queryRow<MealPlan>`
      INSERT INTO meal_plans (week_of, user_id)
      VALUES (${weekDate}, ${'anonymous'})
      ON CONFLICT (week_of, user_id) DO UPDATE
      SET week_of = EXCLUDED.week_of -- This is a no-op to ensure RETURNING works
      RETURNING *
    `;

    if (!mealPlan) {
      // This should ideally not be reached due to the ON CONFLICT clause.
      throw APIError.internal("failed to get or create meal plan");
    }

    // Now, fetch the meal plan and all its entries in a single query.
    const rows = await mealsDB.queryAll<{
      mp_id: number;
      mp_week_of: Date;
      mp_user_id: string;
      mp_created_at: Date;
      mp_updated_at: Date;
      entry_id: number | null;
      entry_day_of_week: number | null;
      entry_meal_type: 'breakfast' | 'lunch' | 'dinner' | null;
      entry_recipe_id: number | null;
      entry_custom_meal: string | null;
      entry_created_at: Date | null;
      entry_updated_at: Date | null;
    }>`
      SELECT
        mp.id as mp_id,
        mp.week_of as mp_week_of,
        mp.user_id as mp_user_id,
        mp.created_at as mp_created_at,
        mp.updated_at as mp_updated_at,
        mpe.id as entry_id,
        mpe.day_of_week as entry_day_of_week,
        mpe.meal_type as entry_meal_type,
        mpe.recipe_id as entry_recipe_id,
        mpe.custom_meal as entry_custom_meal,
        mpe.created_at as entry_created_at,
        mpe.updated_at as entry_updated_at
      FROM
        meal_plans mp
      LEFT JOIN
        meal_plan_entries mpe ON mp.id = mpe.meal_plan_id
      WHERE
        mp.id = ${mealPlan.id}
      ORDER BY
        mpe.day_of_week ASC, mpe.meal_type ASC
    `;

    const mealPlanWithEntries: MealPlanWithEntries = {
      ...mealPlan,
      entries: []
    };

    for (const row of rows) {
      if (row.entry_id) {
        mealPlanWithEntries.entries.push({
          id: row.entry_id,
          meal_plan_id: row.mp_id,
          day_of_week: row.entry_day_of_week!,
          meal_type: row.entry_meal_type!,
          recipe_id: row.entry_recipe_id,
          custom_meal: row.entry_custom_meal,
          created_at: row.entry_created_at!,
          updated_at: row.entry_updated_at!,
        });
      }
    }
    
    return { meal_plan: mealPlanWithEntries };
  }
);

// Sets a meal for a specific day and meal type.
export const setMeal = api<SetMealRequest, SetMealResponse>(
  { expose: true, method: "POST", path: "/meal-plans/meals" },
  async (req) => {
    const weekDate = new Date(req.week_of);
    
    // Get or create meal plan
    const mealPlan = await mealsDB.queryRow<MealPlan>`
      INSERT INTO meal_plans (week_of, user_id)
      VALUES (${weekDate}, ${'anonymous'})
      ON CONFLICT (week_of, user_id) DO UPDATE
      SET week_of = EXCLUDED.week_of
      RETURNING *
    `;
    
    if (!mealPlan) {
      throw APIError.internal("failed to get or create meal plan");
    }
    
    // Upsert the meal entry and join with the recipe table to get all data in one go.
    const entryWithRecipe = await mealsDB.queryRow<MealPlanEntry & { recipe?: Recipe }>`
      WITH entry AS (
        INSERT INTO meal_plan_entries (meal_plan_id, day_of_week, meal_type, recipe_id, custom_meal)
        VALUES (${mealPlan.id}, ${req.day_of_week}, ${req.meal_type}, ${req.recipe_id || null}, ${req.custom_meal || null})
        ON CONFLICT (meal_plan_id, day_of_week, meal_type)
        DO UPDATE SET
          recipe_id = EXCLUDED.recipe_id,
          custom_meal = EXCLUDED.custom_meal,
          updated_at = NOW()
        RETURNING *
      )
      SELECT
        e.*,
        row_to_json(r) as recipe
      FROM entry e
      LEFT JOIN recipes r ON e.recipe_id = r.id
    `;
    
    if (!entryWithRecipe) {
      throw APIError.internal("failed to set meal");
    }

    if (entryWithRecipe.recipe && (entryWithRecipe.recipe as any).id === null) {
      entryWithRecipe.recipe = undefined;
    }
    
    return { entry: entryWithRecipe };
  }
);

// Removes a meal from a specific day and meal type.
export const removeMeal = api<SetMealRequest, void>(
  { expose: true, method: "DELETE", path: "/meal-plans/meals" },
  async (req) => {
    const weekDate = new Date(req.week_of);
    
    await mealsDB.exec`
      DELETE FROM meal_plan_entries
      WHERE meal_plan_id IN (
        SELECT id FROM meal_plans
        WHERE week_of = ${weekDate} AND user_id = ${'anonymous'}
      )
      AND day_of_week = ${req.day_of_week}
      AND meal_type = ${req.meal_type}
    `;
  }
);

// Gets all ingredients needed for a week's meal plan.
export const getWeekIngredients = api<GetWeekIngredientsRequest, GetWeekIngredientsResponse>(
  { expose: true, method: "GET", path: "/meal-plans/ingredients" },
  async (req) => {
    const weekDate = new Date(req.week_of);
    
    const ingredients = await mealsDB.queryAll<{ name: string; quantity: string }>`
      SELECT DISTINCT ri.name, ri.quantity
      FROM recipe_ingredients ri
      JOIN recipes r ON ri.recipe_id = r.id
      JOIN meal_plan_entries mpe ON mpe.recipe_id = r.id
      JOIN meal_plans mp ON mpe.meal_plan_id = mp.id
      WHERE mp.week_of = ${weekDate} AND mp.user_id = ${'anonymous'}
      ORDER BY ri.name ASC
    `;
    
    const ingredientStrings = ingredients.map(ing => `${ing.name} (${ing.quantity})`);
    
    return { ingredients: ingredientStrings };
  }
);
