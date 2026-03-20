-- Migration: Create escenarios table
-- Date: 2026-03-19

CREATE TABLE escenarios (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    nombre          VARCHAR(255) NOT NULL,
    descripcion     TEXT NOT NULL,
    tipo            VARCHAR(100) NULL,
    parametros      JSON NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      INT NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_escenarios_org  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_escenarios_user FOREIGN KEY (created_by)      REFERENCES users(id)         ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_escenarios_org ON escenarios (organization_id);
