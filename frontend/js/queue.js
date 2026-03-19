// queue.js
import { db } from "./firebase-config.js";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { userState } from "./auth.js";

let unsubscribeQueue = null;
let unsubscribeTutors = null;

export const populateTutors = () => {
    const list = document.getElementById('active-student-section');
    if (!list) return;

    if (unsubscribeTutors) unsubscribeTutors();
    list.innerHTML = `<p>Cargando tutores disponibles...</p>`;

    // Escuchando tutores con isAvailable = true
    const q = query(collection(db, "users"), where("role", "==", "TUTOR"), where("isAvailable", "==", true));
    unsubscribeTutors = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            list.innerHTML = `<p style="color: var(--text-gray); text-align: center; padding: 30px;">No hay tutores disponibles en este preciso momento.<br>Regístrate más tarde o intenta recargar.</p>`;
            return;
        }
        
        let html = `<p style="margin-bottom: 12px; font-weight: 600; color: var(--text-dark);">Elige un tutor activo:</p>`;
        snapshot.forEach((docSnap) => {
            const t = docSnap.data();
            const initial = t.name ? t.name.charAt(0).toUpperCase() : 'T';
            html += `
            <div class="wait-list-item" style="cursor: pointer; padding: 20px;" onclick="window.QueueTools.requestTicket('${docSnap.id}', '${t.name}')">
                <div class="user-avatar-placeholder" style="margin-right: 16px;">${initial}</div>
                <div class="wait-details" style="flex: 1;">
                    <h4 style="font-size: 1.1rem;">Prof. ${t.name || 'Tutor'}</h4>
                    <p style="color: var(--text-gray);">Disponible Online</p>
                </div>
                <div style="background-color: var(--primary-blue); color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">→</div>
            </div>`;
        });
        list.innerHTML = html;
    });
};

export const requestTicket = async (tutorId, tutorName) => {
    if (!userState.uid) return alert("Debes iniciar sesión");
    
    try {
        await addDoc(collection(db, "queue"), {
            studentId: userState.uid,
            studentName: userState.name || "Estudiante",
            tutorId: tutorId,
            status: 'WAITING',
            createdAt: serverTimestamp()
        });
        
        const section = document.getElementById('active-student-section');
        section.innerHTML = `
            <div class="active-turn-card">
                <div class="status-pill">TURNO SOLICITADO</div>
                <h3 class="active-turn-title">Esperando a que el Prof. ${tutorName} te acepte...</h3>
                <p style="color: var(--text-gray); margin-bottom: 20px; font-size: 0.9rem;">Por favor no cierres la ventana.</p>
            </div>`;
            
        // Monitor for Room creation
        const roomQ = query(collection(db, "rooms"), where("studentId", "==", userState.uid), where("status", "==", "ACTIVE"));
        onSnapshot(roomQ, (snap) => {
            if(!snap.empty) {
                const roomDoc = snap.docs[0];
                window.AppTools.switchView('view-chat');
                window.dispatchEvent(new CustomEvent('roomJoined', { detail: { roomId: roomDoc.id }}));
            }
        });
        
    } catch(e) {
        console.error("Error al pedir ticket:", e);
        alert("Hubo un error al entrar a la cola");
    }
};

export const populateTutorQueue = () => {
    const queueList = document.getElementById('tutor-queue-list');
    if (!queueList || !userState.uid) return;

    if (unsubscribeQueue) unsubscribeQueue();
    
    const q = query(collection(db, "queue"), where("tutorId", "==", userState.uid), where("status", "==", "WAITING"));
    unsubscribeQueue = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            queueList.innerHTML = `<div style="text-align: center; color: var(--text-light); padding: 40px 20px; border: 1px dashed var(--border-soft); border-radius: 12px;">No hay ningún estudiante en cola.</div>`;
            return;
        }
        
        let html = '';
        let processIndex = 1;
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const btnStyles = processIndex === 1 ? `padding: 10px 16px; font-size: 0.85rem;` : `padding: 10px 16px; font-size: 0.85rem; opacity: 0.5; pointer-events: none;`;
            
            html += `
            <div class="wait-list-item" style="${processIndex === 1 ? 'border: 2px solid var(--primary-blue);' : ''}">
                <div class="wait-number" ${processIndex > 1 ? 'style="background-color: var(--bg-input); color: var(--text-light);"' : ''}>#${processIndex}</div>
                <div class="wait-details" style="flex:1;">
                    <h4>${data.studentName}</h4>
                    <p>Fila General</p>
                </div>
                <div class="wait-time">
                    ${processIndex === 1 ? `<button class="btn-primary" style="${btnStyles}" onclick="window.QueueTools.acceptStudent('${docSnap.id}', '${data.studentId}', '${data.studentName}')">► Atender</button>` : `<span style="font-size: 0.8rem; color: var(--text-gray);">En espera</span>`}
                </div>
            </div>`;
            processIndex++;
        });
        queueList.innerHTML = html;
    });

    // Control the toggle state for availability
    const toggleBtn = document.getElementById('toggle-tutor-state');
    if(toggleBtn) {
        toggleBtn.addEventListener('click', async () => {
            try {
                const isDis = toggleBtn.textContent === "Disponible";
                await updateDoc(doc(db, "users", userState.uid), {
                    isAvailable: !isDis
                });
                toggleBtn.textContent = isDis ? "Ocupado" : "Disponible";
                toggleBtn.style.backgroundColor = isDis ? "var(--danger-color)" : "var(--primary-blue)";
            } catch(e) { console.error("Could not toggle status", e); }
        });
    }
};

export const acceptStudent = async (queueId, studentId, studentName) => {
    try {
        const newRoomRef = await addDoc(collection(db, "rooms"), {
            tutorId: userState.uid,
            tutorName: userState.name,
            studentId: studentId,
            studentName: studentName,
            status: 'ACTIVE',
            createdAt: serverTimestamp()
        });
        
        await deleteDoc(doc(db, "queue", queueId));
        
        window.AppTools.switchView('view-chat');
        window.dispatchEvent(new CustomEvent('roomJoined', { detail: { roomId: newRoomRef.id }}));
    } catch(e) {
        console.error("No se pudo aceptar al estudiante:", e);
    }
};

window.QueueTools = { requestTicket, acceptStudent };

window.addEventListener('authReady', () => {
    if (userState.role === "STUDENT") populateTutors();
    if (userState.role === "TUTOR") populateTutorQueue();
});
