import { UI } from './ui.js';

// --- STATE ---
let selectedRoomTypes = new Set(['STD','SUP','DLX','JS','JSE','FS1','FS2','FSE']);
// Standard: Alle måneder valgt
const allMonths = ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Des"];
let selectedMonths = new Set(allMonths);

// --- DATA: 2025 RAPPORTENE ---
const roomData2025 = {
  "STD": [
    {"month": "Jan", "capacity": 1085, "sold": 343.0, "revenue": 505492.41, "lead": 45.6}, {"month": "Feb", "capacity": 980, "sold": 299.0, "revenue": 417198.95, "lead": 24.4},
    {"month": "Mar", "capacity": 1085, "sold": 408.0, "revenue": 708730.64, "lead": 75.0}, {"month": "Apr", "capacity": 1050, "sold": 293.0, "revenue": 515854.54, "lead": 48.0},
    {"month": "Mai", "capacity": 1085, "sold": 434.0, "revenue": 830923.64, "lead": 63.6}, {"month": "Jun", "capacity": 1050, "sold": 695.0, "revenue": 1293691.83, "lead": 87.7},
    {"month": "Jul", "capacity": 1085, "sold": 452.0, "revenue": 703831.76, "lead": 17.9}, {"month": "Aug", "capacity": 1085, "sold": 665.0, "revenue": 1205544.32, "lead": 59.4},
    {"month": "Sep", "capacity": 1050, "sold": 567.0, "revenue": 1098626.47, "lead": 91.4}, {"month": "Okt", "capacity": 1085, "sold": 499.0, "revenue": 799747.56, "lead": 77.9},
    {"month": "Nov", "capacity": 1050, "sold": 444.0, "revenue": 740113.94, "lead": 61.0}, {"month": "Des", "capacity": 1085, "sold": 345.0, "revenue": 639175.89, "lead": 76.8}
  ],
  "SUP": [
    {"month": "Jan", "capacity": 620, "sold": 213.0, "revenue": 348001.26, "lead": 49.0}, {"month": "Feb", "capacity": 560, "sold": 256.0, "revenue": 429765.73, "lead": 32.9},
    {"month": "Mar", "capacity": 620, "sold": 350.0, "revenue": 622088.83, "lead": 62.0}, {"month": "Apr", "capacity": 600, "sold": 282.0, "revenue": 537368.13, "lead": 33.1},
    {"month": "Mai", "capacity": 620, "sold": 281.0, "revenue": 653357.08, "lead": 88.8}, {"month": "Jun", "capacity": 600, "sold": 398.0, "revenue": 836503.34, "lead": 101.6},
    {"month": "Jul", "capacity": 620, "sold": 427.0, "revenue": 897067.86, "lead": 36.8}, {"month": "Aug", "capacity": 620, "sold": 473.0, "revenue": 993392.99, "lead": 53.3},
    {"month": "Sep", "capacity": 600, "sold": 364.0, "revenue": 774223.1, "lead": 74.5}, {"month": "Okt", "capacity": 620, "sold": 325.0, "revenue": 578928.01, "lead": 88.9},
    {"month": "Nov", "capacity": 600, "sold": 265.0, "revenue": 512571.68, "lead": 74.6}, {"month": "Des", "capacity": 620, "sold": 184.0, "revenue": 352070.85, "lead": 92.8}
  ],
  "JS": [
    {"month": "Jan", "capacity": 465, "sold": 158.0, "revenue": 382752.62, "lead": 38.1}, {"month": "Feb", "capacity": 420, "sold": 176.0, "revenue": 450044.38, "lead": 29.0},
    {"month": "Mar", "capacity": 465, "sold": 204.0, "revenue": 528163.45, "lead": 65.0}, {"month": "Apr", "capacity": 450, "sold": 189.0, "revenue": 467483.83, "lead": 34.2},
    {"month": "Mai", "capacity": 465, "sold": 255.0, "revenue": 785327.0, "lead": 61.3}, {"month": "Jun", "capacity": 450, "sold": 305.0, "revenue": 843555.81, "lead": 48.4},
    {"month": "Jul", "capacity": 465, "sold": 411.0, "revenue": 1268122.21, "lead": 26.4}, {"month": "Aug", "capacity": 465, "sold": 430.0, "revenue": 1272572.55, "lead": 53.6},
    {"month": "Sep", "capacity": 450, "sold": 217.0, "revenue": 670979.03, "lead": 41.9}, {"month": "Okt", "capacity": 465, "sold": 243.0, "revenue": 691727.58, "lead": 57.3},
    {"month": "Nov", "capacity": 450, "sold": 177.0, "revenue": 490436.24, "lead": 40.7}, {"month": "Des", "capacity": 465, "sold": 122.0, "revenue": 312451.93, "lead": 53.4}
  ],
  "FS2": [
    {"month": "Jan", "capacity": 124, "sold": 45.0, "revenue": 88080.88, "lead": 51.9}, {"month": "Feb", "capacity": 112, "sold": 40.0, "revenue": 61358.0, "lead": 19.3},
    {"month": "Mar", "capacity": 124, "sold": 32.0, "revenue": 92792.24, "lead": 69.3}, {"month": "Apr", "capacity": 120, "sold": 47.0, "revenue": 104403.26, "lead": 48.4},
    {"month": "Mai", "capacity": 124, "sold": 51.0, "revenue": 133001.78, "lead": 53.1}, {"month": "Jun", "capacity": 120, "sold": 89.0, "revenue": 274134.35, "lead": 60.3},
    {"month": "Jul", "capacity": 124, "sold": 106.0, "revenue": 333362.98, "lead": 56.4}, {"month": "Aug", "capacity": 124, "sold": 117.0, "revenue": 401181.53, "lead": 93.9},
    {"month": "Sep", "capacity": 120, "sold": 41.0, "revenue": 120942.92, "lead": 59.3}, {"month": "Okt", "capacity": 124, "sold": 55.0, "revenue": 147429.73, "lead": 43.6},
    {"month": "Nov", "capacity": 120, "sold": 35.0, "revenue": 114506.75, "lead": 64.3}, {"month": "Des", "capacity": 124, "sold": 19.0, "revenue": 64994.51, "lead": 56.1}
  ],
  "FSE": [
    {"month": "Jan", "capacity": 93, "sold": 35.0, "revenue": 71555.72, "lead": 36.5}, {"month": "Feb", "capacity": 84, "sold": 27.0, "revenue": 84124.62, "lead": 17.3},
    {"month": "Mar", "capacity": 93, "sold": 28.0, "revenue": 84031.4, "lead": 62.2}, {"month": "Apr", "capacity": 90, "sold": 31.0, "revenue": 90576.7, "lead": 63.9},
    {"month": "Mai", "capacity": 93, "sold": 49.0, "revenue": 179849.25, "lead": 74.9}, {"month": "Jun", "capacity": 90, "sold": 80.0, "revenue": 269368.75, "lead": 92.4},
    {"month": "Jul", "capacity": 93, "sold": 102.0, "revenue": 320256.6, "lead": 100.7}, {"month": "Aug", "capacity": 93, "sold": 79.0, "revenue": 288655.98, "lead": 116.0},
    {"month": "Sep", "capacity": 90, "sold": 35.0, "revenue": 118992.1, "lead": 88.1}, {"month": "Okt", "capacity": 93, "sold": 34.0, "revenue": 130815.61, "lead": 27.0},
    {"month": "Nov", "capacity": 90, "sold": 20.0, "revenue": 78993.55, "lead": 29.7}, {"month": "Des", "capacity": 93, "sold": 21.0, "revenue": 103242.95, "lead": 59.1}
  ],
  "DLX": [
    {"month": "Jan", "capacity": 62, "sold": 25.0, "revenue": 50955.09, "lead": 38.4}, {"month": "Feb", "capacity": 56, "sold": 25.0, "revenue": 53969.95, "lead": 39.6},
    {"month": "Mar", "capacity": 62, "sold": 38.0, "revenue": 82808.48, "lead": 72.5}, {"month": "Apr", "capacity": 60, "sold": 37.0, "revenue": 81607.49, "lead": 39.3},
    {"month": "Mai", "capacity": 62, "sold": 48.0, "revenue": 116709.06, "lead": 47.6}, {"month": "Jun", "capacity": 60, "sold": 40.0, "revenue": 98132.88, "lead": 68.7},
    {"month": "Jul", "capacity": 62, "sold": 32.0, "revenue": 96811.0, "lead": 33.6}, {"month": "Aug", "capacity": 62, "sold": 41.0, "revenue": 116915.14, "lead": 101.7},
    {"month": "Sep", "capacity": 60, "sold": 20.0, "revenue": 58600.5, "lead": 97.0}, {"month": "Okt", "capacity": 62, "sold": 24.0, "revenue": 42018.44, "lead": 30.6},
    {"month": "Nov", "capacity": 60, "sold": 21.0, "revenue": 50188.6, "lead": 80.7}, {"month": "Des", "capacity": 62, "sold": 19.0, "revenue": 51294.15, "lead": 97.4}
  ],
  "FS1": [
    {"month": "Jan", "capacity": 31, "sold": 11.0, "revenue": 20152.15, "lead": 19.4}, {"month": "Feb", "capacity": 28, "sold": 6.0, "revenue": 10915.09, "lead": 19.4},
    {"month": "Mar", "capacity": 31, "sold": 8.0, "revenue": 23521.54, "lead": 46.9}, {"month": "Apr", "capacity": 30, "sold": 9.0, "revenue": 24504.18, "lead": 7.7},
    {"month": "Mai", "capacity": 31, "sold": 23.0, "revenue": 68777.86, "lead": 45.6}, {"month": "Jun", "capacity": 30, "sold": 35.0, "revenue": 106356.0, "lead": 129.0},
    {"month": "Jul", "capacity": 31, "sold": 38.0, "revenue": 112068.47, "lead": 126.9}, {"month": "Aug", "capacity": 31, "sold": 26.0, "revenue": 76440.0, "lead": 235.3},
    {"month": "Sep", "capacity": 30, "sold": 32.0, "revenue": 91732.1, "lead": 119.0}, {"month": "Okt", "capacity": 31, "sold": 18.0, "revenue": 46630.2, "lead": 31.8},
    {"month": "Nov", "capacity": 30, "sold": 6.0, "revenue": 20194.28, "lead": 46.2}, {"month": "Des", "capacity": 31, "sold": 9.0, "revenue": 24727.5, "lead": 73.7}
  ],
  "JSE": [
    {"month": "Jan", "capacity": 31, "sold": 0.0, "revenue": 0.0, "lead": 0}, {"month": "Feb", "capacity": 28, "sold": 0.0, "revenue": 0.0, "lead": 0},
    {"month": "Mar", "capacity": 31, "sold": 0.0, "revenue": 0.0, "lead": 0}, {"month": "Apr", "capacity": 30, "sold": 0.0, "revenue": 0.0, "lead": 0},
    {"month": "Mai", "capacity": 31, "sold": 0.0, "revenue": 0.0, "lead": 0}, {"month": "Jun", "capacity": 30, "sold": 5.0, "revenue": 12135.0, "lead": 43.0},
    {"month": "Jul", "capacity": 31, "sold": 27.0, "revenue": 131149.55, "lead": 9.7}, {"month": "Aug", "capacity": 31, "sold": 28.0, "revenue": 136084.0, "lead": 28.6},
    {"month": "Sep", "capacity": 30, "sold": 16.0, "revenue": 88056.2, "lead": 36.2}, {"month": "Okt", "capacity": 31, "sold": 13.0, "revenue": 55993.67, "lead": 61.4},
    {"month": "Nov", "capacity": 30, "sold": 8.0, "revenue": 26779.15, "lead": 31.1}, {"month": "Des", "capacity": 31, "sold": 10.0, "revenue": 32056.71, "lead": 34.6}
  ]
};

