export const UI = {
    setTxt: (id, val) => { const el = document.getElementById(id); if(el) el.innerText = val; },
    
    updateSliderValue: (id, val, suffix = "") => {
        const el = document.getElementById(id + 'Val');
        if(el) el.innerText = val + suffix;
    },

    setSaveButtonState: (active) => {
        const btn = document.getElementById('saveBtn');
        if(!btn) return;
        if(active) {
            btn.classList.add('active');
            btn.style.opacity = "1";
            btn.style.pointerEvents = "auto";
            btn.style.background = "#38A169"; // Grønn
        } else {
            btn.classList.remove('active');
            btn.style.opacity = "0.6";
            btn.style.pointerEvents = "none";
            btn.style.background = "#718096"; // Grå
        }
    },

    // --- TRE-STRUKTUR VISNING ---
    renderTree: (items, container, currentId, onSelect, onMove, dirtyId, editMode) => {
        container.innerHTML = '';
        const ul = document.createElement('ul');

        // Sortering: Mapper først, så filer (alfabetisk)
        const sortedItems = items.sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'folder' ? -1 : 1;
        });

        sortedItems.forEach(item => {
            const li = document.createElement('li');
            
            // Selve elementet (Mappe eller fil)
            const div = document.createElement('div');
            div.className = `tree-item ${item.type}`;
            if (item.id === currentId) div.classList.add('active');
            if (editMode) div.classList.add('draggable');
            
            const icon = item.type === 'folder' ? '📁' : '📄';
            const draftBadge = (item.id === dirtyId && item.type !== 'folder') ? '<span class="draft-badge">Draft</span>' : '';
            
            div.innerHTML = `<span>${icon} ${item.name}</span>${draftBadge}`;

            // Klikk: Velg strategi eller (eventuelt) toggle mappe
            div.onclick = (e) => {
                e.stopPropagation();
                onSelect(item);
            };

            // --- DRAG & DROP LOGIKK (Kun i Edit Mode) ---
            if (editMode) {
                div.draggable = true;
                div.ondragstart = (e) => {
                    e.dataTransfer.setData('text/plain', item.id);
                    e.dataTransfer.effectAllowed = 'move';
                    div.classList.add('dragging');
                };
                div.ondragend = () => div.classList.remove('dragging');
                
                div.ondragover = (e) => {
                    e.preventDefault(); 
                    e.stopPropagation();
                    div.classList.add('drag-over');
                };
                div.ondragleave = () => div.classList.remove('drag-over');
                
                div.ondrop = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    div.classList.remove('drag-over');
                    const draggedId = e.dataTransfer.getData('text/plain');
                    
                    // Flytt til mappen vi slipper på, ELLER til roten hvis vi slipper på et fil-element
                    if (item.type === 'folder') {
                        onMove(draggedId, item.id);
                    } else {
                        // Slipper man på en fil, legges den i samme mappe som filen
                        onMove(draggedId, item.parentId); 
                    }
                };
            }

            li.appendChild(div);

            // Hvis det er en mappe som har innhold, tegn barna (rekursivt)
            if (item.type === 'folder' && item.children && item.children.length > 0) {
                const childContainer = document.createElement('div');
                UI.renderTree(item.children, childContainer, currentId, onSelect, onMove, dirtyId, editMode);
                li.appendChild(childContainer);
            }

            ul.appendChild(li);
        });
        
        container.appendChild(ul);
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
            
            // Fargekoding basert på sesong i Norge (Panorama)
            // Lav: Jan, Feb, Nov, Dec (Blå)
            // Mid: Mar, Apr, Oct (Oransje)
            // Høy: Mai, Jun, Jul, Aug, Sep (Grønn)
            const low = ['Jan', 'Feb', 'Nov', 'Des'];
            const mid = ['Mar', 'Apr', 'Okt']; 
            
            if (low.includes(item.label)) bar.style.background = "#3182CE"; 
            else if (mid.includes(item.label)) bar.style.background = "#DD6B20"; 
            else bar.style.background = "#38A169"; 
            
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