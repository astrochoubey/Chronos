// State Management
let projectsData = JSON.parse(localStorage.getItem('chronosProjectsData')) || [];

// Charts
let statusChartInstance = null;
let priorityChartInstance = null;

// DOM Elements
const projectModal = document.getElementById('project-modal');
const addProjectBtn = document.getElementById('add-project-btn');
const closeProjectModal = document.getElementById('close-project-modal');
const saveProjectBtn = document.getElementById('save-project-btn');

const listContainer = document.getElementById('list-container');
const boardCols = {
    'Not Started': document.querySelector('#col-not-started .col-cards'),
    'In Progress': document.querySelector('#col-in-progress .col-cards'),
    'Complete': document.querySelector('#col-complete .col-cards')
};
const boardCounts = {
    'Not Started': document.querySelector('#col-not-started .col-count'),
    'In Progress': document.querySelector('#col-in-progress .col-count'),
    'Complete': document.querySelector('#col-complete .col-count')
};

const viewTabs = document.querySelectorAll('.view-tab');
const viewSections = document.querySelectorAll('.view-section');

// Initialize
function init() {
    renderViews();
}

function saveData() {
    localStorage.setItem('chronosProjectsData', JSON.stringify(projectsData));
    renderViews();
}

// View Toggling
viewTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class
        viewTabs.forEach(t => t.classList.remove('active'));
        viewSections.forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });

        // Add active
        tab.classList.add('active');
        const targetId = tab.getAttribute('data-target');
        const targetView = document.getElementById(targetId);
        targetView.classList.add('active');
        targetView.style.display = 'block';

        if (targetId === 'analytics-view') {
            renderAnalytics();
        }
    });
});

// Modal Logic
addProjectBtn.addEventListener('click', () => {
    document.getElementById('edit-proj-id').value = '';
    document.getElementById('proj-name').value = '';
    document.getElementById('proj-desc').value = '';
    document.getElementById('proj-status').value = 'Not Started';
    document.getElementById('proj-priority').value = 'Medium';
    document.getElementById('proj-due').value = '';
    document.getElementById('project-modal-title').textContent = "Add New Project";
    projectModal.classList.add('active');
});

closeProjectModal.addEventListener('click', () => projectModal.classList.remove('active'));

saveProjectBtn.addEventListener('click', () => {
    const id = document.getElementById('edit-proj-id').value;
    const projObj = {
        name: document.getElementById('proj-name').value || 'Untitled Project',
        desc: document.getElementById('proj-desc').value || '',
        status: document.getElementById('proj-status').value,
        priority: document.getElementById('proj-priority').value,
        dueDate: document.getElementById('proj-due').value || 'No Date'
    };

    if (id) {
        // Edit 
        const index = projectsData.findIndex(p => p.id == id);
        if (index > -1) {
            projObj.id = parseInt(id);
            projectsData[index] = projObj;
        }
    } else {
        // Add
        projObj.id = Date.now();
        projectsData.push(projObj);
    }
    
    saveData();
    projectModal.classList.remove('active');
});

window.deleteProject = function(id) {
    if (confirm("Delete this project?")) {
        projectsData = projectsData.filter(p => p.id !== id);
        saveData();
    }
};

window.editProject = function(id) {
    const proj = projectsData.find(p => p.id === id);
    if (!proj) return;
    
    document.getElementById('edit-proj-id').value = proj.id;
    document.getElementById('proj-name').value = proj.name;
    document.getElementById('proj-desc').value = proj.desc;
    document.getElementById('proj-status').value = proj.status;
    document.getElementById('proj-priority').value = proj.priority;
    document.getElementById('proj-due').value = proj.dueDate === 'No Date' ? '' : proj.dueDate;
    document.getElementById('project-modal-title').textContent = "Edit Project";
    
    projectModal.classList.add('active');
};

// Render Logic
function renderViews() {
    renderList();
    renderBoard();
    
    // If analytics view is currently open, re-render charts
    if (document.getElementById('analytics-view').classList.contains('active')) {
        renderAnalytics();
    }
}

