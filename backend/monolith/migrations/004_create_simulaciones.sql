-- Migration: Create simulaciones, simulacion_escenarios, analisis_simulacion tables
-- Date: 2026-03-19

CREATE TABLE simulaciones (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    licitacion_id   INT NOT NULL,
    organization_id INT NOT NULL,
    nombre          VARCHAR(255) NOT NULL,
    color           VARCHAR(7) NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      INT NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_simulaciones_lic  FOREIGN KEY (licitacion_id)   REFERENCES licitaciones(id)   ON DELETE CASCADE,
    CONSTRAINT fk_simulaciones_org  FOREIGN KEY (organization_id) REFERENCES organizations(id)  ON DELETE CASCADE,
    CONSTRAINT fk_simulaciones_user FOREIGN KEY (created_by)      REFERENCES users(id)          ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_simulaciones_lic ON simulaciones (licitacion_id);
CREATE INDEX idx_simulaciones_org ON simulaciones (organization_id);

CREATE TABLE simulacion_escenarios (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    simulacion_id  INT NOT NULL,
    escenario_id   INT NOT NULL,

    CONSTRAINT fk_simesc_sim FOREIGN KEY (simulacion_id) REFERENCES simulaciones(id) ON DELETE CASCADE,
    CONSTRAINT fk_simesc_esc FOREIGN KEY (escenario_id)  REFERENCES escenarios(id)   ON DELETE RESTRICT,
    UNIQUE KEY uq_sim_esc (simulacion_id, escenario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE analisis_simulacion (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    simulacion_id   INT NOT NULL,
    organization_id INT NOT NULL,
    analisis        TEXT NOT NULL,
    model           VARCHAR(100) NOT NULL,
    tokens_usados   INT NULL,
    curva_data      JSON NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_anasim_sim FOREIGN KEY (simulacion_id) REFERENCES simulaciones(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_anasim_sim ON analisis_simulacion (simulacion_id);
CREATE INDEX idx_anasim_org ON analisis_simulacion (organization_id);
