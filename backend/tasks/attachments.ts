import { api, APIError } from "encore.dev/api";
import { tasksDB } from "./db";
import type { Attachment } from "./types";
import type { AuthPayload } from "~backend/auth/auth";

export interface CreateAttachmentRequest {
  name: string;
  url: string;
  size_bytes?: number;
  mime_type?: string;
  card_id: number;
}

export interface CreateAttachmentResponse {
  attachment: Attachment;
}

export interface GetCardAttachmentsResponse {
  attachments: Attachment[];
}

// Creates a new attachment for a card.
export const createAttachment = api<CreateAttachmentRequest, CreateAttachmentResponse>(
  { expose: true, method: "POST", path: "/attachments", auth: true },
  async ({ auth, ...req }: { auth: AuthPayload } & CreateAttachmentRequest) => {
    // Verify user owns the board the card belongs to
    const card = await tasksDB.queryRow`
        SELECT id FROM cards WHERE id = ${req.card_id}
        AND list_id IN (SELECT id FROM lists WHERE board_id IN (
            SELECT id FROM boards WHERE user_id = ${auth.userID}
        ))
    `;
    if (!card) {
        throw APIError.notFound("card not found");
    }

    const attachment = await tasksDB.queryRow<Attachment>`
      INSERT INTO attachments (name, url, size_bytes, mime_type, card_id)
      VALUES (${req.name}, ${req.url}, ${req.size_bytes || null}, ${req.mime_type || null}, ${req.card_id})
      RETURNING *
    `;
    
    if (!attachment) {
      throw APIError.internal("failed to create attachment");
    }
    
    return { attachment };
  }
);

// Deletes an attachment.
export const deleteAttachment = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/attachments/:id", auth: true },
  async ({ auth, id }: { auth: AuthPayload; id: number }) => {
    await tasksDB.exec`
        DELETE FROM attachments
        WHERE id = ${id}
        AND card_id IN (
            SELECT id FROM cards WHERE list_id IN (
                SELECT id FROM lists WHERE board_id IN (
                    SELECT id FROM boards WHERE user_id = ${auth.userID}
                )
            )
        )
    `;
  }
);

// Gets all attachments for a card.
export const getCardAttachments = api<{ card_id: number }, GetCardAttachmentsResponse>(
  { expose: true, method: "GET", path: "/cards/:card_id/attachments", auth: true },
  async ({ auth, card_id }: { auth: AuthPayload; card_id: number }) => {
    // Verify user owns the board the card belongs to
    const card = await tasksDB.queryRow`
        SELECT id FROM cards WHERE id = ${card_id}
        AND list_id IN (SELECT id FROM lists WHERE board_id IN (
            SELECT id FROM boards WHERE user_id = ${auth.userID}
        ))
    `;
    if (!card) {
        throw APIError.notFound("card not found");
    }

    const attachments = await tasksDB.queryAll<Attachment>`
      SELECT * FROM attachments
      WHERE card_id = ${card_id}
      ORDER BY created_at DESC
    `;
    
    return { attachments };
  }
);
