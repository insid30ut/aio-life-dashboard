import { api, APIError } from "encore.dev/api";
import { tasksDB } from "./db";
import type { Card, CardWithMembers, CardWithDetails, ChecklistWithItems, Attachment, Comment } from "./types";

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
  card: CardWithDetails;
}

export interface GetTodayCardsResponse {
  cards: CardWithMembers[];
}

// Creates a new card in a list.
export const createCard = api<CreateCardRequest, CreateCardResponse>(
  { expose: true, method: "POST", path: "/cards" },
  async (req) => {
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

// Gets a specific card with all its details.
export const getCard = api<{ id: number }, GetCardResponse>(
  { expose: true, method: "GET", path: "/cards/:id" },
  async (req) => {
    const card = await tasksDB.queryRow<Card>`
      SELECT * FROM cards WHERE id = ${req.id}
    `;
    
    if (!card) {
      throw APIError.notFound("card not found");
    }
    
    // Get members
    const members = await tasksDB.queryAll<{ user_id: string }>`
      SELECT user_id FROM card_members
      WHERE card_id = ${req.id}
    `;
    
    // Get checklists with items
    const checklists = await tasksDB.queryAll<ChecklistWithItems>`
      SELECT * FROM checklists
      WHERE card_id = ${req.id}
      ORDER BY position ASC
    `;
    
    for (const checklist of checklists) {
      const items = await tasksDB.queryAll`
        SELECT * FROM checklist_items
        WHERE checklist_id = ${checklist.id}
        ORDER BY position ASC
      `;
      checklist.items = items;
    }
    
    // Get attachments
    const attachments = await tasksDB.queryAll<Attachment>`
      SELECT * FROM attachments
      WHERE card_id = ${req.id}
      ORDER BY created_at DESC
    `;
    
    // Get comments
    const comments = await tasksDB.queryAll<Comment>`
      SELECT * FROM comments
      WHERE card_id = ${req.id}
      ORDER BY created_at ASC
    `;
    
    const cardWithDetails: CardWithDetails = {
      ...card,
      members: members.map(m => m.user_id),
      checklists,
      attachments,
      comments
    };
    
    return { card: cardWithDetails };
  }
);

// Updates a card.
export const updateCard = api<UpdateCardRequest, UpdateCardResponse>(
  { expose: true, method: "PUT", path: "/cards/:id" },
  async (req) => {
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
  { expose: true, method: "DELETE", path: "/cards/:id" },
  async (req) => {
    await tasksDB.exec`DELETE FROM cards WHERE id = ${req.id}`;
  }
);

// Gets all cards due today.
export const getTodayCards = api<void, GetTodayCardsResponse>(
  { expose: true, method: "GET", path: "/cards/today" },
  async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const cards = await tasksDB.queryAll<Card>`
      SELECT * FROM cards
      WHERE due_date >= ${today}
        AND due_date < ${tomorrow}
      ORDER BY due_date ASC
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

// Adds a member to a card.
export const addCardMember = api<{ card_id: number; user_id: string }, void>(
  { expose: true, method: "POST", path: "/cards/:card_id/members" },
  async (req) => {
    await tasksDB.exec`
      INSERT INTO card_members (card_id, user_id)
      VALUES (${req.card_id}, ${req.user_id})
      ON CONFLICT (card_id, user_id) DO NOTHING
    `;
  }
);

// Removes a member from a card.
export const removeCardMember = api<{ card_id: number; user_id: string }, void>(
  { expose: true, method: "DELETE", path: "/cards/:card_id/members/:user_id" },
  async (req) => {
    await tasksDB.exec`
      DELETE FROM card_members
      WHERE card_id = ${req.card_id} AND user_id = ${req.user_id}
    `;
  }
);
