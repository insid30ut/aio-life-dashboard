export interface Goal {
  id: number;
  title: string;
  description: string | null;
  target_value: number;
  current_value: number;
  unit: string;
  target_date: Date;
  status: 'active' | 'completed' | 'paused';
  user_id: string;
  created_at: Date;
  updated_at: Date;
}
