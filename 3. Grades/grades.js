// State Management
let appData = JSON.parse(localStorage.getItem('chronosGradesData')) || {
    config: {
        semestersPerYear: 2,
        currentSemester: 1
    },
    subjects: [] // Array of subject objects
};

let activeTabSemester = appData.config.currentSemester;
let gradesChartInstance = null;

// DOM Elements
const configModal = document.getElementById('config-modal');
const configBtn = document.getElementById('config-btn');
const closeConfig = document.getElementById('close-config');
const saveConfigBtn = document.getElementById('save-config-btn');

const subjectModal = document.getElementById('subject-modal');
const addSubjectBtn = document.getElementById('add-subject-btn');
const closeSubject = document.getElementById('close-subject');
const saveSubjectBtn = document.getElementById('save-subject-btn');

const semesterTabsContainer = document.getElementById('semester-tabs');
const subjectsContainer = document.getElementById('subjects-container');
const semesterInfoText = document.getElementById('semester-info-text');

// Initialize Dashboard
function init() {
    // If no subjects yet, maybe prompt config? We can just show the current config.
    updateHeaderInfo();
    renderTabs();
    renderSubjects();
    renderChart();
}

function saveData() {
    localStorage.setItem('chronosGradesData', JSON.stringify(appData));
    updateHeaderInfo();
    renderTabs();
    renderSubjects();
    renderChart();
}

function updateHeaderInfo() {
    semesterInfoText.textContent = `Showing details for Semester ${activeTabSemester} of ${appData.config.semestersPerYear}.`;
}

// --- CONFIG MODAL LOGIC ---
configBtn.addEventListener('click', () => {
    document.getElementById('semesters-count-input').value = appData.config.semestersPerYear;
    document.getElementById('current-semester-input').value = appData.config.currentSemester;
    configModal.classList.add('active');
});

closeConfig.addEventListener('click', () => configModal.classList.remove('active'));

saveConfigBtn.addEventListener('click', () => {
    const totalSems = parseInt(document.getElementById('semesters-count-input').value) || 2;
    const currSem = parseInt(document.getElementById('current-semester-input').value) || 1;
    
    appData.config.semestersPerYear = totalSems;
    appData.config.currentSemester = currSem;
    activeTabSemester = currSem;
    
    saveData();
    configModal.classList.remove('active');
});

// --- SEMESTER TABS LOGIC ---
function renderTabs() {
    semesterTabsContainer.innerHTML = '';
    for (let i = 1; i <= appData.config.semestersPerYear; i++) {
        const btn = document.createElement('button');
        btn.className = `semester-tab ${i === activeTabSemester ? 'active' : ''}`;
        btn.textContent = `Sem ${i}`;
        btn.onclick = () => {
            activeTabSemester = i;
            renderTabs();
            renderSubjects();
            updateHeaderInfo();
        };
        semesterTabsContainer.appendChild(btn);
    }
}

// --- SUBJECTS LOGIC ---
addSubjectBtn.addEventListener('click', () => {
    // Clear inputs
    document.getElementById('edit-subj-id').value = '';
    document.getElementById('subj-name').value = '';
    document.getElementById('subj-teacher').value = '';
    document.getElementById('subj-contact').value = '';
    document.getElementById('subj-goal').value = '';
    document.getElementById('subj-current').value = '';
    document.getElementById('subj-weightages').value = '';
    document.getElementById('subject-modal-title').textContent = "Add New Subject";
    
    subjectModal.classList.add('active');
});

closeSubject.addEventListener('click', () => subjectModal.classList.remove('active'));

saveSubjectBtn.addEventListener('click', () => {
    const id = document.getElementById('edit-subj-id').value;
    const subObj = {
        name: document.getElementById('subj-name').value || 'Unnamed Subject',
        teacher: document.getElementById('subj-teacher').value || '-',
        contact: document.getElementById('subj-contact').value || '-',
        goal: parseFloat(document.getElementById('subj-goal').value) || 0,
        current: parseFloat(document.getElementById('subj-current').value) || 0,
        weightages: document.getElementById('subj-weightages').value || '',
        semester: activeTabSemester
    };

    if (id) {
        // Edit
        const index = appData.subjects.findIndex(s => s.id == id);
        if (index > -1) {
            subObj.id = parseInt(id);
            appData.subjects[index] = subObj;
        }
    } else {
        // Add
        subObj.id = Date.now();
        appData.subjects.push(subObj);
    }

    saveData();
    subjectModal.classList.remove('active');
});

