export const UI = {
    setTxt: (id, val) => { const el = document.getElementById(id); if(el) el.innerText = val; },
    
    updateSliderValue: (id, val, suffix = "") => {
        const el = document.getElementById(id + 'Val');
        if(el) el.innerText = val + suffix;
    },

    // Punkt 1 & 6: Oppdaterer sidebar og viser kun Draft når det er endringer
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

    // Punkt 2: Styrer lagre-knappens utseende
    setSaveButtonState: (active) => {
        const btn = document.getElementById('saveBtn');
        if(!btn) return;
        if(active) btn.classList.add('active');
        else btn.classList.remove('active');
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