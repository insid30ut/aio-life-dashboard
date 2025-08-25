import { api, APIError } from "encore.dev/api";
import { goalsDB } from "./db";
import type { Goal } from "./types";

export interface CreateGoalRequest {
  title: string;
  description?: string;
  target_value: number;
  unit: string;
  target_date: string;
}

export interface CreateGoalResponse {
  goal: Goal;
}

export interface GetGoalsResponse {
  goals: Goal[];
}

export interface UpdateGoalRequest {
  id: number;
  title?: string;
  description?: string;
  target_value?: number;
  current_value?: number;
  unit?: string;
  target_date?: string;
  status?: 'active' | 'completed' | 'paused';
}

export interface UpdateGoalResponse {
  goal: Goal;
}

// Creates a new goal.
export const createGoal = api<CreateGoalRequest, CreateGoalResponse>(
  { expose: true, method: "POST", path: "/goals" },
  async (req) => {
    const goal = await goalsDB.queryRow<Goal>`
      INSERT INTO goals (title, description, target_value, unit, target_date, user_id)
      VALUES (${req.title}, ${req.description || null}, ${req.target_value}, ${req.unit}, ${req.target_date}, ${'anonymous'})
      RETURNING *
    `;
    
    if (!goal) {
      throw APIError.internal("failed to create goal");
    }
    
    return { goal };
  }
);

// Gets all goals for the current user.
export const getGoals = api<void, GetGoalsResponse>(
  { expose: true, method: "GET", path: "/goals" },
  async () => {
    const goals = await goalsDB.queryAll<Goal>`
      SELECT * FROM goals
      WHERE user_id = ${'anonymous'}
      ORDER BY target_date ASC, created_at DESC
    `;
    
    return { goals };
  }
);

// Gets a specific goal.
export const getGoal = api<{ id: number }, { goal: Goal }>(
  { expose: true, method: "GET", path: "/goals/:id" },
  async (req) => {
    const goal = await goalsDB.queryRow<Goal>`
      SELECT * FROM goals
      WHERE id = ${req.id} AND user_id = ${'anonymous'}
    `;
    
    if (!goal) {
      throw APIError.notFound("goal not found");
    }
    
    return { goal };
  }
);

// Updates a goal.
export const updateGoal = api<UpdateGoalRequest, UpdateGoalResponse>(
  { expose: true, method: "PUT", path: "/goals/:id" },
  async (req) => {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (req.title !== undefined) {
      updates.push(`title = $${values.length + 1}`);
      values.push(req.title);
    }
    
    if (req.description !== undefined) {
      updates.push(`description = $${values.length + 1}`);
      values.push(req.description);
    }
    
    if (req.target_value !== undefined) {
      updates.push(`target_value = $${values.length + 1}`);
      values.push(req.target_value);
    }
    
    if (req.current_value !== undefined) {
      updates.push(`current_value = $${values.length + 1}`);
      values.push(req.current_value);
      
      // Auto-complete goal if current_value reaches target_value
      const goal = await goalsDB.queryRow<Goal>`
        SELECT target_value FROM goals 
        WHERE id = ${req.id} AND user_id = ${'anonymous'}
      `;
      
      if (goal && req.current_value >= goal.target_value) {
        updates.push(`status = $${values.length + 1}`);
        values.push('completed');
      }
    }
    
    if (req.unit !== undefined) {
      updates.push(`unit = $${values.length + 1}`);
      values.push(req.unit);
    }
    
    if (req.target_date !== undefined) {
      updates.push(`target_date = $${values.length + 1}`);
      values.push(req.target_date);
    }
    
    if (req.status !== undefined) {
      updates.push(`status = $${values.length + 1}`);
      values.push(req.status);
    }
    
    updates.push(`updated_at = NOW()`);
    
    if (updates.length === 1) { // Only updated_at
      throw APIError.invalidArgument("no fields to update");
    }
    
    const query = `
      UPDATE goals 
      SET ${updates.join(', ')}
      WHERE id = $${values.length + 1} AND user_id = $${values.length + 2}
      RETURNING *
    `;
    values.push(req.id, 'anonymous');
    
    const goal = await goalsDB.rawQueryRow<Goal>(query, ...values);
    
    if (!goal) {
      throw APIError.notFound("goal not found");
    }
    
    return { goal };
  }
);

// Deletes a goal.
export const deleteGoal = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/goals/:id" },
  async (req) => {
    await goalsDB.exec`
      DELETE FROM goals
      WHERE id = ${req.id} AND user_id = ${'anonymous'}
    `;
  }
);
