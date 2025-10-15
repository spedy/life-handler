-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- Insert default categories for klemen
DO $$
DECLARE
    user_id_var INTEGER;
BEGIN
    SELECT id INTO user_id_var FROM users WHERE username = 'klemen';

    INSERT INTO categories (user_id, name, color) VALUES
    (user_id_var, 'work', '#2196f3'),
    (user_id_var, 'relationships', '#ff9800'),
    (user_id_var, 'projects', '#4caf50'),
    (user_id_var, 'personal', '#9c27b0')
    ON CONFLICT (user_id, name) DO NOTHING;
END $$;
