-- Connect to the new database
\c cssecdv_db;

-- Create a new user and grant privileges
CREATE USER secdvuser WITH PASSWORD 'root';
ALTER ROLE secdvuser SET client_encoding TO 'utf8';
ALTER ROLE secdvuser SET default_transaction_isolation TO 'read committed';
ALTER ROLE secdvuser SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE cssecdv_db TO secdvuser;

-- Create the users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,  
  email VARCHAR(255) NOT NULL UNIQUE,  
  username VARCHAR(50) NOT NULL UNIQUE,  
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL UNIQUE,  
  profile_image BYTEA,  
  password VARCHAR(255) NOT NULL,  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  role VARCHAR(20) NOT NULL,  
  ban_posting BOOLEAN DEFAULT FALSE, 
  ban_commenting BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE
);

INSERT INTO users (email, username, full_name, phone_number, password, role, profile_image)
VALUES 
('user@example.com', 'JohnDoe', 'John Doe', '09566724123', '$2a$10$w9hzJswdRJkUD2KAe2W9d.ODcISTI1VNaCN7w.GSPTmJvryisBXjG', 'user', NULL),
('user2@example.com', 'JohnDoe2', 'John Doe', '09566724666', '$2a$10$w9hzJswdRJkUD2KAe2W9d.ODcISTI1VNaCN7w.GSPTmJvryisBXjG', 'user', NULL),
('admin@example.com', 'Admin1', 'Admin User', '09566724321', '$2a$10$w9hzJswdRJkUD2KAe2W9d.ODcISTI1VNaCN7w.GSPTmJvryisBXjG', 'admin', NULL);

CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(50) UNIQUE,
  content TEXT NOT NULL,
  image BYTEA, 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_hidden BOOLEAN DEFAULT FALSE, 
  is_edited BOOLEAN DEFAULT FALSE, 
  comment_limit INT CHECK (comment_limit IS NULL OR comment_limit >= 0)  
);

CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_hidden BOOLEAN DEFAULT FALSE, 
  is_edited BOOLEAN DEFAULT FALSE 
);


INSERT INTO posts (user_id, title, slug, content, image, is_hidden, is_edited)
VALUES 
((SELECT id FROM users WHERE username = 'JohnDoe'), 'First Post', 'first_post', 'This is the content of the first post.', NULL, FALSE, FALSE);

INSERT INTO posts (user_id, title, slug, content, image, is_hidden, is_edited, comment_limit)
VALUES 
((SELECT id FROM users WHERE username = 'JohnDoe2'), 'Second Post', 'second_post', 'This is the content of the second post.', NULL, FALSE, FALSE, 1);

INSERT INTO posts (user_id, title, slug, content, image, is_hidden, is_edited, comment_limit)
VALUES 
((SELECT id FROM users WHERE username = 'JohnDoe2'), 'Third Post', 'third_post', 'This is the content of the second post.', NULL, FALSE, FALSE, 3);


INSERT INTO comments (post_id, user_id, content, is_hidden, is_edited)
VALUES 
((SELECT id FROM posts WHERE title = 'First Post'), (SELECT id FROM users WHERE username = 'JohnDoe'), 'Comment', FALSE, FALSE);

INSERT INTO comments (post_id, user_id, content, is_hidden, is_edited)
VALUES 
((SELECT id FROM posts WHERE title = 'Third Post'), (SELECT id FROM users WHERE username = 'JohnDoe2'), 'This is a comment on the third post.', FALSE, FALSE);