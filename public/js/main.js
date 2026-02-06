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
    expandedIds: new Set(),
    selectedRoomTypes: new Set(['STD','SUP','DLX','JS','JSE','FS1','FS2','FSE']) // Default alle
};

// KOMPLETT DATA FRA 2025 RAPPORTENE
const roomData2025 = {
  "STD": [
    {"month": "Jan", "capacity": 1085, "sold": 343.0, "revenue": 505492.41, "lead": 45.6},
    {"month": "Feb", "capacity": 980, "sold": 299.0, "revenue": 417198.95, "lead": 24.4},
    {"month": "Mar", "capacity": 1085, "sold": 408.0, "revenue": 708730.64, "lead": 75.0},
    {"month": "Apr", "capacity": 1050, "sold": 293.0, "revenue": 515854.54, "lead": 48.0},
    {"month": "Mai", "capacity": 1085, "sold": 434.0, "revenue": 830923.64, "lead": 63.6},
    {"month": "Jun", "capacity": 1050, "sold": 695.0, "revenue": 1293691.83, "lead": 87.7},
    {"month": "Jul", "capacity": 1085, "sold": 452.0, "revenue": 703831.76, "lead": 17.9},
    {"month": "Aug", "capacity": 1085, "sold": 665.0, "revenue": 1205544.32, "lead": 59.4},
    {"month": "Sep", "capacity": 1050, "sold": 567.0, "revenue": 1098626.47, "lead": 91.4},
    {"month": "Okt", "capacity": 1085, "sold": 499.0, "revenue": 799747.56, "lead": 77.9},
    {"month": "Nov", "capacity": 1050, "sold": 444.0, "revenue": 740113.94, "lead": 61.0},
    {"month": "Des", "capacity": 1085, "sold": 345.0, "revenue": 639175.89, "lead": 76.8}
  ],
  "SUP": [
    {"month": "Jan", "capacity": 620, "sold": 213.0, "revenue": 348001.26, "lead": 49.0},
    {"month": "Feb", "capacity": 560, "sold": 256.0, "revenue": 429765.73, "lead": 32.9},
    {"month": "Mar", "capacity": 620, "sold": 350.0, "revenue": 622088.83, "lead": 62.0},
    {"month": "Apr", "capacity": 600, "sold": 282.0, "revenue": 537368.13, "lead": 33.1},
    {"month": "Mai", "capacity": 620, "sold": 281.0, "revenue": 653357.08, "lead": 88.8},
    {"month": "Jun", "capacity": 600, "sold": 398.0, "revenue": 836503.34, "lead": 101.6},
    {"month": "Jul", "capacity": 620, "sold": 427.0, "revenue": 897067.86, "lead": 36.8},
    {"month": "Aug", "capacity": 620, "sold": 473.0, "revenue": 993392.99, "lead": 53.3},
    {"month": "Sep", "capacity": 600, "sold": 364.0, "revenue": 774223.1, "lead": 74.5},
    {"month": "Okt", "capacity": 620, "sold": 325.0, "revenue": 578928.01, "lead": 88.9},
    {"month": "Nov", "capacity": 600, "sold": 265.0, "revenue": 512571.68, "lead": 74.6},
    {"month": "Des", "capacity": 620, "sold": 184.0, "revenue": 352070.85, "lead": 92.8}
  ],
  "JS": [
    {"month": "Jan", "capacity": 465, "sold": 158.0, "revenue": 382752.62, "lead": 38.1},
    {"month": "Feb", "capacity": 420, "sold": 176.0, "revenue": 450044.38, "lead": 29.0},
    {"month": "Mar", "capacity": 465, "sold": 204.0, "revenue": 528163.45, "lead": 65.0},
    {"month": "Apr", "capacity": 450, "sold": 189.0, "revenue": 467483.83, "lead": 34.2},
    {"month": "Mai", "capacity": 465, "sold": 255.0, "revenue": 785327.0, "lead": 61.3},
    {"month": "Jun", "capacity": 450, "sold": 305.0, "revenue": 843555.81, "lead": 48.4},
    {"month": "Jul", "capacity": 465, "sold": 411.0, "revenue": 1268122.21, "lead": 26.4},
    {"month": "Aug", "capacity": 465, "sold": 430.0, "revenue": 1272572.55, "lead": 53.6},
    {"month": "Sep", "capacity": 450, "sold": 217.0, "revenue": 670979.03, "lead": 41.9},
    {"month": "Okt", "capacity": 465, "sold": 243.0, "revenue": 691727.58, "lead": 57.3},
    {"month": "Nov", "capacity": 450, "sold": 177.0, "revenue": 490436.24, "lead": 40.7},
    {"month": "Des", "capacity": 465, "sold": 122.0, "revenue": 312451.93, "lead": 53.4}
  ],
  "FS2": [
    {"month": "Jan", "capacity": 124, "sold": 45.0, "revenue": 88080.88, "lead": 51.9},
    {"month": "Feb", "capacity": 112, "sold": 40.0, "revenue": 61358.0, "lead": 19.3},
    {"month": "Mar", "capacity": 124, "sold": 32.0, "revenue": 92792.24, "lead": 69.3},
    {"month": "Apr", "capacity": 120, "sold": 47.0, "revenue": 104403.26, "lead": 48.4},
    {"month": "Mai", "capacity": 124, "sold": 51.0, "revenue": 133001.78, "lead": 53.1},
    {"month": "Jun", "capacity": 120, "sold": 89.0, "revenue": 274134.35, "lead": 60.3},
    {"month": "Jul", "capacity": 124, "sold": 106.0, "revenue": 333362.98, "lead": 56.4},
    {"month": "Aug", "capacity": 124, "sold": 117.0, "revenue": 401181.53, "lead": 93.9},
    {"month": "Sep", "capacity": 120, "sold": 41.0, "revenue": 120942.92, "lead": 59.3},
    {"month": "Okt", "capacity": 124, "sold": 55.0, "revenue": 147429.73, "lead": 43.6},
    {"month": "Nov", "capacity": 120, "sold": 35.0, "revenue": 114506.75, "lead": 64.3},
    {"month": "Des", "capacity": 124, "sold": 19.0, "revenue": 64994.51, "lead": 56.1}
  ],
  "FSE": [
    {"month": "Jan", "capacity": 93, "sold": 35.0, "revenue": 71555.72, "lead": 36.5},
    {"month": "Feb", "capacity": 84, "sold": 27.0, "revenue": 84124.62, "lead": 17.3},
    {"month": "Mar", "capacity": 93, "sold": 28.0, "revenue": 84031.4, "lead": 62.2},
    {"month": "Apr", "capacity": 90, "sold": 31.0, "revenue": 90576.7, "lead": 63.9},
    {"month": "Mai", "capacity": 93, "sold": 49.0, "revenue": 179849.25, "lead": 74.9},
    {"month": "Jun", "capacity": 90, "sold": 80.0, "revenue": 269368.75, "lead": 92.4},
    {"month": "Jul", "capacity": 93, "sold": 102.0, "revenue": 320256.6, "lead": 100.7},
    {"month": "Aug", "capacity": 93, "sold": 79.0, "revenue": 288655.98, "lead": 116.0},
    {"month": "Sep", "capacity": 90, "sold": 35.0, "revenue": 118992.1, "lead": 88.1},
    {"month": "Okt", "capacity": 93, "sold": 34.0, "revenue": 130815.61, "lead": 27.0},
    {"month": "Nov", "capacity": 90, "sold": 20.0, "revenue": 78993.55, "lead": 29.7},
    {"month": "Des", "capacity": 93, "sold": 21.0, "revenue": 103242.95, "lead": 59.1}
  ],
  "DLX": [
    {"month": "Jan", "capacity": 62, "sold": 25.0, "revenue": 50955.09, "lead": 38.4},
    {"month": "Feb", "capacity": 56, "sold": 25.0, "revenue": 53969.95, "lead": 39.6},
    {"month": "Mar", "capacity": 62, "sold": 38.0, "revenue": 82808.48, "lead": 72.5},
    {"month": "Apr", "capacity": 60, "sold": 37.0, "revenue": 81607.49, "lead": 39.3},
    {"month": "Mai", "capacity": 62, "sold": 48.0, "revenue": 116709.06, "lead": 47.6},
    {"month": "Jun", "capacity": 60, "sold": 40.0, "revenue": 98132.88, "lead": 68.7},
    {"month": "Jul", "capacity": 62, "sold": 32.0, "revenue": 96811.0, "lead": 33.6},
    {"month": "Aug", "capacity": 62, "sold": 41.0, "revenue": 116915.14, "lead": 101.7},
    {"month": "Sep", "capacity": 60, "sold": 20.0, "revenue": 58600.5, "lead": 97.0},
    {"month": "Okt", "capacity": 62, "sold": 24.0, "revenue": 42018.44, "lead": 30.6},
    {"month": "Nov", "capacity": 60, "sold": 21.0, "revenue": 50188.6, "lead": 80.7},
    {"month": "Des", "capacity": 62, "sold": 19.0, "revenue": 51294.15, "lead": 97.4}
  ],
  "FS1": [
    {"month": "Jan", "capacity": 31, "sold": 11.0, "revenue": 20152.15, "lead": 19.4},
    {"month": "Feb", "capacity": 28, "sold": 6.0, "revenue": 10915.09, "lead": 19.4},
    {"month": "Mar", "capacity": 31, "sold": 8.0, "revenue": 23521.54, "lead": 46.9},
    {"month": "Apr", "capacity": 30, "sold": 9.0, "revenue": 24504.18, "lead": 7.7},
    {"month": "Mai", "capacity": 31, "sold": 23.0, "revenue": 68777.86, "lead": 45.6},
    {"month": "Jun", "capacity": 30, "sold": 35.0, "revenue": 106356.0, "lead": 129.0},
    {"month": "Jul", "capacity": 31, "sold": 38.0, "revenue": 112068.47, "lead": 126.9},
    {"month": "Aug", "capacity": 31, "sold": 26.0, "revenue": 76440.0, "lead": 235.3},
    {"month": "Sep", "capacity": 30, "sold": 32.0, "revenue": 91732.1, "lead": 119.0},
    {"month": "Okt", "capacity": 31, "sold": 18.0, "revenue": 46630.2, "lead": 31.8},
    {"month": "Nov", "capacity": 30, "sold": 6.0, "revenue": 20194.28, "lead": 46.2},
    {"month": "Des", "capacity": 31, "sold": 9.0, "revenue": 24727.5, "lead": 73.7}
  ],
  "JSE": [
    {"month": "Jan", "capacity": 31, "sold": 0.0, "revenue": 0.0, "lead": 0},
    {"month": "Feb", "capacity": 28, "sold": 0.0, "revenue": 0.0, "lead": 0},
    {"month": "Mar", "capacity": 31, "sold": 0.0, "revenue": 0.0, "lead": 0},
    {"month": "Apr", "capacity": 30, "sold": 0.0, "revenue": 0.0, "lead": 0},
    {"month": "Mai", "capacity": 31, "sold": 0.0, "revenue": 0.0, "lead": 0},
    {"month": "Jun", "capacity": 30, "sold": 5.0, "revenue": 12135.0, "lead": 43.0},
    {"month": "Jul", "capacity": 31, "sold": 27.0, "revenue": 131149.55, "lead": 9.7},
    {"month": "Aug", "capacity": 31, "sold": 28.0, "revenue": 136084.0, "lead": 28.6},
    {"month": "Sep", "capacity": 30, "sold": 16.0, "revenue": 88056.2, "lead": 36.2},
    {"month": "Okt", "capacity": 31, "sold": 13.0, "revenue": 55993.67, "lead": 61.4},
    {"month": "Nov", "capacity": 30, "sold": 8.0, "revenue": 26779.15, "lead": 31.1},
    {"month": "Des", "capacity": 31, "sold": 10.0, "revenue": 32056.71, "lead": 34.6}
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
    appState.allItems = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    await ensureInitialStructure();
    updateTreeView();
}

async function ensureInitialStructure() {
    let year2026 = appState.allItems.find(i => i.name === '2026' && i.type === 'year');
    if (!year2026) {
        const id = 'year_' + Date.now();
        year2026 = { id, name: '2026', type: 'year', parentId: null, updatedAt: new Date(), sortOrder: 1 };
        await setDoc(doc(db, "strategies", id), year2026);
        appState.allItems.push(year2026);
    }
    let plan2026 = appState.allItems.find(i => i.type === 'priceplan' && i.parentId === year2026.id);
    if (!plan2026) {
        const pid = 'priceplan_' + Date.now();
        const data = scrapeUI(); 
        plan2026 = { id: pid, name: 'Prisplan 2026', type: 'priceplan', parentId: year2026.id, data, updatedAt: new Date(), sortOrder: 1 };
        await setDoc(doc(db, "strategies", pid), plan2026);
        appState.allItems.push(plan2026);
    }
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
        appState.activeView = 'planner';
        document.getElementById('view-planner').style.display = 'block';
        if (item.data) {
            for (const [k, v] of Object.entries(item.data)) { const el = document.getElementById(k); if(el) el.value = v; }
        }
        renderTable(scrapeUI(), appState.pax, appState.nonRef);
    } 
    else if (item.type === 'strategy') {
        appState.activeView = 'calculator';
        document.getElementById('view-calculator').style.display = 'block';
        if (item.data) {
            for (const [k, v] of Object.entries(item.data)) { const el = document.getElementById(k); if(el) el.value = v; }
        }
        updateAll(false);
    } 
    else {
        document.getElementById('view-placeholder').style.display = 'block';
        appState.activeView = null;
    }

    updateTreeView();
    UI.setSaveButtonState(appState.dirtyIds.has(item.id));
}

