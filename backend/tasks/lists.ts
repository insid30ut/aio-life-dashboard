import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { tasksDB } from "./db";
import type { List } from "./types";

export interface CreateListRequest {
  title: string;
  board_id: number;
}

export interface CreateListResponse {
  list: List;
}

export interface UpdateListRequest {
  id: number;
  title?: string;
  position?: number;
}

export interface UpdateListResponse {
  list: List;
}

// Creates a new list in a board.
export const createList = api<CreateListRequest, CreateListResponse>(
  { auth: true, expose: true, method: "POST", path: "/lists" },
  async (req) => {
    // Get the next position
    const maxPosition = await tasksDB.queryRow<{ max_position: number | null }>`
      SELECT MAX(position) as max_position FROM lists
      WHERE board_id = ${req.board_id}
    `;
    
    const position = (maxPosition?.max_position || 0) + 1;
    
    const list = await tasksDB.queryRow<List>`
      INSERT INTO lists (title, position, board_id)
      VALUES (${req.title}, ${position}, ${req.board_id})
      RETURNING *
    `;
    
    if (!list) {
      throw APIError.internal("failed to create list");
    }
    
    return { list };
  }
);

// Updates a list.
export const updateList = api<UpdateListRequest, UpdateListResponse>(
  { auth: true, expose: true, method: "PUT", path: "/lists/:id" },
  async (req) => {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (req.title !== undefined) {
      updates.push(`title = $${values.length + 1}`);
      values.push(req.title);
    }
    
    if (req.position !== undefined) {
      updates.push(`position = $${values.length + 1}`);
      values.push(req.position);
    }
    
    updates.push(`updated_at = NOW()`);
    
    if (updates.length === 1) { // Only updated_at
      throw APIError.invalidArgument("no fields to update");
    }
    
    const query = `
      UPDATE lists 
      SET ${updates.join(', ')}
      WHERE id = $${values.length + 1}
      RETURNING *
    `;
    values.push(req.id);
    
    const list = await tasksDB.rawQueryRow<List>(query, ...values);
    
    if (!list) {
      throw APIError.notFound("list not found");
    }
    
    return { list };
  }
);

// Deletes a list.
export const deleteList = api<{ id: number }, void>(
  { auth: true, expose: true, method: "DELETE", path: "/lists/:id" },
  async (req) => {
    await tasksDB.exec`DELETE FROM lists WHERE id = ${req.id}`;
  }
);
