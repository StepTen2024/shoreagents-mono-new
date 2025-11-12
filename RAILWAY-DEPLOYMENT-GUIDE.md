# 🚀 RAILWAY DEPLOYMENT GUIDE - SHOREAGENTS.AI

## ✅ STATUS: PRODUCTION DEPLOYMENT

**GOAL:** Deploy ShoreAgents to https://shoreagents.ai using Railway

**TIME:** 20-30 minutes

**COST:** ~$10-15/month

---

## 📋 PRE-DEPLOYMENT CHECKLIST

Before you start, make sure you have:

```
✅ GitHub account with access to: github.com/shoreagents/shoreagents-ai-monorepo
✅ Access to shoreagents.ai domain (Cloudflare, Namecheap, etc.)
✅ Supabase credentials (already in .env.local)
✅ All API keys (Claude, Linear, etc.)
✅ Credit card for Railway (first $5 free)
```

---

## 🎯 STEP 1: CREATE RAILWAY ACCOUNT

### **1.1 Sign Up**

1. Go to: **https://railway.app**
2. Click **"Start a New Project"**
3. Click **"Login with GitHub"**
4. Authorize Railway to access your GitHub

### **1.2 Verify Email**

1. Check your email
2. Click verification link
3. Complete profile setup

---

## 🚂 STEP 2: DEPLOY FROM GITHUB

### **2.1 Create New Project**

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Find and select: **`shoreagents/shoreagents-ai-monorepo`**
4. Select branch: **`stephen-branch-old-project`**
5. Click **"Deploy Now"**

### **2.2 Wait for Initial Deploy**

```
⏳ Railway will:
- Clone your repo
- Detect Next.js
- Install dependencies (npm install)
- Build your app (npm run build)
- Start server

This takes 5-10 minutes (first time only)
```

**🚨 IT WILL FAIL! That's expected - we need to add environment variables first.**

---

## 🔐 STEP 3: ADD ENVIRONMENT VARIABLES

### **3.1 Open Variables Tab**

1. In Railway dashboard, click your project
2. Click **"Variables"** tab on the left
3. Click **"RAW Editor"** (easier to paste all at once)

### **3.2 Copy-Paste ALL These Variables**

**🚨 IMPORTANT NOTES:**
- Database & Supabase keys below are CORRECT - use as-is
- API keys (Claude, Linear, Daily) show placeholders - GET REAL KEYS FROM YOUR `.env.local` FILE!
- Replace `YOUR_KEY_HERE` values with actual keys from `.env.local`

```bash
# ================================== 
# SUPABASE DATABASE CONNECTION
# ==================================
DATABASE_URL=postgresql://postgres.ijxxtnakmexuavidzzvx:KiLXZFZjpP5OeLE7@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true

DIRECT_URL=postgresql://postgres:KiLXZFZjpP5OeLE7@db.ijxxtnakmexuavidzzvx.supabase.co:5432/postgres

# ================================== 
# SUPABASE API KEYS
# ==================================
NEXT_PUBLIC_SUPABASE_URL=https://ijxxtnakmexuavidzzvx.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqeHh0bmFrcm1leHVhdmlkenp2eCIsInJvbGUiOiJhbm9uIiwiYXR0IjoxNzU5ODk2NjExLCJleHAiOjIwNzU0NzI2MTF9.n_bPISMPtd8Q79bHHKTJAqEKIdtYLavAbtmDScBUCHQ

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqeHh0bmFrcm1leHVhdmlkenp2eCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3NTk4OTY2MTEsImV4cCI6MjA3NTQ3MjYxMX0.a94ekp41bO9yDuDex_YI_9zs1-98oX75Zkv0zz_zn9w

# ================================== 
# NEXTAUTH (IMPORTANT!)
# ==================================
# 🚨 WILL UPDATE THIS AFTER GETTING RAILWAY URL!
NEXTAUTH_URL=https://shoreagents.ai
NEXTAUTH_SECRET=kJ8mQ2nP9vR3xT6yB1cE4fH7gK0lM5oN8pS2tV5wX9zA3bD6eG9hJ2kM4nQ7rT0u

# ================================== 
# APP CONFIGURATION
# ==================================
NEXT_PUBLIC_APP_URL=https://shoreagents.ai
NODE_ENV=production

# ================================== 
# CLAUDE AI
# ==================================
# 🚨 GET FROM .env.local FILE!
CLAUDE_API_KEY=sk-ant-api03-YOUR_KEY_HERE
CLAUDE_MODEL=claude-sonnet-4-20250514

# ================================== 
# CLOUDCONVERT API
# ==================================
# 🚨 GET FROM .env.local FILE!
CLOUDCONVERT_API_KEY=YOUR_CLOUDCONVERT_KEY_HERE

# ================================== 
# LINEAR API
# ==================================
# 🚨 GET FROM .env.local FILE!
LINEAR_API_KEY=lin_api_YOUR_KEY_HERE
LINEAR_WEBHOOK_SECRET=your-webhook-secret-here

# ================================== 
# DAILY.CO VIDEO
# ==================================
# 🚨 GET FROM .env.local FILE!
DAILY_API_KEY=YOUR_DAILY_KEY_HERE
NEXT_PUBLIC_DAILY_DOMAIN=shoreagents.daily.co
```

