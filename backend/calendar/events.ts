import { api, APIError } from "encore.dev/api";
import { calendarDB } from "./db";
import type { Event } from "./types";
import type { AuthPayload } from "~backend/auth/auth";

export interface CreateEventRequest {
  title: string;
  description?: string;
  date: string;
}

export interface CreateEventResponse {
  event: Event;
}

export interface GetEventsResponse {
  events: Event[];
}

export interface UpdateEventRequest {
  id: number;
  title?: string;
  description?: string;
  date?: string;
}

export interface UpdateEventResponse {
  event: Event;
}

// Creates a new calendar event.
export const createEvent = api<CreateEventRequest, CreateEventResponse>(
  { expose: true, method: "POST", path: "/calendar/events", auth: true },
  async ({ auth, ...req }: { auth: AuthPayload } & CreateEventRequest) => {
    const event = await calendarDB.queryRow<Event>`
      INSERT INTO events (title, description, date, user_id)
      VALUES (${req.title}, ${req.description || null}, ${req.date}, ${auth.userID})
      RETURNING *
    `;
    
    if (!event) {
      throw APIError.internal("failed to create event");
    }
    
    return { event };
  }
);

// Gets all events for the current user.
export const getEvents = api<void, GetEventsResponse>(
  { expose: true, method: "GET", path: "/calendar/events", auth: true },
  async ({ auth }: { auth: AuthPayload }) => {
    const events = await calendarDB.queryAll<Event>`
      SELECT * FROM events
      WHERE user_id = ${auth.userID}
      ORDER BY date ASC
    `;
    
    return { events };
  }
);

// Gets a specific event.
export const getEvent = api<{ id: number }, { event: Event }>(
  { expose: true, method: "GET", path: "/calendar/events/:id", auth: true },
  async ({ auth, id }: { auth: AuthPayload; id: number }) => {
    const event = await calendarDB.queryRow<Event>`
      SELECT * FROM events
      WHERE id = ${id} AND user_id = ${auth.userID}
    `;
    
    if (!event) {
      throw APIError.notFound("event not found");
    }
    
    return { event };
  }
);

// Updates an event.
export const updateEvent = api<UpdateEventRequest, UpdateEventResponse>(
  { expose: true, method: "PUT", path: "/calendar/events/:id", auth: true },
  async ({ auth, ...req }: { auth: AuthPayload } & UpdateEventRequest) => {
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
    
    if (req.date !== undefined) {
      updates.push(`date = $${values.length + 1}`);
      values.push(req.date);
    }
    
    updates.push(`updated_at = NOW()`);
    
    if (updates.length === 1) { // Only updated_at
      throw APIError.invalidArgument("no fields to update");
    }
    
    const query = `
      UPDATE events 
      SET ${updates.join(', ')}
      WHERE id = $${values.length + 1} AND user_id = $${values.length + 2}
      RETURNING *
    `;
    values.push(req.id, auth.userID);
    
    const event = await calendarDB.rawQueryRow<Event>(query, ...values);
    
    if (!event) {
      throw APIError.notFound("event not found");
    }
    
    return { event };
  }
);

// Deletes an event.
export const deleteEvent = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/calendar/events/:id", auth: true },
  async ({ auth, id }: { auth: AuthPayload; id: number }) => {
    await calendarDB.exec`
      DELETE FROM events
      WHERE id = ${id} AND user_id = ${auth.userID}
    `;
  }
);
