# 🎯 Create Linear Task for James

## Quick Start

1. **Get your Linear API key:**
   - Go to https://linear.app/shoreagents/settings/api
   - Create a new API key (or use existing)
   - Copy the key (starts with `lin_api_...`)

2. **Run the script:**
   ```bash
   cd "/Users/stephenatcheler/Desktop/Electron - Staff/gamified-dashboard (1)"
   
   # Option 1: Pass API key as argument
   node create-linear-task-james.js lin_api_YOUR_KEY_HERE
   
   # Option 2: Use environment variable
   export LINEAR_API_KEY="lin_api_YOUR_KEY_HERE"
   node create-linear-task-james.js
   ```

3. **Done!** The script will:
   - Create the Linear task
   - Print the task URL
   - Save task details to `LINEAR-TASK-JAMES-CREATED.md`

---

## What Gets Created

**Task Title:** 🔧 Polish Break System - 3 Outstanding Features

**Task Description:** Full details including:
- What's already done (95% complete!)
- 3 tasks for James:
  1. Away From Desk - Add reason selector
  2. Clock Out Confirmation - Add dialog
  3. Auto Clock Out - End of shift logout
- Testing instructions
- File references
- Code examples
- Success criteria

**Priority:** 2 (Medium)

**Estimate:** 8 hours

---

## Task Details

The Linear task contains comprehensive instructions for James to finish the Break System:

### Priority 1: Away From Desk Reason Selector
- Add modal asking "Why stepping away?"
- Save to `awayReason` database field
- Allow multiple Away breaks (unlimited)

### Priority 2: Clock Out Confirmation
- Show shift summary before clock out
- Prevent clock out if on active break
- Add admin override

### Priority 3: Auto Clock Out at End of Shift
- 15-minute warning
- 5-minute warning
- Auto-clock out at shift end
- Handle active breaks

---

## Files Included

1. **LINEAR-TASK-JAMES-BREAK-POLISH.json** - Task data
2. **create-linear-task-james.js** - Script to create task
3. **CREATE-LINEAR-TASK-README.md** - This file
4. **BREAK-SYSTEM-COMPLETE-OCT-15-2025.md** - Full system documentation

---

## Example Output

```
🚀 Creating Linear task for James...

📋 Task Details:
   Title: 🔧 Polish Break System - 3 Outstanding Features
   Priority: 2
   Estimate: 8 hours

✅ SUCCESS! Linear task created:

   🎯 Task ID: SHO-33
   📝 Title: 🔧 Polish Break System - 3 Outstanding Features
   🔗 URL: https://linear.app/shoreagents/issue/SHO-33/...
   ⏱️  Estimate: 8 hours
   🔥 Priority: 2

📄 Saving task info to LINEAR-TASK-JAMES-CREATED.md...
✅ Task info saved!

🎉 All done! Send this to James:
   https://linear.app/shoreagents/issue/SHO-33/...
```

---

## Troubleshooting

**Error: "Linear API key not provided"**
- Make sure you copied the full key (starts with `lin_api_`)
- Try passing as argument instead of environment variable

**Error: "Unauthorized"**
- Your API key may be expired
- Generate a new key at https://linear.app/settings/api

**Error: "Failed to create issue"**
- Check if you have permission to create issues
- Check network connection

---

## After Creating Task

1. **Share with James:**
   - Send him the Linear task URL
   - Point him to `BREAK-SYSTEM-COMPLETE-OCT-15-2025.md` for full docs

2. **Monitor Progress:**
   - James should update task status as he works
   - Expected completion: 1 day (5-8 hours)

3. **Test After Completion:**
   - Review James's test report
   - Verify all 3 features work
   - Deploy to production

---

## Related Documentation

- `BREAK-SYSTEM-COMPLETE-OCT-15-2025.md` - Complete system documentation
- `BREAK-TRACKER-STATUS-OCT-15-2025.md` - Bug tracking and fixes
- `SCHEDULED-BREAKS-FIX-OCT-15-2025.md` - Scheduler implementation details

---

**Ready to create the task? Run the script!** 🚀