### **3.3 Click "Deploy"**

Railway will automatically redeploy with the new environment variables.

**⏳ Wait 5-10 minutes for build to complete.**

---

## 🌐 STEP 4: GET YOUR RAILWAY URL

### **4.1 Find Generated URL**

1. Go to **"Settings"** tab
2. Scroll to **"Domains"** section
3. You'll see something like: `shoreagents-ai-monorepo-production.up.railway.app`
4. **COPY THIS URL!**

### **4.2 Test the Railway URL**

1. Open the Railway URL in your browser
2. You should see the login page
3. Try logging in as client or admin
4. **✅ If it works, move to next step!**
5. **❌ If it fails, check "Troubleshooting" section below**

---

## 🏷️ STEP 5: CONNECT YOUR DOMAIN (shoreagents.ai)

### **5.1 Add Custom Domain in Railway**

1. In Railway project, go to **"Settings"** → **"Domains"**
2. Click **"Add Custom Domain"**
3. Enter: **`shoreagents.ai`**
4. Railway will show you DNS records to add

### **5.2 Update DNS (Cloudflare, Namecheap, etc.)**

**If using Cloudflare:**

1. Go to Cloudflare dashboard → Your domain → DNS
2. Delete any existing A or CNAME records for `@` (root domain)
3. Add new **CNAME** record:
   ```
   Type: CNAME
   Name: @
   Target: [Railway gave you this, like: shoreagents-ai-monorepo-production.up.railway.app]
   Proxy: OFF (orange cloud off)
   TTL: Auto
   ```
4. Add **CNAME** for www (optional):
   ```
   Type: CNAME
   Name: www
   Target: shoreagents.ai
   Proxy: OFF
   TTL: Auto
   ```

**If using Namecheap/GoDaddy:**

1. Go to domain management → DNS settings
2. Add **CNAME** record:
   ```
   Host: @
   Value: [Railway URL]
   TTL: Automatic
   ```

### **5.3 Wait for DNS Propagation**

```
⏳ DNS changes take 5-60 minutes to propagate
✅ Railway will auto-generate SSL certificate (HTTPS)
```

### **5.4 Verify Domain Works**

1. Visit: **https://shoreagents.ai**
2. Should show login page
3. SSL should be active (padlock icon)
4. **✅ If working, you're live!**

---

## 🔧 STEP 6: UPDATE ELECTRON CONFIG

### **6.1 Update API Base URL**

Edit: `electron/config/trackerConfig.js`

```javascript
module.exports = {
  // OLD:
  // API_BASE_URL: 'http://localhost:3000',
  
  // NEW:
  API_BASE_URL: 'https://shoreagents.ai',
  
  API_PERFORMANCE_ENDPOINT: '/api/analytics',
  
  // ... rest stays the same
}
```

### **6.2 Rebuild Electron App**

```bash
# In your project root:
npm run electron:build

# Or if using electron-builder:
npm run build:electron
```

### **6.3 Distribute New Electron App**

1. Share the new Electron build with your team
2. They install the new version
3. Electron now connects to https://shoreagents.ai
4. **✅ Staff can track from anywhere!**

---

## ✅ STEP 7: FINAL VERIFICATION

### **7.1 Test All User Types**

**Client Login:**
```
1. Go to: https://shoreagents.ai/login/client
2. Login with client credentials
3. Check: /client/analytics
4. Should see staff data ✅
```

**Admin Login:**
```
1. Go to: https://shoreagents.ai/login/admin
2. Login with admin credentials
3. Check: /admin/recruitment
4. Should see admin dashboard ✅
```

**Staff Electron:**
```
1. Staff opens Electron app (new version)
2. Logs in
3. Clicks "Start Shift"
4. Works for 5 minutes
5. Check client analytics - should see data ✅
```

### **7.2 Verify Key Features**

```
✅ Authentication works
✅ Database connected (staff list loads)
✅ File uploads work (Supabase storage)
✅ Time tracking works
✅ Analytics display correctly
✅ WebSockets connected (real-time updates)
✅ Screenshots uploading
```

---

## 🐛 TROUBLESHOOTING

### **Issue 1: Build Fails**

**Error:** `npm install failed` or `prisma generate failed`

**Fix:**
1. Check Railway build logs (Deployments tab)
2. Common issues:
   - Missing `DIRECT_URL` env variable
   - Wrong Prisma version
3. Add build command in Railway settings:
   ```
   npm install && npx prisma generate && npm run build
   ```

### **Issue 2: App Loads But Can't Login**

**Error:** "CSRF token mismatch" or "Callback URL mismatch"

**Fix:**
1. Check `NEXTAUTH_URL` is set to: `https://shoreagents.ai`
2. Redeploy after changing
3. Clear browser cookies and try again

### **Issue 3: Database Connection Fails**

**Error:** "Can't reach database server"

**Fix:**
1. Verify `DATABASE_URL` is correct
2. Check Supabase is not paused (free tier pauses after inactivity)
3. Go to Supabase dashboard → Settings → Pause project → Resume