// NY FUNKSJON: ANALYSE AGGREGATOR
function calculateAnalysisData() {
    const aggregated = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Des"];
    
    months.forEach(m => {
        aggregated[m] = { revenue: 0, sold: 0, capacity: 0, weightedLead: 0 };
    });

    // Summer data for valgte romtyper
    appState.selectedRoomTypes.forEach(type => {
        const monthlyData = roomData2025[type];
        if(monthlyData) {
            monthlyData.forEach(d => {
                if(aggregated[d.month]) {
                    aggregated[d.month].revenue += d.revenue;
                    aggregated[d.month].sold += d.sold;
                    aggregated[d.month].capacity += d.capacity;
                    aggregated[d.month].weightedLead += (d.lead * d.sold); // Vektet med antall solgte
                }
            });
        }
    });

    const revparData = [];
    const occData = [];
    const adrData = [];
    const leadData = [];

    months.forEach(m => {
        const d = aggregated[m];
        const revpar = d.capacity > 0 ? d.revenue / d.capacity : 0;
        const occ = d.capacity > 0 ? (d.sold / d.capacity) * 100 : 0;
        const adr = d.sold > 0 ? d.revenue / d.sold : 0;
        const lead = d.sold > 0 ? d.weightedLead / d.sold : 0;

        revparData.push({ label: m, value: Math.round(revpar), display: Math.round(revpar) + ' kr' });
        occData.push({ label: m, value: Math.round(occ), display: Math.round(occ) + '%' });
        adrData.push({ label: m, value: Math.round(adr), display: Math.round(adr) + ' kr' });
        leadData.push({ label: m, value: Math.round(lead), display: Math.round(lead) + ' d' });
    });

    return { revparData, occData, adrData, leadData };
}

