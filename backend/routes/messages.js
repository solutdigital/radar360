const express = require('express');
const router = express.Router();
const { validateMessageContent } = require('../middleware/contentFilter');
const admin = require('firebase-admin');

// Ensure db is available
const getDb = () => admin.firestore();

router.post('/send', validateMessageContent, async (req, res) => {
    try {
        const { roomId, senderId, senderRole, type, content } = req.body;
        
        if (!roomId || !senderId || !type) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const messageData = {
            senderId,
            senderRole: senderRole || 'STUDENT',
            type,
            content: content || null,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            isFiltered: false, // Could be marked true if warning but allowed
            deliveryStatus: 'SENT'
        };

        const db = getDb();
        const docRef = await db.collection('rooms').doc(roomId).collection('messages').add(messageData);

        return res.status(200).json({ success: true, messageId: docRef.id });
    } catch (error) {
        console.error("Error sending message:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
