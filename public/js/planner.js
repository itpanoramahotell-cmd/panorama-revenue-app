import { roomDefinitions, calculateSingleRoom, formatter } from './calculator.js';

export function renderTable(state, pax, isNonRef) {
    const tbody = document.getElementById('priceTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const configs = [
        { label: "Hovedbygget", type: "hotel" },
        { label: "Panorama Brygge", type: "brygge" }
    ];

    configs.forEach(conf => {
        const sectionRow = document.createElement('tr');
        sectionRow.className = 'section-row';
        sectionRow.innerHTML = `<td colspan="10">${conf.label}</td>`;
        tbody.appendChild(sectionRow);

        // Subheader
        const subHeader = document.createElement('tr');
        subHeader.className = 'th-group';
        subHeader.innerHTML = `
            <th></th>
            <th class="th-sub">Hverdag</th><th class="th-sub weekend-col">Fredag</th><th class="th-sub weekend-col">Lørdag</th>
            <th class="th-sub">Hverdag</th><th class="th-sub weekend-col">Fredag</th><th class="th-sub weekend-col">Lørdag</th>
            <th class="th-sub">Hverdag</th><th class="th-sub weekend-col">Fredag</th><th class="th-sub weekend-col">Lørdag</th>
        `;
        tbody.appendChild(subHeader);

        roomDefinitions.filter(r => r.type === conf.type).forEach(room => {
            const tr = document.createElement('tr');
            let html = `<td class="td-name">${room.name}</td>`;
            
            const seasonPcts = [0, state.seasonMid, state.seasonLow];
            
            seasonPcts.forEach(pct => {
                ['weekday', 'fri', 'sat'].forEach(day => {
                    const price = calculateSingleRoom(room, state, pax, pct, day, isNonRef);
                    const isWeekend = day !== 'weekday';
                    const cellClass = isWeekend ? 'weekend-col td-price' : 'td-price';
                    html += `<td class="${cellClass}">${price ? formatter.format(price) : '-'}</td>`;
                });
            });
            tr.innerHTML = html;
            tbody.appendChild(tr);
        });
    });
}