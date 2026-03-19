const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');

// Load env vars
dotenv.config();

// Init Express App
const app = express();
app.use(cors());
app.use(express.json());

// Routes
const messagesRoute = require('./routes/messages');
app.use('/api/messages', messagesRoute);

const fs = require('fs');
const path = require('path');
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

try {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin initialized via local serviceAccountKey.json");
  } else {
    admin.initializeApp();
    console.log("Firebase Admin initialized via default env credentials.");
  }
} catch (error) {
  console.log("Firebase Admin initialization error:", error);
}

const db = admin.firestore();

// Basic health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Port configuration
const PORT = process.env.APP_PORT || process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Radar 360 Backend running on port ${PORT}`);
});
