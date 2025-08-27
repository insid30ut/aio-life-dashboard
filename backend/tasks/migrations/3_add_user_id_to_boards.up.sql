ALTER TABLE boards
ADD COLUMN user_id TEXT;

-- Note: For a production environment with existing data,
-- you would first populate this new column for existing rows
-- and then alter it to be NOT NULL.
-- For this new feature, we will handle the user_id at the application level.
