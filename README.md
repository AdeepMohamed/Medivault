# 🏥 MediVault — Personal Medical Record Locker

> A production-ready, AI-powered full-stack application for secure personal medical record management.

**Stack**: React + Vite | Node.js + Express | Supabase (PostgreSQL + Storage) | Groq AI | Deployed on Vercel
---

## ✨ Features

- 🔐 **JWT Authentication** — Access + refresh tokens, bcrypt hashing
- 📁 **Medical Record Management** — Upload, categorize, version, search records
- ⬇️ **Local Disk Download** — Download any file to your local disk instantly
- 🕐 **Health Timeline** — Chronological view grouped by year
- 🤖 **AI Health Assistant** — Groq-powered chatbot + report summarization
- 🔗 **Secure Doctor Sharing** — OTP-verified share links + QR codes
- 💊 **Medication Tracker** — Active/inactive medications with prescription linking
- 📅 **Appointment Manager** — Schedule and track doctor appointments
- 📋 **Audit Logs** — Complete activity history
- 🛡️ **Admin Panel** — User management and system monitoring
- 🚀 **Vercel Ready** — Frontend + backend both deployable on Vercel

---

## ⚙️ Setup

### 1. Clone & Install

```bash
git clone <repo>
cd medivault
cd backend && npm install
cd ../frontend && npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) → Create a new project
2. Go to **SQL Editor** → Run the contents of `backend/src/config/migration.sql`
3. Go to **Storage** → Create a new bucket called `medical-records`
   - Set it to **Public** (so signed URLs work)
4. Go to **Project Settings → API** → Copy your `Project URL` and `service_role` key

### 3. Configure Backend Environment

```bash
cp backend/.env.example backend/.env
```

Fill in `backend/.env`:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_64_char_secret
JWT_REFRESH_SECRET=your_64_char_refresh_secret

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password

GROQ_API_KEY=your_groq_api_key
```

### 4. Configure Frontend Environment

```bash
# frontend/.env is already created
# For production, update VITE_API_URL to your Vercel backend URL
```

### 5. Run Locally

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

App runs at: http://localhost:5173

---

## 🚀 Deploy to Vercel

### Frontend Deployment

1. Push the `frontend/` folder to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Set **Root Directory** to `frontend`
4. Add environment variable: `VITE_API_URL=https://your-backend.vercel.app/api`

### Backend Deployment

1. Push the `backend/` folder to GitHub (or same repo)
2. Import project on Vercel
3. Set **Root Directory** to `backend`
4. Add all environment variables from `.env.example`
5. Set `FRONTEND_URL` to your deployed frontend URL

---

## 🔑 Getting API Keys

| Key | Source |
|---|---|
| `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY` | [Supabase Dashboard](https://app.supabase.com) → Project Settings → API |
| `GROQ_API_KEY` | [Groq Console](https://console.groq.com/keys) |
| `EMAIL_USER` & `EMAIL_PASS` | Gmail → [App Passwords](https://myaccount.google.com/apppasswords) |

---

## 📁 Project Structure

```
medivault/
├── backend/
│   ├── server.js              # Express entry point
│   ├── src/
│   │   ├── config/
│   │   │   ├── supabase.js    # Supabase client
│   │   │   └── migration.sql  # Database schema
│   │   ├── controllers/       # Business logic
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Auth, upload, error, rate limiting
│   │   └── services/          # AI, email, file, OTP, audit
│   └── .env.example
│
├── frontend/
│   └── src/
│       ├── pages/             # All page components
│       ├── components/        # Reusable components
│       ├── contexts/          # Auth context
│       ├── services/          # Axios API client
│       └── index.css          # Global design system
│
└── vercel.json                # Vercel deployment config
```

---

## 📋 API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register account |
| POST | `/api/auth/login` | Login, get JWT |
| GET | `/api/records` | List records |
| POST | `/api/records` | Upload record |
| GET | `/api/records/timeline` | Health timeline |
| GET | `/api/records/:id/download` | Download to local disk |
| POST | `/api/share` | Create OTP share link |
| GET | `/api/share/:token/meta` | Get share link info |
| POST | `/api/share/:token/verify` | Verify OTP |
| POST | `/api/ai/chat` | AI health chat |
| POST | `/api/ai/summarize/:id` | AI summarize record |
| GET | `/api/appointments` | List appointments |
| GET | `/api/medications` | List medications |
| GET | `/api/audit` | Audit logs |

---

## ⚕️ Medical Disclaimer

MediVault is a document management tool, not a medical service. The AI Health Assistant provides general health information only and should never replace professional medical advice. Always consult a qualified healthcare provider for medical decisions.

---

*Built with ❤️ by MediVault — Your Personal Medical Record Locker*
