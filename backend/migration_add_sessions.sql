-- migration_add_sessions.sql
-- Run this in MySQL Workbench ONCE to add server-side session storage.
-- Safe to run: only adds a new table, does NOT touch existing data.
--
-- Why: previously "session_token" was a random string handed to the
-- browser but never stored anywhere on the server, so ANY cookie value
-- named session_token would be treated as a valid login. This table lets
-- the backend actually verify a token belongs to a real, unexpired login.

USE authdb;

CREATE TABLE IF NOT EXISTS sessions (
  -- SHA-256 hex digest of the raw token. We never store the raw token,
  -- same principle as reset_token_hash for password resets.
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

GRANT SELECT, INSERT, DELETE ON authdb.sessions TO 'authapp'@'localhost';
FLUSH PRIVILEGES;
