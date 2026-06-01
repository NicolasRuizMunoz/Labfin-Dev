-- Remove the Google Calendar integration.
-- Drops the per-user OAuth token columns, the calendar-event tracking columns on
-- licitaciones, and the team_emails list (used only as calendar attendees).
--
-- Login with Google keeps working: it only uses oauth_accounts(provider, subject,
-- email, user_id), none of which are touched here.
--
-- Safe to run on existing databases. Fresh databases never get these columns
-- (the SQLAlchemy models no longer declare them). The dates fecha_vencimiento and
-- fecha_vencimiento_preguntas on licitaciones are kept on purpose.

ALTER TABLE oauth_accounts
  DROP COLUMN access_token,
  DROP COLUMN refresh_token,
  DROP COLUMN token_expires_at,
  DROP COLUMN scopes;

ALTER TABLE licitaciones
  DROP COLUMN google_calendar_event_id,
  DROP COLUMN google_calendar_event_id_preguntas;

ALTER TABLE organizations
  DROP COLUMN team_emails;