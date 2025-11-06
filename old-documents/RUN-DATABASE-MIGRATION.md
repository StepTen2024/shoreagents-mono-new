# 🚨 DATABASE MIGRATION REQUIRED

**Action Required:** Run Prisma migration to add `video_calls` table

---

## ⚡ QUICK START

```bash
# Run this command to apply the database changes:
pnpm prisma db push
```

---

## 📋 WHAT WILL BE ADDED

### New Table: `video_calls`

This table stores all video call logs including:
- Room information (name, URL)
- Participants (client & staff)
- Call status tracking
- Timestamps (started, answered, ended)
- Duration calculation
- Recording URL (future)

### New Enum: `CallStatus`

```
INITIATED - Call created, ringing
RINGING   - Actively ringing
ANSWERED  - Call accepted and ongoing
ENDED     - Call ended normally
MISSED    - Not answered in time
DECLINED  - Recipient declined
```

### Updated Relations

- `StaffUser.videoCalls` - One-to-many
- `ClientUser.videoCalls` - One-to-many

---

## 🔍 VERIFY MIGRATION

After running `pnpm prisma db push`, verify the table exists:

```sql
-- Check if table was created
SELECT * FROM video_calls LIMIT 1;

-- Check indexes
SHOW INDEXES FROM video_calls;
```

---

## ⚠️ IMPORTANT NOTES

1. **This is additive** - No existing data will be affected
2. **No data migration needed** - This is a new table
3. **Indexes included** - For optimal query performance
4. **Cascade deletes** - Calls deleted when user is deleted

---

## 🚀 AFTER MIGRATION

1. ✅ Migration complete
2. ✅ Add `DAILY_API_KEY` to `.env.local`
3. ✅ Restart server: `pnpm dev`
4. ✅ Test video calling feature
5. ✅ Check call logs in database

---

**Run the migration now to enable video calling!** 📹✨

