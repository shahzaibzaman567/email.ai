# email.ai — AI-Powered Cold Email Automation

A complete full-stack SaaS for automated, AI-personalized cold email outreach. Users can import leads, set their Groq AI guidelines, and dispatch automated sequences that run via background jobs.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TailwindCSS, shadcn/ui, Three.js, Clerk Auth
- **Backend**: Express, TypeScript, Mongoose, Node.js
- **Database**: MongoDB
- **AI Integration**: Groq (Llama 3.3) — Users provide their own keys, or fall back to platform default
- **Background Jobs**: Inngest (handles reliable email dispatching and AI generation)
- **Emails**: Nodemailer / SMTP

---

## Local Development Setup

### 1. Prerequisites
- Node.js 20+
- MongoDB instance (local or Atlas)
- Clerk account
- Groq account

### 2. Environment Variables

Create `.env` files in both the frontend and backend directories. Use the provided `.env.example` files as templates.

**Backend (`backend/.env`)**
```env
# Server
NODE_ENV=development
PORT=3001

# Database (MongoDB)
MONGODB_URI=mongodb://localhost:27017/email_ai

# Clerk authentication (From Clerk Dashboard)
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...

# Frontend origin (CORS)
CLIENT_URL=http://localhost:3000

# Owner account (admin panel access)
OWNER_EMAIL=your.email@gmail.com

# AI — Groq (fallback if user has no personal key set in settings)
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_BASE_URL=https://api.groq.com/openai/v1

# Email sending (SMTP) — fill these in to send real emails
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com

# When true, emails are logged instead of sent (safe for local testing)
EMAIL_TEST_MODE=true

# Minimum interval between outbound emails (application-level throttling)
EMAIL_MIN_INTERVAL_MS=1000
```

**Frontend (`frontend/.env`)**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Ensure this points to your deployed backend in production
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### 3. Installation & Running

Install dependencies for both folders:
```bash
cd backend && npm install
cd ../frontend && npm install
```

Start the application (you will need 3 terminal tabs):

**Tab 1: Backend**
```bash
cd backend
npm run dev
```

**Tab 2: Frontend**
```bash
cd frontend
npm run dev
```

**Tab 3: Inngest Dev Server (For background jobs)**
```bash
npx inngest-cli@latest dev
```
*(This starts the local Inngest server so the backend can process background jobs like generating and sending emails).*

---

## Production Deployment Guide

### 1. Database
Deploy a MongoDB cluster (e.g., MongoDB Atlas). Get the connection string and set `MONGODB_URI`.

### 2. Authentication (Clerk)
- Switch your Clerk instance to **Production**.
- Get your Production API keys and update the environment variables.
- Set up your redirect URLs in Clerk to point to your production domain.

### 3. Backend Deployment (Render, Heroku, or VPS)
- Build the backend: `npm run build`
- Start the server: `npm start`
- **Required Env Vars**: 
  - `NODE_ENV=production`
  - `MONGODB_URI`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`
  - `CLIENT_URL` (e.g. `https://email.ai`)
  - `GROQ_API_KEY` (platform fallback)
  - `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM`
  - `EMAIL_TEST_MODE=false` (to actually send emails)
  - `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` (Get these from Inngest Cloud)

### 4. Background Jobs (Inngest Cloud)
- Create an account at [Inngest](https://inngest.com).
- Link your deployed backend URL (e.g., `https://api.email.ai/api/inngest`).
- Get your Event Key and Signing Key, and add them to your backend environment variables.

### 5. Frontend Deployment (Vercel)
- Deploy the `frontend` folder to Vercel.
- **Required Env Vars**:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `NEXT_PUBLIC_BACKEND_URL` (e.g., `https://api.email.ai`)

---

## Features

- **User Provided Groq API Keys**: Users securely add their own Groq keys in Settings.
- **Background Processing**: Emails are generated via Llama 3.3 and dispatched asynchronously using Inngest to prevent timeouts.
- **Admin Panel**: The owner can view platform metrics (Total Users, Daily Sent Emails, Daily Active Users) via a hidden Admin dashboard.
- **Campaign Analytics**: Track delivery status and personalization errors directly from the Sent Emails UI.
- **Dynamic Neon UI**: A responsive, modern landing page built with Three.js.
