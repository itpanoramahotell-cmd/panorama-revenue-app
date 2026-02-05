import { auth, db, login, logout } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, getDocs, orderBy, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { UI } from './ui.js';
import * as Calc from './calculator.js';
import { renderTable } from './planner.js';

let appState = { 
    allItems: [], 
    currentId: null,
    activeView: null, 
    pax: 2, 
    nonRef: false, 
    dirtyIds: new Set(),
    editMode: false,
    expandedIds: new Set()
};

// Analyse-data (Globalt)
const historicalData = {
    revpar: [{label:'Jan',value:584},{label:'Feb',value:665},{label:'Mar',value:853},{label:'Apr',value:750},{label:'Mai',value:1102},{label:'Jun',value:1537},{label:'Jul',value:1538},{label:'Aug',value:1788},{label:'Sep',value:1244},{label:'Okt',value:993},{label:'Nov',value:837},{label:'Des',value:629}],
    occupancy: [{label:'Jan',value:33.1},{label:'Feb',value:36.6},{label:'Mar',value:42.5},{label:'Apr',value:36.5},{label:'Mai',value:45.4},{label:'Jun',value:67.8},{label:'Jul',value:63.5},{label:'Aug',value:74.0},{label:'Sep',value:53.2},{label:'Okt',value:48.2},{label:'Nov',value:40.2},{label:'Des',value:29.0}],
    lead: [{label:'Jan',value:44.6},{label:'Feb',value:28.2},{label:'Mar',value:67.9},{label:'Apr',value:40.0},{label:'Mai',value:68.6},{label:'Jun',value:82.1},{label:'Jul',value:30.8},{label:'Aug',value:59.9},{label:'Sep',value:77.2},{label:'Okt',value:73.2},{label:'Nov',value:60.6},{label:'Des',value:76.0}],
    adr: [{label:'Jan',value:1767},{label:'Feb',value:1818},{label:'Mar',value:2006},{label:'Apr',value:2052},{label:'Mai',value:2426},{label:'Jun',value:2267},{label:'Jul',value:2422},{label:'Aug',value:2416},{label:'Sep',value:2339},{label:'Okt',value:2059},{label:'Nov',value:2084},{label:'Des',value:2167}],
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
    
    // REDNINGSAKSJON: Sjekk om 2026 og Prisplan finnes, hvis ikke lag dem
    await ensureInitialStructure();
    
    updateTreeView();
}

async function ensureInitialStructure() {
    let year2026 = appState.allItems.find(i => i.name === '2026' && i.type === 'year');
    
    if (!year2026) {
        // Opprett 2026 Mappe hvis den mangler
        const id = 'year_' + Date.now();
        year2026 = { id, name: '2026', type: 'year', parentId: null, updatedAt: new Date(), sortOrder: 1 };
        await setDoc(doc(db, "strategies", id), year2026);
        appState.allItems.push(year2026);
    }

    let plan2026 = appState.allItems.find(i => i.type === 'priceplan' && i.parentId === year2026.id);
    if (!plan2026) {
        // Opprett Prisplan 2026 hvis den mangler under året
        const pid = 'priceplan_' + Date.now();
        const data = scrapeUI(); // Bruker defaults
        plan2026 = { id: pid, name: 'Prisplan 2026', type: 'priceplan', parentId: year2026.id, data, updatedAt: new Date(), sortOrder: 1 };
        await setDoc(doc(db, "strategies", pid), plan2026);
        appState.allItems.push(plan2026);
    }
    
    // Åpne 2026-mappen automatisk
    appState.expandedIds.add(year2026.id);
}

function updateTreeView() {
    const tree = buildTree(appState.allItems);
    const container = document.getElementById('strategyTree');
    UI.renderTree(tree, container, appState.currentId, handleSelect, handleMove, appState.dirtyIds, appState.editMode, appState.expandedIds, toggleExpand);
    document.getElementById('rootDropZone').style.display = appState.editMode ? 'block' : 'none';
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
    if(item.type === 'folder') { toggleExpand(item.id); return; }
    loadItem(item);
}

function loadItem(item) {
    appState.currentId = item.id;
    document.getElementById('strategyName').value = item.name;
    document.getElementById('deleteBtn').style.display = 'block';
    
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');

    if (item.type === 'priceplan') {
        // VIS PRISPLANLEGGER
        appState.activeView = 'planner';
        document.getElementById('view-planner').style.display = 'block';
        if (item.data) {
            for (const [k, v] of Object.entries(item.data)) { const el = document.getElementById(k); if(el) el.value = v; }
        }
        // Tegn tabellen uten å trigge draft
        renderTable(scrapeUI(), appState.pax, appState.nonRef);
    } 
    else if (item.type === 'strategy') {
        // VIS KALKULATOR
        appState.activeView = 'calculator';
        document.getElementById('view-calculator').style.display = 'block';
        if (item.data) {
            for (const [k, v] of Object.entries(item.data)) { const el = document.getElementById(k); if(el) el.value = v; }
        }
        updateAll(false);
    } 
    else {
        // Mapper (År, Sesong, Segment)
        document.getElementById('view-placeholder').style.display = 'block';
        appState.activeView = null;
    }

    updateTreeView();
    UI.setSaveButtonState(appState.dirtyIds.has(item.id));
}

// Global Analyse Button
document.getElementById('globalAnalysisBtn').onclick = () => {
    appState.currentId = null;
    appState.activeView = 'analysis';
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.getElementById('view-analysis').style.display = 'block';
    document.getElementById('strategyName').value = "Analyseoversikt";
    
    UI.renderCharts('chart-season', historicalData.revpar, 2000);
    UI.renderCharts('chart-occupancy', historicalData.occupancy, 100);
    UI.renderCharts('chart-lead', historicalData.lead, 90);
    UI.renderCharts('chart-adr', historicalData.adr, 3000);
    
    updateTreeView(); // Fjerner active-markering i treet
};

