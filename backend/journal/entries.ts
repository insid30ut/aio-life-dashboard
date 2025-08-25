import { api, APIError } from "encore.dev/api";
import { journalDB } from "./db";
import type { Entry } from "./types";

export interface CreateEntryRequest {
  title: string;
  content: string;
  mood?: string;
  date: string;
}

export interface CreateEntryResponse {
  entry: Entry;
}

export interface GetEntriesResponse {
  entries: Entry[];
}

export interface UpdateEntryRequest {
  id: number;
  title?: string;
  content?: string;
  mood?: string;
  date?: string;
}

export interface UpdateEntryResponse {
  entry: Entry;
}

// Creates a new journal entry.
export const createEntry = api<CreateEntryRequest, CreateEntryResponse>(
  { expose: true, method: "POST", path: "/journal/entries" },
  async (req) => {
    const entry = await journalDB.queryRow<Entry>`
      INSERT INTO entries (title, content, mood, date, user_id)
      VALUES (${req.title}, ${req.content}, ${req.mood || null}, ${req.date}, ${'anonymous'})
      RETURNING *
    `;
    
    if (!entry) {
      throw APIError.internal("failed to create entry");
    }
    
    return { entry };
  }
);

// Gets all journal entries for the current user.
export const getEntries = api<void, GetEntriesResponse>(
  { expose: true, method: "GET", path: "/journal/entries" },
  async () => {
    const entries = await journalDB.queryAll<Entry>`
      SELECT * FROM entries
      WHERE user_id = ${'anonymous'}
      ORDER BY date DESC, created_at DESC
    `;
    
    return { entries };
  }
);

// Gets a specific journal entry.
export const getEntry = api<{ id: number }, { entry: Entry }>(
  { expose: true, method: "GET", path: "/journal/entries/:id" },
  async (req) => {
    const entry = await journalDB.queryRow<Entry>`
      SELECT * FROM entries
      WHERE id = ${req.id} AND user_id = ${'anonymous'}
    `;
    
    if (!entry) {
      throw APIError.notFound("entry not found");
    }
    
    return { entry };
  }
);

// Updates a journal entry.
export const updateEntry = api<UpdateEntryRequest, UpdateEntryResponse>(
  { expose: true, method: "PUT", path: "/journal/entries/:id" },
  async (req) => {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (req.title !== undefined) {
      updates.push(`title = $${values.length + 1}`);
      values.push(req.title);
    }
    
    if (req.content !== undefined) {
      updates.push(`content = $${values.length + 1}`);
      values.push(req.content);
    }
    
    if (req.mood !== undefined) {
      updates.push(`mood = $${values.length + 1}`);
      values.push(req.mood);
    }
    
    if (req.date !== undefined) {
      updates.push(`date = $${values.length + 1}`);
      values.push(req.date);
    }
    
    updates.push(`updated_at = NOW()`);
    
    if (updates.length === 1) { // Only updated_at
      throw APIError.invalidArgument("no fields to update");
    }
    
    const query = `
      UPDATE entries 
      SET ${updates.join(', ')}
      WHERE id = $${values.length + 1} AND user_id = $${values.length + 2}
      RETURNING *
    `;
    values.push(req.id, 'anonymous');
    
    const entry = await journalDB.rawQueryRow<Entry>(query, ...values);
    
    if (!entry) {
      throw APIError.notFound("entry not found");
    }
    
    return { entry };
  }
);

// Deletes a journal entry.
export const deleteEntry = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/journal/entries/:id" },
  async (req) => {
    await journalDB.exec`
      DELETE FROM entries
      WHERE id = ${req.id} AND user_id = ${'anonymous'}
    `;
  }
);
