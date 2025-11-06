# 🔧 SERVER FIX GUIDE - GET YOUR PROJECT RUNNING

## 🚨 CURRENT PROBLEMS IDENTIFIED

### 1. **MISSING ENVIRONMENT FILE** ❌
**Problem:** No `.env.local` file exists  
**Impact:** Database connections fail, API keys missing, server can't function properly

### 2. **BPOC DATABASE TIMEOUT** ❌
**Problem:** `BPOC_DATABASE_URL` not configured in environment  
**Impact:** Candidate recruitment features fail with timeout errors

### 3. **EventEmitter MEMORY LEAK** ⚠️
**Problem:** Server has too many event listeners (11 vs max 10)  
**Impact:** Server degrades over time, potential crashes

### 4. **DELETED package-lock.json** ⚠️
**Problem:** Dependency lock file removed  
**Impact:** Potential version conflicts

---

## ✅ STEP-BY-STEP FIX (DO IN ORDER)

### STEP 1: Stop the Server
```bash
# Press Ctrl+C in your terminal to stop the server
```

---

### STEP 2: Create Your Environment File

**ACTION:** Create a new file named `.env.local` in your project root

```bash
cd /Users/stephenatcheler/Documents/GitHub/shoreagents-ai-monorepo
touch .env.local
```

Then add this content (you'll need to fill in your actual credentials):

```env
# ==================================
# SUPABASE DATABASE CONNECTION
# ==================================
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# ==================================
# SUPABASE API KEYS
# ==================================
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# ==================================
# BPOC DATABASE (CANDIDATE RECRUITMENT)
# ==================================
# This is your Railway/external candidate database
BPOC_DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]"

# ==================================
# APP CONFIGURATION
# ==================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-secret-here-change-this"

# ==================================
# DAILY.CO VIDEO CALLING
# ==================================
DAILY_API_KEY="your-daily-api-key-here"

# ==================================
# NODE ENVIRONMENT
# ==================================
NODE_ENV="development"
```

**WHERE TO GET THESE VALUES:**

1. **Supabase Database URLs:**
   - Go to: https://supabase.com/dashboard
   - Select your project → Settings → Database
   - Copy "Transaction" mode string → `DATABASE_URL`
   - Copy "Session" mode string → `DIRECT_URL`

2. **BPOC Database (Your Candidate DB):**
   - Check Railway, Heroku, or wherever your BPOC candidate database is hosted
   - Get the PostgreSQL connection string
   - **THIS IS CRITICAL FOR RECRUITMENT FEATURES**

3. **NEXTAUTH_SECRET:**
   - Generate a random secret: `openssl rand -base64 32`
   - Or use: https://generate-secret.vercel.app/32

---

### STEP 3: Fix EventEmitter Memory Leak

**File to fix:** `server.js`

The problem is in the `startBreakAutoStartJob` function - it's adding event listeners every time.

**FIX:** Add this line at the top of `server.js` after line 10:

```javascript
// Fix EventEmitter memory leak warning
require('events').EventEmitter.defaultMaxListeners = 15;
```

This will increase the limit to 15 listeners.

---

### STEP 4: Restore package-lock.json

```bash
npm install
# This will regenerate package-lock.json with correct versions
```

---

### STEP 5: Clear Next.js Cache

```bash
# Delete Next.js cache to fix 404 errors
rm -rf .next
```

---

### STEP 6: Verify Prisma Connection

```bash
# Generate Prisma client
npx prisma generate

# Test database connection
npx prisma db pull
```

---

### STEP 7: Start Server with Fresh State

```bash
# Make sure you're in the project directory
cd /Users/stephenatcheler/Documents/GitHub/shoreagents-ai-monorepo

# Start the dev server
npm run dev
```

---

## 🧪 VERIFICATION CHECKLIST

After server starts, test these:

### ✅ Server Health
- [ ] Server starts without errors
- [ ] No EventEmitter warnings in console
- [ ] WebSocket server connects: `✅ Socket server registered globally`

### ✅ Database Connections
- [ ] Supabase connection works (login works)
- [ ] BPOC database connects (candidates load in recruitment)
- [ ] No timeout errors in logs

### ✅ Features Working
- [ ] Login works (all 3 portals: client, admin, staff)
- [ ] Recruitment page loads candidates
- [ ] Staff profile loads (test with Vanessa)
- [ ] No 404 errors for CSS/JS chunks

---

## 🔍 COMMON ISSUES & SOLUTIONS

### Issue: "Can't connect to Supabase"
**Solution:** Check your `DATABASE_URL` is correct. Test with:
```bash
psql "your-database-url-here"
```

### Issue: "BPOC database unavailable"
**Solution:**
1. Make sure `BPOC_DATABASE_URL` is set in `.env.local`
2. Test connection to your candidate database
3. If you don't have BPOC database, comment out BPOC features temporarily

### Issue: "NextAuth error"
**Solution:** Make sure `NEXTAUTH_SECRET` is set and not empty

### Issue: Still getting 404s for chunks
**Solution:**
```bash
# Kill ALL Node processes
killall node
# Delete cache
rm -rf .next
rm -rf node_modules/.cache
# Restart
npm run dev
```

---

## 🎯 WHAT SHOULD WORK AFTER FIXES

1. ✅ Server starts cleanly on `http://localhost:3000`
2. ✅ No memory leak warnings
3. ✅ WebSocket connections stable
4. ✅ All 3 login portals work:
   - `/login/client` - Client portal
   - `/login/admin` - Admin portal
   - `/login/staff` - Staff portal
5. ✅ Recruitment features load candidates
6. ✅ Staff profiles display correctly (all data from your doc)
7. ✅ No database timeouts

---

## 📞 IF STILL BROKEN AFTER ALL STEPS

Run this diagnostic command:

```bash
# Check environment
echo "DATABASE_URL exists: $([ -n "$DATABASE_URL" ] && echo 'YES' || echo 'NO')"
echo "BPOC_DATABASE_URL exists: $([ -n "$BPOC_DATABASE_URL" ] && echo 'YES' || echo 'NO')"

# Check server logs for specific error
tail -n 50 server.log | grep -i error
```

---

## 🚀 QUICK START (If you just want to get running NOW)

```bash
# Stop everything
killall node

# Clean slate
rm -rf .next
rm -rf node_modules/.cache

# Create minimal .env.local (REPLACE WITH YOUR ACTUAL VALUES!)
cat > .env.local << 'EOF'
DATABASE_URL="your-supabase-url-here"
DIRECT_URL="your-supabase-direct-url-here"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-this-to-random-string"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-project-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
EOF

# Regenerate dependencies
npm install

# Start fresh
npm run dev
```

**THEN GO EDIT `.env.local` with your real credentials!**

---

## 📝 WHAT TO DO NEXT (After Server is Working)

According to your `StepTenClusterFuck.md`, you still need to:

1. **Test Vanessa's Login** - Verify staff can login at `/login/staff`
2. **Contract PDF Generation** - Implement PDF generation with signature
3. **End-to-End Testing** - Test complete hiring → onboarding → profile flow

But **GET THE SERVER STABLE FIRST** before working on features!

---

**Last Updated:** October 29, 2025
**Your Current Branch:** `2-Bags-Full-Stack-StepTen`