async function handleMove(draggedId, targetId, targetType) {
    if (draggedId === targetId) return;
    const item = appState.allItems.find(i => i.id === draggedId);
    if (!item) return;

    if (targetId === 'root') item.parentId = null;
    else if (['year', 'season', 'segment'].includes(targetType)) {
        item.parentId = targetId;
        appState.expandedIds.add(targetId);
    } else {
        const targetItem = appState.allItems.find(i => i.id === targetId);
        if (targetItem) item.parentId = targetItem.parentId;
    }

    await setDoc(doc(db, "strategies", draggedId), { ...item, updatedAt: new Date() });
    refreshStrategies();
}

async function createItem(type, parentId = null) {
    const name = prompt(`Navn på nytt ${type}:`);
    if (!name) return;
    const id = `${type}_` + Date.now();
    if (parentId) appState.expandedIds.add(parentId);

    const newItem = { id, name, type, parentId, updatedAt: new Date(), sortOrder: Date.now() };
    if (type === 'strategy' || type === 'priceplan') {
        newItem.data = scrapeUI(); // Initial data
        appState.currentId = id;
        appState.dirtyIds.add(id);
        UI.setSaveButtonState(true);
    }

    await setDoc(doc(db, "strategies", id), newItem);
    await refreshStrategies();
    // Hvis det var en strategi/plan, last den inn
    if(type === 'strategy' || type === 'priceplan') loadItem(newItem);
}

function scrapeUI() {
    const data = {};
    document.querySelectorAll('input').forEach(i => {
        if(i.id && !i.id.startsWith('login') && i.id !== 'strategyName') {
            data[i.id] = (i.type === 'number' || i.type === 'range') ? parseFloat(i.value) || 0 : i.value;
        }
    });
    return data;
}

function updateAll(triggeredByInput = false) {
    if (appState.activeView === 'calculator') {
        const data = scrapeUI();
        UI.updateSliderValue('basePrice', data.basePrice, ' kr');
        UI.updateSliderValue('occupancy', data.occupancy, '%');
        UI.updateSliderValue('discount', data.discount, '%');
        UI.updateSliderValue('mix', data.mix, '%');
        
        const res = Calc.runRevenueCalc(data);
        UI.setTxt('totalRevenue', Calc.formatter.format(res.totalRev));
        UI.setTxt('revpar', Calc.formatter.format(res.revpar));
        
        const beRevpar = (data.fixedCosts + (data.varCosts * (data.totalRooms * 30.4 * (data.occupancy/100)))) / (data.totalRooms * 30.4);
        UI.setTxt('beRevPar', Calc.formatter.format(beRevpar || 0));
        
        const status = document.getElementById('beStatus');
        if(res.revpar >= beRevpar) { status.innerText = "✅ Lønnsom"; status.style.color = "#38A169"; }
        else { status.innerText = "⚠️ Tap"; status.style.color = "#E53E3E"; }
    }
    
    if (appState.activeView === 'planner') {
        const data = scrapeUI();
        UI.updateSliderValue('seasonMid', data.seasonMid, '%');
        UI.updateSliderValue('seasonLow', data.seasonLow, '%');
        renderTable(data, appState.pax, appState.nonRef);
    }

    // DRAFT LOGIKK (Kun ved input, ikke navigasjon)
    if(triggeredByInput && appState.currentId) {
        appState.dirtyIds.add(appState.currentId);
        updateTreeView();
        UI.setSaveButtonState(true);
    }
}

// Synkroniser navn
document.getElementById('strategyName').addEventListener('input', (e) => {
    const newName = e.target.value;
    if(appState.currentId) {
        const item = appState.allItems.find(i => i.id === appState.currentId);
        if(item) {
            item.name = newName;
            appState.dirtyIds.add(appState.currentId);
            updateTreeView();
            UI.setSaveButtonState(true);
        }
    }
});

// LISTENERS
document.querySelectorAll('input').forEach(i => {
    if(i.id !== 'strategyName') i.addEventListener('input', () => updateAll(true));
});

// View triggers (ingen draft)
document.getElementById('nonRefToggle').onchange = (e) => { appState.nonRef = e.target.checked; updateAll(false); };
document.querySelectorAll('.pax-btn').forEach(btn => {
    btn.onclick = () => {
        appState.pax = parseInt(btn.dataset.pax);
        document.querySelectorAll('.pax-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateAll(false);
    };
});

document.getElementById('createYearBtn').onclick = () => createItem('year');
document.getElementById('createSeasonBtn').onclick = () => { createItem('season'); alert("Dra sesongen inn i et år."); };
document.getElementById('createSegmentBtn').onclick = () => { createItem('segment'); alert("Dra segmentet inn i en sesong."); };
document.getElementById('createStrategyBtn').onclick = () => { createItem('strategy'); alert("Dra strategien inn i et segment."); };
document.getElementById('createPlanBtn').onclick = () => { createItem('priceplan'); alert("Dra Prisplanen inn i et År."); };

document.getElementById('editModeToggle').onchange = (e) => { appState.editMode = e.target.checked; updateTreeView(); };

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
    document.getElementById('view-placeholder').style.display = 'block';
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

document.getElementById('login-btn-action').onclick = () => login(document.getElementById('login-email').value, document.getElementById('login-password').value);
document.getElementById('logoutBtn').onclick = () => logout();