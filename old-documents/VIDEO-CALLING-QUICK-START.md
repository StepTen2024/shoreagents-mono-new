# 📹 Video Calling - Quick Start Guide

**Get video calling working in 3 steps!**

---

## ⚡ STEP 1: Run Database Migration

```bash
pnpm prisma db push
```

This adds the `video_calls` table to your database.

**Expected Output:**
```
✔ Generated Prisma Client
✔ Changes applied to database
```

---

## ⚡ STEP 2: Add Daily.co API Key

1. **Get Your API Key:**
   - Go to: https://dashboard.daily.co/developers
   - Sign up/login
   - Copy your API key

2. **Add to `.env.local`:**
   ```bash
   DAILY_API_KEY="your-daily-api-key-here"
   ```

---

## ⚡ STEP 3: Restart Server

```bash
# Stop server (Ctrl+C)
pnpm dev
```

**Expected Output:**
```
✅ Socket server registered globally
[WebSocket] Server initialized
```

---

## 🎯 TEST IT!

### Test Client → Staff Call

1. **Login as Client:**
   ```
   http://localhost:3000/login/client
   Email: stephen@stepten.io
   Password: qwerty12345
   ```

2. **Click Video Button** (bottom right corner, purple/pink gradient)

3. **Select Staff Member** and click "Call"

4. **Open Staff Portal** (incognito/different browser):
   ```
   http://localhost:3000/login/staff
   Email: sarah.test@test.com
   Password: password123
   ```

5. **Staff Should See:** Incoming call modal with "Accept" button

6. **Click Accept** → Video call starts! 🎉

---

### Test Staff → Client Call

1. **In Staff Portal:** Click video button (bottom right)

2. **Select Client** and click "Call"

3. **Check Client Portal:** Should see incoming call notification

4. **Click Accept** → Video call starts! 🎉

---

## ✅ SUCCESS INDICATORS

### Browser Console (Both Sides)

```
[WebSocket] Connected to server
[WebSocket] User identified: [Name]
[WebSocket] User [Name] joined room: user:[userId]
```

### When Call is Initiated

**Caller Side:**
```
📞 CALL CREATED: { callId: '...', roomName: '...', ... }
```

**Recipient Side:**
```
📞 INCOMING CALL: { callerName: '...', roomUrl: '...', ... }
```

### Server Logs

```
✅ Socket server registered globally
📞 CALL CREATED: { callId: ..., initiatedBy: 'client', ... }
📤 Sent incoming-call notification to staff [userId]
```

---

## 🐛 TROUBLESHOOTING

### Issue: "Failed to create room"

**Fix:** Check that `DAILY_API_KEY` is in `.env.local` and restart server

---

### Issue: No incoming call notification

**Fix:** 
1. Check browser console for WebSocket connection
2. Make sure you're logged in on both sides
3. Restart server

---

### Issue: No video/audio in call

**Fix:**
1. Allow browser camera/microphone permissions
2. Check that you're on HTTPS (or localhost)

---

## 📚 FULL DOCUMENTATION

- **STAFF-VIDEO-CALLING-COMPLETE.md** - Complete technical docs
- **VIDEO-CALLING-BIDIRECTIONAL-COMPLETE.md** - Feature overview
- **RUN-DATABASE-MIGRATION.md** - Migration details

---

## 🎉 THAT'S IT!

You now have **fully functional bidirectional video calling** between clients and staff with real-time notifications!

---

**Questions?** Check the full documentation files or test with the credentials above! 🚀✨

