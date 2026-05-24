-- Google Calendar OAuth integration
-- Stores per-user Google OAuth tokens so the backend can create calendar events
-- on the user's behalf, and tracks the calendar event id created per licitacion.

ALTER TABLE oauth_accounts
  ADD COLUMN access_token TEXT NULL,
  ADD COLUMN refresh_token TEXT NULL,
  ADD COLUMN token_expires_at DATETIME NULL,
  ADD COLUMN scopes TEXT NULL;

ALTER TABLE licitaciones
  ADD COLUMN google_calendar_event_id VARCHAR(255) NULL;
