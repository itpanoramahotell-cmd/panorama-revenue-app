const marketEvents = {
    2026: {
        months: {
            0: { name: "Januar", info: "Lavsesong. Fokus: Kurs/Konferanse og helge-spa." },
            1: { name: "Februar", info: "Vinterferie (Uke 9). Høy domestic etterspørsel." },
            2: { name: "Mars", info: "Påskeferie (29. mars - 6. april). Strategi: Familiepakker." },
            3: { name: "April", info: "Våren starter. Konferansesesong." },
            4: { name: "Mai", info: "Festspillene i Bergen starter. Mange helligdager (14, 17, 24, 25)." },
            5: { name: "Juni", info: "Høysesong start. Cruise-sesong og fjord-turister." },
            6: { name: "Juli", info: "Fellesferie. Maksimal etterspørsel. Ingen Non-Ref." },
            7: { name: "August", info: "Høysesong slutt. Internasjonale turister (Tyskland/USA)." },
            8: { name: "September", info: "Konferansetopp. Olje/Energi-events." },
            9: { name: "Oktober", info: "Høstferie (Uke 41). Domestic leisure." },
            10: { name: "November", info: "Stille før jul. Julebord-sesong starter." },
            11: { name: "Desember", info: "Julebord og romjul. Lav ADR ukedager." }
        },
        highlights: [
            { date: "2026-03-29", end: "2026-04-06", title: "Påskeferie", type: "holiday", desc: "Hele Norge reiser. Steng for lave corporate-rater." },
            { date: "2026-05-20", end: "2026-06-03", title: "Festspillene i Bergen", type: "event", desc: "Stor internasjonal tiltrekning. Høyt ADR-press i hele regionen." },
            { date: "2026-06-20", end: "2026-08-15", title: "Fellesferie / Peak Summer", type: "peak", desc: "Maks yield. Hurdles bør settes på 2500kr+." },
            { date: "2026-08-24", end: "2026-08-27", title: "ONS (Stavanger/Regionen)", type: "event", desc: "Smitter over på hele Vestlandet. Vanskelig å finne rom." }
        ]
    },
    2027: {
        // ... Lignende struktur for 2027 (Påske er 21-29 mars i 2027)
    }
};

let currentYear = 2026;

export function initMarketCalendar() {
    renderYear(currentYear);
}

window.changeCalendarYear = (year) => {
    currentYear = year;
    document.getElementById('btn2026').classList.toggle('active', year === 2026);
    document.getElementById('btn2027').classList.toggle('active', year === 2027);
    renderYear(year);
};

function renderYear(year) {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    for (let m = 0; m < 12; m++) {
        const monthDiv = document.createElement('div');
        monthDiv.className = 'month-card';
        
        const data = marketEvents[year]?.months[m] || { name: "Måned", info: "" };
        
        monthDiv.innerHTML = `
            <h3>${data.name}</h3>
            <p class="month-info">${data.info}</p>
            <div class="mini-days">
                ${generateDays(year, m)}
            </div>
        `;
        grid.appendChild(monthDiv);
    }
}

function generateDays(year, month) {
    // Enkel visualisering av dager/uker
    let html = '';
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for(let d=1; d<=daysInMonth; d++) {
        const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isEvent = marketEvents[year]?.highlights.find(h => dateStr >= h.date && dateStr <= (h.end || h.date));
        const colorClass = isEvent ? `day-${isEvent.type}` : '';
        
        html += `<span class="day-dot ${colorClass}" title="${isEvent ? isEvent.title : ''}"></span>`;
    }
    return html;
}