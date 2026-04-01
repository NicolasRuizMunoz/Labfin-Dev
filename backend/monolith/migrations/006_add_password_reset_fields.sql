-- Add password-reset columns to users table
ALTER TABLE users
  ADD COLUMN reset_code_hash       VARCHAR(255)  NULL,
  ADD COLUMN reset_code_expires_at DATETIME      NULL;
