import { api, APIError } from "encore.dev/api";
import { budgetDB } from "./db";
import type { Category } from "./types";

export interface CreateCategoryRequest {
  name: string;
  type: 'income' | 'expense';
}

export interface CreateCategoryResponse {
  category: Category;
}

export interface GetCategoriesResponse {
  categories: Category[];
}

export interface UpdateCategoryRequest {
  id: number;
  name?: string;
  type?: 'income' | 'expense';
}

export interface UpdateCategoryResponse {
  category: Category;
}

// Creates a new budget category.
export const createCategory = api<CreateCategoryRequest, CreateCategoryResponse>(
  { expose: true, method: "POST", path: "/budget/categories" },
  async (req) => {
    const category = await budgetDB.queryRow<Category>`
      INSERT INTO categories (name, type, user_id)
      VALUES (${req.name}, ${req.type}, ${'anonymous'})
      RETURNING *
    `;
    
    if (!category) {
      throw APIError.internal("failed to create category");
    }
    
    return { category };
  }
);

// Gets all budget categories for the current user.
export const getCategories = api<void, GetCategoriesResponse>(
  { expose: true, method: "GET", path: "/budget/categories" },
  async () => {
    const categories = await budgetDB.queryAll<Category>`
      SELECT * FROM categories
      WHERE user_id = ${'anonymous'}
      ORDER BY name ASC
    `;
    
    return { categories };
  }
);

// Updates a budget category.
export const updateCategory = api<UpdateCategoryRequest, UpdateCategoryResponse>(
  { expose: true, method: "PUT", path: "/budget/categories/:id" },
  async (req) => {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (req.name !== undefined) {
      updates.push(`name = $${values.length + 1}`);
      values.push(req.name);
    }
    
    if (req.type !== undefined) {
      updates.push(`type = $${values.length + 1}`);
      values.push(req.type);
    }
    
    updates.push(`updated_at = NOW()`);
    
    if (updates.length === 1) { // Only updated_at
      throw APIError.invalidArgument("no fields to update");
    }
    
    const query = `
      UPDATE categories 
      SET ${updates.join(', ')}
      WHERE id = $${values.length + 1} AND user_id = $${values.length + 2}
      RETURNING *
    `;
    values.push(req.id, 'anonymous');
    
    const category = await budgetDB.rawQueryRow<Category>(query, ...values);
    
    if (!category) {
      throw APIError.notFound("category not found");
    }
    
    return { category };
  }
);

// Deletes a budget category.
export const deleteCategory = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/budget/categories/:id" },
  async (req) => {
    await budgetDB.exec`
      DELETE FROM categories
      WHERE id = ${req.id} AND user_id = ${'anonymous'}
    `;
  }
);
