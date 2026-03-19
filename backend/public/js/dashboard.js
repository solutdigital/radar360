/* dashboard.js - Fixed assignment model */
import { db } from "./firebase-config.js";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { userState } from "./auth.js";

let unsubDashboard = null;

export const initStudentDashboard = () => {
    const section = document.getElementById('student-tutor-section');
    const nameDisplay = document.getElementById('student-name-display');
    if (nameDisplay && userState.name) nameDisplay.textContent = userState.name;
    if (!section) return;

    section.innerHTML = `<p style="color: var(--text-gray);">Cargando tu tutor asignado...</p>`;

    if (unsubDashboard) unsubDashboard();

    // Listen to the user's own document for their assigned tutor
    unsubDashboard = onSnapshot(doc(db, "users", userState.uid), async (userSnap) => {
        const userData = userSnap.data();
        const assignedTutorId = userData?.assignedTutorId;
        const roomId = userData?.roomId;

        if (!assignedTutorId || !roomId) {
            section.innerHTML = `
                <div class="card-section" style="text-align: center; padding: 40px 20px;">
                    <div style="font-size: 2rem; margin-bottom: 12px;">📚</div>
                    <h3 style="font-weight: 700; margin-bottom: 8px;">En espera de asignación</h3>
                    <p style="color: var(--text-gray); font-size: 0.9rem;">El administrador te asignará un tutor en breve. Por favor regresa más tarde.</p>
                </div>`;
            return;
        }

        try {
            const tutorSnap = await getDoc(doc(db, "users", assignedTutorId));
            const tutor = tutorSnap.data();
            const initial = tutor?.name?.charAt(0).toUpperCase() || 'T';

            section.innerHTML = `
                <div class="card-section" style="cursor: pointer; border: 2px solid var(--primary-blue);" onclick="window.DashboardTools.openRoom('${roomId}', 'Prof. ${tutor?.name || 'Tutor'}')">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div class="user-avatar-placeholder" style="background: var(--primary-blue); color: white; font-weight: 700;">${initial}</div>
                        <div style="flex: 1;">
                            <div style="font-weight: 700; font-size: 1.1rem;">Prof. ${tutor?.name || 'Tu Tutor'}</div>
                            <div style="font-size: 0.85rem; color: var(--text-gray);">Tu tutor asignado · Haz clic para chatear</div>
                        </div>
                        <div style="background-color: var(--primary-blue); color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">→</div>
                    </div>
                </div>`;
        } catch(e) {
            section.innerHTML = `<p style="color: var(--danger-color);">Error al cargar tu tutor. Intenta recargar.</p>`;
        }
    });
};

export const initTutorDashboard = () => {
    const list = document.getElementById('tutor-students-list');
    if (!list) return;
    list.innerHTML = `<p style="color: var(--text-gray);">Cargando tus estudiantes...</p>`;

    if (unsubDashboard) unsubDashboard();

    const q = query(collection(db, "users"), where("role", "==", "STUDENT"), where("assignedTutorId", "==", userState.uid));
    unsubDashboard = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            list.innerHTML = `<div class="card-section" style="text-align: center; padding: 40px 20px; color: var(--text-gray);">Aún no tienes estudiantes asignados.</div>`;
            return;
        }
        let html = '';
        snapshot.forEach((docSnap) => {
            const s = docSnap.data();
            const initial = s.name?.charAt(0).toUpperCase() || 'E';
            html += `
            <div class="card-section" style="cursor:pointer; margin-bottom: 12px;" onclick="window.DashboardTools.openRoom('${s.roomId}', '${s.name}')">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div class="user-avatar-placeholder" style="background: #e8f0fe; color: var(--primary-blue); font-weight: 700;">${initial}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 700;">${s.name}</div>
                        <div style="font-size: 0.8rem; color: var(--text-gray);">Estudiante asignado · Haz clic para chatear</div>
                    </div>
                    <div style="background: var(--primary-blue); color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">→</div>
                </div>
            </div>`;
        });
        list.innerHTML = html;
    });
};

export const openRoom = (roomId, partnerName) => {
    const title = document.getElementById('chat-room-title');
    if (title) title.textContent = `Chat con ${partnerName}`;
    window.AppTools.switchView('view-chat');
    window.dispatchEvent(new CustomEvent('roomJoined', { detail: { roomId } }));
};

window.DashboardTools = { openRoom };

window.addEventListener('authReady', () => {
    if (userState.role === 'STUDENT') initStudentDashboard();
    if (userState.role === 'TUTOR') initTutorDashboard();
});
