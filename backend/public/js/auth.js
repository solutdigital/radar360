// auth.js - Production-ready authentication (no auto-create)
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase-config.js";

// Global user state shared with other modules
export const userState = { uid: null, role: null, email: null, name: null };

// Listen to auth state changes
onAuthStateChanged(auth, async (user) => {
    if (user) {
        userState.uid = user.uid;
        userState.email = user.email;

        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                userState.role = data.role;
                userState.name = data.name || user.email.split('@')[0];
            } else {
                // User is authenticated but has no role document - show error
                alert("Tu cuenta no tiene un perfil asignado. Contacta al administrador.");
                await signOut(auth);
                return;
            }
        } catch (e) {
            console.error("Error al obtener perfil:", e);
            return;
        }

        // Show header on login
        const header = document.getElementById('app-header');
        if (header) header.style.display = 'flex';

        // Route to the correct view based on role
        if (userState.role === "ADMIN") window.AppTools.switchView('view-admin');
        else if (userState.role === "TUTOR") window.AppTools.switchView('view-tutor');
        else window.AppTools.switchView('view-student');

        // Notify other modules
        window.dispatchEvent(new CustomEvent('authReady'));

    } else {
        userState.uid = null; userState.role = null; userState.email = null; userState.name = null;
        const header = document.getElementById('app-header');
        if (header) header.style.display = 'none';
        if (window.AppTools) window.AppTools.switchView('view-login');
    }
});

// Login Form Handler
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = e.target.querySelector('button');
    btn.textContent = "Verificando...";
    btn.disabled = true;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will handle routing
    } catch (error) {
        let msg = "Correo o contraseña incorrectos.";
        if (error.code === 'auth/too-many-requests') msg = "Demasiados intentos. Espera un momento.";
        alert("Error al ingresar: " + msg);
        btn.textContent = "Entrar";
        btn.disabled = false;
    }
});

const handleLogout = async () => {
    try {
        await signOut(auth);
    } catch(e) {
        console.error("Error al cerrar sesión:", e);
    }
};

window.AuthTools = { handleLogout };
