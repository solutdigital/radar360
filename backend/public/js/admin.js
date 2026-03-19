// admin.js
import { db } from "./firebase-config.js";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { userState } from "./auth.js";

export const initAdminDashboard = () => {
    const activeRoomsList = document.getElementById('admin-rooms-list');
    if (!activeRoomsList) return;

    const q = query(collection(db, "rooms"), where("status", "==", "ACTIVE"));
    
    onSnapshot(q, (snapshot) => {
        const statsNodes = document.querySelectorAll('.admin-stat .number');
        if(statsNodes.length > 0) statsNodes[0].textContent = snapshot.size; 
        
        if (snapshot.empty) {
            activeRoomsList.innerHTML = `<div style="text-align: center; color: var(--text-light); padding: 40px 0;">No hay sesiones activas.</div>`;
            return;
        }
        
        let html = '';
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            html += `
            <div class="card-section" style="border-left: 4px solid var(--primary-blue); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4 style="font-weight: 700; margin-bottom: 4px;">Tutor: ${data.tutorName || 'Desconocido'}</h4>
                    <p style="font-size: 0.85rem; color: var(--text-gray);">Estudiante: ${data.studentName || 'Desconocido'}</p>
                </div>
                <div style="text-align: right;">
                    <div class="status-pill" style="margin-bottom: 8px;">EN VIVO</div>
                    <button class="btn-primary" style="padding: 8px 16px; font-size: 0.8rem; background-color: var(--bg-input); color: var(--primary-blue); width: auto;" onclick="alert('Has visto un extracto supervisado ID: ${docSnap.id}')">Ver Chat</button>
                </div>
            </div>`;
        });
        activeRoomsList.innerHTML = html;
    });
};

window.addEventListener('authReady', () => {
    if (userState.role === "ADMIN") initAdminDashboard();
});
