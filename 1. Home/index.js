// Dashboard Logic
document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Date Displays
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    
    // Main Header Date
    const dateDisplay = document.getElementById("current-date-display");
    if (dateDisplay) {
        dateDisplay.textContent = today.toLocaleDateString(undefined, options);
    }

    // Mini Calendar Date Update
    const mcMonth = document.getElementById("mc-month");
    const mcDay = document.getElementById("mc-day");
    if (mcMonth && mcDay) {
        mcMonth.textContent = today.toLocaleString('default', { month: 'short' });
        mcDay.textContent = today.getDate();
    }

    // 2. Hydration Widget
    const goal = 8;
    const storageKey = 'chronos_water_tracker';
    const todayStr = today.toDateString();
    
    let waterData = JSON.parse(localStorage.getItem(storageKey)) || { date: '', count: 0 };
    if (waterData.date !== todayStr) {
        waterData = { date: todayStr, count: 0 };
        saveWaterData();
    }

    let count = waterData.count;
    const countDisplay = document.getElementById("water-count");
    const circle = document.getElementById("water-progress");
    const addBtn = document.getElementById("add-water-btn");
    const resetBtn = document.getElementById("reset-water-btn");
    
    if (circle) {
        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = circumference;
        
        function setProgress(percent) {
            const maxPercent = Math.min(percent, 100);
            const offset = circumference - (maxPercent / 100) * circumference;
            circle.style.strokeDashoffset = offset;
        }
        
        function updateWaterUI() {
            countDisplay.textContent = count;
            let progress = (count / goal) * 100;
            setProgress(progress);
            if(count >= goal) {
                circle.style.stroke = "var(--success)";
            } else {
                circle.style.stroke = "#3b82f6";
            }
        }
        
        function saveWaterData() { localStorage.setItem(storageKey, JSON.stringify(waterData)); }

        addBtn.addEventListener("click", () => {
            count++; waterData.count = count; saveWaterData(); updateWaterUI();
            addBtn.style.transform = 'scale(0.95)';
            setTimeout(() => addBtn.style.transform = 'none', 150);
        });

        resetBtn.addEventListener("click", () => { count = 0; waterData.count = count; saveWaterData(); updateWaterUI(); });
        
        updateWaterUI();
    }

    // 3. Fast Capture Mock Save
    const captureInput = document.getElementById('capture-input');
    const captureBtn = document.getElementById('save-capture-btn');
    const captureStatus = document.getElementById('capture-status');
    const originalStatusHTML = captureStatus ? captureStatus.innerHTML : '';

    if (captureBtn && captureInput && captureStatus) {
        captureBtn.addEventListener('click', () => {
            const text = captureInput.value.trim();
            if (text) {
                // Simulate saving...
                captureBtn.textContent = 'Saving...';
                captureBtn.style.opacity = '0.7';
                
                setTimeout(() => {
                    captureInput.value = '';
                    captureBtn.textContent = 'Save Note';
                    captureBtn.style.opacity = '1';
                    
                    // Show success feedback
                    captureStatus.innerHTML = '<i class="fa-solid fa-check" style="color:var(--success)"></i> Saved to General';
                    setTimeout(() => {
                        captureStatus.innerHTML = originalStatusHTML;
                    }, 3000);
                }, 800);
            }
        });
    }

    // 4. Daily Quote Rotator
    const quotes = [
        { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
        { text: "Don't let what you cannot do interfere with what you can do.", author: "John Wooden" },
        { text: "The secret to getting ahead is getting started.", author: "Mark Twain" },
        { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
        { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
        { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" },
        { text: "We are what we repeatedly do. Excellence therefore is not an act, but a habit.", author: "Will Durant" }
    ];

    const quoteText = document.getElementById('quote-text');
    const quoteAuthor = document.getElementById('quote-author');
    
    if (quoteText && quoteAuthor) {
        // Use the day of the year to pick a quote consistently for 24 hours
        const start = new Date(today.getFullYear(), 0, 0);
        const diff = today - start;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        
        const quoteIndex = dayOfYear % quotes.length;
        const selectedQuote = quotes[quoteIndex];
        
        quoteText.textContent = `"${selectedQuote.text}"`;
        quoteAuthor.textContent = `- ${selectedQuote.author}`;
    }

    // 5. To-Do & Calendar Sync Logic
    let eventsData = JSON.parse(localStorage.getItem('chronosCalendarData')) || [];
    const todoContainer = document.getElementById('todo-list-container');
    const addTodoBtn = document.getElementById('add-todo-btn');
    const modal = document.getElementById('event-modal');
    const closeBtn = document.getElementById('close-event-modal');

    function renderTodoList() {
        if (!todoContainer) return;
        todoContainer.innerHTML = '';
        
        let todos = eventsData.filter(e => e.syncedToTodo !== false);
        
        todos.sort((a,b) => {
            if(a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
            return new Date(a.start) - new Date(b.start);
        });

        if(todos.length === 0) {
            todoContainer.innerHTML = '<div class="empty-todo">No tasks on the list. Click + to add one!</div>';
            return;
        }

        todos.forEach(todo => {
            let item = document.createElement('div');
            item.className = 'todo-item';
            
            let tagColor = todo.color || '#3b82f6';
            let d = new Date(todo.start);
            let dateStr = d.toLocaleDateString([], {month:'short', day:'numeric'}) + ' at ' + d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});

            item.innerHTML = `
                <div class="todo-tag" style="background:${tagColor}"></div>
                <div class="todo-check" data-id="${todo.id}" style="border-color: ${tagColor}; background: ${todo.isCompleted ? tagColor : 'transparent'};">
                    <i class="fa-solid fa-check" style="color:var(--bg-color); opacity:${todo.isCompleted ? '1' : '0'}"></i>
                </div>
                <div class="todo-content">
                    <div class="todo-title" style="${todo.isCompleted ? 'text-decoration: line-through; opacity: 0.5;' : ''}">${todo.title}</div>
                    <div class="todo-date">${dateStr}</div>
                </div>
            `;
            
            item.querySelector('.todo-content').addEventListener('click', () => { editTodo(todo.id); });
            item.querySelector('.todo-check').addEventListener('click', (e) => { e.stopPropagation(); toggleTodoCompletion(todo.id); });
            todoContainer.appendChild(item);
        });
    }

    function toggleTodoCompletion(id) {
        const idx = eventsData.findIndex(e => e.id === id);
        if (idx > -1) {
            eventsData[idx].isCompleted = !eventsData[idx].isCompleted;
            saveData(); 
        }
    }

    function saveData() {
        localStorage.setItem('chronosCalendarData', JSON.stringify(eventsData));
        renderTodoList();
    }

    function formatDatetimeLocal(isoStr) {
        if (!isoStr) return '';
        const d = new Date(isoStr);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    }

    function openEventModal(eventObj = null) {
        if(!modal) return;
        modal.classList.add('active');
        
        if (eventObj) {
            document.getElementById('modal-title').textContent = "Edit Item";
            document.getElementById('edit-event-id').value = eventObj.id;
            document.getElementById('event-title').value = eventObj.title;
            document.getElementById('event-date').value = formatDatetimeLocal(eventObj.start);
            document.getElementById('event-color').value = eventObj.color || '#3b82f6';
            document.getElementById('sync-todo').checked = (eventObj.syncedToTodo !== false);
            document.getElementById('delete-event-btn').style.display = 'flex';
        } else {
            document.getElementById('modal-title').textContent = "Add Event / Task";
            document.getElementById('edit-event-id').value = '';
            document.getElementById('event-title').value = '';
            document.getElementById('event-date').value = formatDatetimeLocal(new Date().toISOString());
            document.getElementById('event-color').value = '#3b82f6';
            document.getElementById('sync-todo').checked = true;
            document.getElementById('delete-event-btn').style.display = 'none';
        }
    }

    function editTodo(id) {
        const ev = eventsData.find(e => e.id === id);
        if(ev) openEventModal(ev);
    }

    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    if (addTodoBtn) addTodoBtn.addEventListener('click', () => openEventModal());

    const saveEventBtn = document.getElementById('save-event-btn');
    if (saveEventBtn) {
        saveEventBtn.addEventListener('click', () => {
            const id = document.getElementById('edit-event-id').value;
            const title = document.getElementById('event-title').value || '(No Title)';
            const startStr = document.getElementById('event-date').value;
            const color = document.getElementById('event-color').value;
            const syncTodo = document.getElementById('sync-todo').checked;
            
            let startVal = startStr || new Date().toISOString();
            
            if (id) {
                const idx = eventsData.findIndex(e => e.id === id);
                if (idx > -1) {
                    eventsData[idx].title = title;
                    eventsData[idx].start = startVal;
                    eventsData[idx].color = color;
                    eventsData[idx].syncedToTodo = syncTodo;
                }
            } else {
                eventsData.push({
                    id: Date.now().toString(),
                    title: title,
                    start: startVal,
                    color: color,
                    syncedToTodo: syncTodo,
                    isCompleted: false
                });
            }
            saveData();
            modal.classList.remove('active');
        });
    }

    const deleteEventBtn = document.getElementById('delete-event-btn');
    if (deleteEventBtn) {
        deleteEventBtn.addEventListener('click', () => {
            const id = document.getElementById('edit-event-id').value;
            if (confirm("Are you sure you want to delete this?")) {
                eventsData = eventsData.filter(e => e.id !== id);
                saveData();
                modal.classList.remove('active');
            }
        });
    }

    renderTodoList();

    // 6. Recent Notes Display (Mocked Sync from Notes App)
    const recentNotesContainer = document.getElementById('home-recent-notes');
    if (recentNotesContainer) {
        // Mock data to match notes app structure
        const recentNotes = [
            { id: 'note1', title: 'Introductory Concepts', subject: 'Physics', status: 'incomplete', lastEdited: '2 hours ago' },
            { id: 'note2', title: 'Derivatives Review', subject: 'Physics', status: 'completed', lastEdited: '1 day ago' },
            { id: 'note3', title: 'Working Memory Models', subject: 'Psychology', status: 'incomplete', lastEdited: '3 days ago' }
        ];

        recentNotesContainer.innerHTML = '';
        recentNotes.forEach(note => {
            const card = document.createElement('div');
            card.className = 'recent-note-card';
            card.innerHTML = `
                <span class="subject-label">${note.subject}</span>
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
            // Simulate navigation to the note
            card.onclick = () => window.location.href = `../6. Notes/notes.html?noteId=${note.id}`;
            recentNotesContainer.appendChild(card);
        });
    }

});
