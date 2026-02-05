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
  "FS2": [
    {"month": "Jan", "capacity": 124.0, "sold": 37.0, "revenue": 64054.86},
    {"month": "Feb", "capacity": 112.0, "sold": 35.0, "revenue": 52988.7},
    {"month": "Mar", "capacity": 124.0, "sold": 30.0, "revenue": 81006.36},
    {"month": "Apr", "capacity": 120.0, "sold": 44.0, "revenue": 84210.9},
    {"month": "Mai", "capacity": 124.0, "sold": 50.0, "revenue": 115303.19},
    {"month": "Jun", "capacity": 120.0, "sold": 81.0, "revenue": 227692.45},
    {"month": "Jul", "capacity": 124.0, "sold": 99.0, "revenue": 283233.65},
    {"month": "Aug", "capacity": 124.0, "sold": 105.0, "revenue": 322638.72},
    {"month": "Sep", "capacity": 120.0, "sold": 41.0, "revenue": 107984.77},
    {"month": "Okt", "capacity": 124.0, "sold": 55.0, "revenue": 131633.64},
    {"month": "Nov", "capacity": 120.0, "sold": 34.0, "revenue": 98354.26},
    {"month": "Des", "capacity": 124.0, "sold": 18.0, "revenue": 55604.67}
  ],
  "FSE": [
    {"month": "Jan", "capacity": 77.0, "sold": 28.0, "revenue": 57542.09},
    {"month": "Feb", "capacity": 84.0, "sold": 24.0, "revenue": 66621.48},
    {"month": "Mar", "capacity": 93.0, "sold": 26.0, "revenue": 71100.1},
    {"month": "Apr", "capacity": 90.0, "sold": 28.0, "revenue": 72836.26},
    {"month": "Mai", "capacity": 93.0, "sold": 38.0, "revenue": 131651.08},
    {"month": "Jun", "capacity": 90.0, "sold": 63.0, "revenue": 196175.58},
    {"month": "Jul", "capacity": 93.0, "sold": 85.0, "revenue": 241318.35},
    {"month": "Aug", "capacity": 93.0, "sold": 67.0, "revenue": 226228.55},
    {"month": "Sep", "capacity": 90.0, "sold": 29.0, "revenue": 90492.95},
    {"month": "Okt", "capacity": 93.0, "sold": 34.0, "revenue": 116799.62},
    {"month": "Nov", "capacity": 90.0, "sold": 20.0, "revenue": 70529.93},
    {"month": "Des", "capacity": 93.0, "sold": 13.0, "revenue": 56991.36}
  ],
  "JS": [
    {"month": "Jan", "capacity": 465.0, "sold": 127.0, "revenue": 275493.47},
    {"month": "Feb", "capacity": 420.0, "sold": 153.0, "revenue": 346474.64},
    {"month": "Mar", "capacity": 463.0, "sold": 171.0, "revenue": 395243.24},
    {"month": "Apr", "capacity": 449.0, "sold": 173.0, "revenue": 387801.11},
    {"month": "Mai", "capacity": 461.0, "sold": 236.0, "revenue": 661647.47},
    {"month": "Jun", "capacity": 447.0, "sold": 271.0, "revenue": 663930.64},
    {"month": "Jul", "capacity": 465.0, "sold": 388.0, "revenue": 1102632.45},
    {"month": "Aug", "capacity": 463.0, "sold": 396.0, "revenue": 1040819.48},
    {"month": "Sep", "capacity": 449.0, "sold": 209.0, "revenue": 575152.42},
    {"month": "Okt", "capacity": 465.0, "sold": 239.0, "revenue": 605756.36},
    {"month": "Nov", "capacity": 450.0, "sold": 171.0, "revenue": 421838.72},
    {"month": "Des", "capacity": 465.0, "sold": 119.0, "revenue": 271255.0}
  ],
  "JSE": [
    {"month": "Jan", "capacity": 0.0, "sold": 8.0, "revenue": 17856.58},
    {"month": "Feb", "capacity": 0.0, "sold": 8.0, "revenue": 17674.91},
    {"month": "Mar", "capacity": 0.0, "sold": 11.0, "revenue": 25624.89},
    {"month": "Apr", "capacity": -1.0, "sold": 10.0, "revenue": 22494.44},
    {"month": "Mai", "capacity": -4.0, "sold": 11.0, "revenue": 23645.25},
    {"month": "Jun", "capacity": 8.0, "sold": 15.0, "revenue": 33401.63},
    {"month": "Jul", "capacity": 31.0, "sold": 27.0, "revenue": 116910.6},
    {"month": "Aug", "capacity": 31.0, "sold": 25.0, "revenue": 108052.79},
    {"month": "Sep", "capacity": 30.0, "sold": 16.0, "revenue": 78621.62},
    {"month": "Okt", "capacity": 31.0, "sold": 13.0, "revenue": 49994.35},
    {"month": "Nov", "capacity": 30.0, "sold": 8.0, "revenue": 23909.97},
    {"month": "Des", "capacity": 31.0, "sold": 10.0, "revenue": 28622.07}
  ],
  "STD": [
    {"month": "Jan", "capacity": 1085.0, "sold": 297.0, "revenue": 399215.63},
    {"month": "Feb", "capacity": 980.0, "sold": 290.0, "revenue": 363545.84},
    {"month": "Mar", "capacity": 1085.0, "sold": 398.0, "revenue": 623503.86},
    {"month": "Apr", "capacity": 1050.0, "sold": 292.0, "revenue": 462460.23},
    {"month": "Mai", "capacity": 1085.0, "sold": 430.0, "revenue": 731205.75},
    {"month": "Jun", "capacity": 1050.0, "sold": 640.0, "revenue": 1066771.01},
    {"month": "Jul", "capacity": 1084.0, "sold": 443.0, "revenue": 623781.0},
    {"month": "Aug", "capacity": 1081.0, "sold": 622.0, "revenue": 1043384.5},
    {"month": "Sep", "capacity": 1042.0, "sold": 555.0, "revenue": 973648.55},
    {"month": "Okt", "capacity": 1081.0, "sold": 472.0, "revenue": 683209.15},
    {"month": "Nov", "capacity": 1044.0, "sold": 431.0, "revenue": 639593.13},
    {"month": "Des", "capacity": 1085.0, "sold": 345.0, "revenue": 571118.64}
  ],
  "SUP": [
    {"month": "Jan", "capacity": 620.0, "sold": 192.0, "revenue": 274446.2},
    {"month": "Feb", "capacity": 560.0, "sold": 249.0, "revenue": 372539.49},
    {"month": "Mar", "capacity": 620.0, "sold": 325.0, "revenue": 521455.39},
    {"month": "Apr", "capacity": 600.0, "sold": 281.0, "revenue": 481070.52},
    {"month": "Mai", "capacity": 620.0, "sold": 277.0, "revenue": 580194.6},
    {"month": "Jun", "capacity": 599.0, "sold": 367.0, "revenue": 682249.93},
    {"month": "Jul", "capacity": 619.0, "sold": 414.0, "revenue": 788618.55},
    {"month": "Aug", "capacity": 620.0, "sold": 460.0, "revenue": 869980.05},
    {"month": "Sep", "capacity": 600.0, "sold": 359.0, "revenue": 681594.21},
    {"month": "Okt", "capacity": 618.0, "sold": 308.0, "revenue": 494392.68},
    {"month": "Nov", "capacity": 593.0, "sold": 252.0, "revenue": 437555.31},
    {"month": "Des", "capacity": 620.0, "sold": 183.0, "revenue": 312039.08}
  ],
  "DLX": [
    {"month": "Jan", "capacity": 62.0, "sold": 23.0, "revenue": 40291.31},
    {"month": "Feb", "capacity": 56.0, "sold": 19.0, "revenue": 37621.36},
    {"month": "Mar", "capacity": 62.0, "sold": 36.0, "revenue": 68947.09},
    {"month": "Apr", "capacity": 57.0, "sold": 37.0, "revenue": 72469.24},
    {"month": "Mai", "capacity": 62.0, "sold": 45.0, "revenue": 103126.42},
    {"month": "Jun", "capacity": 60.0, "sold": 38.0, "revenue": 81384.72},
    {"month": "Jul", "capacity": 62.0, "sold": 30.0, "revenue": 80197.7},
    {"month": "Aug", "capacity": 62.0, "sold": 41.0, "revenue": 104063.39},
    {"month": "Sep", "capacity": 60.0, "sold": 20.0, "revenue": 52321.86},
    {"month": "Okt", "capacity": 62.0, "sold": 24.0, "revenue": 37516.49},
    {"month": "Nov", "capacity": 60.0, "sold": 21.0, "revenue": 44811.24},
    {"month": "Des", "capacity": 62.0, "sold": 19.0, "revenue": 45798.34}
  ],
  "FS1": [
    {"month": "Jan", "capacity": 31.0, "sold": 10.0, "revenue": 15797.87},
    {"month": "Feb", "capacity": 28.0, "sold": 5.0, "revenue": 9745.61},
    {"month": "Mar", "capacity": 31.0, "sold": 8.0, "revenue": 21001.36},
    {"month": "Apr", "capacity": 30.0, "sold": 9.0, "revenue": 21878.73},
    {"month": "Mai", "capacity": 31.0, "sold": 18.0, "revenue": 48283.8},
    {"month": "Jun", "capacity": 30.0, "sold": 25.0, "revenue": 68710.71},
    {"month": "Jul", "capacity": 31.0, "sold": 28.0, "revenue": 97436.1},
    {"month": "Aug", "capacity": 31.0, "sold": 23.0, "revenue": 60375.0},
    {"month": "Sep", "capacity": 30.0, "sold": 18.0, "revenue": 45153.66},
    {"month": "Okt", "capacity": 31.0, "sold": 13.0, "revenue": 28509.09},
    {"month": "Nov", "capacity": 30.0, "sold": 6.0, "revenue": 18030.61},
    {"month": "Des", "capacity": 31.0, "sold": 8.0, "revenue": 22078.12}
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
        if (item.data) { for (const [k, v] of Object.entries(item.data)) { const el = document.getElementById(k); if(el) el.value = v; } }
        renderTable(scrapeUI(), appState.pax, appState.nonRef);
    } 
    else if (item.type === 'strategy') {
        appState.activeView = 'calculator';
        document.getElementById('view-calculator').style.display = 'block';
        if (item.data) { for (const [k, v] of Object.entries(item.data)) { const el = document.getElementById(k); if(el) el.value = v; } }
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
        aggregated[m] = { revenue: 0, sold: 0, capacity: 0 };
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
                }
            });
        }
    });

    const revparData = [];
    const occData = [];
    const adrData = [];

    months.forEach(m => {
        const d = aggregated[m];
        const revpar = d.capacity > 0 ? d.revenue / d.capacity : 0;
        const occ = d.capacity > 0 ? (d.sold / d.capacity) * 100 : 0;
        const adr = d.sold > 0 ? d.revenue / d.sold : 0;

        revparData.push({ label: m, value: Math.round(revpar), display: Math.round(revpar) + ' kr' });
        occData.push({ label: m, value: Math.round(occ), display: Math.round(occ) + '%' });
        adrData.push({ label: m, value: Math.round(adr), display: Math.round(adr) + ' kr' });
    });

    return { revparData, occData, adrData };
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
            updateAnalysisView();
        };
        toggleContainer.appendChild(btn);
    });

    updateAnalysisView();
    updateTreeView(); 
};

