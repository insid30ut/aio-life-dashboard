CREATE TABLE entries (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  mood TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_entries_user_id ON entries(user_id);
CREATE INDEX idx_entries_date ON entries(date);
