let currentStrategyId = null;
let localStrategies = [];
let globalSettings = { totalRooms: 57 };
let currentPax = 2; // Default
let isNonRefMode = false; // State for bryteren

document.addEventListener('DOMContentLoaded', () => {
    initCalculator();
    initPlanner();
    initBreakEven(); // Start break-even lyttere
    initCostCalculator(); // NY: Start kostnadskalkulator lyttere

    calculateRevenue();
    calculateBreakEven(); 
    updatePricePlan(); 

    fetchSettings().then(() => {
        const roomInput = document.getElementById('totalRooms');
        if(!currentStrategyId && roomInput) { 
            roomInput.value = globalSettings.totalRooms;
            calculateRevenue();
            calculateBreakEven();
            checkRoomStatus();
        }
        fetchStrategies();
    });

    document.getElementById('strategyName').addEventListener('input', function(e) {
        if(currentStrategyId !== null) updateLocalStrategy(currentStrategyId, { name: e.target.value });
    });

    document.querySelectorAll('input').forEach(input => {
        if(input.id !== 'strategyName' && input.id !== 'globalTotalRooms' && !input.id.startsWith('cost')) {
            input.addEventListener('input', () => {
                if(currentStrategyId !== null) {
                    const data = scrapeDataFromUI();
                    updateLocalStrategy(currentStrategyId, { data: data });
                }
                if(input.id === 'totalRooms') checkRoomStatus();
            });
        }
    });
});

// --- HELPER FUNCTIONS ---
function getVal(id) { 
    const el = document.getElementById(id);
    return el ? (parseInt(el.value) || 0) : 0; 
}
function setTxt(id, txt) { 
    const el = document.getElementById(id);
    if(el) el.innerHTML = txt; 
}
const formatter = new Intl.NumberFormat('no-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 });

// --- COST CALCULATOR (NY) ---
function initCostCalculator() {
    const ids = ['costSalaries', 'costRent', 'costEnergy', 'costAdmin', 'costCleaning', 'costLinen', 'costFood', 'costComm'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('input', updateCostSums);
    });
}

function openCostModal() { document.getElementById('costModal').style.display = 'block'; }
function closeCostModal() { document.getElementById('costModal').style.display = 'none'; }

function updateCostSums() {
    const fixedSum = getVal('costSalaries') + getVal('costRent') + getVal('costEnergy') + getVal('costAdmin');
    const varSum = getVal('costCleaning') + getVal('costLinen') + getVal('costFood') + getVal('costComm');
    
    setTxt('displayFixedSum', formatter.format(fixedSum));
    setTxt('displayVarSum', formatter.format(varSum));
}

function applyCosts() {
    const fixedSum = getVal('costSalaries') + getVal('costRent') + getVal('costEnergy') + getVal('costAdmin');
    const varSum = getVal('costCleaning') + getVal('costLinen') + getVal('costFood') + getVal('costComm');
    
    document.getElementById('fixedCosts').value = fixedSum;
    document.getElementById('varCosts').value = varSum;
    
    calculateBreakEven();
    closeCostModal();
}

// --- BREAK-EVEN CALCULATOR ---
function initBreakEven() {
    const ids = ['fixedCosts', 'varCosts'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('input', calculateBreakEven);
    });
}

function calculateBreakEven() {
    const fixedCosts = getVal('fixedCosts');
    const varCosts = getVal('varCosts');
    const totalRooms = getVal('totalRooms') || 57;
    const occupancyPct = getVal('occupancy');
    const currentRevPAR = parseInt(document.getElementById('revpar').innerText.replace(/[^0-9]/g, '')) || 0;

    const daysInMonth = 30.4;
    const totalCapacity = totalRooms * daysInMonth;
    const occupiedRooms = totalCapacity * (occupancyPct / 100);

    const totalCosts = fixedCosts + (varCosts * occupiedRooms);
    const breakEvenRevPAR = totalCapacity > 0 ? totalCosts / totalCapacity : 0;

    setTxt('beRevPar', formatter.format(breakEvenRevPAR));

    const statusEl = document.getElementById('beStatus');
    if (currentRevPAR > breakEvenRevPAR) {
        statusEl.innerHTML = "✅ Du går i pluss! (Din RevPAR er høyere enn smertegrensen)";
        statusEl.className = "be-status success";
    } else {
        statusEl.innerHTML = "⚠️ Du taper penger! (Din RevPAR er for lav)";
        statusEl.className = "be-status warning";
    }
}

