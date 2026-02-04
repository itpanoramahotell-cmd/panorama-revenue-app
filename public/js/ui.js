export const UI = {
    setTxt: (id, val) => { const el = document.getElementById(id); if(el) el.innerText = val; },
    updateSidebar: (list, currentId, onSelect) => {
        const ul = document.getElementById('strategyList');
        ul.innerHTML = '';
        list.forEach(s => {
            const li = document.createElement('li');
            li.innerText = s.name;
            if(s.id === currentId) li.classList.add('active');
            li.onclick = () => onSelect(s.id);
            ul.appendChild(li);
        });
    },
    renderCharts: (containerId, data, maxVal) => {
        const container = document.getElementById(containerId);
        if(!container) return;
        container.innerHTML = '';
        data.forEach(item => {
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.style.height = (item.value / maxVal * 100) + '%';
            bar.setAttribute('data-value', item.label);
            container.appendChild(bar);
        });
    }
};