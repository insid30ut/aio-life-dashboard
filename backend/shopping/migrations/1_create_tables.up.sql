CREATE TABLE shopping_lists (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE shopping_items (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  is_checked BOOLEAN NOT NULL DEFAULT FALSE,
  list_id BIGINT NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shopping_lists_user_id ON shopping_lists(user_id);
CREATE INDEX idx_shopping_items_list_id ON shopping_items(list_id);