// --- LOGIKK ---

export function renderAnalysis() {
    // 1. Render ROMTYPE knapper (Eksisterende)
    const container = document.getElementById('roomTypeToggles');
    if (container) {
        container.innerHTML = '';
        Object.keys(roomData2025).forEach(type => {
            const btn = document.createElement('div');
            btn.className = 'room-toggle' + (selectedRoomTypes.has(type) ? ' active' : '');
            btn.innerText = type;
            btn.onclick = () => {
                if (selectedRoomTypes.has(type)) selectedRoomTypes.delete(type);
                else selectedRoomTypes.add(type);
                btn.classList.toggle('active');
                updateCharts();
            };
            container.appendChild(btn);
        });
    }

    // 2. INJISER MÅNED/SESONG-VELGER (NYTT!)
    // Sjekker om vi allerede har laget den for å unngå duplikater
    let monthContainer = document.getElementById('monthToggles');
    if (!monthContainer) {
        monthContainer = document.createElement('div');
        monthContainer.id = 'monthToggles';
        monthContainer.className = 'segment-builder';
        monthContainer.style.marginTop = '10px';
        monthContainer.style.borderTop = '1px solid #e2e8f0';
        
        // Sett inn etter rom-containeren
        if(container && container.parentNode) {
            container.parentNode.appendChild(monthContainer);
        }
    }
    
    // Bygg innholdet for måneder
    renderMonthControls(monthContainer);

    // 3. INJISER SESONG-SAMMENDRAG BOKS (NYTT!)
    let summaryBox = document.getElementById('seasonSummary');
    if(!summaryBox) {
        summaryBox = document.createElement('div');
        summaryBox.id = 'seasonSummary';
        summaryBox.className = 'kpi-grid';
        summaryBox.style.marginTop = '20px';
        summaryBox.style.marginBottom = '20px';
        // Sett inn FØR grafene
        const grid = document.querySelector('.analysis-grid');
        if(grid && grid.parentNode) grid.parentNode.insertBefore(summaryBox, grid);
    }

    updateCharts();
}

