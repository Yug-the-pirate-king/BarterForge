const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const BACKEND_AI_URL = process.env.BACKEND_AI_URL || 'http://localhost:8000';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/', (req, res) => {
  res.json({
    service: 'Smart Factory Syndicate Gateway',
    status: 'ONLINE',
    port: PORT,
    connected_ai_backend: BACKEND_AI_URL,
    endpoints: {
      whatsapp_webhook: '/webhooks/whatsapp',
      fleetbase_webhook: '/webhooks/fleetbase',
    }
  });
});

// WhatsApp / Twilio Ingestion Webhook (Phase 2 Entrypoint)
app.post('/webhooks/whatsapp', async (req, res) => {
  try {
    const rawBody = req.body;
    console.log('[WhatsApp Webhook Received]:', JSON.stringify(rawBody));
    
    // Webhook acknowledgement to WhatsApp Cloud API
    res.status(200).json({ status: 'ACCEPTED', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('Error processing WhatsApp webhook:', err);
    res.status(500).json({ error: 'Internal gateway error' });
  }
});

// Fleetbase Logistics Event Webhook
app.post('/webhooks/fleetbase', (req, res) => {
  const event = req.body;
  console.log('[Fleetbase Webhook Event]:', event.event, event.data?.id);
  res.status(200).json({ received: true });
});

app.listen(PORT, () => {
  console.log(`[Gateway] Smart Factory Syndicate Gateway running on port ${PORT}`);
});

