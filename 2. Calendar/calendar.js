let eventsData = JSON.parse(localStorage.getItem('chronosCalendarData')) || [];
let calendar;

document.addEventListener('DOMContentLoaded', () => {
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,multiMonthYear'
        },
        height: '100%',
        events: eventsData.map(formatEventForCalendar),
        editable: true,
        selectable: true,
        select: function(info) {
            // Fired when dragging across multiple days or clicking an empty day
            const startStr = info.startStr;
            openEventModal(null, startStr);
            calendar.unselect();
        },
        eventClick: function(info) {
            // Fired when clicking an existing event on the calendar
            const id = info.event.id;
            const fullEvent = eventsData.find(e => e.id == id);
            if (fullEvent) {
                openEventModal(fullEvent);
            }
        },
        eventDrop: function(info) {
            updateEventDate(info.event);
        },
        eventResize: function(info) {
            updateEventDate(info.event);
        }
    });
    calendar.render();
    
    renderTodoList();
});

// Format event object for FullCalendar
function formatEventForCalendar(e) {
    return {
        id: e.id,
        title: e.title,
        start: e.start,
        // Override color to gray out completed tasks on the calendar
        backgroundColor: e.isCompleted ? '#64748b' : e.color,
        borderColor: e.isCompleted ? '#64748b' : e.color
    };
}

// Update event date on drag/resize
function updateEventDate(eventObj) {
    const idx = eventsData.findIndex(e => e.id == eventObj.id);
    if(idx > -1) {
        // Handle timezone correction for start/end
        eventsData[idx].start = eventObj.startStr;
        if(eventObj.endStr) {
            eventsData[idx].end = eventObj.endStr;
        }
        saveData();
    }
}

function saveData() {
    localStorage.setItem('chronosCalendarData', JSON.stringify(eventsData));
    if (calendar) {
        calendar.removeAllEvents();
        calendar.addEventSource(eventsData.map(formatEventForCalendar));
    }
    renderTodoList();
}

// Ensure datetime-local can parse ISO string properly
function formatDatetimeLocal(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
}

// --- Modal Logic ---
const modal = document.getElementById('event-modal');
const closeBtn = document.getElementById('close-event-modal');

function openEventModal(eventObj = null, defaultDateStr = null) {
    modal.classList.add('active');
    
    if (eventObj) {
        // Edit mode
        document.getElementById('modal-title').textContent = "Edit Item";
        document.getElementById('edit-event-id').value = eventObj.id;
        document.getElementById('event-title').value = eventObj.title;
        
        document.getElementById('event-date').value = formatDatetimeLocal(eventObj.start);
        
        document.getElementById('event-color').value = eventObj.color || '#3b82f6';
        document.getElementById('sync-todo').checked = (eventObj.syncedToTodo !== false);
        
        document.getElementById('delete-event-btn').style.display = 'flex';
    } else {
        // Create mode
        document.getElementById('modal-title').textContent = "Add Event / Task";
        document.getElementById('edit-event-id').value = '';
        document.getElementById('event-title').value = '';
        
        if (defaultDateStr) {
            // Append time if it's just a date 'YYYY-MM-DD'
            if(defaultDateStr.length === 10) { 
                defaultDateStr += 'T09:00:00'; 
            }
            document.getElementById('event-date').value = formatDatetimeLocal(defaultDateStr);
        } else {
            document.getElementById('event-date').value = formatDatetimeLocal(new Date().toISOString());
        }
        
        document.getElementById('event-color').value = '#3b82f6';
        document.getElementById('sync-todo').checked = true;
        document.getElementById('delete-event-btn').style.display = 'none';
    }
}

closeBtn.addEventListener('click', () => modal.classList.remove('active'));

document.getElementById('save-event-btn').addEventListener('click', () => {
    const id = document.getElementById('edit-event-id').value;
    const title = document.getElementById('event-title').value || '(No Title)';
    const startStr = document.getElementById('event-date').value;
    const color = document.getElementById('event-color').value;
    const syncTodo = document.getElementById('sync-todo').checked;
    
    let startVal = startStr || new Date().toISOString();
    
    if (id) {
        // Edit
        const idx = eventsData.findIndex(e => e.id === id);
        if (idx > -1) {
            eventsData[idx].title = title;
            eventsData[idx].start = startVal;
            eventsData[idx].color = color;
            eventsData[idx].syncedToTodo = syncTodo;
        }
    } else {
        // Add
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

document.getElementById('delete-event-btn').addEventListener('click', () => {
    const id = document.getElementById('edit-event-id').value;
    if (confirm("Are you sure you want to delete this?")) {
        eventsData = eventsData.filter(e => e.id !== id);
        saveData();
        modal.classList.remove('active');
    }
});


// --- To-Do Sync Logic ---

// Manual add button in To-Do Sidebar
document.getElementById('add-todo-btn').addEventListener('click', () => {
    openEventModal();
});

function renderTodoList() {
    const container = document.getElementById('todo-list-container');
    container.innerHTML = '';
    
    // Filter out items not synced to the To-Do list
    let todos = eventsData.filter(e => e.syncedToTodo !== false);
    
    // Sort: uncompleted first, then chronologically
    todos.sort((a,b) => {
        if(a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        return new Date(a.start) - new Date(b.start);
    });

    if(todos.length === 0) {
        container.innerHTML = `<div class="empty-todo">No tasks on the list. Click on the calendar or the + button to add one!</div>`;
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
        
        // Open edit modal if they click the card body
        item.querySelector('.todo-content').addEventListener('click', () => {
            editTodo(todo.id);
        });

        // Toggle completion checkmark
        item.querySelector('.todo-check').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleTodoCompletion(todo.id);
        });
        
        container.appendChild(item);
    });
}

function editTodo(id) {
    const ev = eventsData.find(e => e.id === id);
    if(ev) openEventModal(ev);
}

function toggleTodoCompletion(id) {
    const idx = eventsData.findIndex(e => e.id === id);
    if (idx > -1) {
        eventsData[idx].isCompleted = !eventsData[idx].isCompleted;
        saveData(); // this visually updates the calendar grey-out and the to-do list checkbox instantly
    }
}
