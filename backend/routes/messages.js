const express = require('express');
const router = express.Router();
const { validateMessageContent } = require('../middleware/contentFilter');
const admin = require('firebase-admin');
const getDb = () => admin.firestore();
router.post('/send', validateMessageContent, async (req, res) => {
    try {
        const { roomId, senderId, senderName, content } = req.body;
        if (!roomId || !senderId || !content) {
            return res.status(400).json({ error: "Faltan campos requeridos." });
        }
        const messageData = {
            senderId,
            senderName: senderName || 'Usuario',
            content,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            deliveryStatus: 'SENT'
        };
        const db = getDb();
        const docRef = await db.collection('rooms').doc(roomId).collection('messages').add(messageData);
        return res.status(200).json({ success: true, messageId: docRef.id });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Error interno." });
    }
});
module.exports = router;
