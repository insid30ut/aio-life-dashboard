import { api, APIError } from "encore.dev/api";
import { tasksDB } from "./db";
import type { List } from "./types";
import type { AuthPayload } from "~backend/auth/auth";

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
  { expose: true, method: "POST", path: "/lists", auth: true },
  async ({ auth, ...req }: { auth: AuthPayload } & CreateListRequest) => {
    // Verify the user owns the board they are creating a list in.
    const board = await tasksDB.queryRow`
        SELECT id FROM boards WHERE id = ${req.board_id} AND user_id = ${auth.userID}
    `;
    if (!board) {
        throw APIError.notFound("board not found");
    }

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
  { expose: true, method: "PUT", path: "/lists/:id", auth: true },
  async ({ auth, ...req }: { auth: AuthPayload } & UpdateListRequest) => {
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
        AND board_id IN (SELECT id FROM boards WHERE user_id = $${values.length + 2})
      RETURNING *
    `;
    values.push(req.id, auth.userID);
    
    const list = await tasksDB.rawQueryRow<List>(query, ...values);
    
    if (!list) {
      throw APIError.notFound("list not found");
    }
    
    return { list };
  }
);

// Deletes a list.
export const deleteList = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/lists/:id", auth: true },
  async ({ auth, id }: { auth: AuthPayload; id: number }) => {
    await tasksDB.exec`
        DELETE FROM lists
        WHERE id = ${id}
        AND board_id IN (SELECT id FROM boards WHERE user_id = ${auth.userID})
    `;
  }
);
