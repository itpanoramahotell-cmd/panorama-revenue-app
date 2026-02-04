import { auth, db, login, logout } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, getDocs, orderBy, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { UI } from './ui.js';
import * as Calc from './calculator.js';
import { renderTable } from './planner.js';

let appState = { strategies: [], currentId: null, pax: 2, nonRef: false, dirtyId: null };

// Faktiske data fra dine 12 månedsrapporter 2025
const historicalData = {
    revpar: [
        {label: 'Jan', value: 584}, {label: 'Feb', value: 665}, {label: 'Mar', value: 853}, 
        {label: 'Apr', value: 750}, {label: 'Mai', value: 1102}, {label: 'Jun', value: 1537}, 
        {label: 'Jul', value: 1538}, {label: 'Aug', value: 1788}, {label: 'Sep', value: 1244}, 
        {label: 'Okt', value: 993}, {label: 'Nov', value: 837}, {label: 'Des', value: 629}
    ],
    occupancy: [
        {label: 'Jan', value: 33.1}, {label: 'Feb', value: 36.6}, {label: 'Mar', value: 42.5}, 
        {label: 'Apr', value: 36.5}, {label: 'Mai', value: 45.4}, {label: 'Jun', value: 67.8}, 
        {label: 'Jul', value: 63.5}, {label: 'Aug', value: 74.0}, {label: 'Sep', value: 53.2}, 
        {label: 'Okt', value: 48.2}, {label: 'Nov', value: 40.2}, {label: 'Des', value: 29.0}
    ],
    lead: [
        {label: 'Jan', value: 44.6}, {label: 'Feb', value: 28.2}, {label: 'Mar', value: 67.9}, 
        {label: 'Apr', value: 40.0}, {label: 'Mai', value: 68.6}, {label: 'Jun', value: 82.1}, 
        {label: 'Jul', value: 30.8}, {label: 'Aug', value: 59.9}, {label: 'Sep', value: 77.2}, 
        {label: 'Okt', value: 73.2}, {label: 'Nov', value: 60.6}, {label: 'Des', value: 76.0}
    ],
    adr: [
        {label: 'Jan', value: 1767}, {label: 'Feb', value: 1818}, {label: 'Mar', value: 2006}, 
        {label: 'Apr', value: 2052}, {label: 'Mai', value: 2426}, {label: 'Jun', value: 2267}, 
        {label: 'Jul', value: 2422}, {label: 'Aug', value: 2416}, {label: 'Sep', value: 2339}, 
        {label: 'Okt', value: 2059}, {label: 'Nov', value: 2084}, {label: 'Des', value: 2167}
    ],
    avgRevpar: 1010 // Gjennomsnittlig RevPAR 2025
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

function updateRecommendations(revpar) {
    const el = document.getElementById('recommendationText');
    const status = document.getElementById('recStatus');
    const diff = revpar - historicalData.avgRevpar;
    
    if (revpar < 800) {
        el.innerText = "RevPAR er lavere enn ønsket. Vurder å øke belegg gjennom kampanjer eller sjekk om baseprisen er for lav.";
        status.innerText = "🔴 SVAK"; status.style.color = "#E53E3E";
    } else if (revpar < historicalData.avgRevpar) {
        el.innerText = `Du ligger ${Math.abs(Math.round(diff))} kr under snittet for 2025. Prøv å justere Booking Mix for å øke Flex-andelen.`;
        status.innerText = "🟡 UNDER SNITT"; status.style.color = "#DD6B20";
    } else {
        el.innerText = "Solid strategi! Du slår 2025-snittet. Husk at august var fjorårets beste måned med en RevPAR på 1 788 kr.";
        status.innerText = "🟢 OVER SNITT"; status.style.color = "#38A169";
    }
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
    
    const status = document.getElementById('beStatus');
    if(res.revpar >= beRevpar) { status.innerText = "✅ Lønnsom drift"; status.style.color = "#38A169"; }
    else { status.innerText = "⚠️ Under smertegrensen"; status.style.color = "#E53E3E"; }

    updateRecommendations(res.revpar);
    renderTable(data, appState.pax, appState.nonRef);
    
    if(triggeredByInput && appState.currentId) {
        appState.dirtyId = appState.currentId;
        UI.updateSidebar(appState.strategies, appState.currentId, loadStrategy, appState.dirtyId);
        UI.setSaveButtonState(true);
    }
}

// EVENTS
document.querySelectorAll('input').forEach(i => i.addEventListener('input', () => updateAll(true)));

document.getElementById('createNewBtn').onclick = () => {
    appState.currentId = "temp_" + Date.now();
    appState.dirtyId = appState.currentId;
    const input = document.getElementById('strategyName');
    input.value = "Ny strategi";
    input.focus(); input.select();
    UI.setSaveButtonState(true);
    updateAll();
};

document.getElementById('saveBtn').onclick = async () => {
    const id = appState.currentId || Date.now().toString();
    await setDoc(doc(db, "strategies", id), { id, name: document.getElementById('strategyName').value, data: scrapeUI(), updatedAt: new Date() });
    appState.currentId = id; appState.dirtyId = null;
    UI.setSaveButtonState(false);
    await refreshStrategies();
};

document.getElementById('deleteBtn').onclick = async () => {
    if(!appState.currentId || !confirm("Vil du slette denne strategien?")) return;
    await deleteDoc(doc(db, "strategies", appState.currentId));
    appState.currentId = null; appState.dirtyId = null;
    document.getElementById('deleteBtn').style.display = 'none';
    UI.setSaveButtonState(false);
    await refreshStrategies();
};

document.getElementById('applyCostsBtn').onclick = () => {
    const f = (parseFloat(document.getElementById('costSalaries').value) || 0) + (parseFloat(document.getElementById('costRent').value) || 0) + (parseFloat(document.getElementById('costEnergy').value) || 0) + (parseFloat(document.getElementById('costAdmin').value) || 0);
    const v = (parseFloat(document.getElementById('costCleaning').value) || 0) + (parseFloat(document.getElementById('costLinen').value) || 0) + (parseFloat(document.getElementById('costFood').value) || 0) + (parseFloat(document.getElementById('costComm').value) || 0);
    document.getElementById('fixedCosts').value = f;
    document.getElementById('varCosts').value = v;
    UI.hideModal('costModal'); updateAll(true);
};

document.getElementById('openCostModalBtn').onclick = () => UI.showModal('costModal');
document.getElementById('closeCostBtn').onclick = () => UI.hideModal('costModal');
document.getElementById('settingsBtn').onclick = () => UI.showModal('settingsModal');
document.getElementById('closeSettingsBtn').onclick = () => UI.hideModal('settingsModal');

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = () => {
        const t = btn.dataset.tab;
        document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
        document.getElementById('view-' + t).style.display = 'block';
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if(t === 'analysis') {
            UI.renderCharts('chart-season', historicalData.revpar, 2000);
            UI.renderCharts('chart-occupancy', historicalData.occupancy, 100);
            UI.renderCharts('chart-lead', historicalData.lead, 90);
            UI.renderCharts('chart-adr', historicalData.adr, 3000);
        }
    };
});

document.getElementById('nonRefToggle').onchange = (e) => { appState.nonRef = e.target.checked; updateAll(true); };
document.querySelectorAll('.pax-btn').forEach(btn => {
    btn.onclick = () => {
        appState.pax = parseInt(btn.dataset.pax);
        document.querySelectorAll('.pax-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateAll(true);
    };
});

function loadStrategy(id) {
    appState.currentId = id; appState.dirtyId = null;
    const s = appState.strategies.find(x => x.id === id);
    document.getElementById('strategyName').value = s.name;
    document.getElementById('deleteBtn').style.display = 'block';
    for (const [k, v] of Object.entries(s.data)) { const el = document.getElementById(k); if(el) el.value = v; }
    updateAll(false); UI.setSaveButtonState(false);
}

document.getElementById('login-btn-action').onclick = () => login(document.getElementById('login-email').value, document.getElementById('login-password').value);
document.getElementById('logoutBtn').onclick = () => logout();