// --- PLANNER LOGIC ---
function initPlanner() {
    const inputs = [
        'hotelBase', 'addSup', 'addDlx', 'addJs', 'addJsExcl', 
        'maxStd', 'maxSup', 'maxDlx', 'maxJs', 'maxJsExcl',
        'singleStd', 'singleSup', 'singleDlx', 'singleJs', 'singleJsExcl',
        'hotelNonRef', 'hotelWeekend', 'hotelSpecial', 'hotelExtra',
        'bryggeBase', 'addFs2', 'addFsExcl',
        'maxFs1', 'maxFs2', 'maxFsExcl',
        'bryggeNonRef', 'bryggeWeekend', 'bryggeSpecial', 'bryggeSingle', 'bryggeExtra',
        'seasonMid', 'seasonLow'
    ];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('input', updatePricePlan);
    });
}

function setPax(n) {
    currentPax = n;
    document.querySelectorAll('.pax-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('pax' + n).classList.add('active');
    updatePricePlan();
}

function toggleNonRef() {
    isNonRefMode = document.getElementById('nonRefToggle').checked;
    updatePricePlan();
}

function updatePricePlan() {
    if(!document.getElementById('hotelBase')) return;

    const seasonMidPct = getVal('seasonMid');
    const seasonLowPct = getVal('seasonLow');
    
    setTxt('seasonMidVal', (seasonMidPct > 0 ? '+' : '') + seasonMidPct + '%');
    setTxt('seasonLowVal', (seasonLowPct > 0 ? '+' : '') + seasonLowPct + '%');

    const tbody = document.getElementById('priceTableBody');
    if(tbody) {
        tbody.innerHTML = '';
        const rooms = [
            { name: "Standardrom", type: "hotel", addon: 0, maxPax: getVal('maxStd'), singleDed: getVal('singleStd') },
            { name: "Superior", type: "hotel", addon: getVal('addSup'), maxPax: getVal('maxSup'), singleDed: getVal('singleSup') },
            { name: "Deluxe", type: "hotel", addon: getVal('addDlx'), maxPax: getVal('maxDlx'), singleDed: getVal('singleDlx') },
            { name: "Juniorsuite", type: "hotel", addon: getVal('addJs'), maxPax: getVal('maxJs'), singleDed: getVal('singleJs') },
            { name: "Juniorsuite Excl", type: "hotel", addon: getVal('addJsExcl'), maxPax: getVal('maxJsExcl'), singleDed: getVal('singleJsExcl') },
            { name: "Fjordsuite 1. etg", type: "brygge", addon: 0, maxPax: getVal('maxFs1') },
            { name: "Fjordsuite 2. etg", type: "brygge", addon: getVal('addFs2'), maxPax: getVal('maxFs2') },
            { name: "Fjordsuite Excl", type: "brygge", addon: getVal('addFsExcl'), maxPax: getVal('maxFsExcl') }
        ];

        const calcPrice = (room, seasonPct, dayType) => {
            if (currentPax > room.maxPax) return '<span class="price-na">-</span>';
            let base = 0, singleDed = 0, extraBed = 0, weekendAdd = 0, specialAdd = 0, discountPct = 0;
            
            if (room.type === 'hotel') {
                base = getVal('hotelBase');
                singleDed = room.singleDed;
                extraBed = getVal('hotelExtra');
                weekendAdd = getVal('hotelWeekend');
                specialAdd = getVal('hotelSpecial');
                discountPct = getVal('hotelNonRef');
            } else {
                base = getVal('bryggeBase');
                singleDed = getVal('bryggeSingle');
                extraBed = getVal('bryggeExtra');
                weekendAdd = getVal('bryggeWeekend');
                specialAdd = getVal('bryggeSpecial');
                discountPct = getVal('bryggeNonRef');
            }

            let price = base + room.addon;
            price = price * (1 + (seasonPct / 100));
            if (dayType === 'fri') price += weekendAdd;
            if (dayType === 'sat') price += specialAdd;
            if (currentPax === 1) price -= singleDed;
            if (currentPax > 2) {
                const extraPersons = currentPax - 2;
                price += (extraPersons * extraBed);
            }
            if (isNonRefMode) price = price * (1 - (discountPct / 100));
            return formatter.format(price);
        };

        const createRow = (room) => {
             const tr = document.createElement('tr');
             tr.innerHTML = `
                <td>${room.name} <span style="font-size:0.7em; color:#aaa;">(Max ${room.maxPax})</span></td>
                <td style="background:#fff5f5">${calcPrice(room, 0, 'weekday')}</td>
                <td style="background:#fff5f5">${calcPrice(room, 0, 'fri')}</td>
                <td class="td-special">${calcPrice(room, 0, 'sat')}</td>
                <td style="background:#fffcf5">${calcPrice(room, seasonMidPct, 'weekday')}</td>
                <td style="background:#fffcf5">${calcPrice(room, seasonMidPct, 'fri')}</td>
                <td class="td-special">${calcPrice(room, seasonMidPct, 'sat')}</td>
                <td style="background:#f5faff">${calcPrice(room, seasonLowPct, 'weekday')}</td>
                <td style="background:#f5faff">${calcPrice(room, seasonLowPct, 'fri')}</td>
                <td class="td-special">${calcPrice(room, seasonLowPct, 'sat')}</td>
            `;
            return tr;
        };

        tbody.innerHTML += '<tr class="section-row"><td colspan="10">HOVEDBYGGET</td></tr>';
        rooms.filter(r => r.type === 'hotel').forEach(r => tbody.appendChild(createRow(r)));
        tbody.innerHTML += '<tr class="section-row"><td colspan="10">PANORAMA BRYGGE</td></tr>';
        rooms.filter(r => r.type === 'brygge').forEach(r => tbody.appendChild(createRow(r)));
    }
}

// --- CALCULATOR LOGIC ---
function initCalculator() {
    const inputs = ['totalRooms', 'basePrice', 'discount', 'occupancy', 'mix'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('input', () => {
            calculateRevenue();
            calculateBreakEven(); 
        });
    });
}

