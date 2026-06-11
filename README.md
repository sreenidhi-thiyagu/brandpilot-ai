# BrandPilot AI — Mini CRM for D2C Shopper Engagement

> Xeno Engineering Internship Assignment 2026

An AI-native Mini CRM built for **GlowCare Beauty**, a D2C brand. Helps marketers intelligently segment shoppers, generate AI-powered campaign messages, send via a stubbed channel service, and track real-time analytics.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend + API | Next.js 15 App Router (TypeScript) |
| Styling | Tailwind CSS |
| Database | SQLite (local) via Prisma ORM |
| AI | Google Gemini 2.5 Flash (`@google/genai`) |
| Charts | Recharts |
| Icons | Lucide React |
| Channel Service | Node.js + Express |

## Security Note (Demo Tradeoff)
For the purpose of this internship assignment and demo, **authentication and Supabase Row Level Security (RLS) are intentionally omitted**. All API routes are completely open. In a production environment, this application would require Supabase Auth and proper RLS policies to restrict data access.

---

## Project Structure

```
brandpilot-ai/
├── crm-app/              ← Next.js app (frontend + API routes)
│   ├── src/app/          ← Pages and API routes
│   ├── src/components/   ← Sidebar UI
│   ├── src/lib/          ← Prisma client, AI client, utils
│   ├── prisma/           ← schema.prisma + dev.db (SQLite)
│   └── .env.local        ← Your secrets (copy from .env.local.example)
├── channel-service/      ← Standalone Express server (port 4000)
└── docs/                 ← Architecture, tradeoffs, walkthrough
```

---

## Quick Start (Local)

### Prerequisites
- Node.js 18+
- npm

### Step 1 — Configure Environment
```bash
cd crm-app
copy .env.local.example .env.local
```
Open `.env.local` and replace `YOUR_GEMINI_API_KEY_HERE` with your actual key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Step 2 — Install and Setup Database
```bash
cd crm-app
npm install
npx prisma db push    # Creates local SQLite dev.db
```

### Step 3 — Run Channel Service
```bash
cd channel-service
npm install
npm start
# → Running on http://localhost:4000
```

### Step 4 — Run CRM App
```bash
cd crm-app
npm run dev
# → Running on http://localhost:3000
```

---

## Demo Flow

1. Open **http://localhost:3000**
2. Go to **Customers** → Click **"Seed Demo Data"** (generates 100 customers, 250+ orders)
3. Go to **AI Segments** → Type: *"Find high-value skincare customers from Chennai who haven't purchased in 60 days"*
4. Go to **Campaigns** → Select segment, set goal, channel (WhatsApp), tone → **"Generate Message with AI"**
5. Edit if needed → **"Save Campaign"** → **"Send Now"**
6. Watch the **Channel Service** terminal log callbacks
7. Go to **Analytics** → Watch real-time funnel stats update every 5 seconds
8. Go back to **Dashboard** → See overall metrics update

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/customers/seed` | Generate 100 demo customers + 250 orders |
| GET | `/api/customers` | List customers (filter by `city`, `category`) |
| POST | `/api/segments/ai` | AI segment from natural language prompt |
| GET | `/api/segments` | List all segments |
| POST | `/api/ai/generate-message` | AI message generation |
| POST | `/api/campaigns` | Create a campaign (draft) |
| GET | `/api/campaigns` | List all campaigns |
| POST | `/api/campaigns/[id]/send` | Send campaign to segment |
| GET | `/api/campaigns/[id]/stats` | Campaign analytics |
| POST | `/api/receipts/channel-callback` | Webhook for delivery events |
| GET | `/api/dashboard/stats` | Overview metrics |

---

## Channel Service

The channel service at `http://localhost:4000/send` simulates async delivery:
- Immediately returns `202 Accepted`
- Sends `sent` callback at 500ms
- Sends `delivered` (85%) or `failed` (15%) at 1-2s
- Sends `opened` (60% of delivered) at 3-5s
- Sends `clicked` (30% of opened) at 5-8s
- Sends `converted` (10% of clicked) at 8-10s

---

## Docs

- [Architecture](docs/architecture.md)
- [Tradeoffs](docs/tradeoffs.md)
- [AI Workflow](docs/ai-workflow.md)
- [Walkthrough Script](docs/walkthrough-script.md)
