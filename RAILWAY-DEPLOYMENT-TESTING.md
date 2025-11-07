# 🚂 **RAILWAY DEPLOYMENT FOR TESTING**

**Purpose:** Deploy to Railway for centralized testing (not production yet)  
**Last Updated:** November 7, 2025

---

## 🎯 **WHY DEPLOY TO RAILWAY FOR TESTING?**

### **Current Problem (Local Testing):**
- ❌ Different computers, different environments
- ❌ Can't see their logs
- ❌ Screenshot-based debugging
- ❌ Network/firewall issues
- ❌ Slow iteration

### **Solution (Railway Testing):**
- ✅ **One central server** for all testers
- ✅ **Live logs** viewable from Railway dashboard
- ✅ **Same environment** for everyone
- ✅ **Real-time monitoring** from anywhere
- ✅ **Electron app** points to Railway URL
- ✅ **See exact errors** instantly

---

## 📋 **QUICK START (15 minutes)**

### **Step 1: Create Railway Account**
1. Go to https://railway.app
2. Sign up with GitHub
3. Link your repository: `shoreagents-mono-new`

### **Step 2: Create New Project**
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose `shoreagents-mono-new`
4. Railway will auto-detect Next.js

### **Step 3: Add Environment Variables**
In Railway dashboard, add these variables:

```bash
# Database (from Supabase)
DATABASE_URL="postgresql://postgres.xxx:xxx@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:xxx@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Auth (NextAuth)
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="https://your-railway-url.railway.app"  # Railway will provide this

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# BPOC Database (external recruitment DB)
BPOC_DATABASE_URL="postgresql://user:password@host:port/database"

# Optional: Anthropic AI
ANTHROPIC_API_KEY="sk-ant-xxx"  # If using AI features
```

### **Step 4: Configure Build Settings**
Railway should auto-detect, but verify:
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Node Version:** 20.x

### **Step 5: Deploy**
1. Click "Deploy"
2. Wait 3-5 minutes for build
3. Railway will give you a URL like: `https://shoreagents-testing.railway.app`

---

## 🔧 **UPDATE ELECTRON TO USE RAILWAY**

Once deployed, update Electron to connect to Railway instead of localhost:

### **File:** `electron/config/trackerConfig.js`

```javascript
module.exports = {
  // Tracking intervals (in milliseconds)
  TRACKING_INTERVAL: 5000,
  SYNC_INTERVAL: 10000,
  
  // API configuration - CHANGE THIS
  API_BASE_URL: 'https://shoreagents-testing.railway.app',  // ✅ YOUR RAILWAY URL
  API_PERFORMANCE_ENDPOINT: '/api/analytics',
  
  // ... rest of config
}
```

**Commit and push this change:**
```bash
git add electron/config/trackerConfig.js
git commit -m "🚂 Point Electron to Railway testing environment"
git push origin main
```

---

## 📊 **VIEWING LIVE LOGS ON RAILWAY**

### **To See Real-Time Logs:**
1. Go to Railway dashboard
2. Click your project
3. Click "Deployments" tab
4. Click "View Logs"

### **You'll See:**
- ✅ All API requests from Electron
- ✅ Analytics data being received
- ✅ Database queries
- ✅ Any errors in real-time
- ✅ Performance metrics updates

**Example logs you'll see:**
```
📊 [Performance API] Tracking for shift: Thursday
🖱️ Mouse: 210 movements, 30 clicks
⌨️ Keystrokes: 0
✅ [Performance API] INCREMENTING metrics
```

---

## 🎯 **TESTING WORKFLOW**

### **For Your Team (Staff Testing):**
1. Pull latest code: `git pull origin main`
2. Restart Electron app
3. App auto-connects to Railway
4. Login as staff
5. Clock in and work normally
6. All data goes to Railway

### **For You (Admin Monitoring):**
1. Open Railway dashboard for live logs
2. Open `https://shoreagents-testing.railway.app/admin/analytics`
3. See real-time data from all testers
4. Watch logs for errors
5. No screenshots needed - you see everything!

---

## ✅ **BENEFITS OF RAILWAY TESTING**

### **1. Centralized Debugging**
- See all logs in one place
- No screenshot exchange needed
- Real-time error monitoring

### **2. Consistent Environment**
- Everyone tests same codebase
- No "works on my machine" issues
- Same database, same APIs

### **3. Easy Iteration**
- Push code to GitHub → Auto-deploys to Railway
- Team tests immediately
- Fast feedback loop

