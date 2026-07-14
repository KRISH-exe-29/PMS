-- Migration: Add is_manual_progress to projects table
-- Purpose: Support the "Override Auto-Calculation" feature on the frontend
-- Date: 2026-07-14

ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_manual_progress BOOLEAN DEFAULT false;
