import { auth, db, login, logout } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, getDocs, orderBy, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { UI } from './ui.js';
import * as Calc from './calculator.js';
import { renderTable } from './planner.js';

let appState = { strategies: [], currentId: null, pax: 2, nonRef: false, dirtyId: null };

const historicalData = {
    revpar: [
        {label: 'Jan', value: 1767}, {label: 'Feb', value: 1818}, {label: 'Mar', value: 2005}, 
        {label: 'Apr', value: 2051}, {label: 'Mai', value: 2425}, {label: 'Jun', value: 2267}, 
        {label: 'Jul', value: 2421}, {label: 'Aug', value: 2415}, {label: 'Sep', value: 2339}, 
        {label: 'Okt', value: 2058}
    ],
    occupancy: [
        {label: 'Jan', value: 44.6, display: '44.6%'}, {label: 'Feb', value: 28.2, display: '28.2%'},
        {label: 'Mar', value: 67.9, display: '67.9%'}, {label: 'Apr', value: 40.0, display: '40.0%'},
        {label: 'Mai', value: 68.6, display: '68.6%'}, {label: 'Jun', value: 82.1, display: '82.1%'},
        {label: 'Jul', value: 30.8, display: '30.8%'}, {label: 'Aug', value: 59.9, display: '59.9%'},
        {label: 'Sep', value: 77.2, display: '77.2%'}, {label: 'Okt', value: 73.2, display: '73.2%'}
    ]
};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        UI.hideModal('login-overlay');
        await refreshStrategies();
    } else {
        UI.showModal('login-overlay');
    }
});

async function refreshStrategies() {
    const q = query(collection(db, "strategies"), orderBy("updatedAt", "desc"));
    const snap = await getDocs(q);
    appState.strategies = snap.docs.map(d => d.data());
    UI.updateSidebar(appState.strategies, appState.currentId, loadStrategy, appState.dirtyId);
}

function scrapeUI() {
    const data = {};
    document.querySelectorAll('input').forEach(i => {
        if(i.id && !i.id.startsWith('login')) {
            data[i.id] = (i.type === 'number' || i.type === 'range') ? parseFloat(i.value) || 0 : i.value;
        }
    });
    return data;
}

function updateAll(triggeredByInput = false) {
    const data = scrapeUI();
    UI.updateSliderValue('basePrice', data.basePrice, ' kr');
    UI.updateSliderValue('occupancy', data.occupancy, '%');
    UI.updateSliderValue('discount', data.discount, '%');
    UI.updateSliderValue('mix', data.mix, '%');
    UI.updateSliderValue('seasonMid', data.seasonMid, '%');
    UI.updateSliderValue('seasonLow', data.seasonLow, '%');

    const res = Calc.runRevenueCalc(data);
    UI.setTxt('totalRevenue', Calc.formatter.format(res.totalRev));
    UI.setTxt('revpar', Calc.formatter.format(res.revpar));
    UI.setTxt('adr', Calc.formatter.format(res.adr));
    UI.setTxt('displayFlexPrice', Calc.formatter.format(data.basePrice));
    UI.setTxt('displayNonRefPrice', Calc.formatter.format(res.nonRefPrice));
    
    const beRevpar = (data.fixedCosts + (data.varCosts * (data.totalRooms * 30.4 * (data.occupancy/100)))) / (data.totalRooms * 30.4);
    UI.setTxt('beRevPar', Calc.formatter.format(beRevpar || 0));
    
    renderTable(data, appState.pax, appState.nonRef);
    
    // Punkt 1, 2 & 6: Aktiver Draft og Save-knapp kun ved endring
    if(triggeredByInput && appState.currentId) {
        appState.dirtyId = appState.currentId;
        UI.updateSidebar(appState.strategies, appState.currentId, loadStrategy, appState.dirtyId);
        UI.setSaveButtonState(true);
    }
}

// --- EVENT LISTENERS ---
document.querySelectorAll('input').forEach(i => i.addEventListener('input', () => updateAll(true)));

// Punkt 5: Ny strategi med fokus
document.getElementById('createNewBtn').onclick = () => {
    appState.currentId = "temp_" + Date.now();
    appState.dirtyId = appState.currentId;
    const nameInput = document.getElementById('strategyName');
    nameInput.value = "Ny strategi";
    nameInput.focus();
    nameInput.select();
    UI.setSaveButtonState(true);
    updateAll();
};

document.getElementById('saveBtn').onclick = async () => {
    const id = appState.currentId || Date.now().toString();
    const docData = { id, name: document.getElementById('strategyName').value, data: scrapeUI(), updatedAt: new Date() };
    await setDoc(doc(db, "strategies", id), docData);
    appState.currentId = id;
    appState.dirtyId = null;
    UI.setSaveButtonState(false);
    await refreshStrategies();
};

// Punkt 4: Sletting med advarsel
document.getElementById('deleteBtn').onclick = async () => {
    if(!appState.currentId) return;
    const confirmDelete = confirm("⚠️ Er du sikker på at du vil slette denne strategien permanent?");
    if(confirmDelete) {
        await deleteDoc(doc(db, "strategies", appState.currentId));
        appState.currentId = null;
        appState.dirtyId = null;
        document.getElementById('deleteBtn').style.display = 'none';
        await refreshStrategies();
    }
};

// Modaler
document.getElementById('openCostModalBtn').onclick = () => UI.showModal('costModal');
document.getElementById('closeCostBtn').onclick = () => UI.hideModal('costModal');
document.getElementById('settingsBtn').onclick = () => UI.showModal('settingsModal');
document.getElementById('closeSettingsBtn').onclick = () => UI.hideModal('settingsModal');

// Tab switching
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
        document.getElementById('view-' + tab).style.display = 'block';
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if(tab === 'analysis') {
            UI.renderCharts('chart-season', historicalData.revpar, 3000);
            UI.renderCharts('chart-occupancy', historicalData.occupancy, 100);
        }
    };
});

document.getElementById('nonRefToggle').onchange = (e) => {
    appState.nonRef = e.target.checked;
    updateAll(true);
};

document.querySelectorAll('.pax-btn').forEach(btn => {
    btn.onclick = () => {
        appState.pax = parseInt(btn.dataset.pax);
        document.querySelectorAll('.pax-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateAll(true);
    };
});

function loadStrategy(id) {
    appState.currentId = id;
    appState.dirtyId = null;
    const s = appState.strategies.find(x => x.id === id);
    document.getElementById('strategyName').value = s.name;
    document.getElementById('deleteBtn').style.display = 'block';
    for (const [key, val] of Object.entries(s.data)) {
        const el = document.getElementById(key);
        if(el) el.value = val;
    }
    updateAll(false); // Fjerner Draft ved innlasting
    UI.setSaveButtonState(false);
}

document.getElementById('login-btn-action').onclick = () => login(document.getElementById('login-email').value, document.getElementById('login-password').value);
document.getElementById('logoutBtn').onclick = () => logout();