function deleteSubject(id) {
    if (confirm("Are you sure you want to remove this subject?")) {
        appData.subjects = appData.subjects.filter(s => s.id !== id);
        saveData();
    }
}

function editSubject(id) {
    const subj = appData.subjects.find(s => s.id === id);
    if (!subj) return;
    
    document.getElementById('edit-subj-id').value = subj.id;
    document.getElementById('subj-name').value = subj.name;
    document.getElementById('subj-teacher').value = subj.teacher;
    document.getElementById('subj-contact').value = subj.contact;
    document.getElementById('subj-goal').value = subj.goal;
    document.getElementById('subj-current').value = subj.current;
    document.getElementById('subj-weightages').value = subj.weightages;
    document.getElementById('subject-modal-title').textContent = "Edit Subject";
    
    subjectModal.classList.add('active');
}

function renderSubjects() {
    subjectsContainer.innerHTML = '';
    const filteredSubjects = appData.subjects.filter(s => s.semester === activeTabSemester);
    
    if (filteredSubjects.length === 0) {
        subjectsContainer.innerHTML = `<p style="color:var(--text-muted); grid-column:1/-1; padding: 20px 0;">No subjects added for this semester yet.</p>`;
        return;
    }

    filteredSubjects.forEach(s => {
        const diff = s.current - s.goal;
        let diffClass = "diff-neutral";
        let diffText = "On Goal";
        
        if (diff > 0) {
            diffClass = "diff-positive";
            diffText = `+${diff}% Above`;
        } else if (diff < 0) {
            diffClass = "diff-negative";
            diffText = `${diff}% Below`;
        }

        const card = document.createElement('div');
        card.className = 'subject-card';
        card.innerHTML = `
            <div class="card-actions">
                <button class="card-btn" onclick="editSubject(${s.id})" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button class="card-btn delete" onclick="deleteSubject(${s.id})" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </div>
            <h4>${s.name}</h4>
            <div class="teacher-info">
                <span><i class="fa-solid fa-user-tie"></i> ${s.teacher}</span>
                <span><i class="fa-solid fa-envelope"></i> ${s.contact}</span>
            </div>
            ${s.weightages ? `<div class="weightages">${s.weightages}</div>` : ''}
            
            <div class="grade-stats">
                <div class="grade-block">
                    <span class="grade-label">Current</span>
                    <span class="grade-val">${s.current}%</span>
                </div>
                <div class="grade-block">
                    <span class="grade-label">Goal</span>
                    <span class="grade-val" style="color:var(--text-muted);">${s.goal}%</span>
                </div>
            </div>
            <div class="grade-diff ${diffClass}" style="margin-top:10px;">
                ${diffText}
            </div>
        `;
        subjectsContainer.appendChild(card);
    });
}

// --- CHART.JS VISUALIZATION LOGIC ---
function renderChart() {
    const ctx = document.getElementById('gradesChart').getContext('2d');
    
    // Get subjects for ALL semesters or stringently active tab? 
    // Usually a big picture graph is better, but since they switch tabs, let's filter to active semester context.
    const filteredSubjects = appData.subjects.filter(s => s.semester === activeTabSemester);
    
    const labels = filteredSubjects.map(s => s.name);
    const dataCurrent = filteredSubjects.map(s => s.current);
    const dataGoal = filteredSubjects.map(s => s.goal);

    if (gradesChartInstance) {
        gradesChartInstance.destroy();
    }
    
    // Set default chart font family
    Chart.defaults.font.family = "'Outfit', sans-serif";
    Chart.defaults.color = "#cbd5e1";

    gradesChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Current Grade',
                    data: dataCurrent,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)', // Primary blue
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: 'Goal Grade',
                    data: dataGoal,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Glass white
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                    }
                }
            }
        }
    });
}

// Boot up
window.onload = init;

// --- YOUTUBE BG VIDEO LOGIC ---
let player;
let isMuted = true;
// Default to a scenic lofi video
let currentVideoId = 'jfKfPfyJRdk'; // Lofi Girl VOD

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        videoId: currentVideoId,
        playerVars: {
            'autoplay': 1,
            'controls': 0,
            'showinfo': 0,
            'modestbranding': 1,
            'loop': 1,
            'playlist': currentVideoId,
            'fs': 0,
            'cc_load_policy': 0,
            'iv_load_policy': 3,
            'autohide': 0,
            'disablekb': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    if (isMuted) {
        player.mute();
    } else {
        player.unMute();
    }
    player.playVideo();
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        player.playVideo(); 
    }
}