// Global Analyse Knapp
document.getElementById('globalAnalysisBtn').onclick = () => {
    appState.currentId = null;
    appState.activeView = 'analysis';
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.getElementById('view-analysis').style.display = 'block';
    document.getElementById('strategyName').value = "Analyseoversikt (Segmentering)";
    
    // Generer romtype-toggles
    const toggleContainer = document.getElementById('roomTypeToggles');
    toggleContainer.innerHTML = '';
    const allTypes = Object.keys(roomData2025);
    allTypes.forEach(type => {
        const btn = document.createElement('div');
        btn.className = 'room-toggle' + (appState.selectedRoomTypes.has(type) ? ' active' : '');
        btn.innerText = type;
        btn.onclick = () => {
            if(appState.selectedRoomTypes.has(type)) appState.selectedRoomTypes.delete(type);
            else appState.selectedRoomTypes.add(type);
            
            // Toggle visual state
            if(appState.selectedRoomTypes.has(type)) btn.classList.add('active');
            else btn.classList.remove('active');
            
            updateAnalysisView();
        };
        toggleContainer.appendChild(btn);
    });

    updateAnalysisView();
    updateTreeView(); // Fjerner active-markering i treet
};

function updateAnalysisView() {
    const data = calculateAnalysisData();
    UI.renderCharts('chart-revpar', data.revparData, 3000);
    UI.renderCharts('chart-occupancy', data.occData, 100);
    UI.renderCharts('chart-adr', data.adrData, 3500);
    UI.renderCharts('chart-lead', data.leadData, 150);
}

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
        newItem.data = scrapeUI(); 
        appState.currentId = id;
        appState.dirtyIds.add(id);
        UI.setSaveButtonState(true);
    }

    await setDoc(doc(db, "strategies", id), newItem);
    await refreshStrategies();
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
        
        // --- ADR BEREGNING (Korrekt) ---
        const res = Calc.runRevenueCalc(data);
        UI.setTxt('totalRevenue', Calc.formatter.format(res.totalRev));
        UI.setTxt('revpar', Calc.formatter.format(res.revpar));
        UI.setTxt('adr', Calc.formatter.format(res.adr)); 
        UI.setTxt('displayFlexPrice', Calc.formatter.format(data.basePrice));
        UI.setTxt('displayNonRefPrice', Calc.formatter.format(res.nonRefPrice));
        // ------------------------------
        
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

    if(triggeredByInput && appState.currentId) {
        appState.dirtyIds.add(appState.currentId);
        updateTreeView();
        UI.setSaveButtonState(true);
    }
}

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

document.querySelectorAll('input').forEach(i => {
    if(i.id !== 'strategyName') i.addEventListener('input', () => updateAll(true));
});

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