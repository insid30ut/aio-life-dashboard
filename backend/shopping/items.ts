import { api, APIError } from "encore.dev/api";
import { shoppingDB } from "./db";
import type { ShoppingItem } from "./types";
import type { AuthPayload } from "~backend/auth/auth";

export interface CreateItemRequest {
  name: string;
  list_id: number;
}

export interface CreateItemResponse {
  item: ShoppingItem;
}

export interface UpdateItemRequest {
  id: number;
  name?: string;
  is_checked?: boolean;
  position?: number;
}

export interface UpdateItemResponse {
  item: ShoppingItem;
}

export interface AddItemsRequest {
  list_id: number;
  items: string[];
}

export interface AddItemsResponse {
  items: ShoppingItem[];
}

// Creates a new shopping item.
export const createItem = api<CreateItemRequest, CreateItemResponse>(
  { expose: true, method: "POST", path: "/shopping/items", auth: true },
  async ({ auth, ...req }: { auth: AuthPayload } & CreateItemRequest) => {
    // Verify the list belongs to the user
    const list = await shoppingDB.queryRow<{ id: number }>`
      SELECT id FROM shopping_lists
      WHERE id = ${req.list_id} AND user_id = ${auth.userID}
    `;
    
    if (!list) {
      throw APIError.notFound("shopping list not found");
    }
    
    // Get the next position
    const maxPosition = await shoppingDB.queryRow<{ max_position: number | null }>`
      SELECT MAX(position) as max_position FROM shopping_items
      WHERE list_id = ${req.list_id}
    `;
    
    const position = (maxPosition?.max_position || 0) + 1;
    
    const item = await shoppingDB.queryRow<ShoppingItem>`
      INSERT INTO shopping_items (name, list_id, position)
      VALUES (${req.name}, ${req.list_id}, ${position})
      RETURNING *
    `;
    
    if (!item) {
      throw APIError.internal("failed to create shopping item");
    }
    
    return { item };
  }
);

// Updates a shopping item.
export const updateItem = api<UpdateItemRequest, UpdateItemResponse>(
  { expose: true, method: "PUT", path: "/shopping/items/:id", auth: true },
  async ({ auth, ...req }: { auth: AuthPayload } & UpdateItemRequest) => {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (req.name !== undefined) {
      updates.push(`name = $${values.length + 1}`);
      values.push(req.name);
    }
    
    if (req.is_checked !== undefined) {
      updates.push(`is_checked = $${values.length + 1}`);
      values.push(req.is_checked);
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
      UPDATE shopping_items 
      SET ${updates.join(', ')}
      WHERE id = $${values.length + 1}
        AND list_id IN (
          SELECT id FROM shopping_lists WHERE user_id = $${values.length + 2}
        )
      RETURNING *
    `;
    values.push(req.id, auth.userID);
    
    const item = await shoppingDB.rawQueryRow<ShoppingItem>(query, ...values);
    
    if (!item) {
      throw APIError.notFound("shopping item not found");
    }
    
    return { item };
  }
);

// Deletes a shopping item.
export const deleteItem = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/shopping/items/:id", auth: true },
  async ({ auth, id }: { auth: AuthPayload; id: number }) => {
    await shoppingDB.exec`
      DELETE FROM shopping_items
      WHERE id = ${id}
        AND list_id IN (
          SELECT id FROM shopping_lists WHERE user_id = ${auth.userID}
        )
    `;
  }
);

// Adds multiple items to a shopping list.
export const addItems = api<AddItemsRequest, AddItemsResponse>(
  { expose: true, method: "POST", path: "/shopping/lists/:list_id/items/bulk", auth: true },
  async ({ auth, ...req }: { auth: AuthPayload } & AddItemsRequest) => {
    // Verify the list belongs to the user
    const list = await shoppingDB.queryRow<{ id: number }>`
      SELECT id FROM shopping_lists
      WHERE id = ${req.list_id} AND user_id = ${auth.userID}
    `;
    
    if (!list) {
      throw APIError.notFound("shopping list not found");
    }
    
    // Get the current max position
    const maxPosition = await shoppingDB.queryRow<{ max_position: number | null }>`
      SELECT MAX(position) as max_position FROM shopping_items
      WHERE list_id = ${req.list_id}
    `;
    
    let position = (maxPosition?.max_position || 0) + 1;
    const items: ShoppingItem[] = [];
    
    for (const itemName of req.items) {
      const item = await shoppingDB.queryRow<ShoppingItem>`
        INSERT INTO shopping_items (name, list_id, position)
        VALUES (${itemName}, ${req.list_id}, ${position})
        RETURNING *
      `;
      
      if (item) {
        items.push(item);
        position++;
      }
    }
    
    return { items };
  }
);

// Unchecks all items in a shopping list.
export const uncheckAllItems = api<{ list_id: number }, void>(
  { expose: true, method: "POST", path: "/shopping/lists/:list_id/uncheck-all", auth: true },
  async ({ auth, ...req }: { auth: AuthPayload } & { list_id: number }) => {
    // Verify the list belongs to the user
    const list = await shoppingDB.queryRow<{ id: number }>`
      SELECT id FROM shopping_lists
      WHERE id = ${req.list_id} AND user_id = ${auth.userID}
    `;
    
    if (!list) {
      throw APIError.notFound("shopping list not found");
    }
    
    await shoppingDB.exec`
      UPDATE shopping_items
      SET is_checked = FALSE, updated_at = NOW()
      WHERE list_id = ${req.list_id}
    `;
  }
);
