-- Migration: Add AI_AGENT to TaskSource enum
-- Date: November 21, 2025
-- Purpose: Allow AI to create tasks with proper source tracking

-- Add AI_AGENT value to existing TaskSource enum
ALTER TYPE "TaskSource" ADD VALUE IF NOT EXISTS 'AI_AGENT';

-- Verify the enum values
COMMENT ON TYPE "TaskSource" IS 'Task creation source: SELF (staff created for themselves), CLIENT (client created for staff), MANAGEMENT (management assigned), AI_AGENT (created by AI assistant)';

