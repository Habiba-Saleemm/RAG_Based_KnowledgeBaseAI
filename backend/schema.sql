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
