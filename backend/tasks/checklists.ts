import { api, APIError } from "encore.dev/api";
import { tasksDB } from "./db";
import type { Checklist, ChecklistItem, ChecklistWithItems } from "./types";
import type { AuthPayload } from "~backend/auth/auth";

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

const userOwnsCard = async (userID: string, cardID: number): Promise<boolean> => {
    const card = await tasksDB.queryRow`
        SELECT id FROM cards WHERE id = ${cardID}
        AND list_id IN (SELECT id FROM lists WHERE board_id IN (
            SELECT id FROM boards WHERE user_id = ${userID}
        ))
    `;
    return !!card;
};

const userOwnsChecklist = async (userID: string, checklistID: number): Promise<boolean> => {
    const checklist = await tasksDB.queryRow`
        SELECT id FROM checklists WHERE id = ${checklistID}
        AND card_id IN (
            SELECT id FROM cards WHERE list_id IN (
                SELECT id FROM lists WHERE board_id IN (
                    SELECT id FROM boards WHERE user_id = ${userID}
                )
            )
        )
    `;
    return !!checklist;
}

// Creates a new checklist for a card.
export const createChecklist = api<CreateChecklistRequest, CreateChecklistResponse>(
  { expose: true, method: "POST", path: "/checklists", auth: true },
  async ({ auth, ...req }: { auth: AuthPayload } & CreateChecklistRequest) => {
    if (!await userOwnsCard(auth.userID, req.card_id)) {
        throw APIError.notFound("card not found");
    }

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
    
    return { checklist: { ...checklist, items: [] } };
  }
);

// Updates a checklist.
export const updateChecklist = api<UpdateChecklistRequest, UpdateChecklistResponse>(
  { expose: true, method: "PUT", path: "/checklists/:id", auth: true },
  async ({ auth, ...req }: { auth: AuthPayload } & UpdateChecklistRequest) => {
    if (!await userOwnsChecklist(auth.userID, req.id)) {
        throw APIError.notFound("checklist not found");
    }

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
    
    if (updates.length === 1) {
      throw APIError.invalidArgument("no fields to update");
    }
    
    const query = `UPDATE checklists SET ${updates.join(', ')} WHERE id = $${values.length + 1} RETURNING *`;
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
  { expose: true, method: "DELETE", path: "/checklists/:id", auth: true },
  async ({ auth, id }: { auth: AuthPayload; id: number }) => {
    await tasksDB.exec`
        DELETE FROM checklists WHERE id = ${id}
        AND card_id IN (
            SELECT id FROM cards WHERE list_id IN (
                SELECT id FROM lists WHERE board_id IN (
                    SELECT id FROM boards WHERE user_id = ${auth.userID}
                )
            )
        )
    `;
  }
);

// Creates a new checklist item.
export const createChecklistItem = api<CreateChecklistItemRequest, CreateChecklistItemResponse>(
  { expose: true, method: "POST", path: "/checklist-items", auth: true },
  async ({ auth, ...req }: { auth: AuthPayload } & CreateChecklistItemRequest) => {
    if (!await userOwnsChecklist(auth.userID, req.checklist_id)) {
        throw APIError.notFound("checklist not found");
    }

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
  { expose: true, method: "PUT", path: "/checklist-items/:id", auth: true },
  async ({ auth, ...req }: { auth: AuthPayload } & UpdateChecklistItemRequest) => {
    const item = await tasksDB.queryRow`
        SELECT id FROM checklist_items WHERE id = ${req.id}
        AND checklist_id IN (
            SELECT id FROM checklists WHERE card_id IN (
                SELECT id FROM cards WHERE list_id IN (
                    SELECT id FROM lists WHERE board_id IN (
                        SELECT id FROM boards WHERE user_id = ${auth.userID}
                    )
                )
            )
        )
    `;
    if (!item) {
        throw APIError.notFound("checklist item not found");
    }

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
    
    if (updates.length === 1) {
      throw APIError.invalidArgument("no fields to update");
    }
    
    const query = `UPDATE checklist_items SET ${updates.join(', ')} WHERE id = $${values.length + 1} RETURNING *`;
    values.push(req.id);
    
    const updatedItem = await tasksDB.rawQueryRow<ChecklistItem>(query, ...values);
    
    if (!updatedItem) {
      throw APIError.notFound("checklist item not found");
    }
    
    return { item: updatedItem };
  }
);

// Deletes a checklist item.
export const deleteChecklistItem = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/checklist-items/:id", auth: true },
  async ({ auth, id }: { auth: AuthPayload; id: number }) => {
    await tasksDB.exec`
        DELETE FROM checklist_items WHERE id = ${id}
        AND checklist_id IN (
            SELECT id FROM checklists WHERE card_id IN (
                SELECT id FROM cards WHERE list_id IN (
                    SELECT id FROM lists WHERE board_id IN (
                        SELECT id FROM boards WHERE user_id = ${auth.userID}
                    )
                )
            )
        )
    `;
  }
);
