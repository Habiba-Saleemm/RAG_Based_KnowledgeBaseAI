-- ============================================
-- Database: authdb
-- Run this file once to set up your database:
--   mysql -u root -p < schema.sql
-- ============================================

CREATE DATABASE IF NOT EXISTS authdb
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE authdb;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  -- bcrypt hashes are always 60 characters -> VARCHAR(60) is enough,
  -- 255 leaves headroom if you switch algorithms later
  password_hash VARCHAR(255) NOT NULL,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until DATETIME NULL,

  -- Forgot-password flow: we store a HASH of the reset token (never the
  -- raw token itself), plus when it expires.
  reset_token_hash CHAR(64) NULL,
  reset_token_expires DATETIME NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Email must be unique so no two accounts share it
  UNIQUE KEY uniq_email (email)
) ENGINE=InnoDB;

-- Server-side sessions: session_token cookies are opaque, random strings
-- handed to the browser at login. We store a HASH of each valid token here
-- (never the raw token) so the backend can actually verify a cookie
-- belongs to a real, unexpired login instead of just trusting its presence.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash CHAR(64) NOT NULL PRIMARY KEY,
  user_id INT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_sessions_user_id (user_id),
  INDEX idx_sessions_expires_at (expires_at),

  CONSTRAINT fk_sessions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- Dedicated least-privilege DB user (don't use root from the app)
-- Change 'StrongPassword123!' before running in production.
CREATE USER IF NOT EXISTS 'authapp'@'localhost' IDENTIFIED BY 'StrongPassword123!';
GRANT SELECT, INSERT, UPDATE ON authdb.users TO 'authapp'@'localhost';
GRANT SELECT, INSERT, DELETE ON authdb.sessions TO 'authapp'@'localhost';
FLUSH PRIVILEGES;



CREATE TABLE documents (
    id INT NOT NULL AUTO_INCREMENT,
    filename VARCHAR(255) NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    uploaded_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    INDEX ix_documents_id (id),
    INDEX ix_documents_content_hash (content_hash)
);

CREATE TABLE document_chunks (
    id INT NOT NULL AUTO_INCREMENT,
    document_id INT NOT NULL,
    question TEXT NULL,
    chunk_text TEXT NOT NULL,
    embedding TEXT NOT NULL,
    chunk_index INT NOT NULL,
    PRIMARY KEY (id),
    INDEX ix_document_chunks_id (id),
    INDEX ix_document_chunks_document_id (document_id)
);

CREATE TABLE user_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

select * from documents;

DROP TABLE document_chunks;

SELECT id, filename, content_hash FROM documents;

SELECT COUNT(*) FROM document_chunks;

SELECT COUNT(*) FROM document_chunks WHERE document_id = 4;

delete from documents where id = 4;
SELECT id, document_id, question, LEFT(chunk_text, 50), content_hash FROM document_chunks LIMIT 10;

SELECT question, chunk_text FROM document_chunks 
WHERE document_id = 4 AND question LIKE '%annual paid leave%';


SELECT id, question FROM document_chunks WHERE document_id = 4 ORDER BY id;

SELECT * FROM user_logs ORDER BY created_at DESC;

SELECT DISTINCT user_id FROM user_logs;

SELECT * FROM user_logs ORDER BY created_at DESC;