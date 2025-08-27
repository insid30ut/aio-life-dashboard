import { api, APIError } from "encore.dev/api";
import { shoppingDB } from "./db";
import type { ShoppingList, ShoppingListWithItems, ShoppingItem } from "./types";
import type { AuthPayload } from "~backend/auth/auth";

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
  { expose: true, method: "POST", path: "/shopping/lists", auth: true },
  async ({ auth, ...req }: { auth: AuthPayload } & CreateListRequest) => {
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
  { expose: true, method: "GET", path: "/shopping/lists", auth: true },
  async ({ auth }: { auth: AuthPayload }) => {
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
  { expose: true, method: "GET", path: "/shopping/lists/:id", auth: true },
  async ({ auth, id }: { auth: AuthPayload; id: number }) => {
    const rows = await shoppingDB.queryAll<{
        list_id: number;
        list_title: string;
        list_user_id: string;
        list_created_at: Date;
        list_updated_at: Date;
        item_id: number | null;
        item_name: string | null;
        item_is_checked: boolean | null;
        item_list_id: number | null;
        item_position: number | null;
        item_created_at: Date | null;
        item_updated_at: Date | null;
    }>`
        SELECT
            sl.id AS list_id,
            sl.title AS list_title,
            sl.user_id AS list_user_id,
            sl.created_at AS list_created_at,
            sl.updated_at AS list_updated_at,
            si.id AS item_id,
            si.name AS item_name,
            si.is_checked AS item_is_checked,
            si.list_id AS item_list_id,
            si.position AS item_position,
            si.created_at AS item_created_at,
            si.updated_at AS item_updated_at
        FROM
            shopping_lists sl
        LEFT JOIN
            shopping_items si ON sl.id = si.list_id
        WHERE
            sl.id = ${id} AND sl.user_id = ${auth.userID}
        ORDER BY
            si.position ASC
    `;

    if (rows.length === 0) {
        const list = await shoppingDB.queryRow<ShoppingList>`
            SELECT * FROM shopping_lists WHERE id = ${id} AND user_id = ${auth.userID}
        `;
        if (!list) {
            throw APIError.notFound("shopping list not found");
        }
        return { list: { ...list, items: [] } };
    }

    const firstRow = rows[0];
    const listWithItems: ShoppingListWithItems = {
        id: firstRow.list_id,
        title: firstRow.list_title,
        user_id: firstRow.list_user_id,
        created_at: firstRow.list_created_at,
        updated_at: firstRow.list_updated_at,
        items: [],
    };

    for (const row of rows) {
        if (row.item_id) {
            listWithItems.items.push({
                id: row.item_id,
                name: row.item_name!,
                is_checked: row.item_is_checked!,
                list_id: row.item_list_id!,
                position: row.item_position!,
                created_at: row.item_created_at!,
                updated_at: row.item_updated_at!,
            });
        }
    }

    return { list: listWithItems };
  }
);

// Updates a shopping list.
export const updateList = api<UpdateListRequest, UpdateListResponse>(
  { expose: true, method: "PUT", path: "/shopping/lists/:id", auth: true },
  async ({ auth, ...req }: { auth: AuthPayload } & UpdateListRequest) => {
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
  { expose: true, method: "DELETE", path: "/shopping/lists/:id", auth: true },
  async ({ auth, id }: { auth: AuthPayload; id: number }) => {
    await shoppingDB.exec`
      DELETE FROM shopping_lists
      WHERE id = ${id} AND user_id = ${auth.userID}
    `;
  }
);
