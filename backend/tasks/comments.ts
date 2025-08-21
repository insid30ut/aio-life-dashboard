import { api, APIError } from "encore.dev/api";
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
  { expose: true, method: "POST", path: "/comments" },
  async (req) => {
    const comment = await tasksDB.queryRow<Comment>`
      INSERT INTO comments (content, card_id, user_id)
      VALUES (${req.content}, ${req.card_id}, ${'anonymous'})
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
  { expose: true, method: "PUT", path: "/comments/:id" },
  async (req) => {
    const comment = await tasksDB.queryRow<Comment>`
      UPDATE comments 
      SET content = ${req.content}, updated_at = NOW()
      WHERE id = ${req.id}
      RETURNING *
    `;
    
    if (!comment) {
      throw APIError.notFound("comment not found");
    }
    
    return { comment };
  }
);

// Deletes a comment.
export const deleteComment = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/comments/:id" },
  async (req) => {
    await tasksDB.exec`
      DELETE FROM comments 
      WHERE id = ${req.id}
    `;
  }
);

// Gets all comments for a card.
export const getCardComments = api<{ card_id: number }, GetCardCommentsResponse>(
  { expose: true, method: "GET", path: "/cards/:card_id/comments" },
  async (req) => {
    const comments = await tasksDB.queryAll<Comment>`
      SELECT * FROM comments
      WHERE card_id = ${req.card_id}
      ORDER BY created_at ASC
    `;
    
    return { comments };
  }
);
