export const UI = {
    setTxt: (id, val) => { const el = document.getElementById(id); if(el) el.innerText = val; },
    
    updateSliderValue: (id, val, suffix = "") => {
        const el = document.getElementById(id + 'Val');
        if(el) el.innerText = val + suffix;
    },

    updateSidebar: (list, currentId, onSelect, dirtyId = null) => {
        const ul = document.getElementById('strategyList');
        if(!ul) return;
        ul.innerHTML = '';
        list.forEach(s => {
            const li = document.createElement('li');
            const isDirty = s.id === dirtyId;
            li.innerHTML = `${s.name}${isDirty ? '<span class="draft-badge">Draft</span>' : ''}`;
            if(s.id === currentId) li.classList.add('active');
            li.onclick = () => onSelect(s.id);
            ul.appendChild(li);
        });
    },

    setSaveButtonState: (active) => {
        const btn = document.getElementById('saveBtn');
        if(!btn) return;
        if(active) {
            btn.classList.add('active');
            btn.style.opacity = "1";
            btn.style.pointerEvents = "auto";
        } else {
            btn.classList.remove('active');
            btn.style.opacity = "0.6";
            btn.style.pointerEvents = "none";
        }
    },

    showModal: (id) => { const el = document.getElementById(id); if(el) el.style.display = 'flex'; },
    hideModal: (id) => { const el = document.getElementById(id); if(el) el.style.display = 'none'; },

    renderCharts: (containerId, data, maxVal) => {
        const container = document.getElementById(containerId);
        if(!container) return;
        container.innerHTML = '';
        data.forEach(item => {
            const wrapper = document.createElement('div');
            wrapper.className = 'chart-bar-wrapper';
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            
            // Fargekoding basert på sesong (Jan-Okt fra rapporter)
            const low = ['Jan', 'Feb', 'Nov', 'Des'];
            const mid = ['Mar', 'Apr', 'Mai', 'Okt'];
            
            if (low.includes(item.label)) bar.style.background = "#3182CE"; // Lav
            else if (mid.includes(item.label)) bar.style.background = "#DD6B20"; // Mid
            else bar.style.background = "#38A169"; // Høy (Jun, Jul, Aug, Sep)
            
            bar.style.height = (item.value / maxVal * 100) + '%';
            bar.setAttribute('data-value', item.display || item.value);
            const label = document.createElement('div');
            label.className = 'chart-label';
            label.innerText = item.label;
            wrapper.appendChild(bar);
            wrapper.appendChild(label);
            container.appendChild(wrapper);
        });
    }
};