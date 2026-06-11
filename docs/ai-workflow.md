# AI Workflow

AI was heavily utilized throughout the lifecycle of the BrandPilot AI project, from conceptualization to coding to embedded product features.

## 1. Product Scoping & Architecture
Generative AI was used to brainstorm the minimal viable features needed for a "Mini CRM" that specifically targets D2C shopper engagement rather than B2B sales. AI helped define the database schema, identifying the need for decoupled `segments` and `campaign_recipients` tables to track granular event lifecycles.

## 2. Code Generation and Iteration
An AI coding assistant (like Cursor or Gemini Code Assist) was used to:
- Generate the boilerplate Next.js App Router structure.
- Scaffold the Supabase SQL migrations.
- Write the React components using Tailwind CSS and Lucide React.
- Scaffold the mock Express.js channel service.

## 3. Embedded AI Features (Gemini API)
We embedded the Gemini API natively into the product to create a "zero-click" or "low-friction" user experience:
- **AI Segment Builder**: Translates messy human thought ("Find high value Chennai folks who haven't bought recently") into strict JSON rules that the backend can parse into SQL queries.
- **Campaign Message Generator**: Uses context about the segment, the desired channel constraints (SMS vs WhatsApp), and tone to draft high-converting copy automatically.

## 4. Test Data Generation
Writing believable test data is tedious. We used AI to help structure the `customers/seed` API logic, defining realistic categories ("Skincare", "Haircare"), Indian cities, and randomized distribution logic to make the demo feel alive.
