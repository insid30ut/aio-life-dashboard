import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { shoppingDB } from "./db";
import type { ShoppingList, ShoppingListWithItems, ShoppingItem } from "./types";

export interface CreateListRequest {
  title: string;
}

export interface CreateListResponse {
  list: ShoppingList;
}

export interface GetListsResponse {
  lists: ShoppingList[];
}

export interface GetListResponse {
  list: ShoppingListWithItems;
}

export interface UpdateListRequest {
  id: number;
  title: string;
}

export interface UpdateListResponse {
  list: ShoppingList;
}

// Creates a new shopping list.
export const createList = api<CreateListRequest, CreateListResponse>(
  { auth: true, expose: true, method: "POST", path: "/shopping/lists" },
  async (req) => {
    const auth = getAuthData()!;
    
    const list = await shoppingDB.queryRow<ShoppingList>`
      INSERT INTO shopping_lists (title, user_id)
      VALUES (${req.title}, ${auth.userID})
      RETURNING *
    `;
    
    if (!list) {
      throw APIError.internal("failed to create shopping list");
    }
    
    return { list };
  }
);

// Gets all shopping lists for the current user.
export const getLists = api<void, GetListsResponse>(
  { auth: true, expose: true, method: "GET", path: "/shopping/lists" },
  async () => {
    const auth = getAuthData()!;
    
    const lists = await shoppingDB.queryAll<ShoppingList>`
      SELECT * FROM shopping_lists
      WHERE user_id = ${auth.userID}
      ORDER BY updated_at DESC
    `;
    
    return { lists };
  }
);

// Gets a specific shopping list with all its items.
export const getList = api<{ id: number }, GetListResponse>(
  { auth: true, expose: true, method: "GET", path: "/shopping/lists/:id" },
  async (req) => {
    const auth = getAuthData()!;
    
    const list = await shoppingDB.queryRow<ShoppingList>`
      SELECT * FROM shopping_lists
      WHERE id = ${req.id} AND user_id = ${auth.userID}
    `;
    
    if (!list) {
      throw APIError.notFound("shopping list not found");
    }
    
    const items = await shoppingDB.queryAll<ShoppingItem>`
      SELECT * FROM shopping_items
      WHERE list_id = ${req.id}
      ORDER BY position ASC
    `;
    
    const listWithItems: ShoppingListWithItems = {
      ...list,
      items
    };
    
    return { list: listWithItems };
  }
);

// Updates a shopping list.
export const updateList = api<UpdateListRequest, UpdateListResponse>(
  { auth: true, expose: true, method: "PUT", path: "/shopping/lists/:id" },
  async (req) => {
    const auth = getAuthData()!;
    
    const list = await shoppingDB.queryRow<ShoppingList>`
      UPDATE shopping_lists
      SET title = ${req.title}, updated_at = NOW()
      WHERE id = ${req.id} AND user_id = ${auth.userID}
      RETURNING *
    `;
    
    if (!list) {
      throw APIError.notFound("shopping list not found");
    }
    
    return { list };
  }
);

// Deletes a shopping list.
export const deleteList = api<{ id: number }, void>(
  { auth: true, expose: true, method: "DELETE", path: "/shopping/lists/:id" },
  async (req) => {
    const auth = getAuthData()!;
    
    await shoppingDB.exec`
      DELETE FROM shopping_lists
      WHERE id = ${req.id} AND user_id = ${auth.userID}
    `;
  }
);
