import { api, APIError } from "encore.dev/api";
import { tasksDB } from "./db";
import type { Board, BoardWithLists, ListWithCards, CardWithMembers } from "./types";
import type { AuthPayload } from "~backend/auth/auth";

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
  { expose: true, method: "POST", path: "/boards", auth: true },
  async ({ auth, ...req }: { auth: AuthPayload } & CreateBoardRequest) => {
    const board = await tasksDB.queryRow<Board>`
      INSERT INTO boards (title, background, user_id)
      VALUES (${req.title}, ${req.background || '#007AFF'}, ${auth.userID})
      RETURNING *
    `;
    
    if (!board) {
      throw APIError.internal("failed to create board");
    }
    
    return { board };
  }
);

// Lists all boards for the current user.
export const listBoards = api<void, ListBoardsResponse>(
  { expose: true, method: "GET", path: "/boards", auth: true },
  async ({ auth }: { auth: AuthPayload }) => {
    const boards = await tasksDB.queryAll<Board>`
      SELECT * FROM boards
      WHERE user_id = ${auth.userID}
      ORDER BY updated_at DESC
    `;
    
    return { boards };
  }
);

// Gets a specific board with all its lists and cards.
export const getBoard = api<{ id: number }, GetBoardResponse>(
  { expose: true, method: "GET", path: "/boards/:id", auth: true },
  async ({ auth, id }: { auth: AuthPayload; id: number }) => {
    const rows = await tasksDB.queryAll<{
      board_id: number;
      board_title: string;
      board_background: string;
      board_user_id: string;
      board_created_at: Date;
      board_updated_at: Date;
      list_id: number | null;
      list_title: string | null;
      list_position: number | null;
      list_created_at: Date | null;
      list_updated_at: Date | null;
      card_id: number | null;
      card_title: string | null;
      card_description: string | null;
      card_position: number | null;
      card_due_date: Date | null;
      card_labels: string[] | null;
      card_created_at: Date | null;
      card_updated_at: Date | null;
      card_list_id: number | null;
      card_member_user_id: string | null;
    }>`
      SELECT
          b.id AS board_id,
          b.title AS board_title,
          b.background AS board_background,
          b.user_id AS board_user_id,
          b.created_at AS board_created_at,
          b.updated_at AS board_updated_at,
          l.id AS list_id,
          l.title AS list_title,
          l.position AS list_position,
          l.created_at AS list_created_at,
          l.updated_at AS list_updated_at,
          c.id AS card_id,
          c.title AS card_title,
          c.description AS card_description,
          c.position AS card_position,
          c.due_date AS card_due_date,
          c.labels AS card_labels,
          c.created_at AS card_created_at,
          c.updated_at AS card_updated_at,
          c.list_id AS card_list_id,
          cm.user_id AS card_member_user_id
      FROM
          boards b
      LEFT JOIN
          lists l ON b.id = l.board_id
      LEFT JOIN
          cards c ON l.id = c.list_id
      LEFT JOIN
          card_members cm ON c.id = cm.card_id
      WHERE
          b.id = ${id} AND b.user_id = ${auth.userID}
      ORDER BY
          l.position ASC, c.position ASC
    `;

    if (rows.length === 0) {
      const board = await tasksDB.queryRow<Board>`
          SELECT * FROM boards WHERE id = ${id} AND user_id = ${auth.userID}
      `;
      if (!board) {
        throw APIError.notFound("board not found");
      }
      return { board: { ...board, lists: [] } };
    }

    const firstRow = rows[0];
    const board: BoardWithLists = {
      id: firstRow.board_id,
      title: firstRow.board_title,
      background: firstRow.board_background,
      user_id: firstRow.board_user_id,
      created_at: firstRow.board_created_at,
      updated_at: firstRow.board_updated_at,
      lists: [],
    };

    const listsMap = new Map<number, ListWithCards>();
    const cardsMap = new Map<number, CardWithMembers>();

    for (const row of rows) {
      if (row.list_id && !listsMap.has(row.list_id)) {
        listsMap.set(row.list_id, {
          id: row.list_id,
          title: row.list_title!,
          position: row.list_position!,
          board_id: row.board_id,
          created_at: row.list_created_at!,
          updated_at: row.list_updated_at!,
          cards: [],
        });
      }

      if (row.card_id && !cardsMap.has(row.card_id)) {
        cardsMap.set(row.card_id, {
          id: row.card_id,
          title: row.card_title!,
          description: row.card_description || "",
          position: row.card_position!,
          due_date: row.card_due_date || null,
          labels: row.card_labels || [],
          list_id: row.card_list_id!,
          created_at: row.card_created_at!,
          updated_at: row.card_updated_at!,
          members: [],
        });
      }

      if (row.card_id && row.card_member_user_id) {
        const card = cardsMap.get(row.card_id);
        if (card && !card.members.includes(row.card_member_user_id)) {
          card.members.push(row.card_member_user_id);
        }
      }
    }

    for (const card of cardsMap.values()) {
      const list = listsMap.get(card.list_id);
      if (list) {
        list.cards.push(card);
      }
    }

    board.lists = Array.from(listsMap.values());

    return { board };
  }
);
