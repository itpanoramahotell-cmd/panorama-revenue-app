export const formatter = new Intl.NumberFormat('no-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 });

export const roomDefinitions = [
    { id: 'std', name: "Standardrom", type: "hotel", addon: 0, maxPax: 'maxStd', singleDed: 'singleStd' },
    { id: 'sup', name: "Superior", type: "hotel", addon: 'addSup', maxPax: 'maxSup', singleDed: 'singleSup' },
    { id: 'dlx', name: "Deluxe", type: "hotel", addon: 'addDlx', maxPax: 'maxDlx', singleDed: 'singleDlx' },
    { id: 'js', name: "Juniorsuite", type: "hotel", addon: 'addJs', maxPax: 'maxJs', singleDed: 'singleJs' },
    { id: 'jsexcl', name: "Juniorsuite Excl", type: "hotel", addon: 'addJsExcl', maxPax: 'maxJsExcl', singleDed: 'singleJsExcl' },
    { id: 'fs1', name: "Fjordsuite 1. etg", type: "brygge", addon: 0, maxPax: 'maxFs1' },
    { id: 'fs2', name: "Fjordsuite 2. etg", type: "brygge", addon: 'addFs2', maxPax: 'maxFs2' },
    { id: 'fsexcl', name: "Fjordsuite Excl", type: "brygge", addon: 'addFsExcl', maxPax: 'maxFsExcl' }
];

export function runRevenueCalc(state) {
    const totalRooms = state.totalRooms || 81;
    const roomsSold = Math.round(totalRooms * (state.occupancy / 100));
    const nonRefPrice = state.basePrice * (1 - (state.discount / 100));
    const totalRev = (roomsSold * (state.mix / 100) * nonRefPrice) + (roomsSold * (1 - state.mix / 100) * state.basePrice);
    
    return {
        totalRev,
        revpar: totalRev / totalRooms,
        adr: roomsSold > 0 ? totalRev / roomsSold : 0,
        nonRefPrice
    };
}

export function calculateSingleRoom(room, state, pax, seasonPct, dayType, isNonRef) {
    if (pax > (state[room.maxPax] || 2)) return null;
    
    const base = room.type === 'hotel' ? state.hotelBase : state.bryggeBase;
    const addon = room.addon === 0 ? 0 : (state[room.addon] || 0);
    const discPct = room.type === 'hotel' ? state.hotelNonRef : state.bryggeNonRef;
    
    let price = (base + addon) * (1 + (seasonPct / 100));
    if (dayType === 'fri') price += (state.hotelWeekend || 0);
    if (dayType === 'sat') price += (state.hotelSpecial || 0);
    if (pax === 1) price -= (state[room.singleDed] || state.bryggeSingle || 0);
    if (pax > 2) price += ((pax - 2) * (state.hotelExtra || state.bryggeExtra || 0));
    
    return isNonRef ? price * (1 - (discPct / 100)) : price;
}