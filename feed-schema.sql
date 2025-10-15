-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    post_key VARCHAR(16) UNIQUE NOT NULL,
    book_title VARCHAR(500) NOT NULL,
    book_author VARCHAR(500),
    chapter_title VARCHAR(500),
    chapter_id VARCHAR(100),
    chapter_order INTEGER,
    post_index INTEGER,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'learning',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    question_key VARCHAR(16) UNIQUE NOT NULL,
    post_key VARCHAR(16) REFERENCES posts(post_key) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    question_text TEXT NOT NULL,
    book_title VARCHAR(500),
    chapter_title VARCHAR(500),
    answers JSONB NOT NULL,
    type VARCHAR(50) DEFAULT 'multiple-choice',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create question_attempts table (tracks user answers)
CREATE TABLE IF NOT EXISTS question_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    question_key VARCHAR(16) REFERENCES questions(question_key) ON DELETE CASCADE,
    is_correct BOOLEAN NOT NULL,
    time_taken_ms INTEGER NOT NULL,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, question_key, attempted_at)
);

-- Create user_question_stats table (aggregate stats per user per question)
CREATE TABLE IF NOT EXISTS user_question_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    question_key VARCHAR(16) REFERENCES questions(question_key) ON DELETE CASCADE,
    total_attempts INTEGER DEFAULT 0,
    correct_attempts INTEGER DEFAULT 0,
    best_time_ms INTEGER,
    last_attempted_at TIMESTAMP,
    UNIQUE(user_id, question_key)
);

-- Create feed_view table (tracks what users have seen)
CREATE TABLE IF NOT EXISTS feed_views (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    post_key VARCHAR(16) REFERENCES posts(post_key) ON DELETE CASCADE,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_key)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_post_key ON posts(post_key);
CREATE INDEX IF NOT EXISTS idx_posts_book_title ON posts(book_title);
CREATE INDEX IF NOT EXISTS idx_questions_question_key ON questions(question_key);
CREATE INDEX IF NOT EXISTS idx_questions_post_key ON questions(post_key);
CREATE INDEX IF NOT EXISTS idx_question_attempts_user_id ON question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_question_key ON question_attempts(question_key);
CREATE INDEX IF NOT EXISTS idx_user_question_stats_user_id ON user_question_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_views_user_id ON feed_views(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_views_post_key ON feed_views(post_key);
