import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { tasksDB } from "./db";
import type { Attachment } from "./types";

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
  { auth: true, expose: true, method: "POST", path: "/attachments" },
  async (req) => {
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
  { auth: true, expose: true, method: "DELETE", path: "/attachments/:id" },
  async (req) => {
    await tasksDB.exec`DELETE FROM attachments WHERE id = ${req.id}`;
  }
);

// Gets all attachments for a card.
export const getCardAttachments = api<{ card_id: number }, GetCardAttachmentsResponse>(
  { auth: true, expose: true, method: "GET", path: "/cards/:card_id/attachments" },
  async (req) => {
    const attachments = await tasksDB.queryAll<Attachment>`
      SELECT * FROM attachments
      WHERE card_id = ${req.card_id}
      ORDER BY created_at DESC
    `;
    
    return { attachments };
  }
);