function renderMonthControls(container) {
    container.innerHTML = '';
    
    // Header
    const header = document.createElement('div');
    header.innerHTML = '<strong>Velg sesong/måneder:</strong>';
    header.style.width = '100%';
    header.style.marginBottom = '5px';
    header.style.color = '#4a5568';
    header.style.fontSize = '0.85rem';
    container.appendChild(header);

    // Måneds-knapper
    const monthWrapper = document.createElement('div');
    monthWrapper.style.display = 'flex';
    monthWrapper.style.flexWrap = 'wrap';
    monthWrapper.style.gap = '5px';
    monthWrapper.style.marginBottom = '10px';

    allMonths.forEach(m => {
        const btn = document.createElement('div');
        btn.className = 'room-toggle' + (selectedMonths.has(m) ? ' active' : '');
        btn.innerText = m;
        btn.style.fontSize = '0.75rem';
        btn.onclick = () => {
            if (selectedMonths.has(m)) selectedMonths.delete(m);
            else selectedMonths.add(m);
            btn.classList.toggle('active');
            updateCharts();
        };
        monthWrapper.appendChild(btn);
    });
    container.appendChild(monthWrapper);

    // Hurtigvalg for sesonger (Presets)
    const presetWrapper = document.createElement('div');
    presetWrapper.style.display = 'flex';
    presetWrapper.style.gap = '10px';
    
    const presets = [
        { name: 'Alle', months: allMonths },
        { name: 'Vinter', months: ['Jan', 'Feb', 'Mar', 'Nov', 'Des'] },
        { name: 'Sommer', months: ['Jun', 'Jul', 'Aug'] },
        { name: 'Vår', months: ['Apr', 'Mai'] },
        { name: 'Høst', months: ['Sep', 'Okt'] }
    ];

    presets.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'btn-struct'; // Gjenbruker sidebar-knapp stil
        btn.style.color = '#2D3748';
        btn.style.background = '#EDF2F7';
        btn.style.border = '1px solid #CBD5E0';
        btn.innerText = p.name;
        btn.onclick = () => {
            selectedMonths = new Set(p.months);
            renderMonthControls(container); // Re-render for å oppdatere active states
            updateCharts();
        };
        presetWrapper.appendChild(btn);
    });
    container.appendChild(presetWrapper);
}

