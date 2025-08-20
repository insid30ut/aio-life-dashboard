import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { tasksDB } from "./db";
import type { Card, CardWithMembers } from "./types";

export interface CreateCardRequest {
  title: string;
  description?: string;
  list_id: number;
  due_date?: Date;
  labels?: string[];
}

export interface CreateCardResponse {
  card: CardWithMembers;
}

export interface UpdateCardRequest {
  id: number;
  title?: string;
  description?: string;
  position?: number;
  list_id?: number;
  due_date?: Date | null;
  labels?: string[];
}

export interface UpdateCardResponse {
  card: CardWithMembers;
}

export interface GetCardResponse {
  card: CardWithMembers;
}

export interface GetTodayCardsResponse {
  cards: CardWithMembers[];
}

// Creates a new card in a list.
export const createCard = api<CreateCardRequest, CreateCardResponse>(
  { auth: true, expose: true, method: "POST", path: "/cards" },
  async (req) => {
    const auth = getAuthData()!;
    
    // Check if user is a member of the board
    const membership = await tasksDB.queryRow`
      SELECT 1 FROM board_members bm
      JOIN lists l ON l.board_id = bm.board_id
      WHERE l.id = ${req.list_id} AND bm.user_id = ${auth.userID}
    `;
    
    if (!membership) {
      throw APIError.permissionDenied("not a member of this board");
    }
    
    // Get the next position
    const maxPosition = await tasksDB.queryRow<{ max_position: number | null }>`
      SELECT MAX(position) as max_position FROM cards
      WHERE list_id = ${req.list_id}
    `;
    
    const position = (maxPosition?.max_position || 0) + 1;
    
    const card = await tasksDB.queryRow<Card>`
      INSERT INTO cards (title, description, position, list_id, due_date, labels)
      VALUES (${req.title}, ${req.description || ''}, ${position}, ${req.list_id}, ${req.due_date || null}, ${req.labels || []})
      RETURNING *
    `;
    
    if (!card) {
      throw APIError.internal("failed to create card");
    }
    
    const cardWithMembers: CardWithMembers = {
      ...card,
      members: []
    };
    
    return { card: cardWithMembers };
  }
);

// Gets a specific card with its members.
export const getCard = api<{ id: number }, GetCardResponse>(
  { auth: true, expose: true, method: "GET", path: "/cards/:id" },
  async (req) => {
    const auth = getAuthData()!;
    
    // Check if user is a member of the board
    const membership = await tasksDB.queryRow`
      SELECT 1 FROM board_members bm
      JOIN lists l ON l.board_id = bm.board_id
      JOIN cards c ON c.list_id = l.id
      WHERE c.id = ${req.id} AND bm.user_id = ${auth.userID}
    `;
    
    if (!membership) {
      throw APIError.notFound("card not found");
    }
    
    const card = await tasksDB.queryRow<Card>`
      SELECT * FROM cards WHERE id = ${req.id}
    `;
    
    if (!card) {
      throw APIError.notFound("card not found");
    }
    
    const members = await tasksDB.queryAll<{ user_id: string }>`
      SELECT user_id FROM card_members
      WHERE card_id = ${req.id}
    `;
    
    const cardWithMembers: CardWithMembers = {
      ...card,
      members: members.map(m => m.user_id)
    };
    
    return { card: cardWithMembers };
  }
);

// Updates a card.
export const updateCard = api<UpdateCardRequest, UpdateCardResponse>(
  { auth: true, expose: true, method: "PUT", path: "/cards/:id" },
  async (req) => {
    const auth = getAuthData()!;
    
    // Check if user is a member of the board
    const membership = await tasksDB.queryRow`
      SELECT 1 FROM board_members bm
      JOIN lists l ON l.board_id = bm.board_id
      JOIN cards c ON c.list_id = l.id
      WHERE c.id = ${req.id} AND bm.user_id = ${auth.userID}
    `;
    
    if (!membership) {
      throw APIError.permissionDenied("not authorized to update this card");
    }
    
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
    
    if (req.position !== undefined) {
      updates.push(`position = $${values.length + 1}`);
      values.push(req.position);
    }
    
    if (req.list_id !== undefined) {
      updates.push(`list_id = $${values.length + 1}`);
      values.push(req.list_id);
    }
    
    if (req.due_date !== undefined) {
      updates.push(`due_date = $${values.length + 1}`);
      values.push(req.due_date);
    }
    
    if (req.labels !== undefined) {
      updates.push(`labels = $${values.length + 1}`);
      values.push(req.labels);
    }
    
    updates.push(`updated_at = NOW()`);
    
    if (updates.length === 1) { // Only updated_at
      throw APIError.invalidArgument("no fields to update");
    }
    
    const query = `
      UPDATE cards 
      SET ${updates.join(', ')}
      WHERE id = $${values.length + 1}
      RETURNING *
    `;
    values.push(req.id);
    
    const card = await tasksDB.rawQueryRow<Card>(query, ...values);
    
    if (!card) {
      throw APIError.notFound("card not found");
    }
    
    const members = await tasksDB.queryAll<{ user_id: string }>`
      SELECT user_id FROM card_members
      WHERE card_id = ${req.id}
    `;
    
    const cardWithMembers: CardWithMembers = {
      ...card,
      members: members.map(m => m.user_id)
    };
    
    return { card: cardWithMembers };
  }
);

// Deletes a card.
export const deleteCard = api<{ id: number }, void>(
  { auth: true, expose: true, method: "DELETE", path: "/cards/:id" },
  async (req) => {
    const auth = getAuthData()!;
    
    // Check if user is a member of the board
    const membership = await tasksDB.queryRow`
      SELECT 1 FROM board_members bm
      JOIN lists l ON l.board_id = bm.board_id
      JOIN cards c ON c.list_id = l.id
      WHERE c.id = ${req.id} AND bm.user_id = ${auth.userID}
    `;
    
    if (!membership) {
      throw APIError.permissionDenied("not authorized to delete this card");
    }
    
    await tasksDB.exec`DELETE FROM cards WHERE id = ${req.id}`;
  }
);

// Gets all cards due today for the authenticated user.
export const getTodayCards = api<void, GetTodayCardsResponse>(
  { auth: true, expose: true, method: "GET", path: "/cards/today" },
  async () => {
    const auth = getAuthData()!;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const cards = await tasksDB.queryAll<Card>`
      SELECT c.* FROM cards c
      JOIN lists l ON c.list_id = l.id
      JOIN board_members bm ON l.board_id = bm.board_id
      WHERE bm.user_id = ${auth.userID}
        AND c.due_date >= ${today}
        AND c.due_date < ${tomorrow}
      ORDER BY c.due_date ASC
    `;
    
    const cardsWithMembers: CardWithMembers[] = [];
    
    for (const card of cards) {
      const members = await tasksDB.queryAll<{ user_id: string }>`
        SELECT user_id FROM card_members
        WHERE card_id = ${card.id}
      `;
      
      cardsWithMembers.push({
        ...card,
        members: members.map(m => m.user_id)
      });
    }
    
    return { cards: cardsWithMembers };
  }
);