function calculateRevenue() {
    const totalRooms = getVal('totalRooms') || 57;
    const basePrice = getVal('basePrice');
    const discount = getVal('discount');
    const occupancy = getVal('occupancy');
    const mix = getVal('mix');

    setTxt('basePriceVal', basePrice + ' kr');
    setTxt('discountVal', discount + '%');
    setTxt('occupancyVal', occupancy + '%');
    setTxt('mixVal', mix + '%');

    const occDecimal = occupancy / 100;
    const mixDecimal = mix / 100;
    const discDecimal = discount / 100;

    const nonRefPrice = basePrice * (1 - discDecimal);
    const roomsSold = Math.round(totalRooms * occDecimal);
    const nonRefRooms = Math.round(roomsSold * mixDecimal);
    const flexRooms = roomsSold - nonRefRooms;

    const totalRev = (nonRefRooms * nonRefPrice) + (flexRooms * basePrice);
    const adr = roomsSold > 0 ? totalRev / roomsSold : 0;
    const revpar = totalRev / totalRooms;

    setTxt('totalRevenue', formatter.format(totalRev));
    setTxt('revpar', formatter.format(revpar));
    setTxt('adr', formatter.format(adr));
    setTxt('displayFlexPrice', formatter.format(basePrice));
    setTxt('displayNonRefPrice', formatter.format(nonRefPrice));
    
    generateRecommendation(occupancy, discount, adr, basePrice);
}

