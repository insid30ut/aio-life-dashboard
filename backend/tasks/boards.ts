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
    const board = await tasksDB.queryRow<Board>`
      INSERT INTO boards (title, background)
      VALUES (${req.title}, ${req.background || '#007AFF'})
      RETURNING *
    `;
    
    if (!board) {
      throw APIError.internal("failed to create board");
    }
    
    return { board };
  }
);

// Lists all boards.
export const listBoards = api<void, ListBoardsResponse>(
  { auth: true, expose: true, method: "GET", path: "/boards" },
  async () => {
    const boards = await tasksDB.queryAll<Board>`
      SELECT * FROM boards
      ORDER BY updated_at DESC
    `;
    
    return { boards };
  }
);

// Gets a specific board with all its lists and cards.
export const getBoard = api<{ id: number }, GetBoardResponse>(
  { auth: true, expose: true, method: "GET", path: "/boards/:id" },
  async (req) => {
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
