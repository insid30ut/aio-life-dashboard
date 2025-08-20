import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { tasksDB } from "./db";
import type { Board, BoardWithLists, ListWithCards, CardWithMembers } from "./types";

export interface CreateBoardRequest {
  title: string;
  background?: string;
}

export interface CreateBoardResponse {
  board: Board;
}

export interface ListBoardsResponse {
  boards: Board[];
}

export interface GetBoardResponse {
  board: BoardWithLists;
}

// Creates a new board.
export const createBoard = api<CreateBoardRequest, CreateBoardResponse>(
  { auth: true, expose: true, method: "POST", path: "/boards" },
  async (req) => {
    const auth = getAuthData()!;
    
    const board = await tasksDB.queryRow<Board>`
      INSERT INTO boards (title, background)
      VALUES (${req.title}, ${req.background || '#007AFF'})
      RETURNING *
    `;
    
    if (!board) {
      throw APIError.internal("failed to create board");
    }
    
    // Add the creator as a board member
    await tasksDB.exec`
      INSERT INTO board_members (board_id, user_id, role)
      VALUES (${board.id}, ${auth.userID}, 'owner')
    `;
    
    return { board };
  }
);

// Lists all boards the user is a member of.
export const listBoards = api<void, ListBoardsResponse>(
  { auth: true, expose: true, method: "GET", path: "/boards" },
  async () => {
    const auth = getAuthData()!;
    
    const boards = await tasksDB.queryAll<Board>`
      SELECT b.* FROM boards b
      JOIN board_members bm ON b.id = bm.board_id
      WHERE bm.user_id = ${auth.userID}
      ORDER BY b.updated_at DESC
    `;
    
    return { boards };
  }
);

// Gets a specific board with all its lists and cards.
export const getBoard = api<{ id: number }, GetBoardResponse>(
  { auth: true, expose: true, method: "GET", path: "/boards/:id" },
  async (req) => {
    const auth = getAuthData()!;
    
    // Check if user is a member of this board
    const membership = await tasksDB.queryRow`
      SELECT 1 FROM board_members
      WHERE board_id = ${req.id} AND user_id = ${auth.userID}
    `;
    
    if (!membership) {
      throw APIError.notFound("board not found");
    }
    
    const board = await tasksDB.queryRow<Board>`
      SELECT * FROM boards WHERE id = ${req.id}
    `;
    
    if (!board) {
      throw APIError.notFound("board not found");
    }
    
    const lists = await tasksDB.queryAll<ListWithCards>`
      SELECT * FROM lists
      WHERE board_id = ${req.id}
      ORDER BY position ASC
    `;
    
    // Get cards for each list
    for (const list of lists) {
      const cards = await tasksDB.queryAll<CardWithMembers>`
        SELECT * FROM cards
        WHERE list_id = ${list.id}
        ORDER BY position ASC
      `;
      
      // Get members for each card
      for (const card of cards) {
        const members = await tasksDB.queryAll<{ user_id: string }>`
          SELECT user_id FROM card_members
          WHERE card_id = ${card.id}
        `;
        card.members = members.map(m => m.user_id);
      }
      
      list.cards = cards;
    }
    
    const boardWithLists: BoardWithLists = {
      ...board,
      lists
    };
    
    return { board: boardWithLists };
  }
);
