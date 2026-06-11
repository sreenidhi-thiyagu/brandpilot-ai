const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'channel-service', timestamp: new Date().toISOString() });
});

app.post('/send', (req, res) => {
  const { campaignId, customerId, recipient, channel, message, callbackUrl } = req.body;

  if (!campaignId || !customerId || !callbackUrl) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Send an immediate successful acceptance
  res.status(202).json({ status: 'accepted', message: 'Message queued for delivery' });

  // Simulate async delivery lifecycle
  console.log(`[${new Date().toISOString()}] Received send request for Campaign: ${campaignId}, Customer: ${customerId}`);

  const simulateCallback = async (status, delay) => {
    setTimeout(async () => {
      try {
        const payload = {
          campaignId,
          customerId,
          status,
          timestamp: new Date().toISOString()
        };
        console.log(`[${new Date().toISOString()}] Sending callback to ${callbackUrl}: ${status} for Customer ${customerId}`);
        
        await fetch(callbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } catch (error) {
        console.error(`Failed to send callback for ${status}`, error.message);
      }
    }, delay);
  };

  // Probabilities and timing flow
  // - sent immediately (let's say we send 'sent' callback at 500ms)
  simulateCallback('sent', 500);

  // - delivered (85%) or failed (15%) after 1-2s
  const isDelivered = Math.random() < 0.85;
  const deliveryDelay = Math.floor(Math.random() * 1000) + 1000;

  if (!isDelivered) {
    simulateCallback('failed', deliveryDelay);
    return; // Lifecycle ends
  } else {
    simulateCallback('delivered', deliveryDelay);
  }

  // - opened (60% of delivered) after 3-5s
  const isOpened = Math.random() < 0.60;
  if (!isOpened) return; // Lifecycle ends
  const openDelay = deliveryDelay + Math.floor(Math.random() * 2000) + 2000;
  simulateCallback('opened', openDelay);

  // - clicked (30% of opened) after 5-8s
  const isClicked = Math.random() < 0.30;
  if (!isClicked) return; // Lifecycle ends
  const clickDelay = openDelay + Math.floor(Math.random() * 3000) + 2000;
  simulateCallback('clicked', clickDelay);

  // - converted (10% of clicked) randomly after 8-10s
  const isConverted = Math.random() < 0.10;
  if (!isConverted) return;
  const convertDelay = clickDelay + Math.floor(Math.random() * 2000) + 2000;
  simulateCallback('converted', convertDelay);
});

app.listen(PORT, () => {
  console.log(`Channel Service running on http://localhost:${PORT}`);
});
