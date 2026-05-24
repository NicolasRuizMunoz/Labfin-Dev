-- Prio 3 — Calendario:
--   1) Nueva fecha de vencimiento de preguntas y aclaraciones en licitaciones
--   2) Track del evento Calendar asociado a esa fecha de preguntas
--   3) Lista de correos del equipo (organización) para invitar como attendees
--      a los eventos creados desde LabFin, de modo que aparezcan en su Calendar.

ALTER TABLE licitaciones
  ADD COLUMN fecha_vencimiento_preguntas DATE NULL,
  ADD COLUMN google_calendar_event_id_preguntas VARCHAR(255) NULL;

ALTER TABLE organizations
  ADD COLUMN team_emails JSON NULL;
