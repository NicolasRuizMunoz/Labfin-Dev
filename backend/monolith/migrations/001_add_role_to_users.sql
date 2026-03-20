-- Migration: Add role column to users table
-- Date: 2026-03-19
-- Description: Adds ENUM role column with 'client' and 'evalitics' values.
--              All existing users default to 'client'.

ALTER TABLE users
    ADD COLUMN role ENUM('client', 'evalitics') NOT NULL DEFAULT 'client'
    AFTER hashed_password;

-- To manually promote a user to evalitics admin:
-- UPDATE users SET role = 'evalitics' WHERE email = 'admin@evalitics.com';
