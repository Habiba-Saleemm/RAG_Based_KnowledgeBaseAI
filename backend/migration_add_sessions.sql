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

GRANT ALTER ON authdb.users TO 'authapp'@'localhost';
FLUSH PRIVILEGES;

GRANT ALL PRIVILEGES ON authdb.* TO 'authapp'@'localhost';
FLUSH PRIVILEGES;

ALTER TABLE document_chunks ADD COLUMN question TEXT NULL;

DELETE FROM document_chunks WHERE document_id = 4;
DELETE FROM documents WHERE id = 4;

select * from users;

DELETE FROM users 
WHERE id IN (3, 6, 8);

SELECT * FROM users ORDER BY id ASC;

ALTER TABLE users ADD COLUMN can_upload_documents BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN can_use_ai_chat BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN can_manage_faqs BOOLEAN NOT NULL DEFAULT FALSE;

SELECT id, name, email FROM users ORDER BY id;

DROP TABLE document_chunks;
DROP TABLE documents;

SELECT * FROM documents WHERE filename = 'test.txt';


SHOW TABLES;
