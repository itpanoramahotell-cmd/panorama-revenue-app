const marketEvents = {
    2026: {
        months: [
            { name: "Januar", info: "Lavsesong. Fokus: Lokale konferanser." },
            { name: "Februar", info: "Vinterferie (Uke 9). Høy familietrafikk." },
            { name: "Mars", info: "Påskeopptakt. Forretningstrafikk dominerer." },
            { name: "April", info: "Påske (29.mars-6.april). Deretter konferansetopp." },
            { name: "Mai", info: "Festspillene starter. Mange helligdager." },
            { name: "Juni", info: "Bergenfest. Cruise-start. Maksimal etterspørsel." },
            { name: "Juli", info: "Fellesferie. Høyeste ADR-potensial." },
            { name: "August", info: "Internasjonale ferier (DE/UK). Fortsatt høy yield." },
            { name: "September", info: "Høstkonferanser. Olje/Energi-fokus." },
            { name: "Oktober", info: "Høstferie (Uke 41). Weekend-staycations." },
            { name: "November", info: "Julebord-sesong. Lav rom-etterspørsel ukedager." },
            { name: "Desember", info: "Julebordshelger. Stille romjul." }
        ],
        highlights: [
            { start: "2026-03-29", end: "2026-04-06", title: "Påskeferie", type: "holiday" },
            { start: "2026-05-20", end: "2026-06-03", title: "Festspillene i Bergen", type: "event" },
            { start: "2026-06-10", end: "2026-06-14", title: "Bergenfest", type: "event" },
            { start: "2026-06-20", end: "2026-08-15", title: "Fellesferie & Peak Summer", type: "peak" },
            { start: "2026-07-10", end: "2026-08-20", title: "Tysk Sommerferie (Inbound)", type: "inbound" },
            { start: "2026-10-05", end: "2026-10-09", title: "Høstferie (Vestland)", type: "holiday" }
        ]
    },
    2027: {
        months: [
            { name: "Januar", info: "Kick-off måned. Lav ADR." },
            { name: "Februar", info: "Vinterferie (Uke 8). Nordmenn på tur." },
            { name: "Mars", info: "Tidlig Påske (21-29 mars). Viktig ferievindu." },
            { name: "April", info: "Møtevirksomhet topper seg." },
            { name: "Mai", info: "Konfirmasjoner/Helligdager. Weekendtopp." },
            { name: "Juni", info: "Høysesong start. Bergenfest." },
            { name: "Juli", info: "Maksimal ferietrafikk." },
            { name: "August", info: "Skolestart (Uke 33). Skifte til korp." },
            { name: "September", info: "Store kongresser i Bergen." },
            { name: "Oktober", info: "Høstferie. Kurs/Konferanse." },
            { name: "November", info: "Kick-off julebord." },
            { name: "Desember", info: "Årsavslutninger." }
        ],
        highlights: [
            { start: "2027-03-21", end: "2027-03-29", title: "Påskeferie", type: "holiday" },
            { start: "2027-06-15", end: "2027-08-15", title: "Peak Summer", type: "peak" },
            { start: "2027-05-17", end: "2027-05-17", title: "Grunnlovsdagen", type: "event" }
        ]
    }
};

let activeYear = 2026;

export function initMarketCalendar() {
    renderCalendar(activeYear);
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

    const data = marketEvents[year];
    data.months.forEach((m, index) => {
        const card = document.createElement('div');
        card.className = 'month-card';
        card.style.background = 'white';
        card.style.padding = '15px';
        card.style.borderRadius = '8px';
        card.style.border = '1px solid #e2e8f0';
        card.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';

        card.innerHTML = `
            <h3 style="color:#1B365D; margin-bottom:5px;">${m.name}</h3>
            <p style="font-size:0.8rem; color:#718096; min-height:40px;">${m.info}</p>
            <div class="day-grid" style="display:flex; flex-wrap:wrap; gap:3px; margin-top:10px;">
                ${generateDayDots(year, index)}
            </div>
        `;
        grid.appendChild(card);
    });
}

function generateDayDots(year, monthIndex) {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    let dots = '';
    
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, monthIndex, d);
        const dateStr = date.toISOString().split('T')[0];
        
        let statusClass = '';
        let title = `Dag ${d}`;
        
        const event = marketEvents[year].highlights.find(h => dateStr >= h.start && dateStr <= h.end);
        
        if (event) {
            statusClass = `day-${event.type}`;
            title = event.title;
        }

        dots += `<span class="day-dot ${statusClass}" title="${title}" style="width:10px; height:10px; border-radius:2px; background:#edf2f7; display:inline-block;"></span>`;
    }
    return dots;
}