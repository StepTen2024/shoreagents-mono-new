-- ============================================
-- 🎮 GAMIFICATION SYSTEM - Daily Staff Scores
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS staff_gamified_daily (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "staffUserId" TEXT NOT NULL,
    date TIMESTAMP(3) NOT NULL,
    
    -- 🎯 DAILY SCORE (0-100)
    "totalScore" INTEGER NOT NULL,
    
    -- 📊 SCORE BREAKDOWN
    "attendanceScore" INTEGER NOT NULL,
    "breakScore" INTEGER NOT NULL,
    "activityScore" INTEGER NOT NULL,
    "focusScore" INTEGER NOT NULL,
    
    -- 🏆 ACHIEVEMENTS
    achievements TEXT[] DEFAULT '{}',
    
    -- 📈 METRICS SNAPSHOT
    "clockedInAt" TIMESTAMP(3),
    "clockedOutAt" TIMESTAMP(3),
    "wasLate" BOOLEAN DEFAULT false,
    "lateBy" INTEGER,
    "wasEarly" BOOLEAN DEFAULT false,
    "earlyBy" INTEGER,
    
    "totalBreaks" INTEGER DEFAULT 0,
    "activeTime" INTEGER DEFAULT 0,
    "idleTime" INTEGER DEFAULT 0,
    keystrokes INTEGER DEFAULT 0,
    "mouseClicks" INTEGER DEFAULT 0,
    
    -- 🎮 GAMIFICATION
    "energyLevel" TEXT NOT NULL,
    streak INTEGER DEFAULT 1,
    
    -- 📅 METADATA
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 🔗 FOREIGN KEY
    CONSTRAINT staff_gamified_daily_staffUserId_fkey 
        FOREIGN KEY ("staffUserId") 
        REFERENCES staff_users(id) 
        ON DELETE CASCADE,
    
    -- 🚫 UNIQUE: One record per staff per day
    UNIQUE("staffUserId", date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "staff_gamified_daily_date_idx" ON staff_gamified_daily(date);
CREATE INDEX IF NOT EXISTS "staff_gamified_daily_totalScore_idx" ON staff_gamified_daily("totalScore");
CREATE INDEX IF NOT EXISTS "staff_gamified_daily_staffUserId_date_idx" ON staff_gamified_daily("staffUserId", date);

-- ============================================
-- ✅ DONE! Table created successfully
-- ============================================

