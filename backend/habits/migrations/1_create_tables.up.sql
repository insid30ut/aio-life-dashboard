CREATE TABLE habits (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#007AFF',
  icon TEXT DEFAULT 'zap',
  frequency TEXT NOT NULL DEFAULT 'daily', -- For now, only 'daily' is supported
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE habit_entries (
  id BIGSERIAL PRIMARY KEY,
  habit_id BIGINT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  completed_at DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_habit_entries_habit_id_completed_at ON habit_entries (habit_id, completed_at);
CREATE INDEX idx_habits_user_id ON habits(user_id);
