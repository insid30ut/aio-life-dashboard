import { api, APIError } from "encore.dev/api";
import { habitsDB } from "./db";
import type { Habit, HabitWithEntries, HabitEntry } from "./types";
import type { AuthPayload } from "~backend/auth/auth";

// == Create Habit ==
export interface CreateHabitRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export const createHabit = api<CreateHabitRequest, { habit: Habit }>(
  { expose: true, method: "POST", path: "/habits", auth: true },
  async ({ auth, ...req }: { auth: AuthPayload } & CreateHabitRequest) => {
    const habit = await habitsDB.queryRow<Habit>`
      INSERT INTO habits (name, description, color, icon, user_id)
      VALUES (${req.name}, ${req.description || null}, ${req.color || '#007AFF'}, ${req.icon || 'zap'}, ${auth.userID})
      RETURNING *
    `;
    if (!habit) {
      throw APIError.internal("failed to create habit");
    }
    return { habit };
  }
);

// == Get Habits ==
// This endpoint fetches all habits and their entries from the last 30 days.
export const getHabits = api<void, { habits: HabitWithEntries[] }>(
  { expose: true, method: "GET", path: "/habits", auth: true },
  async ({ auth }: { auth: AuthPayload }) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const rows = await habitsDB.queryAll<Habit & { entries: HabitEntry[] | null }>`
      SELECT
        h.*,
        (
          SELECT json_agg(he.*)
          FROM habit_entries he
          WHERE he.habit_id = h.id AND he.completed_at >= ${thirtyDaysAgo}
        ) as entries
      FROM habits h
      WHERE h.user_id = ${auth.userID}
      ORDER BY h.created_at DESC
    `;

    const habits: HabitWithEntries[] = rows.map(row => ({
      ...row,
      entries: row.entries || [],
    }));

    return { habits };
  }
);

// == Track Habit ==
export interface TrackHabitRequest {
  habit_id: number;
  date: string; // YYYY-MM-DD
}

export const trackHabit = api<TrackHabitRequest, { entry: HabitEntry }>(
  { expose: true, method: "POST", path: "/habits/track", auth: true },
  async ({ auth, ...req }: { auth: AuthPayload } & TrackHabitRequest) => {
    // Verify user owns the habit before tracking
    const habit = await habitsDB.queryRow<{ id: number }>`
        SELECT id FROM habits WHERE id = ${req.habit_id} AND user_id = ${auth.userID}
    `;
    if (!habit) {
        throw APIError.notFound("habit not found");
    }

    const entry = await habitsDB.queryRow<HabitEntry>`
      INSERT INTO habit_entries (habit_id, completed_at)
      VALUES (${req.habit_id}, ${req.date})
      ON CONFLICT (habit_id, completed_at) DO NOTHING
      RETURNING *
    `;

    if (!entry) {
        const existingEntry = await habitsDB.queryRow<HabitEntry>`
            SELECT * FROM habit_entries
            WHERE habit_id = ${req.habit_id} AND completed_at = ${req.date}
        `;
        if (!existingEntry) {
            throw APIError.internal("failed to track habit");
        }
        return { entry: existingEntry };
    }

    return { entry };
  }
);

// == Untrack Habit ==
export interface UntrackHabitRequest {
  habit_id: number;
  date: string; // YYYY-MM-DD
}

export const untrackHabit = api<UntrackHabitRequest, { success: boolean }>(
  { expose: true, method: "POST", path: "/habits/untrack", auth: true },
  async ({ auth, ...req }: { auth: AuthPayload } & UntrackHabitRequest) => {
    await habitsDB.exec`
      DELETE FROM habit_entries
      WHERE habit_id = ${req.habit_id}
        AND completed_at = ${req.date}
        AND habit_id IN (SELECT id FROM habits WHERE user_id = ${auth.userID})
    `;
    return { success: true };
  }
);

// == Delete Habit ==
export const deleteHabit = api<{ id: number }, { success: boolean }>(
  { expose: true, method: "DELETE", path: "/habits/:id", auth: true },
  async ({ auth, id }: { auth: AuthPayload; id: number }) => {
    await habitsDB.exec`
      DELETE FROM habits
      WHERE id = ${id} AND user_id = ${auth.userID}
    `;
    return { success: true };
  }
);
