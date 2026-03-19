import { db } from "./firebase-config.js";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { userState } from "./auth.js";

const messageInput = document.getElementById('message-input');
const chatForm = document.getElementById('chat-form');
const chatMessages = document.getElementById('chat-messages');

let currentRoomId = null;
let isReadOnly = false;
let unsubscribeMessages = null;

const goBack = () => {
    if (userState.role === 'TUTOR') window.AppTools.switchView('view-tutor');
    else if (userState.role === 'ADMIN') window.AppTools.switchView('view-admin');
    else window.AppTools.switchView('view-student');
};

window.ChatTools = { goBack };

window.addEventListener('roomJoined', (e) => {
    currentRoomId = e.detail.roomId;
    isReadOnly = e.detail.readOnly || false;
    if (unsubscribeMessages) unsubscribeMessages();
    
    chatMessages.innerHTML = `<div style="text-align: center; font-size: 0.75rem; color: var(--text-light); margin: 20px 0;">Inicio de la sesión supervisada</div>`;
    
    const q = query(collection(db, "rooms", currentRoomId, "messages"), orderBy("createdAt", "asc"));
    
    unsubscribeMessages = onSnapshot(q, (snapshot) => {
        chatMessages.innerHTML = '';
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const msgDiv = document.createElement('div');
            const isMe = data.senderId === userState.uid;
            msgDiv.className = isMe ? 'msg sent' : 'msg received';
            
            let timeStr = "";
            if (data.createdAt) {
                const date = data.createdAt.toDate();
                timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            
            msgDiv.innerHTML = `<div>${escapeHtml(data.content)}</div><div class="msg-time">${isMe ? 'Tú' : data.senderName} • ${timeStr}</div>`;
            chatMessages.appendChild(msgDiv);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
});

if(chatForm) {
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = messageInput.value.trim();
        if (!content || !currentRoomId) return;

        messageInput.value = '';
        
        // We send to backend API to apply content filtering
        try {
            const response = await fetch('/api/messages/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: currentRoomId,
                    senderId: userState.uid,
                    senderName: userState.name,
                    content: content
                })
            });
            
            if (!response.ok) {
                const err = await response.json();
                alert("Mensaje bloqueado: " + err.message);
            }
        } catch(err) {
             console.error("Error al enviar mensaje:", err);
             alert("Error de red al enviar el mensaje.");
        }
    });
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