### **Issue 4: Electron Can't Connect**

**Error:** "Failed to sync" or "Network error"

**Fix:**
1. Verify Electron `API_BASE_URL` is: `https://shoreagents.ai`
2. Check Railway app is running (not crashed)
3. Verify SSL certificate is active (https not http)
4. Restart Electron app

### **Issue 5: Domain Not Working**

**Error:** "This site can't be reached"

**Fix:**
1. Check DNS records are correct (CNAME pointing to Railway)
2. Wait longer (DNS can take up to 48 hours, usually 10-30 mins)
3. Check domain is not expired
4. Try visiting Railway URL directly - if that works, it's DNS issue

### **Issue 6: WebSockets Not Working**

**Error:** Real-time features not updating

**Fix:**
1. Railway supports WebSockets by default ✅
2. Check browser console for WS errors
3. Verify firewall not blocking WebSocket connections
4. Railway should auto-handle WS upgrade requests

---

## 💰 PRICING BREAKDOWN

### **Railway Costs:**

```
Starter Plan (Hobby): $5/month
- 500 hours of execution time
- $0.01/hour after that
- Enough for development/small team

Pro Plan: $20/month
- Unlimited execution time
- Priority support
- Better for production

Expected Monthly Cost: $10-20 for your usage
```

### **Total Monthly Costs:**

```
Railway (App Hosting):     $10-20/month
Supabase (Database):       $0/month (current usage - free tier)
Domain (shoreagents.ai):   ~$12/year (already paid?)
SSL Certificate:           $0 (Railway provides free)

TOTAL: ~$10-20/month
```

---

## 🎉 SUCCESS CHECKLIST

Mark off each item as you complete it:

```
□ Railway account created
□ GitHub repo connected
□ Environment variables added
□ App deployed successfully
□ Railway URL tested and working
□ Custom domain (shoreagents.ai) connected
□ DNS records updated
□ Domain verified (SSL active)
□ Electron config updated to production URL
□ Electron app rebuilt and distributed
□ Client login tested
□ Admin login tested
□ Staff Electron tested
□ Analytics showing data
□ Time tracking working
□ All team members have new Electron build
```

**When all ✅ = YOU'RE LIVE! 🚀**

---

## 📞 SUPPORT

### **If Stuck:**

1. **Railway Issues:** Check Railway docs - https://docs.railway.app
2. **Supabase Issues:** Check Supabase dashboard for errors
3. **DNS Issues:** Use https://dnschecker.org to verify propagation
4. **Electron Issues:** Check Electron console logs (F12 in Electron)

### **Railway Support:**

- Discord: https://discord.gg/railway
- Docs: https://docs.railway.app
- Status: https://status.railway.app

---

## 🔄 AUTO-DEPLOYMENT SETUP

**After initial deploy, Railway auto-deploys on git push!**

```bash
# Make changes to code
git add .
git commit -m "New feature"
git push origin stephen-branch-old-project

# Railway automatically:
1. Detects new commit
2. Pulls latest code
3. Runs build
4. Deploys to production

# Takes ~5 minutes
# Zero downtime deployment ✅
```

---

## 🎯 POST-DEPLOYMENT TASKS

### **Immediate:**
```
1. ✅ Share new Electron app with all staff
2. ✅ Update bookmarks to shoreagents.ai
3. ✅ Test all critical features
4. ✅ Monitor Railway logs for errors
```

### **Within 24 Hours:**
```
1. ✅ Set up Railway notifications (Slack/Email)
2. ✅ Configure automatic backups in Supabase
3. ✅ Set up error monitoring (Sentry optional)
4. ✅ Document any custom processes
```

### **Ongoing:**
```
1. ✅ Monitor Railway usage/costs
2. ✅ Keep Supabase backups current
3. ✅ Update Electron app when needed
4. ✅ Review analytics weekly
```

---

## 🔐 SECURITY CHECKLIST

```
✅ All env variables in Railway (not in code)
✅ NEXTAUTH_SECRET is strong and unique
✅ Supabase RLS policies enabled
✅ SSL/HTTPS active on domain
✅ Database not publicly accessible
✅ API keys not exposed in frontend
✅ Admin routes protected by auth
```

---

## 📊 MONITORING

### **Railway Dashboard:**
```
- Deployments: See all builds and their status
- Metrics: CPU, Memory, Network usage
- Logs: Real-time application logs
- Settings: Manage env variables, scaling
```

### **Supabase Dashboard:**
```
- Database: Monitor queries and performance
- Storage: Check file uploads
- Auth: Monitor user logins
- Logs: Database errors and warnings
```

---

## 🚀 YOU'RE READY!

**Follow these steps in order and your app will be live on shoreagents.ai!**

**Estimated Total Time:** 20-30 minutes (excluding DNS propagation)

**Difficulty:** Easy (just follow steps!)

---

**Good luck! 🔥**

**Created:** November 6, 2025
**Last Updated:** November 6, 2025
**Branch:** stephen-branch-old-project
**Status:** ✅ PRODUCTION READY

