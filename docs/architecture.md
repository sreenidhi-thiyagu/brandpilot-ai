# System Architecture

BrandPilot AI uses a monolithic frontend+backend pattern using Next.js App Router, coupled with a serverless Postgres database (Supabase) and a mock microservice for communication channels.

## Architecture Diagram

```ascii
+-------------------+       +-----------------------+        +--------------------+
|                   |       |                       |        |                    |
|   Next.js Client  | <---> |   Next.js API Routes  | <----> |  Gemini LLM API    |
|   (React, UI)     |       |   (CRM Backend)       |        |  (GenAI SDK)       |
|                   |       |                       |        |                    |
+-------------------+       +-----------------------+        +--------------------+
                                      |   ^
                                      |   |
                                      v   |
                            +-----------------------+
                            |                       |
                            | Supabase PostgreSQL   |
                            | (Customers, Campaigns,|
                            |  Segments, Events)    |
                            |                       |
                            +-----------------------+
                                      ^   |
                      POST /send      |   | POST /api/receipts/channel-callback
                      (Fire & forget) |   | (Async webhooks)
                                      |   v
                            +-----------------------+
                            |                       |
                            |   Channel Service     |
                            |   (Node.js / Express) |
                            |                       |
                            +-----------------------+
```

## Data Flow (Campaign Lifecycle)

1. **Segment Creation**: User inputs a natural language prompt. Next.js API calls Gemini to parse the prompt into JSON rules. The API queries Supabase `customers` table with these rules and stores the result in `segments` and `segment_customers`.
2. **Message Generation**: User provides campaign context. Next.js API calls Gemini to generate personalized message templates and suggestions.
3. **Dispatch**: User clicks send. Next.js API iterates over `segment_customers`, personalizes the template, and sends a `POST` request to the Channel Service for each recipient.
4. **Lifecycle Callbacks**: The Channel Service waits for randomized intervals, then sends webhooks back to the Next.js `CRM_CALLBACK_URL` to update the status (delivered, opened, clicked, converted).
5. **Analytics**: The Dashboard and Analytics pages poll the Next.js API, which aggregates `campaign_recipients` statuses from Supabase.
