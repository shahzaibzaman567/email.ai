# MongoDB Database Update - email.ai کے لیے

## تبدیلی کیا ہوئی؟

**پہلے:**
- Database: `shazora`
- مسائل: duplicate keys, null emails

**اب:**
- Database: `email_ai` (نیا dedicated database)
- صاف ستھرا ڈیٹا

---

## Step 1: MongoDB Atlas میں نیا Database بنایں

1. MongoDB Atlas dashboard میں جائیں
2. اپنے Cluster کو click کریں
3. Collections tab میں جائیں
4. **+ Create Database** کلک کریں
5. یہ بھریں:
   - Database Name: `email_ai`
   - Collection Name: `users`
6. **Create** کریں

---

## Step 2: Local .env Update ✅ (Done)

```
MONGODB_URI=mongodb://shahzaibzaman465_db_user:...@ac-pe3ljoi-shard-00-00.qlwkr1y.mongodb.net:27017,ac-pe3ljoi-shard-00-01.qlwkr1y.mongodb.net:27017,ac-pe3ljoi-shard-00-02.qlwkr1y.mongodb.net:27017/email_ai?ssl=true&...
                                                                                                                                                                                                    ^^^^^^^^
                                                                                                                                                                            یہاں /email_ai ہے اب
```

---

## Step 3: Vercel میں Update کریں (ضروری!)

**Vercel Dashboard:**
1. اپنا project کھولیں
2. Settings → Environment Variables
3. `MONGODB_URI` کو find کریں
4. Value تبدیل کریں - اسے `/shazora` سے `/email_ai` میں تبدیل کریں

**بہتری:**
```diff
- MONGODB_URI=...mongodb.net:27017/shazora?ssl=true...
+ MONGODB_URI=...mongodb.net:27017/email_ai?ssl=true...
```

5. Save کریں → Vercel خود redeploy کرے گا

---

## Step 4: Code Commit کریں

```bash
cd e:\projects\email.ai
git add backend/.env
git commit -m "chore: switch to dedicated email_ai database"
git push
```

---

## فائدے:

✅ نیا صاف database
✅ کوئی duplicate key errors نہیں
✅ Production ready data
✅ Local اور Vercel دونوں میں الگ data نہیں

---

## اگر پرانا Data چاہیے:

اگر `shazora` سے data منتقل کرنا ہے تو:

```javascript
// MongoDB میں چلائیں
db.getSiblingDB('shazora').users.find().forEach(function(doc) {
  db.getSiblingDB('email_ai').users.insertOne(doc);
});
```

---

## مکمل ہونے کے بعد:

1. Local server restart کریں
2. Vercel میں redeploy ہونے تک انتظار کریں
3. Admin panel test کریں - کام کرے گا! ✅
