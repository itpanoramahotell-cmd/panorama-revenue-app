// 1. Samle alle imports fra samme kilde øverst
import { auth, db, login } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    collection, 
    query, 
    getDocs, 
    orderBy, 
    doc, 
    setDoc, 
    deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { UI } from './ui.js';
import * as Calc from './calculator.js';

// --- STATE ---
let localStrategies = [];
let currentStrategyId = null;

// --- AUTH LOGIKK ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        UI.hideLogin();
        await loadInitialData();
    } else {
        UI.showLogin();
    }
});

window.handleLogin = async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    try {
        await login(email, pass);
    } catch (e) {
        UI.setTxt('login-error', "Feil passord/e-post");
    }
};

// --- DATA LOGIKK ---
async function loadInitialData() {
    try {
        const q = query(collection(db, "strategies"), orderBy("updatedAt", "desc"));
        const snapshot = await getDocs(q);
        localStrategies = snapshot.docs.map(doc => doc.data());
        
        UI.updateStrategyList(localStrategies, currentStrategyId, (id) => {
            currentStrategyId = id;
            // TODO: Legg til funksjon for å fylle skjema med data fra valgt strategi
        });
    } catch (error) {
        console.error("Kunne ikke hente data:", error);
    }
}

export async function saveStrategy(strategy) {
    if (!strategy.id || strategy.id.startsWith('temp_')) {
        strategy.id = Date.now().toString();
    }

    try {
        await setDoc(doc(db, "strategies", strategy.id), {
            id: strategy.id,
            name: strategy.name,
            data: strategy.data,
            updatedAt: new Date()
        });
        console.log("Lagret i Firestore!");
        return strategy.id;
    } catch (e) {
        console.error("Feil ved lagring:", e);
        throw e;
    }
}

// Funksjon som kalles når man trykker på "Lagre Endringer"
window.saveCurrentStrategy = async () => {
    const btn = document.getElementById('saveBtn');
    const originalText = btn.textContent;
    
    // Samle data fra UI (du må bruke din eksisterende scrape-logikk her)
    const strategyData = {
        name: document.getElementById('strategyName').value,
        id: currentStrategyId,
        data: scrapeDataFromUI() // Denne må flyttes til ui.js eller main.js
    };

    try {
        btn.textContent = "⌛ Lagrer...";
        btn.disabled = true;
        
        const newId = await saveStrategy(strategyData);
        currentStrategyId = newId;
        
        // Oppdater listen lokalt uten å laste alt på nytt
        await loadInitialData(); 
        
        btn.textContent = "✅ Lagret!";
        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
        }, 2000);
    } catch (error) {
        alert("Kunne ikke lagre: " + error.message);
        btn.textContent = originalText;
        btn.disabled = false;
    }
};

// Hjelpefunksjon for å hente alle verdier fra input-feltene
function scrapeDataFromUI() {
    const data = {};
    document.querySelectorAll('input').forEach(input => {
        if(input.id && input.id !== 'strategyName' && !input.id.startsWith('login-')) {
            data[input.id] = input.value;
        }
    });
    return data;
}

// Funksjon for å starte en ny, tom strategi
window.createNewStrategy = () => {
    currentStrategyId = "temp_" + Date.now();
    const newStrategy = {
        id: currentStrategyId,
        name: "Ny strategi",
        data: scrapeDataFromUI(), // Henter standardverdier fra feltene
        isDirty: true
    };
    
    // Legg til i listen og oppdater UI
    localStrategies.unshift(newStrategy); 
    UI.updateStrategyList(localStrategies, currentStrategyId, loadStrategy);
    
    // Sett fokus på navnefeltet
    const nameInput = document.getElementById('strategyName');
    nameInput.value = newStrategy.name;
    nameInput.focus();
    nameInput.select();
};

// Koble knappen i HTML til funksjonen
document.getElementById('createNewBtn').addEventListener('click', window.createNewStrategy);

// Oppdaterer alle tall når brukeren endrer noe
function handleInputChange() {
    const state = scrapeDataFromUI();
    const results = Calc.calculateRevenue(state);
    
    // Oppdater tallene i UI
    UI.setTxt('totalRevenue', Calc.formatter.format(results.totalRev));
    UI.setTxt('revpar', Calc.formatter.format(results.revpar));
    UI.setTxt('adr', Calc.formatter.format(results.adr));
    
    // Hvis vi er på en eksisterende strategi, merk den som endret
    if (currentStrategyId) {
        const s = localStrategies.find(x => x.id === currentStrategyId);
        if (s) s.isDirty = true;
    }
}

// Start lyttere på alle inputs
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', handleInputChange);
});