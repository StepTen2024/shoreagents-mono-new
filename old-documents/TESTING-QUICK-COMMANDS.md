# 🚀 Quick Testing Commands

## 🔍 View Database While Testing:
```bash
npx prisma studio
# Opens at http://localhost:5555
```

## 🗄️ Reset Database (if needed):
```bash
npx prisma migrate reset
npx prisma generate
```

## 📊 Check Database Status:
```bash
npx prisma migrate status
```

## 🔄 If Server Hangs:
```bash
pkill -9 node
lsof -ti:3000 | xargs kill -9
npm run dev
```

## 🧹 Clear Cache & Restart:
```bash
rm -rf .next
npx prisma generate
npm run dev
```

## 📝 Check Logs:
```bash
# Server logs are in the terminal where npm run dev is running
# Check browser console for frontend errors
```

## 🐛 Debugging API Calls:
```bash
# Watch API requests in terminal
# Or use browser Network tab
```

---

## 🎯 Test URLs (Copy-Paste):
```
http://localhost:3000/login
http://localhost:3000/staff/onboarding
http://localhost:3000/admin/staff/onboarding
http://localhost:3000/staff/contract
```

---

**Quick Reference!** ✂️🔥

