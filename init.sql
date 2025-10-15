-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    weight INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_id ON activity_logs(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_clicked_at ON activity_logs(clicked_at);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);

-- Insert default user (password: ks15scss - hashed with bcrypt)
INSERT INTO users (username, password)
VALUES ('klemen', '$2b$10$gz56/DFQP1zRKdMlQzpVKu14vdeGa//dXjeAYIMSJCYjIgU8XfDNC')
ON CONFLICT (username) DO NOTHING;

-- Get the user id
DO $$
DECLARE
    user_id_var INTEGER;
BEGIN
    SELECT id INTO user_id_var FROM users WHERE username = 'klemen';

    -- Insert default activities for klemen
    INSERT INTO activities (user_id, name, category, weight) VALUES
    (user_id_var, 'smartis', 'work', 9),
    (user_id_var, 'codeventuri', 'work', 8),
    (user_id_var, 'KG', 'work', 7),
    (user_id_var, 'chorse', 'personal', 5),
    (user_id_var, 'anamarija', 'relationships', 10),
    (user_id_var, 'simon', 'relationships', 7),
    (user_id_var, 'matej', 'relationships', 7),
    (user_id_var, 'eva', 'relationships', 10),
    (user_id_var, 'fran ramovs', 'relationships', 6),
    (user_id_var, 'razpis MDP', 'projects', 8),
    (user_id_var, 'kickstarter campaign', 'projects', 8)
    ON CONFLICT (user_id, name) DO NOTHING;
END $$;
