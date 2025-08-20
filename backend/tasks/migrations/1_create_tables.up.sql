CREATE TABLE boards (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  background TEXT DEFAULT '#007AFF',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE board_members (
  id BIGSERIAL PRIMARY KEY,
  board_id BIGINT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(board_id, user_id)
);

CREATE TABLE lists (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  position INTEGER NOT NULL,
  board_id BIGINT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE cards (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  position INTEGER NOT NULL,
  list_id BIGINT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  due_date TIMESTAMP WITH TIME ZONE,
  labels TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE card_members (
  id BIGSERIAL PRIMARY KEY,
  card_id BIGINT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(card_id, user_id)
);

CREATE INDEX idx_board_members_user_id ON board_members(user_id);
CREATE INDEX idx_lists_board_id ON lists(board_id);
CREATE INDEX idx_cards_list_id ON cards(list_id);
CREATE INDEX idx_cards_due_date ON cards(due_date);
CREATE INDEX idx_card_members_user_id ON card_members(user_id);
