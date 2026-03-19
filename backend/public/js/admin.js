// admin.js - Full admin panel: supervision, assignments, user creation
import { db } from "./firebase-config.js";
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, updateDoc, setDoc, deleteDoc } from "firebase/firestore";
import { userState } from "./auth.js";

export const showTab = (tab) => {
    ['supervision', 'assignments', 'users'].forEach(t => {
        document.getElementById(`admin-tab-${t}`).style.display = t === tab ? 'block' : 'none';
        const btn = document.getElementById(`tab-${t}`);
        if(btn) btn.classList.toggle('active', t === tab);
    });
    if(tab === 'assignments') loadAssignments();
};

// ─── SUPERVISION TAB ──────────────────────────────
const initSupervision = () => {
    const list = document.getElementById('admin-rooms-list');
    const statEl = document.getElementById('stat-active-chats');
    if (!list) return;

    const q = query(collection(db, "rooms"), where("status", "==", "ACTIVE"));
    onSnapshot(q, (snapshot) => {
        if(statEl) statEl.textContent = snapshot.size;

        if (snapshot.empty) {
            list.innerHTML = `<div style="text-align: center; color: var(--text-light); padding: 40px 0;">No hay sesiones activas.</div>`;
            return;
        }

        let html = '';
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            html += `
            <div class="card-section" style="border-left: 4px solid var(--primary-blue); display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div>
                    <h4 style="font-weight: 700; margin-bottom: 4px;">Tutor: ${data.tutorName || 'N/A'}</h4>
                    <p style="font-size: 0.85rem; color: var(--text-gray);">Estudiante: ${data.studentName || 'N/A'}</p>
                </div>
                <div style="text-align: right;">
                    <div class="status-pill" style="margin-bottom: 8px;">EN VIVO</div>
                    <button class="btn-primary" style="padding: 8px 16px; font-size: 0.8rem; background-color: var(--bg-input); color: var(--primary-blue); width: auto;" onclick="window.AdminTools.viewRoom('${docSnap.id}', '${data.tutorName}', '${data.studentName}')">Ver Chat</button>
                </div>
            </div>`;
        });
        list.innerHTML = html;
    });
};

// Admin can view chat of any active room
const viewRoom = (roomId, tutorName, studentName) => {
    const title = document.getElementById('chat-room-title');
    if(title) title.textContent = `Supervisando: ${studentName} ↔ ${tutorName}`;
    window.AppTools.switchView('view-chat');
    window.dispatchEvent(new CustomEvent('roomJoined', { detail: { roomId, readOnly: true } }));
};

// ─── ASSIGNMENTS TAB ──────────────────────────────
const loadAssignments = async () => {
    const listEl = document.getElementById('assignments-list');
    if(!listEl) return;
    listEl.innerHTML = `<p style="color:var(--text-gray);">Cargando...</p>`;

    try {
        const [studentsSnap, tutorsSnap] = await Promise.all([
            getDocs(query(collection(db, "users"), where("role", "==", "STUDENT"))),
            getDocs(query(collection(db, "users"), where("role", "==", "TUTOR")))
        ]);

        const tutors = [];
        tutorsSnap.forEach(d => tutors.push({ id: d.id, ...d.data() }));

        let html = `<div style="margin-bottom:12px; font-size:0.85rem; color:var(--text-gray);">Selecciona un tutor para cada estudiante y guarda la asignación.</div>`;

        if (studentsSnap.empty) {
            listEl.innerHTML = `<div class="card-section" style="text-align:center; color:var(--text-gray);">No hay estudiantes registrados aún.</div>`;
            return;
        }

        studentsSnap.forEach(d => {
            const s = { id: d.id, ...d.data() };
            const tutorOptions = tutors.map(t =>
                `<option value="${t.id}" ${s.assignedTutorId === t.id ? 'selected' : ''}>${t.name}</option>`
            ).join('');

            html += `
            <div class="card-section" style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 140px;">
                    <div style="font-weight: 700;">${s.name}</div>
                    <div style="font-size:0.78rem; color:var(--text-gray);">${s.email || ''}</div>
                </div>
                <select id="assign-select-${s.id}" style="flex:1; min-width: 160px; padding: 10px; border-radius: 10px; border: 1px solid var(--border-soft); background: var(--bg-input); font-size: 0.9rem;">
                    <option value="">-- Sin asignar --</option>
                    ${tutorOptions}
                </select>
                <button class="btn-primary" style="width:auto; padding: 10px 20px; font-size:0.85rem;" onclick="window.AdminTools.saveAssignment('${s.id}', '${s.name}')">Guardar</button>
            </div>`;
        });
        listEl.innerHTML = html;
    } catch(e) {
        listEl.innerHTML = `<p style="color: var(--danger-color);">Error al cargar asignaciones: ${e.message}</p>`;
    }
};

const saveAssignment = async (studentId, studentName) => {
    const sel = document.getElementById(`assign-select-${studentId}`);
    if (!sel) return;
    const tutorId = sel.value;

    if (!tutorId) {
        alert("Por favor selecciona un tutor antes de guardar.");
        return;
    }

    try {
        const tutorSnap = await getDoc(doc(db, "users", tutorId));
        const tutorName = tutorSnap.data()?.name || 'Tutor';

        // Create or reuse the room for this student-tutor pair
        const roomId = `room_${studentId}`;
        await setDoc(doc(db, "rooms", roomId), {
            tutorId,
            tutorName,
            studentId,
            studentName,
            status: 'ACTIVE',
            createdAt: new Date()
        }, { merge: true });

        // Update student doc with assignment info
        await updateDoc(doc(db, "users", studentId), { assignedTutorId: tutorId, roomId });

        alert(`✅ ${studentName} asignado al Prof. ${tutorName}`);
    } catch(e) {
        alert("Error al guardar: " + e.message);
    }
};

// ─── CREATE USER TAB ──────────────────────────────
const initCreateUser = () => {
    const form = document.getElementById('create-user-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('new-user-name').value.trim();
        const email = document.getElementById('new-user-email').value.trim();
        const password = document.getElementById('new-user-password').value;
        const role = document.getElementById('new-user-role').value;
        const btn = document.getElementById('create-user-btn');
        const status = document.getElementById('create-user-status');

        btn.disabled = true;
        btn.textContent = "Creando...";
        status.textContent = "";

        try {
            const res = await fetch('/api/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || data.message);

            status.textContent = `✅ Usuario creado: ${name}`;
            status.style.color = "green";
            form.reset();
        } catch(err) {
            status.textContent = `❌ Error: ${err.message}`;
            status.style.color = "var(--danger-color)";
        } finally {
            btn.disabled = false;
            btn.textContent = "Crear Usuario";
        }
    });
};

window.AdminTools = { showTab, viewRoom, saveAssignment };

window.addEventListener('authReady', () => {
    if (userState.role === 'ADMIN') {
        initSupervision();
        initCreateUser();
    }
});
