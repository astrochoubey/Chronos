document.addEventListener('DOMContentLoaded', () => {

    // Mock Data Structure
    // Hierarchy: Subject -> Notebook -> Topic -> Subtopic -> Notes
    const notesData = {
        subjects: [
            {
                id: 'sub1',
                name: 'Physics',
                notebooks: [
                    {
                        id: 'nb1',
                        name: 'Wave Mechanics',
                        color: '#3b82f6', // blue
                        topics: [
                            {
                                id: 'top1', name: 'Introductory Concepts',
                                subtopics: [
                                    {
                                        id: 'subtop1', name: 'Week 1',
                                        notes: [
                                            { id: 'note1', title: 'Introductory Concepts', tags: ['Week 1', 'Introduction'], status: 'incomplete', lastEdited: '2 hours ago', content: '<h1>Introductory Concepts</h1><p>...</p>' },
                                            { id: 'note2', title: 'Derivatives Review', tags: ['Week 2', 'Derivatives'], status: 'completed', lastEdited: '1 day ago', content: '<h2>Math Review</h2>...' }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: 'sub2',
                name: 'Psychology',
                notebooks: [
                    {
                        id: 'nb2',
                        name: 'Cognitive Psych',
                        color: '#10b981', // green
                        topics: [
                            {
                                id: 'top2', name: 'Memory',
                                subtopics: [
                                    {
                                        id: 'subtop2', name: 'Short-term',
                                        notes: [
                                            { id: 'note3', title: 'Working Memory Models', tags: ['Week 1'], status: 'incomplete', lastEdited: '3 days ago', content: '...' }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ],
        recent: ['note1', 'note2', 'note3']
    };

    // DOM Elements
    const views = {
        home: document.getElementById('notes-home-view'),
        editor: document.getElementById('notes-editor-view')
    };
    const containers = {
        recentList: document.getElementById('recent-notes-grid'),
        subjectList: document.getElementById('subjects-container'),
        tree: document.getElementById('hierarchy-tree'),
        editorBreadcrumbs: document.getElementById('editor-breadcrumbs'),
        noteTitle: document.getElementById('note-title'),
        noteContent: document.getElementById('editor-content'),
        noteTags: document.getElementById('note-tags'),
        noteStatus: document.getElementById('note-status'),
        currentNotebookTitle: document.getElementById('current-notebook-title')
    };

    // Modals
    const addModal = document.getElementById('add-modal');
    const newSubjectBtn = document.getElementById('new-subject-btn');
    const closeModalBtn = document.getElementById('close-modal');
    const saveNotebookBtn = document.getElementById('save-notebook-btn');
    const colorOptions = document.querySelectorAll('.color-option');
    let selectedColor = '#8b5a2b';

    // State
    let currentNotebook = null;
    let currentSubject = null;
    let activeNote = null;

    // --- Initiation ---
    renderHomeView();

    function renderHomeView() {
        // Render Recent Notes
        containers.recentList.innerHTML = '';
        notesData.recent.forEach(noteId => {
            const note = findNoteById(noteId);
            if (note) {
                // Find subject label
                const meta = findMetaForNote(note.id);

                const card = document.createElement('div');
                card.className = 'recent-note-card';
                card.innerHTML = `
                    <span class="subject-label">${meta.subjectName}</span>
                    <h3>${note.title}</h3>
                    <div class="note-meta">
                        <span><i class="fa-regular fa-clock"></i> ${note.lastEdited}</span>
                        <span>
                            ${note.status === 'completed'
                        ? '<i class="fa-solid fa-check-circle" style="color:var(--success)"></i> Cmpl'
                        : '<i class="fa-regular fa-circle"></i> Inc'}
                        </span>
                    </div>
                `;
                card.onclick = () => openNotebook(meta.notebookId, note.id);
                containers.recentList.appendChild(card);
            }
        });

        // Render Subjects and Notebooks
        containers.subjectList.innerHTML = '';
        notesData.subjects.forEach(subject => {
            const group = document.createElement('div');
            group.className = 'subject-group';

            let html = `<h3>${subject.name} <span>${subject.notebooks.length} Notebooks</span></h3>`;
            html += `<div class="notebooks-grid">`;

            subject.notebooks.forEach(nb => {
                // Collect note titles for preview
                let noteTitles = [];
                nb.topics.forEach(t => {
                    t.subtopics.forEach(st => {
                        st.notes.forEach(n => {
                            if (noteTitles.length < 6) noteTitles.push(n.title);
                        });
                    });
                });

                let previewHtml = '';
                if (noteTitles.length > 0) {
                    previewHtml = `
                        <div class="preview-overlay">
                            <div>
                                <div class="preview-overlay-header">
                                    <span>Quick Preview</span>
                                    <i class="fa-solid fa-eye"></i>
                                </div>
                                <ul class="preview-scroll preview-list">
                                    ${noteTitles.map(title => `
                                        <li class="preview-list-item">
                                            <div class="preview-bullet"></div>
                                            <span class="preview-text">${title}</span>
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                            <button class="preview-btn" onclick="openNotebookHandler('${subject.id}', '${nb.id}')">
                                <span>Open Notebook</span>
                                <i class="fa-solid fa-arrow-right"></i>
                            </button>
                        </div>
                    `;
                } else {
                    previewHtml = `
                        <div class="preview-overlay">
                            <div>
                                <div class="preview-overlay-header">
                                    <span>Quick Preview</span>
                                    <i class="fa-solid fa-eye"></i>
                                </div>
                                <div class="preview-text" style="opacity: 0.5; font-style: italic; padding-top: 10px;">
                                    No notes yet
                                </div>
                            </div>
                            <button class="preview-btn" onclick="openNotebookHandler('${subject.id}', '${nb.id}')">
                                <span>Open Notebook</span>
                                <i class="fa-solid fa-arrow-right"></i>
                            </button>
                        </div>
                    `;
                }

                // Choose a random icon for demo purposes based on notebook name length
                const icons = ['fa-book', 'fa-pen-nib', 'fa-lightbulb', 'fa-code', 'fa-flask'];
                const iconClass = icons[nb.name.length % icons.length];

                html += `
                    <div class="notebook-card">
                        <div class="card-content">
                            <div class="card-icon-wrapper" style="background-color: ${nb.color}20; color: ${nb.color};">
                                <i class="fa-solid ${iconClass}"></i>
                            </div>
                            <div style="margin-top: 16px;">
                                <h3 class="card-title">${nb.name}</h3>
                                <div class="card-meta">
                                    <span class="card-meta-badge">${subject.name}</span>
                                    <span>•</span>
                                    <span>${nb.topics.length} Topics</span>
                                </div>
                            </div>
                        </div>
                        ${previewHtml}
                    </div>
                `;
            });

            // Add new notebook button
            html += `
                <div class="new-notebook-card" onclick="openAddModal('${subject.name}')">
                    <div class="new-notebook-icon">
                        <i class="fa-solid fa-plus" style="font-size: 24px;"></i>
                    </div>
                    <span class="new-notebook-text">Add Notebook</span>
                </div>
            `;

            html += `</div>`;
            group.innerHTML = html;
            containers.subjectList.appendChild(group);
        });
    }

    // Handlers
    window.openNotebookHandler = function (subjectId, notebookId) {
        currentSubject = notesData.subjects.find(s => s.id === subjectId);
        currentNotebook = currentSubject.notebooks.find(n => n.id === notebookId);
        openEditorView();
    };

    function openNotebook(notebookId, noteId) {
        // Find subject and notebook
        for (let s of notesData.subjects) {
            let nb = s.notebooks.find(n => n.id === notebookId);
            if (nb) {
                currentSubject = s;
                currentNotebook = nb;
                break;
            }
        }
        openEditorView(noteId);
    }

    function openEditorView(noteIdToOpen = null) {
        views.home.classList.remove('view-active');
        views.home.classList.add('view-hidden');
        views.editor.classList.remove('view-hidden');
        views.editor.classList.add('view-active');

        containers.currentNotebookTitle.textContent = currentNotebook.name;
        renderHierarchyTree();

        // Open specific note or first note
        if (noteIdToOpen) {
            loadNoteInEditor(findNoteById(noteIdToOpen));
        } else {
            // Pick first note if exists
            let firstNote = null;
            if (currentNotebook.topics.length > 0 && currentNotebook.topics[0].subtopics.length > 0 && currentNotebook.topics[0].subtopics[0].notes.length > 0) {
                firstNote = currentNotebook.topics[0].subtopics[0].notes[0];
            }
            if (firstNote) loadNoteInEditor(firstNote);
            else clearEditor();
        }
    }

    document.getElementById('back-to-home').addEventListener('click', () => {
        views.editor.classList.remove('view-active');
        views.editor.classList.add('view-hidden');
        views.home.classList.remove('view-hidden');
        views.home.classList.add('view-active');
        currentNotebook = null;
        currentSubject = null;
        renderHomeView();
    });

    // Editor Functions
    function renderHierarchyTree() {
        containers.tree.innerHTML = '';
        currentNotebook.topics.forEach(topic => {
            const topicEl = document.createElement('div');
            topicEl.className = 'tree-item';

            let html = `<div class="tree-topic"><i class="fa-solid fa-chevron-right"></i> ${topic.name}</div>`;
            html += `<div class="tree-subtopic" style="display:block;">`;

            topic.subtopics.forEach(sub => {
                html += `<div style="font-size:12px; color:var(--text-muted); padding:4px 10px; text-transform:uppercase; letter-spacing:1px;">${sub.name}</div>`;
                sub.notes.forEach(note => {
                    const statusClass = note.status === 'completed' ? 'completed' : 'incomplete';
                    const activeClass = (activeNote && activeNote.id === note.id) ? 'active' : '';
                    html += `<a class="tree-note-link ${activeClass}" onclick="loadNoteHandler('${note.id}')">
                                <span class="status-dot ${statusClass}"></span> ${note.title}
                             </a>`;
                });
            });
            html += `</div>`;

            topicEl.innerHTML = html;
            // Topic toggling
            topicEl.querySelector('.tree-topic').onclick = (e) => {
                const subEl = e.currentTarget.nextElementSibling;
                const icon = e.currentTarget.querySelector('i');
                if (subEl.style.display === 'none') {
                    subEl.style.display = 'block';
                    icon.style.transform = 'rotate(90deg)';
                } else {
                    subEl.style.display = 'none';
                    icon.style.transform = 'rotate(0deg)';
                }
            };
            // Default expanded state
            topicEl.querySelector('.tree-topic i').style.transform = 'rotate(90deg)';

            containers.tree.appendChild(topicEl);
        });
    }

    window.loadNoteHandler = function (noteId) {
        loadNoteInEditor(findNoteById(noteId));
    };

    function loadNoteInEditor(note) {
        if (!note) return;
        activeNote = note;

        // Find meta
        const meta = findMetaForNote(note.id);
        containers.editorBreadcrumbs.textContent = `${meta.subjectName} / ${meta.notebookName} / ${meta.topicName} / ${meta.subtopicName}`;

        containers.noteTitle.value = note.title;
        containers.noteContent.innerHTML = note.content;

        // Tags
        let tagsHtml = '';
        note.tags.forEach(tag => {
            tagsHtml += `<span class="tag"><i class="fa-solid fa-tag"></i> ${tag}</span>`;
        });
        tagsHtml += `<button class="add-tag-btn" onclick="addTag()"><i class="fa-solid fa-plus"></i></button>`;
        containers.noteTags.innerHTML = tagsHtml;

        updateStatusUI(note.status);

        // re-render tree to hit active class
        renderHierarchyTree();
    }

    function clearEditor() {
        activeNote = null;
        containers.editorBreadcrumbs.textContent = '';
        containers.noteTitle.value = '';
        containers.noteContent.innerHTML = '';
        containers.noteTags.innerHTML = '';
    }

    // Status Toggle
    window.toggleStatus = function () {
        if (!activeNote) return;

        if (activeNote.status === 'incomplete') {
            activeNote.status = 'completed';
        } else {
            activeNote.status = 'incomplete';
        }

        updateStatusUI(activeNote.status);
        renderHierarchyTree(); // Update dot in sidebar
    };

    function updateStatusUI(status) {
        if (status === 'completed') {
            containers.noteStatus.className = 'status-indicator completed';
            containers.noteStatus.innerHTML = '<i class="fa-solid fa-check-square"></i> Completed';
        } else {
            containers.noteStatus.className = 'status-indicator incomplete';
            containers.noteStatus.innerHTML = '<i class="fa-regular fa-square"></i> Incomplete';
        }
    }

    window.addTag = function () {
        if (!activeNote) return;
        const tag = prompt("Enter new tag name:");
        if (tag && tag.trim() !== "") {
            activeNote.tags.push(tag.trim());
            loadNoteInEditor(activeNote); // Refresh UI
        }
    };

    // Helper functions
    function findNoteById(id) {
        for (let s of notesData.subjects) {
            for (let nb of s.notebooks) {
                for (let t of nb.topics) {
                    for (let st of t.subtopics) {
                        for (let n of st.notes) {
                            if (n.id === id) return n;
                        }
                    }
                }
            }
        }
        return null;
    }

    function findMetaForNote(id) {
        for (let s of notesData.subjects) {
            for (let nb of s.notebooks) {
                for (let t of nb.topics) {
                    for (let st of t.subtopics) {
                        for (let n of st.notes) {
                            if (n.id === id) return {
                                subjectName: s.name,
                                subjectId: s.id,
                                notebookName: nb.name,
                                notebookId: nb.id,
                                topicName: t.name,
                                subtopicName: st.name
                            };
                        }
                    }
                }
            }
        }
        return {};
    }

    // --- Modal Logic ---
    window.openAddModal = function (subjectName = '') {
        addModal.classList.add('active');
        document.getElementById('modal-subject').value = subjectName;
        document.getElementById('modal-notebook').value = '';
    };

    newSubjectBtn.addEventListener('click', () => openAddModal());

    closeModalBtn.addEventListener('click', () => {
        addModal.classList.remove('active');
    });

    colorOptions.forEach(opt => {
        opt.addEventListener('click', (e) => {
            colorOptions.forEach(o => o.classList.remove('active'));
            e.currentTarget.classList.add('active');
            selectedColor = e.currentTarget.dataset.color;
        });
    });

    saveNotebookBtn.addEventListener('click', () => {
        const subName = document.getElementById('modal-subject').value.trim();
        const nbName = document.getElementById('modal-notebook').value.trim();

        if (subName && nbName) {
            // Find or create subject
            let subject = notesData.subjects.find(s => s.name.toLowerCase() === subName.toLowerCase());
            if (!subject) {
                subject = { id: 's_' + Date.now(), name: subName, notebooks: [] };
                notesData.subjects.push(subject);
            }

            // Create notebook
            const newNb = {
                id: 'nb_' + Date.now(),
                name: nbName,
                color: selectedColor,
                topics: [
                    { id: 't_default', name: 'General', subtopics: [{ id: 'st_default', name: 'Notes', notes: [] }] }
                ]
            };
            subject.notebooks.push(newNb);

            addModal.classList.remove('active');
            renderHomeView();
        } else {
            alert('Please fill in both Subject and Notebook name.');
        }
    });
});
