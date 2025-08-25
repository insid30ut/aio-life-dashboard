export interface Entry {
  id: number;
  title: string;
  content: string;
  mood: string | null;
  date: Date;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}
