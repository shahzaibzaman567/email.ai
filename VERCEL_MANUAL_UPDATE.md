# Vercel میں Manual Update - Step by Step

## اگر Dashboard میں issue آ رہا ہے

### Option 1: Vercel CLI سے کریں (بہتر)

```bash
# Terminal میں یہ چلائیں
npm install -g vercel          # Install CLI

vercel login                    # Login کریں

cd e:\projects\email.ai\backend

vercel env add MONGODB_URI     # Add variable

# جب پوچھے:
# 1. Value کے لیے یہ paste کریں:
mongodb://shahzaibzaman465_db_user:1YjxYvdLdF93UxL2@ac-pe3ljoi-shard-00-00.qlwkr1y.mongodb.net:27017,ac-pe3ljoi-shard-00-01.qlwkr1y.mongodb.net:27017,ac-pe3ljoi-shard-00-02.qlwkr1y.mongodb.net:27017/email_ai?ssl=true&replicaSet=atlas-fc2pxw-shard-0&authSource=admin&appName=Cluster0

# 2. Environment: production چنیں

vercel env list                # Check کریں کہ add ہوگیا
```

---

### Option 2: Dashboard میں Update کریں

**اگر dashboard میں issue آ رہا ہے:**

1. پہلے **پرانا variable DELETE کریں:**
   - Vercel Dashboard
   - Project Settings
   - Environment Variables
   - پرانا `MONGODB_URI` تلاش کریں
   - **Delete** کریں (trash icon)
   - Confirm کریں

2. پھر **نیا add کریں:**
   - **+ Add** بٹن
   - Name: `MONGODB_URI`
   - Value: اوپر والی مکمل URL
   - Environment: `production` (checkbox)
   - **Save** کریں

---

### Option 3: GitHub Secrets سے (Advanced)

اگر ابھی بھی issue ہو تو:

1. GitHub repository میں جائیں
2. Settings → Secrets and variables → Actions
3. **New repository secret**
4. Name: `VERCEL_MONGODB_URI`
5. Value: MongoDB URI
6. Vercel build میں استعمال کریں

---

## Redeploy کریں

```bash
vercel redeploy
```

یا:
- Vercel Dashboard
- Deployments tab
- Latest deployment پر click
- **Redeploy** button

---

## Verify ہو گیا یا نہیں

```bash
# Vercel CLI سے check کریں
vercel env list

# یہ دکھنا چاہیے:
# MONGODB_URI (production)
```

---

## اگر ابھی بھی issue ہو

1. Browser cache clear کریں
2. Incognito window میں try کریں
3. Vercel logout اور دوبارہ login کریں
4. پوری URL copy-paste دوبارہ کریں (typo نہ ہو)

---

## کامیابی کی علامات

After redeploy:
- [ ] Admin panel کھولیں
- [ ] "Check Backend Configuration" دبائیں
- [ ] یہ دیکھیں:

```json
{
  "success": true,
  "ownerEmail": "shahzaibzaman.official@gmail.com",
  "nodeEnv": "production"
}
```

- [ ] Admin dashboard stats دیکھیں
- [ ] کوئی errors نہیں!

✅ مکمل!
