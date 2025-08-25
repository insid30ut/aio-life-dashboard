export interface Event {
  id: number;
  title: string;
  description: string | null;
  date: Date;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}