function generateRecommendation(occ, disc, adr, base) {
    const el = document.getElementById('recommendationText');
    const status = document.getElementById('recStatus');
    let msg = "Start med å justere spakene...", icon = "🧐";

    if (occ > 90) {
        if (disc > 10) { msg = "⚠️ <strong>Høy etterspørsel!</strong> Vurder å fjerne rabatter."; icon = "📈"; } 
        else { msg = "✅ <strong>Perfekt!</strong> Høyt belegg til høy pris."; icon = "⭐"; }
    } else if (occ < 50) {
        msg = "🔻 <strong>Lavt belegg.</strong> Sjekk om prisene er konkurransedyktige."; icon = "📉";
    } else {
        msg = "👍 <strong>Balansert.</strong> God drift."; icon = "⚖️";
    }
    if(el) el.innerHTML = msg;
    if(status) status.innerHTML = icon;
}

// --- DATA & STATE ---
async function fetchSettings() {
    try {
        const res = await fetch('/api/settings');
        if(res.ok) globalSettings = await res.json();
    } catch (e) { console.warn(e); }
}

function openSettingsModal() { 
    document.getElementById('globalTotalRooms').value = globalSettings.totalRooms; 
    document.getElementById('settingsModal').style.display = 'block'; 
}
function closeSettingsModal() { document.getElementById('settingsModal').style.display = 'none'; }

async function saveGlobalSettings() {
    const inputField = document.getElementById('globalTotalRooms');
    const newRooms = parseInt(inputField.value);
    if (!newRooms || newRooms < 1) { alert("Ugyldig antall"); return; }
    
    globalSettings.totalRooms = newRooms;
    
    try {
        await fetch('/api/settings', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(globalSettings)
        });
        location.reload(); 
    } catch(err) { alert("Lagring feilet"); }
}

function checkRoomStatus() {
    const input = document.getElementById('totalRooms');
    const icon = document.getElementById('roomStatusIcon');
    const text = document.getElementById('roomStatusText');
    if (parseInt(input.value) === globalSettings.totalRooms) {
        icon.style.display = 'inline'; text.textContent = "Standard"; text.style.color = "var(--success)";
    } else {
        icon.style.display = 'none'; text.textContent = "Unntak"; text.style.color = "var(--warning)";
    }
}

// --- STRATEGIES API ---
async function fetchStrategies() {
    const list = document.getElementById('strategyList');
    list.innerHTML = '<li class="loading">Laster...</li>';
    try {
        const res = await fetch('/api/strategies');
        const strategies = await res.json();
        localStrategies = strategies.map(s => ({ ...s, isDirty: false }));
        renderSidebar();
        if(localStrategies.length === 0) list.innerHTML = '<li style="padding:10px;">Ingen strategier</li>';
    } catch (err) { list.innerHTML = '<li class="error">Feil</li>'; }
}

function renderSidebar() {
    const list = document.getElementById('strategyList');
    list.innerHTML = '';
    localStrategies.forEach(s => {
        const li = document.createElement('li');
        li.draggable = true;
        li.dataset.id = s.id;
        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragend', handleDragEnd);
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = s.name;
        nameSpan.style.pointerEvents = "none";
        li.appendChild(nameSpan);

        if(s.isDirty) {
            const badge = document.createElement('span');
            badge.className = 'draft-badge';
            badge.textContent = 'Kladd';
            li.appendChild(badge);
        }

        li.addEventListener('click', (e) => {
            if(!li.classList.contains('dragging')) loadStrategyFromLocal(s.id);
        });

        if(s.id === currentStrategyId) li.classList.add('active');
        list.appendChild(li);
    });
    list.addEventListener('dragover', handleDragOver);
}

function handleDragStart(e) { e.target.classList.add('dragging'); }
function handleDragEnd(e) { e.target.classList.remove('dragging'); e.target.style.opacity = '1'; updateLocalOrder(); }
function handleDragOver(e) {
    e.preventDefault();
    const list = document.getElementById('strategyList');
    const dragging = document.querySelector('.dragging');
    const after = getDragAfterElement(list, e.clientY);
    if (after == null) list.appendChild(dragging);
    else list.insertBefore(dragging, after);
}
function getDragAfterElement(container, y) {
    const draggables = [...container.querySelectorAll('li:not(.dragging)')];
    return draggables.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
        else return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}
