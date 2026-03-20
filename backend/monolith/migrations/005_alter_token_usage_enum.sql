-- Migration: Extend token_usage.usage_type ENUM to include scenario_analysis
-- Date: 2026-03-19

ALTER TABLE token_usage
    MODIFY COLUMN usage_type ENUM('analysis', 'chat', 'scenario_analysis') NOT NULL;
