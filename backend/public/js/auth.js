// auth.js
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase-config.js";

// Global user state (exported for other modules to use if needed)
export const userState = { uid: null, role: null, email: null, name: null };

// Listen to auth state changes to route user
onAuthStateChanged(auth, async (user) => {
    if (user) {
        userState.uid = user.uid;
        userState.email = user.email;
        
        // Fetch user role from Firestore Custom Claims or Users collection
        // For emulator demo, we derive role from email if missing
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                userState.role = userDoc.data().role;
                userState.name = userDoc.data().name || user.email.split('@')[0];
            } else {
                // Auto-create user doc if it doesn't exist (helpful for local emulator test)
                let tempRole = "STUDENT";
                if(user.email.includes("admin")) tempRole = "ADMIN";
                if(user.email.includes("tutor")) tempRole = "TUTOR";
                
                await setDoc(doc(db, "users", user.uid), {
                    role: tempRole,
                    email: user.email,
                    name: user.email.split('@')[0]
                });
                userState.role = tempRole;
                userState.name = user.email.split('@')[0];
            }
        } catch (e) {
            console.error("Error al obtener rol:", e);
        }

        // Switch to the correct view based on role
        if (userState.role === "ADMIN") window.AppTools.switchView('view-admin');
        else if (userState.role === "TUTOR") window.AppTools.switchView('view-tutor');
        else window.AppTools.switchView('view-student');
        
        // Dispatch custom event to notify other modules that auth is ready
        window.dispatchEvent(new CustomEvent('authReady'));

    } else {
        // Logged out
        userState.uid = null; userState.role = null; userState.email = null;
        if(window.AppTools) window.AppTools.switchView('view-login');
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
        // routing handled by onAuthStateChanged
    } catch (error) {
        // If user not found (local emulator testing), create account automatically
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            console.log("Creando nueva cuenta de prueba en emulador...");
            try {
                await createUserWithEmailAndPassword(auth, email, password);
            } catch (createErr) {
                alert("Error al ingresar: " + createErr.message);
                btn.textContent = "Entrar";
                btn.disabled = false;
            }
        } else {
             alert("Error al ingresar: " + error.message);
             btn.textContent = "Entrar";
             btn.disabled = false;
        }
    }
});

const handleLogout = async () => {
    try {
        await signOut(auth);
    } catch(e) {
        console.error("Error al salir:", e);
    }
}

window.AuthTools = { handleLogout };
