# Vercel میں MONGODB_URI Update کریں

## ضروری Steps:

### Step 1: MongoDB Atlas میں نیا Database بنائیں

1. https://cloud.mongodb.com پر جائیں
2. اپنے Cluster کو click کریں
3. **Collections** tab
4. **+ Create Database**
5. یہ بھریں:
   - Database Name: `email_ai`
   - Collection Name: `users`
6. **Create** دبائیں

---

### Step 2: Vercel میں جائیں

1. https://vercel.com پر جائیں
2. اپنا project تلاش کریں: `email-ai-backend`
3. **Settings** tab کھولیں

---

### Step 3: Environment Variables Update کریں

1. **Settings** → **Environment Variables**
2. `MONGODB_URI` variable find کریں
3. **Edit** کلک کریں (pencil icon)
4. Value میں یہ تبدیلی کریں:

**تبدیلی:**
```diff
- /shazora?ssl=true
+ /email_ai?ssl=true
```

**مکمل URL ہوگی:**
```
mongodb://shahzaibzaman465_db_user:1YjxYvdLdF93UxL2@ac-pe3ljoi-shard-00-00.qlwkr1y.mongodb.net:27017,ac-pe3ljoi-shard-00-01.qlwkr1y.mongodb.net:27017,ac-pe3ljoi-shard-00-02.qlwkr1y.mongodb.net:27017/email_ai?ssl=true&replicaSet=atlas-fc2pxw-shard-0&authSource=admin&appName=Cluster0
```

5. **Save** کلک کریں

---

### Step 4: Automatic Redeploy

Vercel خود بخود redeploy کرے گا۔ 2-3 منٹ انتظار کریں۔

---

### Step 5: Test کریں

1. Admin panel پر جائیں
2. صفحہ refresh کریں
3. اب کام کرے گا! ✅

---

## فائدے:

✅ صاف نیا database
✅ کوئی duplicate errors نہیں
✅ Production ready
✅ Local اور Vercel میں الگ data

---

## Local میں Test کریں:

Local server شروع کریں - یہ نیا `email_ai` database استعمال کرے گا:

```bash
cd backend
npm run dev
```

Users اب `email_ai` database میں save ہوں گے۔