### **4. Production-Ready Testing**
- Test with real network latency
- Test with real database connections
- Test Electron → Server communication
- Find issues before production

### **5. Remote Monitoring**
- Watch from anywhere
- Don't need to be on their PC
- See exactly what they're doing

---

## 🔄 **DEPLOYMENT WORKFLOW**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Make changes locally                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Test locally (optional)                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Push to GitHub: git push origin main                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Railway auto-deploys (2-3 min)                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Team tests on Railway URL                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. You monitor live logs                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Find issues → Fix → Push → Auto-deploy → Test again      │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ **RAILWAY-SPECIFIC FIXES**

### **1. WebSocket Support (for real-time tracking)**
Railway supports WebSockets by default, but verify in `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure WebSockets work on Railway
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  // Railway needs this for proper request handling
  output: 'standalone'
}

module.exports = nextConfig
```

### **2. Prisma Migration**
Railway will run `prisma generate` automatically, but for migrations:

**Option A: Use Supabase (recommended)**
- No migrations needed on Railway
- Database is already on Supabase
- Railway just connects to it

**Option B: Run migrations manually**
In Railway dashboard:
1. Go to Settings → Deploy
2. Add Build Command: `npm run build && npx prisma migrate deploy`

---

## 🚨 **TROUBLESHOOTING**

### **Issue 1: Build Fails**
**Check:**
- All env vars set correctly
- `DATABASE_URL` and `DIRECT_URL` both set
- Node version is 20.x

**Fix:**
- Re-deploy with correct variables
- Check Railway build logs for specific error

### **Issue 2: Electron Can't Connect**
**Check:**
- Electron config has correct Railway URL
- Railway app is deployed (green status)
- No typos in URL

**Fix:**
- Update `trackerConfig.js` with exact Railway URL
- Restart Electron app

### **Issue 3: Database Connection Errors**
**Check:**
- Supabase database is running
- Connection strings are correct
- IP whitelist allows Railway (Supabase should allow all by default)

**Fix:**
- Test connection strings locally first
- Check Supabase logs

### **Issue 4: Session/Auth Issues**
**Check:**
- `NEXTAUTH_URL` matches Railway URL
- `NEXTAUTH_SECRET` is set
- Cookies domain is correct

**Fix:**
- Update `NEXTAUTH_URL` after Railway gives you URL
- Re-deploy

---

## 💰 **RAILWAY PRICING**

**Free Tier (Hobby Plan):**
- $5/month credit
- Good for testing
- Sleeps after 30 min inactivity (can disable)

**Paid (Recommended for Testing):**
- ~$10-20/month for testing environment
- Always on
- Better performance

**Pro Tip:** Use free tier for initial testing, upgrade if needed.

---

## 📋 **CHECKLIST BEFORE GOING LIVE**

- [ ] Railway project created
- [ ] All env vars added
- [ ] App deployed successfully (green status)
- [ ] Can access `https://your-url.railway.app`
- [ ] Electron updated to Railway URL
- [ ] Team can login
- [ ] Tracking works (check logs)
- [ ] Admin dashboard shows data
- [ ] Live logs visible on Railway

---

## 🎯 **NEXT STEPS AFTER TESTING**

Once testing is complete on Railway:

1. **Create Production Deployment:**
   - Separate Railway project for production
   - Use production database
   - Use production domain

2. **Update Electron for Production:**
   - Point to production URL
   - Create production build
   - Distribute to team

3. **Set Up Monitoring:**
   - Railway alerts
   - Error tracking (Sentry)
   - Performance monitoring

---

## ✅ **SUMMARY: WHY RAILWAY MAKES TESTING EASIER**

| Feature | Local Testing | Railway Testing |
|---------|--------------|-----------------|
| **Environment** | Different per PC | Same for everyone |
| **Logs** | Screenshots only | Live dashboard |
| **Debugging** | Blind | Real-time |
| **Collaboration** | Difficult | Easy |
| **Iteration Speed** | Slow | Fast (auto-deploy) |
| **Network Issues** | Common | Rare |
| **Monitoring** | Manual | Automatic |
| **Data Consistency** | Varies | Consistent |

---

## 🚀 **READY TO DEPLOY?**

1. Set up Railway account
2. Deploy to Railway
3. Update Electron config
4. Push to GitHub
5. Team tests
6. Monitor live logs
7. Debug in real-time

**Your testing life just got 10X easier! 🎉**

