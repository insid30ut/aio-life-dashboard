import { api, APIError } from "encore.dev/api";
import { tasksDB } from "./db";
import type { Comment } from "./types";
import type { AuthPayload } from "~backend/auth/auth";

export interface CreateCommentRequest {
  content: string;
  card_id: number;
}

export interface CreateCommentResponse {
  comment: Comment;
}

export interface UpdateCommentRequest {
  id: number;
  content: string;
}

export interface UpdateCommentResponse {
  comment: Comment;
}

export interface GetCardCommentsResponse {
  comments: Comment[];
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

// Creates a new comment on a card.
export const createComment = api<CreateCommentRequest, CreateCommentResponse>(
  { expose: true, method: "POST", path: "/comments", auth: true },
  async ({ auth, ...req }: { auth: AuthPayload } & CreateCommentRequest) => {
    if (!await userOwnsCard(auth.userID, req.card_id)) {
        throw APIError.notFound("card not found");
    }

    const comment = await tasksDB.queryRow<Comment>`
      INSERT INTO comments (content, card_id, user_id)
      VALUES (${req.content}, ${req.card_id}, ${auth.userID})
      RETURNING *
    `;
    
    if (!comment) {
      throw APIError.internal("failed to create comment");
    }
    
    return { comment };
  }
);

// Updates a comment. A user can only update their own comment.
export const updateComment = api<UpdateCommentRequest, UpdateCommentResponse>(
  { expose: true, method: "PUT", path: "/comments/:id", auth: true },
  async ({ auth, ...req }: { auth: AuthPayload } & UpdateCommentRequest) => {
    const comment = await tasksDB.queryRow<Comment>`
      UPDATE comments 
      SET content = ${req.content}, updated_at = NOW()
      WHERE id = ${req.id} AND user_id = ${auth.userID}
      RETURNING *
    `;
    
    if (!comment) {
      throw APIError.notFound("comment not found, or you don't have permission to edit it");
    }
    
    return { comment };
  }
);

// Deletes a comment. A user can only delete their own comment.
export const deleteComment = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/comments/:id", auth: true },
  async ({ auth, id }: { auth: AuthPayload; id: number }) => {
    await tasksDB.exec`
      DELETE FROM comments 
      WHERE id = ${id} AND user_id = ${auth.userID}
    `;
  }
);

// Gets all comments for a card. A user must own the card's board to see comments.
export const getCardComments = api<{ card_id: number }, GetCardCommentsResponse>(
  { expose: true, method: "GET", path: "/cards/:card_id/comments", auth: true },
  async ({ auth, card_id }: { auth: AuthPayload; card_id: number }) => {
    if (!await userOwnsCard(auth.userID, card_id)) {
        throw APIError.notFound("card not found");
    }

    const comments = await tasksDB.queryAll<Comment>`
      SELECT * FROM comments
      WHERE card_id = ${card_id}
      ORDER BY created_at ASC
    `;
    
    return { comments };
  }
);
