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
    const totalRooms = parseFloat(state.totalRooms) || 81;
    const occupancyPct = parseFloat(state.occupancy) || 0;
    const basePrice = parseFloat(state.basePrice) || 0;
    const discountPct = parseFloat(state.discount) || 0;
    const mixPct = parseFloat(state.mix) || 0;

    // 1. Beregn antall solgte rom
    const roomsSold = Math.round(totalRooms * (occupancyPct / 100));

    // 2. Beregn prisene
    const nonRefPrice = basePrice * (1 - (discountPct / 100));
    const flexPrice = basePrice;

    // 3. Fordel bookinger (Mix)
    // Hvor mange kjøper Non-Ref?
    const nonRefRooms = roomsSold * (mixPct / 100);
    // Hvor mange kjøper Flex?
    const flexRooms = roomsSold * (1 - (mixPct / 100));

    // 4. Total Omsetning
    const totalRev = (nonRefRooms * nonRefPrice) + (flexRooms * flexPrice);

    // 5. Faktisk ADR (Vektet snitt)
    // Hvis vi har solgt rom, del total omsetning på antall rom. Hvis ikke, bruk basepris for visning.
    const adr = roomsSold > 0 ? (totalRev / roomsSold) : basePrice;

    return {
        totalRev,
        revpar: totalRev / totalRooms, // RevPAR er alltid Total Rev / TOTALT antall rom (ikke solgte)
        adr, 
        nonRefPrice
    };
}

export function calculateSingleRoom(room, state, pax, seasonPct, dayType, isNonRef) {
    if (pax > (state[room.maxPax] || 2)) return null;
    
    const base = room.type === 'hotel' ? state.hotelBase : state.bryggeBase;
    const addon = room.addon === 0 ? 0 : (state[room.addon] || 0);
    const discPct = room.type === 'hotel' ? state.hotelNonRef : state.bryggeNonRef;
    
    let price = (base + addon) * (1 + (seasonPct / 100));
    
    // Tillegg
    if (dayType === 'fri') price += (state.hotelWeekend || 0);
    if (dayType === 'sat') price += (state.hotelSpecial || 0);
    
    // Fradrag/Tillegg PAX
    if (pax === 1) price -= (state[room.singleDed] || state.bryggeSingle || 0);
    if (pax > 2) price += ((pax - 2) * (state.hotelExtra || state.bryggeExtra || 0));
    
    // Non-Ref rabatt i matrisen
    if (isNonRef) {
        price = price * (1 - (discPct / 100));
    }
    
    return Math.round(price);
}