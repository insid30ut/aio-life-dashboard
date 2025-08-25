CREATE TABLE goals (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  target_value DOUBLE PRECISION NOT NULL CHECK (target_value > 0),
  current_value DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (current_value >= 0),
  unit TEXT NOT NULL,
  target_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_target_date ON goals(target_date);
