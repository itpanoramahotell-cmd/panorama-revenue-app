export const UI = {
    // Enkel tekstoppdatering
    setTxt: (id, val) => { const el = document.getElementById(id); if(el) el.innerText = val; },
    
    // Oppdaterer slider-verdier
    updateSliderValue: (id, val, suffix = "") => {
        const el = document.getElementById(id + 'Val');
        if(el) el.innerText = val + suffix;
    },

    // Styrer lagre-knappens utseende (Grønn/Grå)
    setSaveButtonState: (active) => {
        const btn = document.getElementById('saveBtn');
        if(!btn) return;
        if(active) {
            btn.classList.add('active');
            btn.style.opacity = "1";
            btn.style.pointerEvents = "auto";
            btn.style.background = "#38A169"; 
        } else {
            btn.classList.remove('active');
            btn.style.opacity = "0.6";
            btn.style.pointerEvents = "none";
            btn.style.background = "#718096"; 
        }
    },

    // --- REKURSIV TRE-RENDERER (Hjernen bak mappestrukturen) ---
    renderTree: (items, container, currentId, onSelect, onMove, dirtyIds, editMode, expandedIds, toggleExpand) => {
        container.innerHTML = '';
        const ul = document.createElement('ul');

        // Sortering: Basert på 'sortOrder'
        const sortedItems = items.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

        sortedItems.forEach(item => {
            const li = document.createElement('li');
            const div = document.createElement('div');
            
            // CSS-klasser basert på type (mappe/fil)
            div.className = `tree-item ${item.type}`;
            
            // Markering av valgt element
            if (item.id === currentId) div.classList.add('active');
            
            // Drag-and-drop klasse
            if (editMode) div.classList.add('draggable');
            
            // Ikoner
            let icon = '📄';
            if (item.type === 'year') icon = '📅';
            if (item.type === 'season') icon = '🌤️';
            if (item.type === 'segment') icon = '🏨';

            // Draft Badge (Vises kun hvis endret)
            const isDirty = dirtyIds.has(item.id);
            const draftBadge = isDirty ? '<span class="draft-badge">DRAFT</span>' : '';
            
            // Mappe-logikk (Chevron for åpne/lukke)
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedIds.has(item.id);
            const chevron = (['year','season','segment'].includes(item.type)) 
                ? `<span class="chevron" style="margin-right:5px; font-size:0.7rem; cursor:pointer;">${isExpanded ? '▼' : '▶'}</span>` 
                : '';

            div.innerHTML = `<div style="display:flex; align-items:center;">${chevron}<span>${icon} ${item.name}</span></div>${draftBadge}`;

            // Klikk-håndtering
            div.onclick = (e) => {
                e.stopPropagation();
                // Hvis det er en mappe -> Toggle expand
                if (['year','season','segment'].includes(item.type)) {
                    toggleExpand(item.id);
                } else {
                    // Hvis det er en fil -> Velg den
                    onSelect(item);
                }
            };

            // --- DRAG & DROP LOGIKK ---
            if (editMode) {
                div.draggable = true;
                div.ondragstart = (e) => {
                    e.dataTransfer.setData('text/plain', item.id);
                    e.dataTransfer.effectAllowed = 'move';
                    div.classList.add('dragging');
                };
                div.ondragend = () => div.classList.remove('dragging');
                
                div.ondragover = (e) => { e.preventDefault(); e.stopPropagation(); div.classList.add('drag-over'); };
                div.ondragleave = () => div.classList.remove('drag-over');
                
                div.ondrop = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    div.classList.remove('drag-over');
                    const draggedId = e.dataTransfer.getData('text/plain');
                    // Send beskjed tilbake til main.js om flytting
                    onMove(draggedId, item.id, item.type);
                };
            }

            li.appendChild(div);

            // Render barn (rekursivt) hvis mappen er åpnet
            if (hasChildren && isExpanded) {
                const childContainer = document.createElement('div');
                UI.renderTree(item.children, childContainer, currentId, onSelect, onMove, dirtyIds, editMode, expandedIds, toggleExpand);
                li.appendChild(childContainer);
            }

            ul.appendChild(li);
        });
        
        container.appendChild(ul);
    },

    // Modal-håndtering
    showModal: (id) => { const el = document.getElementById(id); if(el) el.style.display = 'flex'; },
    hideModal: (id) => { const el = document.getElementById(id); if(el) el.style.display = 'none'; },

    // Tegner grafer med sesongfarger
    renderCharts: (containerId, data, maxVal) => {
        const container = document.getElementById(containerId);
        if(!container) return;
        container.innerHTML = '';
        data.forEach(item => {
            const wrapper = document.createElement('div');
            wrapper.className = 'chart-bar-wrapper';
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            
            // Fargekoding sesong
            const low = ['Jan', 'Feb', 'Nov', 'Des'];
            const mid = ['Mar', 'Apr', 'Mai', 'Okt']; 
            if (low.includes(item.label)) bar.style.background = "#3182CE"; 
            else if (mid.includes(item.label)) bar.style.background = "#DD6B20"; 
            else bar.style.background = "#38A169"; 
            
            bar.style.height = (item.value / maxVal * 100) + '%';
            bar.setAttribute('data-value', item.display || item.value);
            const label = document.createElement('div');
            label.className = 'chart-label';
            label.innerText = item.label;
            wrapper.appendChild(bar); wrapper.appendChild(label); container.appendChild(wrapper);
        });
    }
};