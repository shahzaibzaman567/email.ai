# Cold Email Settings - صحیح طریقہ

## مسئلہ ختم کر دیا! ✅

"Invalid identifier format" error ab nahi ayega. Backend mein validation schema add ki.

---

## Cold Email Settings - Data Format

### 📧 SMTP Settings (Gmail ke liye)

```
SMTP Host:        smtp.gmail.com
SMTP Port:        587
Email Address:    shahzaibzaman465@gmail.com
App Password:     (Google App Password)
From Name:        Shahzaib Zaman
```

**Gmail App Password kaise bnao:**
1. Google Account mein jao
2. Security → App Passwords
3. "Mail" aur "Windows Computer" select karo
4. Password generate hoga - copy karo

---

### 🤖 Groq API Settings

```
Groq API Key:     gsk_.... (apna key)
```

**Free key kaise banao:**
1. https://console.groq.com par jao
2. API Keys section
3. Create new key
4. Paste it here

---

### ✍️ Content & Style Settings

**Service to Pitch:**
```
✅ Email automation platform
✅ CRM software
✅ Lead generation tool
```

**Target Business:**
```
✅ B2B SaaS companies
✅ Startups in Tech
✅ Small businesses
```

**Email Goal:**
```
✅ Schedule a call
✅ Get introduction
✅ Get feedback
```

**Tone:**
```
✅ Professional
✅ Friendly & Casual
✅ Formal
```

**Email Length:**
```
✅ Short (Under 100 words)
✅ Medium (100-200 words)
✅ Long (200+ words)
```

**Personalization Level:**
```
✅ Low - Generic template
✅ Medium - Some personalization
✅ High - Full personalization per lead
```

**Call to Action (CTA):**
```
✅ "Can we schedule a 15-min call?"
✅ "Would you be open to a quick chat?"
✅ "Can I send over some ideas?"
```

**Subject Line Mode:**
```
✅ AI Personalized per Lead (BEST)
✅ Same subject for everyone
✅ Custom instruction (tell AI how to create subject)
```

---

### ⏰ Schedule & Limits

```
Daily Limit:          100 (emails per day)
Start Time:           09:00 (9 AM)
End Time:             17:00 (5 PM)
Timezone:             UTC (or apna timezone)
```

**Time Format:** `HH:MM` (24-hour format)
```
✅ 09:00 (9 AM)
✅ 14:30 (2:30 PM)
✅ 17:00 (5 PM)
❌ 9:00 (GALAT - leading zero zaroori)
❌ 2:30 PM (GALAT - 24-hour format use karo)
```

**Daily Limit:**
```
✅ 50 (Safe - warmup)
✅ 100 (Normal)
✅ 200 (Aggressive)
❌ 1000+ (Gmail ban kar sakta hai)
```

---

### 👥 Signature

```
Best regards,
Shahzaib Zaman
Full Stack Web Developer
📧 shahzaibzaman.official@gmail.com
📱 +92 300 1234567
```

---

## صحیح Format کیا ہے؟

### ✅ SAHI Examples:

```
SMTP Port: 587
Daily Limit: 100
Start Time: 09:00
End Time: 17:00
Groq API Key: REDACTED
Signature: Best regards,
Shahzaib
```

### ❌ GALAT Examples:

```
SMTP Port: abc (number hona chahiye)
Daily Limit: -50 (negative nahi)
Start Time: 9:00 (09:00 hona chahiye - leading zero)
End Time: 25:00 (24-hour format nahi hai)
Groq API Key: gsk_... (dots paste mat karo, full key paste karo)
```

---

## Common Errors

### Error: "Invalid identifier format"
- **Matlab:** Koi field mein galat format data hai
- **Fix:** Upper wala guide dekho - har field ki format check karo

### Error: "SMTP user is required"
- **Matlab:** SMTP Host diya hai lekin user nahi
- **Fix:** Email Address fill karo

### Error: "Time must be in HH:MM format"
- **Matlab:** Time format galat hai
- **Fix:** 09:00 format mein likho (24-hour)

### Error: "Port must be between 1 and 65535"
- **Matlab:** Port number galat hai
- **Fix:** Gmail ke liye 587, Outlook ke liye 587 ya 25

---

## Save Settings - Step by Step

1. **SMTP Details fill karo** (Gmail)
   - Host: smtp.gmail.com
   - Port: 587
   - Email: apna email
   - App Password: generate kiya hua

2. **Groq API key paste karo**
   - https://console.groq.com se key lo
   - Paste karo

3. **Content style select karo**
   - Dropdown se select karo
   - Ya custom likho

4. **Schedule set karo**
   - Daily Limit: 100
   - Start Time: 09:00
   - End Time: 17:00

5. **Signature likho**

6. **Save Settings dabao**

---

## After Saving

✅ Settings saved honě chahiye
✅ No error message
✅ Ab campaigns bana sakte ho

---

## Testing

1. **Small test karo pehle:**
   - 5 leads select karo
   - Campaign launch karo
   - Check karo ke emails proper format mein hain

2. **Phir scale up karo:**
   - 50 emails bhejo
   - Response dekho
   - Improvements karo

---

**Sab clear? Ab Cold Email Settings mein data properly fill karo aur Save karo!** ✅
