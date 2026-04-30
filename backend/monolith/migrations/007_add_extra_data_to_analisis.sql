-- Add structured payload column to analisis_licitaciones
-- Stores the full JSON block emitted by EVA: meta, scoring, breakeven, curvas, factores_externos, alertas
ALTER TABLE analisis_licitaciones
  ADD COLUMN extra_data JSON NULL;
