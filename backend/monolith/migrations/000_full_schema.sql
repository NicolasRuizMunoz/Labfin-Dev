-- ============================================================
-- LabFin / Evalitics — Schema completo para deploy desde cero
-- Correr UNA SOLA VEZ en una base de datos nueva vacía.
-- El backend crea las tablas base (users, organizations, etc.)
-- al iniciar. Este archivo agrega las columnas y tablas extra
-- que las migraciones individuales habrían aplicado en orden.
-- ============================================================

-- 001: Rol de usuario
ALTER TABLE users
    ADD COLUMN role ENUM('client', 'evalitics') NOT NULL DEFAULT 'client'
    AFTER hashed_password;

-- 002: Tracking de tokens OpenAI
CREATE TABLE token_usage (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    organization_id     INT NOT NULL,
    user_id             INT NOT NULL,
    usage_type          ENUM('analysis', 'chat', 'scenario_analysis') NOT NULL,
    model               VARCHAR(50) NOT NULL,
    prompt_tokens       INT NOT NULL DEFAULT 0,
    completion_tokens   INT NOT NULL DEFAULT 0,
    total_tokens        INT NOT NULL DEFAULT 0,
    estimated_cost_usd  DECIMAL(10, 6) NOT NULL DEFAULT 0,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_token_usage_org  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_token_usage_user FOREIGN KEY (user_id)         REFERENCES users(id)         ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_token_usage_org_created ON token_usage (organization_id, created_at);
CREATE INDEX idx_token_usage_org_type    ON token_usage (organization_id, usage_type);
CREATE INDEX idx_token_usage_user        ON token_usage (user_id);

-- 003: Escenarios hipotéticos
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

-- 004: Simulaciones y análisis
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

    CONSTRAINT fk_simulaciones_lic  FOREIGN KEY (licitacion_id)   REFERENCES licitaciones(id)  ON DELETE CASCADE,
    CONSTRAINT fk_simulaciones_org  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_simulaciones_user FOREIGN KEY (created_by)      REFERENCES users(id)         ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_simulaciones_lic ON simulaciones (licitacion_id);
CREATE INDEX idx_simulaciones_org ON simulaciones (organization_id);

CREATE TABLE simulacion_escenarios (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    simulacion_id INT NOT NULL,
    escenario_id  INT NOT NULL,

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

-- 006: Campos para recuperación de contraseña
ALTER TABLE users
    ADD COLUMN reset_code_hash       VARCHAR(255) NULL,
    ADD COLUMN reset_code_expires_at DATETIME     NULL;
