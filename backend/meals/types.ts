export interface Recipe {
  id: number;
  name: string;
  instructions: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface RecipeIngredient {
  id: number;
  name: string;
  quantity: string;
  recipe_id: number;
  position: number;
  created_at: Date;
}

export interface RecipeWithIngredients extends Recipe {
  ingredients: RecipeIngredient[];
}

export interface MealPlan {
  id: number;
  week_of: Date;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface MealPlanEntry {
  id: number;
  meal_plan_id: number;
  day_of_week: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  recipe_id: number | null;
  custom_meal: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface MealPlanWithEntries extends MealPlan {
  entries: MealPlanEntry[];
}

export interface MealPlanEntryWithRecipe extends MealPlanEntry {
  recipe?: Recipe;
}
