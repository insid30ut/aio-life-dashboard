import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { tasksDB } from "./db";
import type { Checklist, ChecklistItem, ChecklistWithItems } from "./types";

export interface CreateChecklistRequest {
  title: string;
  card_id: number;
}

export interface CreateChecklistResponse {
  checklist: ChecklistWithItems;
}

export interface UpdateChecklistRequest {
  id: number;
  title?: string;
  position?: number;
}

export interface UpdateChecklistResponse {
  checklist: Checklist;
}

export interface CreateChecklistItemRequest {
  title: string;
  checklist_id: number;
}

export interface CreateChecklistItemResponse {
  item: ChecklistItem;
}

export interface UpdateChecklistItemRequest {
  id: number;
  title?: string;
  completed?: boolean;
  position?: number;
}

export interface UpdateChecklistItemResponse {
  item: ChecklistItem;
}

// Creates a new checklist for a card.
export const createChecklist = api<CreateChecklistRequest, CreateChecklistResponse>(
  { auth: true, expose: true, method: "POST", path: "/checklists" },
  async (req) => {
    // Get the next position
    const maxPosition = await tasksDB.queryRow<{ max_position: number | null }>`
      SELECT MAX(position) as max_position FROM checklists
      WHERE card_id = ${req.card_id}
    `;
    
    const position = (maxPosition?.max_position || 0) + 1;
    
    const checklist = await tasksDB.queryRow<Checklist>`
      INSERT INTO checklists (title, card_id, position)
      VALUES (${req.title}, ${req.card_id}, ${position})
      RETURNING *
    `;
    
    if (!checklist) {
      throw APIError.internal("failed to create checklist");
    }
    
    const checklistWithItems: ChecklistWithItems = {
      ...checklist,
      items: []
    };
    
    return { checklist: checklistWithItems };
  }
);

// Updates a checklist.
export const updateChecklist = api<UpdateChecklistRequest, UpdateChecklistResponse>(
  { auth: true, expose: true, method: "PUT", path: "/checklists/:id" },
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
      UPDATE checklists 
      SET ${updates.join(', ')}
      WHERE id = $${values.length + 1}
      RETURNING *
    `;
    values.push(req.id);
    
    const checklist = await tasksDB.rawQueryRow<Checklist>(query, ...values);
    
    if (!checklist) {
      throw APIError.notFound("checklist not found");
    }
    
    return { checklist };
  }
);

// Deletes a checklist.
export const deleteChecklist = api<{ id: number }, void>(
  { auth: true, expose: true, method: "DELETE", path: "/checklists/:id" },
  async (req) => {
    await tasksDB.exec`DELETE FROM checklists WHERE id = ${req.id}`;
  }
);

// Creates a new checklist item.
export const createChecklistItem = api<CreateChecklistItemRequest, CreateChecklistItemResponse>(
  { auth: true, expose: true, method: "POST", path: "/checklist-items" },
  async (req) => {
    // Get the next position
    const maxPosition = await tasksDB.queryRow<{ max_position: number | null }>`
      SELECT MAX(position) as max_position FROM checklist_items
      WHERE checklist_id = ${req.checklist_id}
    `;
    
    const position = (maxPosition?.max_position || 0) + 1;
    
    const item = await tasksDB.queryRow<ChecklistItem>`
      INSERT INTO checklist_items (title, checklist_id, position)
      VALUES (${req.title}, ${req.checklist_id}, ${position})
      RETURNING *
    `;
    
    if (!item) {
      throw APIError.internal("failed to create checklist item");
    }
    
    return { item };
  }
);

// Updates a checklist item.
export const updateChecklistItem = api<UpdateChecklistItemRequest, UpdateChecklistItemResponse>(
  { auth: true, expose: true, method: "PUT", path: "/checklist-items/:id" },
  async (req) => {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (req.title !== undefined) {
      updates.push(`title = $${values.length + 1}`);
      values.push(req.title);
    }
    
    if (req.completed !== undefined) {
      updates.push(`completed = $${values.length + 1}`);
      values.push(req.completed);
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
      UPDATE checklist_items 
      SET ${updates.join(', ')}
      WHERE id = $${values.length + 1}
      RETURNING *
    `;
    values.push(req.id);
    
    const item = await tasksDB.rawQueryRow<ChecklistItem>(query, ...values);
    
    if (!item) {
      throw APIError.notFound("checklist item not found");
    }
    
    return { item };
  }
);

// Deletes a checklist item.
export const deleteChecklistItem = api<{ id: number }, void>(
  { auth: true, expose: true, method: "DELETE", path: "/checklist-items/:id" },
  async (req) => {
    await tasksDB.exec`DELETE FROM checklist_items WHERE id = ${req.id}`;
  }
);