window.applyPreset = (preset) => {
    if(preset === 'all') appState.selectedRoomTypes = new Set(Object.keys(roomData2025));
    if(preset === 'hotel') appState.selectedRoomTypes = new Set(['STD','SUP','DLX','JS','JSE']);
    if(preset === 'brygge') appState.selectedRoomTypes = new Set(['FS1','FS2','FSE']);
    document.getElementById('globalAnalysisBtn').click(); // Re-render
};

function updateAnalysisView() {
    const data = calculateAnalysisData();
    UI.renderCharts('chart-revpar', data.revparData, 3000);
    UI.renderCharts('chart-occupancy', data.occData, 100);
    UI.renderCharts('chart-adr', data.adrData, 3500);
    
    // Oppdater knappene (visuelt)
    document.querySelectorAll('.room-toggle').forEach(btn => {
        if(appState.selectedRoomTypes.has(btn.innerText)) btn.classList.add('active');
        else btn.classList.remove('active');
    });
}

// ... (Resten av funksjonene er like som før: handleMove, createItem, etc.)
// ... (Kopier inn scrapeUI, updateAll, listeners fra forrige svar her, de er uendret)

// Sørg for at du tar med resten av hjelpefunksjonene (scrapeUI, updateAll, event listeners) nederst i filen
// Jeg inkluderer de viktigste her for å gjøre det kjørbart:

