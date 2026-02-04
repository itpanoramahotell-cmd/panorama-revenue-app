import { roomDefinitions, calculateSingleRoom, formatter } from './calculator.js';

export function renderTable(state, pax, isNonRef) {
    const tbody = document.getElementById('priceTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const configs = [
        { label: "HOVEDBYGGET", type: "hotel" },
        { label: "PANORAMA BRYGGE", type: "brygge" }
    ];

    configs.forEach(conf => {
        tbody.innerHTML += `<tr class="section-row"><td colspan="10">${conf.label}</td></tr>`;
        roomDefinitions.filter(r => r.type === conf.type).forEach(room => {
            const tr = document.createElement('tr');
            let html = `<td>${room.name}</td>`;
            
            [0, state.seasonMid, state.seasonLow].forEach(pct => {
                ['weekday', 'fri', 'sat'].forEach(day => {
                    const price = calculateSingleRoom(room, state, pax, pct, day, isNonRef);
                    html += `<td>${price ? formatter.format(price) : '-'}</td>`;
                });
            });
            tr.innerHTML = html;
            tbody.appendChild(tr);
        });
    });
}