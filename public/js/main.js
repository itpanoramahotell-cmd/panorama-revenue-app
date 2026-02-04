import { auth, db, login, logout } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, getDocs, orderBy, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { UI } from './ui.js';
import * as Calc from './calculator.js';
import { renderTable } from './planner.js';

let appState = { strategies: [], currentId: null, pax: 2, nonRef: false };

// --- INITIALISERING ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        document.getElementById('login-overlay').style.display = 'none';
        await refreshStrategies();
    } else {
        document.getElementById('login-overlay').style.display = 'flex';
    }
});

async function refreshStrategies() {
    const q = query(collection(db, "strategies"), orderBy("updatedAt", "desc"));
    const snap = await getDocs(q);
    appState.strategies = snap.docs.map(d => d.data());
    UI.updateSidebar(appState.strategies, appState.currentId, loadStrategy);
}

function scrapeUI() {
    const data = {};
    document.querySelectorAll('input').forEach(i => {
        if(i.id && !i.id.startsWith('login')) {
            data[i.id] = (i.type === 'number' || i.type === 'range') ? parseFloat(i.value) : i.value;
        }
    });
    return data;
}

function updateAll() {
    const data = scrapeUI();
    const res = Calc.runRevenueCalc(data);
    UI.setTxt('totalRevenue', Calc.formatter.format(res.totalRev));
    UI.setTxt('revpar', Calc.formatter.format(res.revpar));
    UI.setTxt('adr', Calc.formatter.format(res.adr));
    UI.setTxt('displayFlexPrice', Calc.formatter.format(data.basePrice));
    UI.setTxt('displayNonRefPrice', Calc.formatter.format(res.nonRefPrice));
    
    // Break-even
    const beRevpar = (data.fixedCosts + (data.varCosts * (data.totalRooms * 30.4 * (data.occupancy/100)))) / (data.totalRooms * 30.4);
    UI.setTxt('beRevPar', Calc.formatter.format(beRevpar));
    
    renderTable(data, appState.pax, appState.nonRef);
}

// --- EVENT LISTENERS ---
document.querySelectorAll('input').forEach(i => i.addEventListener('input', updateAll));

document.getElementById('saveBtn').onclick = async () => {
    const id = appState.currentId || Date.now().toString();
    const docData = { id, name: document.getElementById('strategyName').value, data: scrapeUI(), updatedAt: new Date() };
    await setDoc(doc(db, "strategies", id), docData);
    appState.currentId = id;
    refreshStrategies();
};

document.getElementById('createNewBtn').onclick = () => {
    appState.currentId = null;
    document.getElementById('strategyName').value = "Ny strategi";
    updateAll();
};

document.getElementById('login-btn-action').onclick = () => login(document.getElementById('login-email').value, document.getElementById('login-password').value);
document.getElementById('logoutBtn').onclick = () => logout();

// Tab switching
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
        document.getElementById('view-' + btn.dataset.tab).style.display = 'block';
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    };
});

// PAX Buttons
document.querySelectorAll('.pax-btn').forEach(btn => {
    btn.onclick = () => {
        appState.pax = parseInt(btn.dataset.pax);
        document.querySelectorAll('.pax-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateAll();
    };
});

function loadStrategy(id) {
    appState.currentId = id;
    const s = appState.strategies.find(x => x.id === id);
    document.getElementById('strategyName').value = s.name;
    for (const [key, val] of Object.entries(s.data)) {
        const el = document.getElementById(key);
        if(el) el.value = val;
    }
    updateAll();
    UI.updateSidebar(appState.strategies, id, loadStrategy);
}