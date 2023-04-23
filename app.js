require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const offerHashes = process.env.OFFER_HASHES.split(',');

app.post('/webhook', (req, res) => {
  const webhookEvent = req.body;

  if (webhookEvent.event === 'trade.started' && offerHashes.includes(webhookEvent.data.offer_hash)) {
    setTimeout(() => {
      sendGreetingMessage(webhookEvent.data.trade_hash);
    }, process.env.NOONES_AUTOGREETING_DELAY);
  }

  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`App is listening at http://localhost:${port}`);
});

async function sendGreetingMessage(tradeHash) {
  try {
    const accessToken = await getAccessToken();
    const tradeChatUrl = `https://api.noones.com/trade-chat/post`;

    const response = await axios.post(
      tradeChatUrl,
      {
        trade_hash: tradeHash,
        message: process.env.NOONES_AUTOGREETING_MESSAGE,
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    console.log(`Sent greeting message for trade hash: ${tradeHash}`);
  } catch (error) {
    console.error(`Error sending greeting message for trade hash: ${tradeHash}`, error);
  }
}

async function getAccessToken() {
  const tokenUrl = 'https://auth.noones.com/oauth2/token';
  const clientId = process.env.NOONES_CLIENT_ID;
  const clientSecret = process.env.NOONES_CLIENT_SECRET;

  try {
    const response = await axios.post(
      tokenUrl,
      {
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'noones:trade:get noones:trade-chat:post',
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('Error getting access token', error);
    throw error;
  }
}