function calculateAggregatedData() {
    const aggregated = {};
    
    // VIKTIG: Filtrer bort måneder som ikke er valgt
    const activeMonths = allMonths.filter(m => selectedMonths.has(m));
    
    activeMonths.forEach(m => {
        aggregated[m] = { revenue: 0, sold: 0, capacity: 0, weightedLead: 0 };
    });

    let totalRevenue = 0;
    let totalSold = 0;
    let totalCapacity = 0;

    // Loop gjennom valgte romtyper
    selectedRoomTypes.forEach(type => {
        const data = roomData2025[type];
        if (data) {
            data.forEach(d => {
                // Sjekk om måneden er valgt
                if (selectedMonths.has(d.month) && aggregated[d.month]) {
                    aggregated[d.month].revenue += d.revenue;
                    aggregated[d.month].sold += d.sold;
                    aggregated[d.month].capacity += d.capacity;
                    aggregated[d.month].weightedLead += (d.lead * d.sold);
                    
                    // Totaler for hele utvalget (for summary box)
                    totalRevenue += d.revenue;
                    totalSold += d.sold;
                    totalCapacity += d.capacity;
                }
            });
        }
    });

    // Formater til grafer
    const revparData = [];
    const occData = [];
    const adrData = [];
    const leadData = [];

    activeMonths.forEach(m => {
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

    // Beregn snitt for hele utvalget (Sesong-tall)
    const avgRevpar = totalCapacity > 0 ? totalRevenue / totalCapacity : 0;
    const avgAdr = totalSold > 0 ? totalRevenue / totalSold : 0;
    const avgOcc = totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0;

    return { 
        revparData, occData, adrData, leadData,
        summary: { avgRevpar, avgAdr, avgOcc, totalRevenue } 
    };
}

function updateCharts() {
    const data = calculateAggregatedData();
    
    // Oppdater grafene
    UI.renderCharts('chart-revpar', data.revparData, 3000);
    UI.renderCharts('chart-occupancy', data.occData, 100);
    UI.renderCharts('chart-adr', data.adrData, 3500);
    UI.renderCharts('chart-lead', data.leadData, 150);

    // Oppdater Sammendragsboksen (Sesong Kalkulator)
    const summaryBox = document.getElementById('seasonSummary');
    if(summaryBox) {
        const formatter = new Intl.NumberFormat('no-NO', { maximumFractionDigits: 0 });
        summaryBox.innerHTML = `
            <div class="kpi-card" style="background:#2C5282;">
                <h3 style="font-size:0.8rem;">Snitt RevPAR (Utvalg)</h3>
                <div class="value" style="font-size:1.8rem;">${formatter.format(data.summary.avgRevpar)} kr</div>
            </div>
            <div class="kpi-card" style="background:#2C5282;">
                <h3 style="font-size:0.8rem;">Snitt ADR (Utvalg)</h3>
                <div class="value" style="font-size:1.8rem;">${formatter.format(data.summary.avgAdr)} kr</div>
            </div>
            <div class="kpi-card" style="background:#2C5282;">
                <h3 style="font-size:0.8rem;">Snitt Belegg (Utvalg)</h3>
                <div class="value" style="font-size:1.8rem;">${Math.round(data.summary.avgOcc)}%</div>
            </div>
            <div class="kpi-card" style="background:#38A169;">
                <h3 style="font-size:0.8rem;">Total Omsetning (Utvalg)</h3>
                <div class="value" style="font-size:1.8rem;">${formatter.format(data.summary.totalRevenue)}</div>
            </div>
        `;
    }
}