function updateLocalOrder() {
    const items = document.querySelectorAll('#strategyList li');
    const ids = Array.from(items).map(li => li.dataset.id);
    localStrategies.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
}

function updateLocalStrategy(id, changes) {
    const idx = localStrategies.findIndex(s => s.id === id);
    if(idx !== -1) {
        localStrategies[idx] = { ...localStrategies[idx], ...changes, isDirty: true };
        renderSidebar();
    }
}

function loadStrategyFromLocal(id) {
    currentStrategyId = id;
    const strategy = localStrategies.find(s => s.id === id);
    if(!strategy) return;

    document.getElementById('strategyName').value = strategy.name;
    document.getElementById('deleteBtn').style.display = 'block';

    for (const [key, value] of Object.entries(strategy.data)) {
        const el = document.getElementById(key);
        if (el) {
            el.value = value;
            const disp = document.getElementById(key + 'Val');
            if (disp) disp.textContent = value + (key.includes('Price') ? ' kr' : '%');
        }
    }
    
    if (!strategy.data.totalRooms) {
        document.getElementById('totalRooms').value = globalSettings.totalRooms;
    }

    checkRoomStatus();
    renderSidebar();
    calculateRevenue();
    calculateBreakEven(); 
    updatePricePlan();
}

function createNewStrategy() {
    const newId = "temp_" + Date.now();
    const defaultData = scrapeDataFromUI();
    defaultData.totalRooms = globalSettings.totalRooms;

    const newStrategy = { id: newId, name: "<Untitled>", data: defaultData, isDirty: true };
    localStrategies.push(newStrategy);
    loadStrategyFromLocal(newId);
    
    document.getElementById('strategyName').focus();
    document.getElementById('strategyName').select();
}

function scrapeDataFromUI() {
    const data = {};
    document.querySelectorAll('input').forEach(input => {
        if(input.id && input.id !== 'strategyName' && input.id !== 'globalTotalRooms') {
            data[input.id] = input.value;
        }
    });
    return data;
}

async function saveCurrentStrategy() {
    const s = localStrategies.find(x => x.id === currentStrategyId);
    if(!s) return;
    if(!s.name || s.name === "<Untitled>") if(!confirm("Lagre som 'Untitled'?")) return;

    const payload = { 
        id: s.id.startsWith('temp_') ? null : s.id, 
        name: s.name, 
        data: s.data 
    };

    const btn = document.getElementById('saveBtn');
    const txt = btn.textContent;
    btn.textContent = "Lagrer...";
    
    try {
        const res = await fetch('/api/strategies', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify(payload)
        });
        const saved = await res.json();
        const idx = localStrategies.findIndex(x => x.id === currentStrategyId);
        if(idx !== -1) {
            localStrategies[idx] = { ...saved, isDirty: false };
            currentStrategyId = saved.id;
        }
        renderSidebar();
        document.getElementById('deleteBtn').style.display = 'block';
        btn.textContent = "✅ Lagret!";
        setTimeout(() => btn.textContent = txt, 2000);
    } catch(e) { alert("Feil"); btn.textContent = txt; }
}

async function deleteCurrentStrategy() {
    if(!currentStrategyId || !confirm("Slette?")) return;
    if(!currentStrategyId.toString().startsWith('temp_')) {
        await fetch(`/api/strategies/${currentStrategyId}`, {method:'DELETE'});
    }
    localStrategies = localStrategies.filter(x => x.id !== currentStrategyId);
    renderSidebar();
    if(localStrategies.length > 0) loadStrategyFromLocal(localStrategies[0].id);
    else createNewStrategy();
}

