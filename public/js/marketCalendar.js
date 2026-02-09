// Utvidet markedsdata med fokus på de viktigste nasjonene for Vestlandet
let marketEvents = {
    highlights: [
        { start: "2026-03-29", end: "2026-04-06", title: "Påskeferie (Norge)", type: "holiday" },
        { start: "2026-05-20", end: "2026-06-03", title: "Festspillene i Bergen", type: "event" },
        { start: "2026-06-10", end: "2026-06-14", title: "Bergenfest", type: "event" },
        { start: "2026-06-20", end: "2026-08-15", title: "Fellesferie (Norge)", type: "peak" },
        // Internasjonale ferier som påvirker Bergen sterkt:
        { start: "2026-07-01", end: "2026-08-31", title: "USA Summer Travel Peak", type: "inbound" },
        { start: "2026-07-06", end: "2026-09-08", title: "Tyskland Skoleferie (Ulike delstater)", type: "inbound" },
        { start: "2026-07-18", end: "2026-08-31", title: "Nederland Sommerferie", type: "inbound" },
        { start: "2026-07-22", end: "2026-09-02", title: "UK School Holidays", type: "inbound" },
        { start: "2026-10-05", end: "2026-10-09", title: "Høstferie (Vestland)", type: "holiday" }
    ]
};

const typeColors = {
    holiday: '#f6ad55', // Oransje
    event: '#fc8181',   // Rød
    peak: '#68d391',    // Grønn
    inbound: '#4299e1', // Blå
    custom: '#9f7aea',  // Lilla (for egne oppføringer)
    today: '#1B365D'    // Mørkeblå ramme for i dag
};

let activeYear = 2026;

export function initMarketCalendar() {
    renderCalendar(activeYear);
    renderEventTable();
}

window.changeCalendarYear = (year) => {
    activeYear = year;
    document.getElementById('btn2026').classList.toggle('active', year === 2026);
    document.getElementById('btn2027').classList.toggle('active', year === 2027);
    renderCalendar(year);
};

function renderCalendar(year) {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    for (let m = 0; m < 12; m++) {
        const date = new Date(year, m, 1);
        const monthName = date.toLocaleString('no-NO', { month: 'long' });
        
        const card = document.createElement('div');
        card.className = 'month-card';
        card.innerHTML = `
            <h3 style="text-transform: capitalize; color: #1B365D;">${monthName}</h3>
            <div class="day-grid" style="display:flex; flex-wrap:wrap; gap:4px;">
                ${generateDayDots(year, m, todayStr)}
            </div>
        `;
        grid.appendChild(card);
    }
}

function generateDayDots(year, monthIndex, todayStr) {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    let dots = '';

    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, monthIndex, d);
        const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        let bgColor = '#edf2f7';
        let border = 'none';
        let title = `Dag ${d}`;
        
        // Sjekk hendelser
        const event = marketEvents.highlights.find(h => dateStr >= h.start && dateStr <= h.end);
        if (event) {
            bgColor = typeColors[event.type] || typeColors.custom;
            title = `${event.title}\nPeriode: ${event.start} til ${event.end}`;
        }

        // Markering for "I dag"
        if (dateStr === todayStr) {
            border = `2px solid ${typeColors.today}`;
            title += " (I DAG)";
        }

        dots += `<span class="day-dot" title="${title}" style="width:12px; height:12px; border-radius:2px; background:${bgColor}; border:${border}; display:inline-block; cursor:pointer;"></span>`;
    }
    return dots;
}

// Punkt 2 & 3: Tabell og egne oppføringer
function renderEventTable() {
    const container = document.getElementById('eventDetails'); // Bruker aside-panelet
    if (!container) return;

    container.innerHTML = `
        <div class="panel" style="margin-top:20px;">
            <h3>Administrer hendelser</h3>
            <table style="width:100%; font-size:0.8rem;">
                <thead>
                    <tr><th>Event</th><th>Fra</th><th>Til</th><th>Type</th></tr>
                </thead>
                <tbody id="eventTableBody">
                    ${marketEvents.highlights.map((h, i) => `
                        <tr>
                            <td>${h.title}</td>
                            <td>${h.start}</td>
                            <td>${h.end}</td>
                            <td><span style="display:inline-block; width:10px; height:10px; background:${typeColors[h.type]};"></span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div style="margin-top:15px; display:flex; flex-direction:column; gap:5px;">
                <input type="text" id="newTitle" placeholder="Hendelse navn" class="input-sm">
                <div style="display:flex; gap:5px;">
                    <input type="date" id="newStart" class="input-sm">
                    <input type="date" id="newEnd" class="input-sm">
                </div>
                <button id="addEventBtn" class="btn-struct" style="background:var(--primary); color:white; width:100%;">Legg til hendelse</button>
            </div>
        </div>
    `;

    document.getElementById('addEventBtn').onclick = () => {
        const title = document.getElementById('newTitle').value;
        const start = document.getElementById('newStart').value;
        const end = document.getElementById('newEnd').value;
        
        if (title && start && end) {
            marketEvents.highlights.push({ start, end, title, type: 'custom' });
            renderCalendar(activeYear);
            renderEventTable();
        }
    };
}