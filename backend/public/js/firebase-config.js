// firebase-config.js
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCQPlilQuZqvl-sLAqRHSLs4hOyDbwQFzo",
    authDomain: "radar-academico-360.firebaseapp.com",
    projectId: "radar-academico-360",
    storageBucket: "radar-academico-360.firebasestorage.app",
    messagingSenderId: "432775276490",
    appId: "1:432775276490:web:02f949a5304b7dafefd133",
    measurementId: "G-CY1GJHWDNB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const db = getFirestore(app);
const auth = getAuth(app);

// LOCAL EMULATOR CONNECTION (DISABLE FOR PRODUCTION)
/*
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    connectFirestoreEmulator(db, 'localhost', 8081);
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    console.log("Conectado a Firebase Local Emulator Suite");
}
*/

export { app, db, auth };
