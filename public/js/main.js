import { auth, db, login, logout } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, getDocs, orderBy, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { UI } from './ui.js';
import * as Calc from './calculator.js';
import { renderTable } from './planner.js';

let appState = { 
    allItems: [], 
    currentId: null, 
    pax: 2, 
    nonRef: false, 
    dirtyIds: new Set(),
    editMode: false,
    expandedIds: new Set()
};

const historicalData = {
    revpar: [{label:'Jan',value:584},{label:'Feb',value:665},{label:'Mar',value:853},{label:'Apr',value:750},{label:'Mai',value:1102},{label:'Jun',value:1537},{label:'Jul',value:1538},{label:'Aug',value:1788},{label:'Sep',value:1244},{label:'Okt',value:993},{label:'Nov',value:837},{label:'Des',value:629}],
    occupancy: [{label:'Jan',value:33.1},{label:'Feb',value:36.6},{label:'Mar',value:42.5},{label:'Apr',value:36.5},{label:'Mai',value:45.4},{label:'Jun',value:67.8},{label:'Jul',value:63.5},{label:'Aug',value:74.0},{label:'Sep',value:53.2},{label:'Okt',value:48.2},{label:'Nov',value:40.2},{label:'Des',value:29.0}],
    lead: [{label:'Jan',value:44.6},{label:'Feb',value:28.2},{label:'Mar',value:67.9},{label:'Apr',value:40.0},{label:'Mai',value:68.6},{label:'Jun',value:82.1},{label:'Jul',value:30.8},{label:'Aug',value:59.9},{label:'Sep',value:77.2},{label:'Okt',value:73.2},{label:'Nov',value:60.6},{label:'Des',value:76.0}],
    adr: [{label:'Jan',value:1767},{label:'Feb',value:1818},{label:'Mar',value:2006},{label:'Apr',value:2052},{label:'Mai',value:2426},{label:'Jun',value:2267},{label:'Jul',value:2422},{label:'Aug',value:2416},{label:'Sep',value:2339},{label:'Okt',value:2059},{label:'Nov',value:2084},{label:'Des',value:2167}],
    avgRevpar: 1010
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
    appState.allItems = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    updateTreeView();
}

function updateTreeView() {
    const tree = buildTree(appState.allItems);
    const container = document.getElementById('strategyTree');
    UI.renderTree(tree, container, appState.currentId, handleSelect, handleMove, appState.dirtyIds, appState.editMode, appState.expandedIds, toggleExpand);
    
    const rootZone = document.getElementById('rootDropZone');
    rootZone.style.display = appState.editMode ? 'block' : 'none';
}

function buildTree(items) {
    const rootItems = [];
    const lookup = {};
    items.forEach(item => { lookup[item.id] = { ...item, children: [] }; });
    items.forEach(item => {
        if (item.parentId && lookup[item.parentId]) {
            lookup[item.parentId].children.push(lookup[item.id]);
        } else {
            rootItems.push(lookup[item.id]);
        }
    });
    return rootItems;
}

function toggleExpand(id) {
    if (appState.expandedIds.has(id)) appState.expandedIds.delete(id);
    else appState.expandedIds.add(id);
    updateTreeView();
}

function handleSelect(item) {
    if (item.type !== 'strategy') return;
    loadStrategy(item.id);
}

async function handleMove(draggedId, targetId, targetType) {
    if (draggedId === targetId) return;
    const item = appState.allItems.find(i => i.id === draggedId);
    if (!item) return;

    if (targetId === 'root') {
        item.parentId = null;
    } else if (['year', 'season', 'segment'].includes(targetType)) {
        item.parentId = targetId;
        appState.expandedIds.add(targetId);
    } else {
        const targetItem = appState.allItems.find(i => i.id === targetId);
        if (targetItem) item.parentId = targetItem.parentId;
    }

    await setDoc(doc(db, "strategies", draggedId), { ...item, updatedAt: new Date() });
    updateTreeView();
}