async function handleMove(draggedId, targetId, targetType) {
    if (draggedId === targetId) return;
    const item = appState.allItems.find(i => i.id === draggedId);
    if (!item) return;
    if (targetId === 'root') item.parentId = null;
    else if (['year', 'season', 'segment'].includes(targetType)) { item.parentId = targetId; appState.expandedIds.add(targetId); } 
    else { const targetItem = appState.allItems.find(i => i.id === targetId); if (targetItem) item.parentId = targetItem.parentId; }
    await setDoc(doc(db, "strategies", draggedId), { ...item, updatedAt: new Date() });
    refreshStrategies();
}

async function createItem(type, parentId = null) {
    const name = prompt(`Navn på nytt ${type}:`); if (!name) return;
    const id = `${type}_` + Date.now();
    if (parentId) appState.expandedIds.add(parentId);
    const newItem = { id, name, type, parentId, updatedAt: new Date(), sortOrder: Date.now() };
    if (type === 'strategy' || type === 'priceplan') { newItem.data = scrapeUI(); appState.currentId = id; appState.dirtyIds.add(id); UI.setSaveButtonState(true); }
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
        const res = Calc.runRevenueCalc(data);
        UI.setTxt('totalRevenue', Calc.formatter.format(res.totalRev));
        UI.setTxt('revpar', Calc.formatter.format(res.revpar));
        const beRevpar = (data.fixedCosts + (data.varCosts * (data.totalRooms * 30.4 * (data.occupancy/100)))) / (data.totalRooms * 30.4);
        UI.setTxt('beRevPar', Calc.formatter.format(beRevpar || 0));
        const status = document.getElementById('beStatus');
        if(res.revpar >= beRevpar) { status.innerText = "✅ Lønnsom"; status.style.color = "#38A169"; } else { status.innerText = "⚠️ Tap"; status.style.color = "#E53E3E"; }
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
        if(item) { item.name = newName; appState.dirtyIds.add(appState.currentId); updateTreeView(); UI.setSaveButtonState(true); }
    }
});