// --- ANALYSIS CHARTS ---
const analysisData = {
    months: [
        {m:'Jan', rev:830, lead:45, type:'low'}, {m:'Feb', rev:944, lead:28, type:'low'}, 
        {m:'Mar', rev:1212, lead:68, type:'mid'}, {m:'Apr', rev:1065, lead:40, type:'low'}, 
        {m:'Mai', rev:1566, lead:69, type:'mid'}, {m:'Jun', rev:2184, lead:82, type:'high'}, 
        {m:'Jul', rev:2186, lead:31, type:'high'}, {m:'Aug', rev:2541, lead:60, type:'high'}, 
        {m:'Sep', rev:1767, lead:77, type:'mid'}, {m:'Okt', rev:1411, lead:73, type:'mid'}, 
        {m:'Nov', rev:1189, lead:61, type:'low'}, {m:'Des', rev:894, lead:76, type:'low'}
    ],
    occupancy: [
        {label: 'Jan', value: 29.3, display: '29%', class: 'low'},
        {label: 'Feb', value: 35.0, display: '35%', class: 'low'},
        {label: 'Mar', value: 40.6, display: '41%', class: 'mid'},
        {label: 'Apr', value: 36.5, display: '36%', class: 'low'},
        {label: 'Mai', value: 44.7, display: '45%', class: 'mid'},
        {label: 'Jun', value: 62.4, display: '62%', class: 'high'},
        {label: 'Jul', value: 60.3, display: '60%', class: 'high'},
        {label: 'Aug', value: 69.4, display: '69%', class: 'high'},
        {label: 'Sep', value: 51.5, display: '52%', class: 'mid'},
        {label: 'Okt', value: 46.2, display: '46%', class: 'mid'},
        {label: 'Nov', value: 39.0, display: '39%', class: 'low'},
        {label: 'Des', value: 28.5, display: '29%', class: 'low'}
    ],
    days: [
        {d:'Man', adr:1975}, {d:'Tir', adr:2125}, {d:'Ons', adr:2169}, 
        {d:'Tor', adr:2219}, {d:'Fre', adr:2210}, {d:'Lør', adr:2373}, {d:'Søn', adr:2077}
    ]
};

function renderCharts() {
    if(!document.getElementById('chart-season')) return;
    renderBarChart('chart-season', analysisData.months.map(d => ({
        label: d.m, value: d.rev, display: d.rev + ' kr', class: d.type
    })), 2600);
    renderBarChart('chart-occupancy', analysisData.occupancy.map(d => ({
        label: d.label, value: d.value, display: d.display, class: d.class
    })), 100);
    renderBarChart('chart-dow', analysisData.days.map(d => ({
        label: d.d, value: d.adr, display: d.adr + ' kr', class: d.d === 'Lør' ? 'high' : 'mid'
    })), 2500);
    renderBarChart('chart-lead', analysisData.months.map(d => ({
        label: d.m, value: d.lead, display: d.lead + ' d', class: 'low'
    })), 90);
}

function renderBarChart(elementId, data, maxVal) {
    const container = document.getElementById(elementId);
    if(!container) return;
    container.innerHTML = ''; 
    data.forEach(item => {
        let heightPct = (item.value / maxVal) * 100;
        if(heightPct > 100) heightPct = 100; 
        const wrapper = document.createElement('div');
        wrapper.className = 'chart-bar-wrapper';
        const bar = document.createElement('div');
        bar.className = `chart-bar ${item.class || ''}`;
        bar.style.height = '0%'; 
        bar.setAttribute('data-value', item.display);
        const label = document.createElement('div');
        label.className = 'chart-label';
        label.textContent = item.label;
        wrapper.appendChild(bar);
        wrapper.appendChild(label);
        container.appendChild(wrapper);
        setTimeout(() => { bar.style.height = heightPct + '%'; }, 100);
    });
}

function toggleHelp() {
    const content = document.getElementById('help-content');
    content.classList.toggle('open');
    const btn = document.querySelector('.help-toggle');
    btn.textContent = content.classList.contains('open') ? "❌ Lukk veiledning" : "🎓 Hvordan bruke dette verktøyet? (Klikk for å åpne)";
}