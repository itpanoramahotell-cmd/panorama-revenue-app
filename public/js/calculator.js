export const formatter = new Intl.NumberFormat('no-NO', { 
    style: 'currency', 
    currency: 'NOK', 
    maximumFractionDigits: 0 
});

export function calculateRevenue(state) {
    const totalRooms = parseInt(state.totalRooms) || 57;
    const occDecimal = state.occupancy / 100;
    const mixDecimal = state.mix / 100;
    const discDecimal = state.discount / 100;

    const nonRefPrice = state.basePrice * (1 - discDecimal);
    const roomsSold = Math.round(totalRooms * occDecimal);
    const nonRefRooms = Math.round(roomsSold * mixDecimal);
    const flexRooms = roomsSold - nonRefRooms;

    const totalRev = (nonRefRooms * nonRefPrice) + (flexRooms * state.basePrice);
    const adr = roomsSold > 0 ? totalRev / roomsSold : 0;
    const revpar = totalRev / totalRooms;

    return { totalRev, adr, revpar, nonRefPrice };
}

export function calculateBreakEven(fixedCosts, varCosts, totalRooms, occupancyPct) {
    const daysInMonth = 30.4;
    const totalCapacity = totalRooms * daysInMonth;
    const occupiedRooms = totalCapacity * (occupancyPct / 100);
    const totalCosts = fixedCosts + (varCosts * occupiedRooms);
    
    return totalCapacity > 0 ? totalCosts / totalCapacity : 0;
}