document.querySelectorAll('input').forEach(i => { if(i.id !== 'strategyName') i.addEventListener('input', () => updateAll(true)); });
document.getElementById('nonRefToggle').onchange = (e) => { appState.nonRef = e.target.checked; updateAll(false); };
document.querySelectorAll('.pax-btn').forEach(btn => {
    btn.onclick = () => { appState.pax = parseInt(btn.dataset.pax); document.querySelectorAll('.pax-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); updateAll(false); };
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
rootZone.ondrop = (e) => { e.preventDefault(); rootZone.classList.remove('drag-over'); handleMove(e.dataTransfer.getData('text/plain'), 'root'); };
document.getElementById('saveBtn').onclick = async () => {
    if(!appState.currentId) return;
    const item = appState.allItems.find(i => i.id === appState.currentId);
    if(item) { item.data = scrapeUI(); item.updatedAt = new Date(); await setDoc(doc(db, "strategies", item.id), item); appState.dirtyIds.delete(item.id); UI.setSaveButtonState(appState.dirtyIds.size > 0); refreshStrategies(); }
};
document.getElementById('deleteBtn').onclick = async () => {
    if(!appState.currentId || !confirm("Slette?")) return;
    await deleteDoc(doc(db, "strategies", appState.currentId)); appState.currentId = null; appState.dirtyIds.delete(appState.currentId); document.getElementById('deleteBtn').style.display = 'none'; document.getElementById('view-placeholder').style.display = 'block'; await refreshStrategies();
};
document.getElementById('applyCostsBtn').onclick = () => {
    const f = (parseFloat(document.getElementById('costSalaries').value) || 0) + (parseFloat(document.getElementById('costRent').value) || 0) + (parseFloat(document.getElementById('costEnergy').value) || 0) + (parseFloat(document.getElementById('costAdmin').value) || 0);
    const v = (parseFloat(document.getElementById('costCleaning').value) || 0) + (parseFloat(document.getElementById('costLinen').value) || 0) + (parseFloat(document.getElementById('costFood').value) || 0) + (parseFloat(document.getElementById('costComm').value) || 0);
    document.getElementById('fixedCosts').value = f; document.getElementById('varCosts').value = v; UI.hideModal('costModal'); updateAll(true);
};
document.getElementById('openCostModalBtn').onclick = () => UI.showModal('costModal');
document.getElementById('closeCostBtn').onclick = () => UI.hideModal('costModal');
document.getElementById('settingsBtn').onclick = () => UI.showModal('settingsModal');
document.getElementById('closeSettingsBtn').onclick = () => UI.hideModal('settingsModal');
document.getElementById('saveGlobalSettingsBtn').onclick = () => { document.getElementById('totalRooms').value = document.getElementById('globalTotalRooms').value; UI.hideModal('settingsModal'); updateAll(true); };
document.getElementById('login-btn-action').onclick = () => login(document.getElementById('login-email').value, document.getElementById('login-password').value);
document.getElementById('logoutBtn').onclick = () => logout();
