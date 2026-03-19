// routes/users.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// POST /api/users/create
// Creates a new Firebase Auth user and stores their profile in Firestore
router.post('/create', async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Todos los campos son requeridos.' });
    }

    const validRoles = ['STUDENT', 'TUTOR', 'ADMIN'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Rol inválido.' });
    }

    try {
        // Create user in Firebase Auth
        const userRecord = await admin.auth().createUser({ email, password });
        
        // Store role and name in Firestore
        await admin.firestore().collection('users').doc(userRecord.uid).set({
            name,
            email,
            role,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(201).json({ uid: userRecord.uid, message: `Usuario ${name} creado correctamente.` });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
