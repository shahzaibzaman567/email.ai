# Production Deployment Checklist

## ✅ Local میں Test کریں

```bash
cd backend
npm run build      # ✅ Pass کیا
npm run dev        # ✅ Server running
```

---

## 🚀 Production Deploy - Vercel میں

### Step 1: MongoDB Atlas - نیا Database (اگر ابھی نہیں)

- [ ] MongoDB Atlas میں جائیں
- [ ] نیا database بنائیں: `email_ai`
- [ ] Collection: `users`

### Step 2: Vercel - Environment Variables Update

**Vercel Dashboard:**
1. [ ] Project کھولیں
2. [ ] Settings → Environment Variables
3. [ ] `MONGODB_URI` تلاش کریں
4. [ ] Edit کریں: `/shazora` → `/email_ai`
5. [ ] Save کریں

### Step 3: Code Push (آپشنل - Auto Redeploy)

```bash
cd e:\projects\email.ai
git add .
git commit -m "chore: production ready - email_ai database"
git push
```

### Step 4: Vercel Automatic Redeploy

- [ ] GitHub push کریں
- [ ] Vercel خود بخود redeploy کرے گا
- [ ] 2-3 منٹ انتظار کریں
- [ ] Deployments میں "Success" دیکھیں

---

## 🧪 Testing After Deployment

### Test 1: Admin Panel

1. [ ] Frontend پر جائیں
2. [ ] Admin Panel open کریں
3. [ ] "Check Backend Configuration" دبائیں
4. [ ] یہ دیکھیں:
   ```json
   {
     "success": true,
     "ownerEmail": "shahzaibzaman.official@gmail.com",
     "nodeEnv": "production"
   }
   ```

### Test 2: Admin Dashboard

1. [ ] Admin stats دیکھیں
2. [ ] کوئی errors نہیں ہونی چاہیے
3. [ ] صاف data دیکھنا چاہیے

### Test 3: Normal User Features

1. [ ] Dashboard کھولیں
2. [ ] Leads دیکھیں
3. [ ] Campaign بنائیں
4. [ ] Email بھیجیں

---

## 📊 Database Verification

**MongoDB Atlas میں check کریں:**

```javascript
// Collection stats
db.users.stats()

// User count
db.users.countDocuments()

// Check admin user
db.users.findOne({ role: "owner" })
```

---

## 🎯 Expected Results

✅ Admin panel کام کرے
✅ کوئی errors نہیں
✅ Database میں `email_ai` میں data save ہو
✅ Vercel logs میں "User authenticated" with isOwner: true

---

## ❌ اگر کچھ غلط ہو

### Admin panel still failing?

Check:
1. Vercel MONGODB_URI = `/email_ai` ہے؟
2. Clerk OWNER_EMAIL صحیح ہے؟
3. Vercel logs میں کوئی error؟

### Database نہیں ملا?

```javascript
// MongoDB میں check کریں
show dbs         // email_ai ہونی چاہیے
use email_ai
show collections // users ہونی چاہیے
```

---

## 🔄 Production Environment

```
Frontend: Vercel (Next.js)
Backend: Vercel (Express)
Database: MongoDB Atlas (email_ai)
Auth: Clerk
File Storage: N/A
Email: Gmail SMTP
```

---

## ✨ کامیاب ہونے کے نشانات

```
[2026-09-06T05:18:08.521Z] INFO Inngest client initialized
[2026-09-06T05:18:08.785Z] INFO Starting email-ai backend
[2026-09-06T05:18:11.353Z] INFO MongoDB connected
[2026-09-06T05:18:11.378Z] INFO Server listening on http://localhost:3001
```

Production میں یہی logs ہوں گے۔

---

## مکمل ہونے کے بعد

1. یوزرز کو بتائیں - app live ہے
2. Monitoring setup کریں
3. Backup لیں
4. Documentation update کریں

**کامیاب deployment! 🎉**
