-- Migration: Create token_usage table for OpenAI consumption tracking
-- Date: 2026-03-19

CREATE TABLE token_usage (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    user_id     INT NOT NULL,
    usage_type  ENUM('analysis', 'chat') NOT NULL,
    model       VARCHAR(50) NOT NULL,
    prompt_tokens     INT NOT NULL DEFAULT 0,
    completion_tokens INT NOT NULL DEFAULT 0,
    total_tokens      INT NOT NULL DEFAULT 0,
    estimated_cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_token_usage_org  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_token_usage_user FOREIGN KEY (user_id)         REFERENCES users(id)         ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_token_usage_org_created ON token_usage (organization_id, created_at);
CREATE INDEX idx_token_usage_org_type    ON token_usage (organization_id, usage_type);
CREATE INDEX idx_token_usage_user        ON token_usage (user_id);
