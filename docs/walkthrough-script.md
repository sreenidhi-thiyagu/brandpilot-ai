# BrandPilot AI - Demo Walkthrough Script

**Target Length:** 5-6 minutes

## 1. Introduction (0:00 - 0:45)
- **Speaker**: "Hi, I'm presenting BrandPilot AI for the Xeno Engineering Internship assignment."
- **Hook**: "This is an AI-native Mini CRM built for D2C brands, specifically 'GlowCare Beauty'. Unlike a sales pipeline CRM, this is built for marketers to intelligently engage shoppers."
- **Stack**: "It's built with Next.js, Supabase, Tailwind, and the Gemini API for intelligence. I also built a separate Express.js microservice to simulate message delivery."

## 2. Dashboard & Seeding (0:45 - 1:30)
- *Screen: Dashboard*
- **Speaker**: "Here is the dashboard. Right now, it's empty. Let's go to the Customers page."
- *Click: Customers -> 'Seed Demo Data'*
- **Speaker**: "To make this realistic, I built a seed API that generates 100 fake customers and over 250 historical orders, calculating their total spend and last purchase date automatically."

## 3. AI Segment Builder (1:30 - 2:30)
- *Click: AI Segments*
- **Speaker**: "Segmentation is usually complex. Here, it's natural language."
- *Action: Type "Find high-value skincare customers from Chennai who have not purchased in 60 days"*
- **Speaker**: "Behind the scenes, the Next.js API sends this to Gemini, which returns a structured JSON ruleset. The backend applies these rules to Supabase and saves the segment. As you can see, we found X matching customers."

## 4. Campaign Builder (2:30 - 3:45)
- *Click: Campaigns*
- **Speaker**: "Now let's target them. I select my new segment, choose WhatsApp as the channel, and set the goal to 'Drive weekend sales' with a 'Friendly' tone and a '15% discount' offer."
- *Action: Click 'Generate Message with AI'*
- **Speaker**: "Gemini understands the constraints of WhatsApp versus SMS, formats the text, and includes personalization tags."
- *Action: Click 'Save Campaign' then 'Send Now'*
- **Speaker**: "When I hit send, the CRM loops through the segment, personalizes the copy, and fires it off to our external Channel Service."

## 5. Async Callbacks & Analytics (3:45 - 4:45)
- *Screen: Terminal showing Channel Service logs, then switch to Analytics page*
- **Speaker**: "The Channel Service receives the requests and returns a 202 Accepted. Then, it uses random delays to simulate the real world: delivering, opening, clicking, and converting."
- *Action: Watch the Analytics charts update*
- **Speaker**: "Because it fires webhooks back to our Next.js callback API, our Analytics page updates in real-time. You can see the funnel dropping off from Sent to Converted."

## 6. Architecture & Tradeoffs (4:45 - 5:30)
- **Speaker**: "To achieve this, I separated the CRM from the Channel service to demonstrate webhooks. If I were to scale this, I would replace the synchronous API calls with a BullMQ or SQS queue, and add idempotency keys to the webhooks to prevent duplicate events. I've documented these tradeoffs and the AI workflow in the repository."
- **Sign-off**: "Thank you for watching."
