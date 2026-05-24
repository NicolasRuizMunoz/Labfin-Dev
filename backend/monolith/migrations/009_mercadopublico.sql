-- MercadoPúblico scraper:
--   1) Extiende `licitaciones` con campos provenientes de la API pública.
--   2) Crea `etiquetas_busqueda`: marcas configurables por organización para
--      filtrar y traer licitaciones automáticamente desde MercadoPúblico.

ALTER TABLE licitaciones
  ADD COLUMN codigo_externo VARCHAR(50) NULL,
  ADD COLUMN link_externo VARCHAR(500) NULL,
  ADD COLUMN organismo VARCHAR(255) NULL,
  ADD COLUMN region VARCHAR(100) NULL,
  ADD COLUMN monto_estimado DECIMAL(18,2) NULL,
  ADD COLUMN moneda VARCHAR(10) NULL,
  ADD COLUMN descripcion TEXT NULL,
  ADD COLUMN categoria VARCHAR(255) NULL,
  ADD COLUMN estado_mp VARCHAR(50) NULL,
  ADD COLUMN fuente VARCHAR(20) NOT NULL DEFAULT 'manual',
  ADD UNIQUE KEY uniq_lic_org_codigo (organization_id, codigo_externo);

CREATE TABLE etiquetas_busqueda (
  id INT PRIMARY KEY AUTO_INCREMENT,
  organization_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  keywords JSON NULL,
  regiones JSON NULL,
  categorias JSON NULL,
  monto_min DECIMAL(18,2) NULL,
  monto_max DECIMAL(18,2) NULL,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_etiqueta_org (organization_id),
  INDEX idx_etiqueta_activa (activa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
