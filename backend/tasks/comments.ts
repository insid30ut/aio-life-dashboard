import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { tasksDB } from "./db";
import type { Comment } from "./types";

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

// Creates a new comment on a card.
export const createComment = api<CreateCommentRequest, CreateCommentResponse>(
  { auth: true, expose: true, method: "POST", path: "/comments" },
  async (req) => {
    const auth = getAuthData()!;
    
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

// Updates a comment.
export const updateComment = api<UpdateCommentRequest, UpdateCommentResponse>(
  { auth: true, expose: true, method: "PUT", path: "/comments/:id" },
  async (req) => {
    const auth = getAuthData()!;
    
    const comment = await tasksDB.queryRow<Comment>`
      UPDATE comments 
      SET content = ${req.content}, updated_at = NOW()
      WHERE id = ${req.id} AND user_id = ${auth.userID}
      RETURNING *
    `;
    
    if (!comment) {
      throw APIError.notFound("comment not found or not authorized");
    }
    
    return { comment };
  }
);

// Deletes a comment.
export const deleteComment = api<{ id: number }, void>(
  { auth: true, expose: true, method: "DELETE", path: "/comments/:id" },
  async (req) => {
    const auth = getAuthData()!;
    
    const result = await tasksDB.exec`
      DELETE FROM comments 
      WHERE id = ${req.id} AND user_id = ${auth.userID}
    `;
  }
);

// Gets all comments for a card.
export const getCardComments = api<{ card_id: number }, GetCardCommentsResponse>(
  { auth: true, expose: true, method: "GET", path: "/cards/:card_id/comments" },
  async (req) => {
    const comments = await tasksDB.queryAll<Comment>`
      SELECT * FROM comments
      WHERE card_id = ${req.card_id}
      ORDER BY created_at ASC
    `;
    
    return { comments };
  }
);