function renderList() {
    listContainer.innerHTML = '';
    
    if (projectsData.length === 0) {
        listContainer.innerHTML = `<div style="padding: 20px; color: var(--text-muted);">No projects found. Add one to get started!</div>`;
        return;
    }

    // Sort by priority (High > Medium > Low) then by Date
    const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
    const sortedData = [...projectsData].sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

    sortedData.forEach(p => {
        const item = document.createElement('div');
        item.className = 'list-item';
        
        let safeStatusClass = p.status.replace(" ", ""); // e.g. "NotStarted" or "InProgress" or "Complete"
        
        item.innerHTML = `
            <div>
                <div class="proj-title">${p.name}</div>
                <div class="proj-desc-preview">${p.desc}</div>
            </div>
            <div>
                <span class="proj-priority priority-${p.priority}">${p.priority}</span>
            </div>
            <div>
                <span class="proj-status status-${safeStatusClass}">
                    ${p.status === 'Complete' ? '<i class="fa-solid fa-check-circle"></i>' : (p.status === 'In Progress' ? '<i class="fa-solid fa-spinner"></i>' : '<i class="fa-regular fa-circle"></i>')} 
                    ${p.status}
                </span>
            </div>
            <div style="color: var(--text-muted); font-size:14px;">${p.dueDate}</div>
            <div class="actions-group">
                <button class="action-btn" onclick="editProject(${p.id})"><i class="fa-solid fa-pen"></i></button>
                <button class="action-btn del-btn" onclick="deleteProject(${p.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

// Kanban Drag and Drop Logic
let draggedCardId = null;

function renderBoard() {
    // Clear cols
    Object.values(boardCols).forEach(col => col.innerHTML = '');
    
    // Reset counts
    Object.keys(boardCounts).forEach(key => boardCounts[key].textContent = '0');

    projectsData.forEach(p => {
        const col = boardCols[p.status];
        if (!col) return;

        const countSpan = boardCounts[p.status];
        countSpan.textContent = parseInt(countSpan.textContent) + 1;

        const card = document.createElement('div');
        card.className = 'kanban-card';
        card.draggable = true;
        card.dataset.id = p.id;
        
        let icon = p.status === 'Complete' ? '<i class="fa-solid fa-check-circle" style="color:var(--success)"></i>' : (p.status === 'In Progress' ? '<i class="fa-solid fa-spinner" style="color:var(--warning)"></i>' : '');

        card.innerHTML = `
            <div class="card-header">
                <strong>${p.name}</strong>
                ${icon}
            </div>
            <div class="proj-desc-preview" style="margin-bottom: 12px;">${p.desc}</div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="proj-priority priority-${p.priority}" style="font-size:12px; padding:4px 8px;">${p.priority}</span>
                <span class="card-due"><i class="fa-regular fa-calendar"></i> ${p.dueDate}</span>
            </div>
        `;
        
        // Drag Events
        card.addEventListener('dragstart', (e) => {
            draggedCardId = p.id;
            setTimeout(() => card.style.opacity = '0.5', 0);
        });
        
        card.addEventListener('dragend', () => {
            card.style.opacity = '1';
            draggedCardId = null;
        });

        col.appendChild(card);
    });
}

// Setup Column Drop Zones ONCE
document.querySelectorAll('.kanban-col').forEach(zone => {
    zone.addEventListener('dragover', e => {
        e.preventDefault(); // allow dropping
        zone.classList.add('drag-over');
    });
    
    zone.addEventListener('dragleave', () => {
        zone.classList.remove('drag-over');
    });
    
    zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        if (draggedCardId) {
            const statusTargets = {
                'col-not-started': 'Not Started',
                'col-in-progress': 'In Progress',
                'col-complete': 'Complete'
            };
            const targetStatus = statusTargets[zone.id];
            
            const projectIndex = projectsData.findIndex(proj => proj.id === draggedCardId);
            if (projectIndex > -1 && projectsData[projectIndex].status !== targetStatus) {
                projectsData[projectIndex].status = targetStatus;
                saveData(); // Automatically calls renderViews() again
            }
        }
    });
});

function renderAnalytics() {
    if (projectsData.length === 0) return;

    let statusCounts = { 'Not Started': 0, 'In Progress': 0, 'Complete': 0 };
    let priorityCounts = { 'High': 0, 'Medium': 0, 'Low': 0 };

    projectsData.forEach(p => {
        if(statusCounts[p.status] !== undefined) statusCounts[p.status]++;
        if(priorityCounts[p.priority] !== undefined) priorityCounts[p.priority]++;
    });

    const total = projectsData.length;
    const completed = statusCounts['Complete'];
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Update Stats Block
    document.getElementById('overall-progress-fill').style.width = `${percent}%`;
    document.getElementById('overall-progress-text').textContent = `${percent}% Completed`;
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-pending').textContent = total - completed;

    Chart.defaults.font.family = "'Outfit', sans-serif";
    Chart.defaults.color = "#cbd5e1";

    // Status Chart (Doughnut)
    const ctxStatus = document.getElementById('statusChart').getContext('2d');
    if (statusChartInstance) statusChartInstance.destroy();
    
    statusChartInstance = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
            labels: ['Not Started', 'In Progress', 'Complete'],
            datasets: [{
                data: [statusCounts['Not Started'], statusCounts['In Progress'], statusCounts['Complete']],
                backgroundColor: ['#64748b', '#f59e0b', '#10b981'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'right' } },
            cutout: '70%'
        }
    });

    // Priority Chart (Bar)
    const ctxPriority = document.getElementById('priorityChart').getContext('2d');
    if (priorityChartInstance) priorityChartInstance.destroy();

    priorityChartInstance = new Chart(ctxPriority, {
        type: 'bar',
        data: {
            labels: ['High', 'Medium', 'Low'],
            datasets: [{
                label: 'Projects',
                data: [priorityCounts['High'], priorityCounts['Medium'], priorityCounts['Low']],
                backgroundColor: ['rgba(239, 68, 68, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(59, 130, 246, 0.8)'],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } },
                x: { grid: { display: false } }
            }
        }
    });
}

// Boot setup
window.onload = init;
