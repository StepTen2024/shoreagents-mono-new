# 🤖 NOVA - QUICK START GUIDE

## 🚀 Run These Commands (In Order):

```bash
# 1. Get the GUNTING branch
git fetch origin
git checkout Gunting-Project-Scissor
git pull origin Gunting-Project-Scissor

# 2. Install dependencies
npm install

# 3. Generate Prisma Client
npx prisma generate

# 4. Run database migration
npx prisma migrate dev --name gunting-onboarding-system

# 5. Start dev server
npm run dev
```

---

## 🧪 Then Test These URLs:

1. **Login:** http://localhost:3000/login
2. **Staff Onboarding:** http://localhost:3000/staff/onboarding
3. **Admin Verification:** http://localhost:3000/admin/staff/onboarding

---

## 📋 Check All 8 Steps Work:
✅ Personal Info  
✅ Resume Upload  
✅ Government ID  
✅ Education  
✅ Medical Info  
✅ Data Privacy  
✅ Signature  
✅ Emergency Contact  

---

## 🐛 Found a Bug?
Comment on GitHub Issue #77 or Slack #gunting

## ✅ When Done:
Report to Stephen & team that migration is complete!

---

**Full checklist:** See `NOVA-MIGRATION-CHECKLIST.md`

**Let's go! 🤖✂️🔥**

