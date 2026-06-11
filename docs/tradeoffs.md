# Tradeoffs and Future Improvements

Building an AI-native CRM in a short period required several tradeoffs. Here are the key compromises made and how they would be addressed in a production environment:

## 1. Simulated Data for Scope
We built a deterministic data seeder that populates the database with 100 fake customers and ~250 orders. In a real system, this data would stream in from a Shopify/Magento integration or a CDP (Customer Data Platform) via webhooks and ETL pipelines.

## 2. Stubbed Channel Service
Instead of integrating with Twilio, SendGrid, or WhatsApp Business APIs, we created a lightweight Express.js server that simulates message delivery and interaction lifecycles using `setTimeout`.
**Production Fix:** Integrate actual provider APIs and handle real webhooks with proper signature verification.

## 3. Asynchronous Processing & Message Queues
Currently, when a campaign is sent, the Next.js API makes synchronous `fetch` calls to the channel service in a loop.
**Production Fix:** For thousands of users, this would cause timeouts. We would use a background task queue (e.g., BullMQ, AWS SQS, Google Cloud Tasks) to batch and process outgoing messages asynchronously.

## 4. Idempotency and Webhook Reliability
The callback endpoint blindly updates the database.
**Production Fix:** Implement idempotency keys. If a webhook is retried by the provider, we need to ensure we don't process it twice or overwrite a newer status (e.g., changing 'converted' back to 'delivered').

## 5. Security & RLS
We bypassed Supabase Row Level Security (RLS) by using the `service_role` key in backend APIs to speed up development.
**Production Fix:** Implement proper authentication (Supabase Auth) and strict RLS policies so users only see data for their specific brand or organization.

## 6. AI Token Limits & Prompt Engineering
The Gemini API is used dynamically for generating SQL-like filters and copy. 
**Production Fix:** In a mature product, we'd use few-shot prompting, schema validation via function calling (Structured Outputs), and caching to prevent unpredictable outputs and high token usage.
