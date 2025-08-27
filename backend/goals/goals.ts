import { api, APIError } from "encore.dev/api";
import { goalsDB } from "./db";
import type { Goal } from "./types";
import type { AuthPayload } from "~backend/auth/auth";

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
  { expose: true, method: "POST", path: "/goals", auth: true },
  async ({ auth, ...req }: { auth: AuthPayload } & CreateGoalRequest) => {
    const goal = await goalsDB.queryRow<Goal>`
      INSERT INTO goals (title, description, target_value, unit, target_date, user_id)
      VALUES (${req.title}, ${req.description || null}, ${req.target_value}, ${req.unit}, ${req.target_date}, ${auth.userID})
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
  { expose: true, method: "GET", path: "/goals", auth: true },
  async ({ auth }: { auth: AuthPayload }) => {
    const goals = await goalsDB.queryAll<Goal>`
      SELECT * FROM goals
      WHERE user_id = ${auth.userID}
      ORDER BY target_date ASC, created_at DESC
    `;
    
    return { goals };
  }
);

// Gets a specific goal.
export const getGoal = api<{ id: number }, { goal: Goal }>(
  { expose: true, method: "GET", path: "/goals/:id", auth: true },
  async ({ auth, id }: { auth: AuthPayload; id: number }) => {
    const goal = await goalsDB.queryRow<Goal>`
      SELECT * FROM goals
      WHERE id = ${id} AND user_id = ${auth.userID}
    `;
    
    if (!goal) {
      throw APIError.notFound("goal not found");
    }
    
    return { goal };
  }
);

// Updates a goal.
export const updateGoal = api<UpdateGoalRequest, UpdateGoalResponse>(
  { expose: true, method: "PUT", path: "/goals/:id", auth: true },
  async ({ auth, ...req }: { auth: AuthPayload } & UpdateGoalRequest) => {
    const updates: string[] = [];
    const values: any[] = [];
    
    // Build the SET clauses dynamically
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
    if (req.unit !== undefined) {
      updates.push(`unit = $${values.length + 1}`);
      values.push(req.unit);
    }
    if (req.target_date !== undefined) {
      updates.push(`target_date = $${values.length + 1}`);
      values.push(req.target_date);
    }
    
    // Handle current_value and status update together
    if (req.current_value !== undefined) {
      updates.push(`current_value = $${values.length + 1}`);
      values.push(req.current_value);
      // Use a CASE statement to conditionally update the status in the same query
      updates.push(`status = CASE WHEN $${values.length} >= target_value THEN 'completed' ELSE status END`);
    } else if (req.status !== undefined) {
      // If only status is provided, update it directly
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
    values.push(req.id, auth.userID);
    
    const goal = await goalsDB.rawQueryRow<Goal>(query, ...values);
    
    if (!goal) {
      throw APIError.notFound("goal not found");
    }
    
    return { goal };
  }
);

// Deletes a goal.
export const deleteGoal = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/goals/:id", auth: true },
  async ({ auth, id }: { auth: AuthPayload; id: number }) => {
    await goalsDB.exec`
      DELETE FROM goals
      WHERE id = ${id} AND user_id = ${auth.userID}
    `;
  }
);
