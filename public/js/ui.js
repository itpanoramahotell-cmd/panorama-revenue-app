import { formatter } from './calculator.js';

export const UI = {
    setTxt: (id, txt) => { const el = document.getElementById(id); if(el) el.innerHTML = txt; },
    getVal: (id) => { const el = document.getElementById(id); return el ? (parseInt(el.value) || 0) : 0; },
    
    showLogin: () => document.getElementById('login-overlay').style.display = 'flex',
    hideLogin: () => document.getElementById('login-overlay').style.display = 'none',
    
    updateStrategyList: (strategies, currentId, onSelect) => {
        const list = document.getElementById('strategyList');
        list.innerHTML = '';
        strategies.forEach(s => {
            const li = document.createElement('li');
            li.textContent = s.name;
            if(s.id === currentId) li.classList.add('active');
            li.onclick = () => onSelect(s.id);
            list.appendChild(li);
        });
    }
};

export function renderCharts(data) {
    const container = document.getElementById('chart-season');
    if(!container) return;
    
    // Logikk for å sette høyde på søylene basert på data
    // f.eks. bar.style.height = (value / maxValue) * 100 + '%';
}