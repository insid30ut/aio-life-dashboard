export interface Habit {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  frequency: 'daily'; // Only daily is supported for now
  created_at: Date;
  updated_at: Date;
}

export interface HabitEntry {
  id: number;
  habit_id: number;
  completed_at: Date; // This will be a date string in YYYY-MM-DD format from the DB
  created_at: Date;
}

// This will be the shape of the data returned by the getHabits endpoint
export interface HabitWithEntries extends Habit {
    entries: HabitEntry[];
}
