# Trade Verse — Vercel Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (free) → vercel.com
- Neon account (free Postgres) → neon.tech
- Firebase project with Google Auth enabled

---

## Step 1 — Set up Neon (Free PostgreSQL)

1. Go to https://neon.tech and sign up free
2. Create a new project → name it `tradeverse`
3. Copy the **Connection String** (looks like `postgresql://user:pass@host/db?sslmode=require`)

---

## Step 2 — Get Firebase Service Account Key

1. Go to https://console.firebase.google.com
2. Select your project → **Project Settings** (gear icon)
3. Click **Service Accounts** tab
4. Click **Generate new private key** → download the JSON file
5. Open the JSON file and copy ALL its contents

---

## Step 3 — Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/tradeverse.git
git push -u origin main
```

---

## Step 4 — Deploy on Vercel

1. Go to https://vercel.com → **Add New Project**
2. Import your GitHub repo
3. Framework: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Click **Environment Variables** and add:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Neon connection string |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | The full JSON from Step 2 (paste as-is) |

7. Click **Deploy**

---

## Step 5 — Push DB Schema to Neon

After deploy, run this once locally:

```bash
npm install
DATABASE_URL="your-neon-connection-string" npm run db:push
```

This creates all the tables in your Neon database.

---

## Step 6 — Enable Firebase Google Auth

1. Firebase Console → **Authentication** → **Sign-in method**
2. Enable **Google**
3. Add your Vercel deployment URL to **Authorized domains**
   - e.g. `tradeverse.vercel.app`

---

That's it! Your app is live.