async function createItem(type, parentId = null) {
    const name = prompt(`Navn på nytt ${type}:`);
    if (!name) return;
    const id = `${type}_` + Date.now();
    
    if (parentId) appState.expandedIds.add(parentId);

    const newItem = { 
        id, name, type, parentId, 
        updatedAt: new Date(),
        sortOrder: Date.now() 
    };
    
    if (type === 'strategy') {
        newItem.data = scrapeUI();
        appState.currentId = id;
        appState.dirtyIds.add(id);
        UI.setSaveButtonState(true);
    }

    await setDoc(doc(db, "strategies", id), newItem);
    await refreshStrategies();
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
    
    const recText = document.getElementById('recommendationText');
    const recStatus = document.getElementById('recStatus');
    if (res.revpar < historicalData.avgRevpar) {
        recText.innerText = "RevPAR ligger under fjorårssnittet (1010 kr). Vurder tiltak.";
        recStatus.innerText = "🟡 UNDER SNITT"; recStatus.style.color = "#DD6B20";
    } else {
        recText.innerText = "Solid ytelse! Du ligger over snittet for 2025.";
        recStatus.innerText = "🟢 OVER SNITT"; recStatus.style.color = "#38A169";
    }

    renderTable(data, appState.pax, appState.nonRef);
    
    if(triggeredByInput && appState.currentId) {
        appState.dirtyIds.add(appState.currentId);
        updateTreeView();
        UI.setSaveButtonState(true);
    }
}

// SYNCHRONIZATION LOGIC (NY!)
document.getElementById('strategyName').addEventListener('input', (e) => {
    const newName = e.target.value;
    if(appState.currentId) {
        // Finn objektet i minnet
        const item = appState.allItems.find(i => i.id === appState.currentId);
        if(item) {
            item.name = newName; // Oppdater lokalt minne
            appState.dirtyIds.add(appState.currentId); // Merk som endret
            updateTreeView(); // Tegn treet på nytt umiddelbart
            UI.setSaveButtonState(true);
        }
    }
});

// EVENTS
document.querySelectorAll('input').forEach(i => {
    if(i.id !== 'strategyName') i.addEventListener('input', () => updateAll(true));
});

document.getElementById('createYearBtn').onclick = () => createItem('year');
document.getElementById('createSeasonBtn').onclick = () => { createItem('season'); alert("Dra sesongen inn i et år."); };
document.getElementById('createSegmentBtn').onclick = () => { createItem('segment'); alert("Dra segmentet inn i en sesong."); };
document.getElementById('createStrategyBtn').onclick = () => { createItem('strategy'); alert("Dra strategien inn i et segment."); };

document.getElementById('editModeToggle').onchange = (e) => {
    appState.editMode = e.target.checked;
    updateTreeView();
};

const rootZone = document.getElementById('rootDropZone');
rootZone.ondragover = (e) => { e.preventDefault(); rootZone.classList.add('drag-over'); };
rootZone.ondragleave = () => rootZone.classList.remove('drag-over');
rootZone.ondrop = (e) => {
    e.preventDefault();
    rootZone.classList.remove('drag-over');
    const draggedId = e.dataTransfer.getData('text/plain');
    handleMove(draggedId, 'root');
};

document.getElementById('saveBtn').onclick = async () => {
    if(!appState.currentId) return;
    const item = appState.allItems.find(i => i.id === appState.currentId);
    if(item) {
        item.data = scrapeUI();
        item.updatedAt = new Date();
        // Navn er allerede oppdatert i minnet via input-listener
        await setDoc(doc(db, "strategies", item.id), item);
        appState.dirtyIds.delete(item.id);
        UI.setSaveButtonState(appState.dirtyIds.size > 0);
        refreshStrategies();
    }
};

document.getElementById('deleteBtn').onclick = async () => {
    if(!appState.currentId || !confirm("Slette?")) return;
    await deleteDoc(doc(db, "strategies", appState.currentId));
    appState.currentId = null;
    appState.dirtyIds.delete(appState.currentId);
    document.getElementById('deleteBtn').style.display = 'none';
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
document.getElementById('saveGlobalSettingsBtn').onclick = () => {
    document.getElementById('totalRooms').value = document.getElementById('globalTotalRooms').value;
    UI.hideModal('settingsModal'); updateAll(true);
};

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
    appState.currentId = id;
    const s = appState.allItems.find(x => x.id === id);
    if(!s) return;
    document.getElementById('strategyName').value = s.name;
    document.getElementById('deleteBtn').style.display = 'block';
    if(s.data) {
        for (const [k, v] of Object.entries(s.data)) { const el = document.getElementById(k); if(el) el.value = v; }
    }
    updateAll(false);
    UI.setSaveButtonState(appState.dirtyIds.has(id));
}

document.getElementById('login-btn-action').onclick = () => login(document.getElementById('login-email').value, document.getElementById('login-password').value);
document.getElementById('logoutBtn').onclick = () => logout();