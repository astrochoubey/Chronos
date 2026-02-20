// --- YOUTUBE BG VIDEO LOGIC ---
let player;
let isMuted = true;
// Default to a scenic lofi video
let currentVideoId = 'jfKfPfyJRdk'; // Official Lofi Girl VOD

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

function extractVideoID(url) {
    let videoID = '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
        videoID = match[2];
    }
    return videoID;
}

document.getElementById('set-bg-btn').addEventListener('click', () => {
    const url = document.getElementById('yt-link-input').value;
    const vid = extractVideoID(url);
    if (vid) {
        currentVideoId = vid;
        player.loadVideoById({videoId: currentVideoId});
        player.setLoop(true);
        // iframe api loop requires passing playlist as well
        if (player.loadPlaylist) {
            player.loadPlaylist([currentVideoId]); 
        }
        document.getElementById('yt-link-input').value = '';
        document.getElementById('bg-controls-panel').style.display = 'none';
    } else {
        alert("Invalid YouTube URL");
    }
});

document.getElementById('mute-toggle').addEventListener('change', (e) => {
    isMuted = e.target.checked;
    if (player && player.mute) {
        if (isMuted) {
            player.mute();
        } else {
            player.unMute();
        }
    }
});


// --- TIMER LOGIC ---
let userSettings = JSON.parse(localStorage.getItem('pomodoroSettings')) || {
    focusTime: 25,
    breakTime: 5
};

let FOCUS_MINUTES = userSettings.focusTime;
let BREAK_MINUTES = userSettings.breakTime;

let focusTime = FOCUS_MINUTES * 60;
let breakTime = BREAK_MINUTES * 60;
let timeLeft = focusTime;
let timerId = null;
let isRunning = false;
let mode = 'focus'; // 'focus' or 'break'

const timeDisplay = document.getElementById('time-display');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const tabFocus = document.getElementById('tab-focus');
const tabBreak = document.getElementById('tab-break');
const statusDisplay = document.getElementById('timer-status');
const tallyContainer = document.getElementById('pomodoro-tally');

let pomodorosCompleted = 0;

function updateDisplay() {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    timeDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    document.title = `${timeDisplay.textContent} | Focus Timer`;
}

function updateTally() {
    tallyContainer.innerHTML = '';
    for (let i = 0; i < 4; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        if (i >= pomodorosCompleted % 4) {
            dot.classList.add('empty');
        }
        tallyContainer.appendChild(dot);
    }
}

function switchMode(newMode) {
    mode = newMode;
    clearInterval(timerId);
    isRunning = false;
    startBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    
    if (mode === 'focus') {
        tabFocus.classList.add('active');
        tabBreak.classList.remove('active');
        timeLeft = focusTime;
        statusDisplay.textContent = 'STAY FOCUSED';
    } else {
        tabBreak.classList.add('active');
        tabFocus.classList.remove('active');
        timeLeft = breakTime;
        statusDisplay.textContent = 'TAKE A BREAK';
    }
    updateDisplay();
}

tabFocus.addEventListener('click', () => switchMode('focus'));
tabBreak.addEventListener('click', () => switchMode('break'));

startBtn.addEventListener('click', () => {
    if (isRunning) {
        clearInterval(timerId);
        startBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    } else {
        timerId = setInterval(() => {
            timeLeft--;
            updateDisplay();
            
            // STATS TRACKING
            if (mode === 'focus') {
                incrementStats(1); // 1 second
            }

            if (timeLeft <= 0) {
                clearInterval(timerId);
                isRunning = false;
                startBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                
                // Play sound alert maybe
                let audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.play().catch(e => console.log(e));
                
                if (mode === 'focus') {
                    pomodorosCompleted++;
                    updateTally();
                    switchMode('break');
                } else {
                    switchMode('focus');
                }
            }
        }, 1000);
        startBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    }
    isRunning = !isRunning;
});

resetBtn.addEventListener('click', () => {
    switchMode(mode);
});


// --- STATS LOGIC ---
const stats = JSON.parse(localStorage.getItem('pomodoroStats')) || {
    today: 0,
    week: 0,
    month: 0,
    year: 0,
    lastSec: Date.now()
};

function checkAndResetStats() {
    const now = new Date();
    const lastDate = new Date(stats.lastSec);
    
    if (now.getDate() !== lastDate.getDate() || now.getMonth() !== lastDate.getMonth() || now.getFullYear() !== lastDate.getFullYear()) {
        stats.today = 0;
    }
    
    const getWeek = (d) => {
        const date = new Date(d.getTime());
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        const week1 = new Date(date.getFullYear(), 0, 4);
        return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    };
    if (getWeek(now) !== getWeek(lastDate) || now.getFullYear() !== lastDate.getFullYear()) {
        stats.week = 0;
    }
    
    if (now.getMonth() !== lastDate.getMonth() || now.getFullYear() !== lastDate.getFullYear()) {
        stats.month = 0;
    }
    
    if (now.getFullYear() !== lastDate.getFullYear()) {
        stats.year = 0;
    }
    
    stats.lastSec = now.getTime();
}

function incrementStats(seconds) {
    checkAndResetStats();
    stats.today += seconds;
    stats.week += seconds;
    stats.month += seconds;
    stats.year += seconds;
    stats.lastSec = Date.now();
    localStorage.setItem('pomodoroStats', JSON.stringify(stats));
    updateStatsDisplay();
}

function formatTime(secs) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) {
        return `${h}h ${m}m`;
    }
    return `${m}m`;
}

function updateStatsDisplay() {
    checkAndResetStats();
    document.getElementById('stat-today').textContent = formatTime(stats.today);
    document.getElementById('stat-week').textContent = formatTime(stats.week);
    document.getElementById('stat-month').textContent = formatTime(stats.month);
    document.getElementById('stat-year').textContent = formatTime(stats.year);
}


// --- TO DO LOGIC ---
let todos = JSON.parse(localStorage.getItem('pomodoroTodos')) || [];
const todoList = document.getElementById('todo-list');
const todoInput = document.getElementById('todo-input');
const addTodoBtn = document.getElementById('add-todo');

function renderTodos() {
    todoList.innerHTML = '';
    todos.forEach((todo, index) => {
        const li = document.createElement('li');
        if (todo.completed) li.classList.add('completed');
        
        li.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
            <span class="todo-text">${todo.text}</span>
            <button class="delete-todo"><i class="fa-solid fa-xmark"></i></button>
        `;
        
        const checkbox = li.querySelector('.todo-checkbox');
        checkbox.addEventListener('change', () => {
            todos[index].completed = checkbox.checked;
            saveTodos();
            renderTodos();
        });
        
        const textSpan = li.querySelector('.todo-text');
        textSpan.addEventListener('click', () => {
            checkbox.checked = !checkbox.checked;
            todos[index].completed = checkbox.checked;
            saveTodos();
            renderTodos();
        });
        
        const delBtn = li.querySelector('.delete-todo');
        delBtn.addEventListener('click', () => {
            todos.splice(index, 1);
            saveTodos();
            renderTodos();
        });
        
        todoList.appendChild(li);
    });
}

function saveTodos() {
    localStorage.setItem('pomodoroTodos', JSON.stringify(todos));
}

function addTodo() {
    const text = todoInput.value.trim();
    if (text) {
        todos.push({ text, completed: false });
        todoInput.value = '';
        saveTodos();
        renderTodos();
    }
}

addTodoBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});

// --- SETTINGS LOGIC ---
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const focusTimeInput = document.getElementById('focus-time-input');
const breakTimeInput = document.getElementById('break-time-input');

settingsBtn.addEventListener('click', () => {
    focusTimeInput.value = FOCUS_MINUTES;
    breakTimeInput.value = BREAK_MINUTES;
    settingsModal.classList.add('active');
});

closeSettings.addEventListener('click', () => {
    settingsModal.classList.remove('active');
});

saveSettingsBtn.addEventListener('click', () => {
    const newFocus = parseInt(focusTimeInput.value);
    const newBreak = parseInt(breakTimeInput.value);
    
    if (newFocus > 0 && newBreak > 0) {
        FOCUS_MINUTES = newFocus;
        BREAK_MINUTES = newBreak;
        focusTime = FOCUS_MINUTES * 60;
        breakTime = BREAK_MINUTES * 60;
        
        userSettings = { focusTime: FOCUS_MINUTES, breakTime: BREAK_MINUTES };
        localStorage.setItem('pomodoroSettings', JSON.stringify(userSettings));
        
        // Only override if timer is currently stopped
        if (!isRunning) {
            switchMode(mode);
        }
    }
    settingsModal.classList.remove('active');
});

// --- TOGGLE PANELS LOGIC ---
const bgToggleBtn = document.getElementById('bg-toggle-btn');
const bgControlsPanel = document.getElementById('bg-controls-panel');
const spotifyToggleBtn = document.getElementById('spotify-toggle-btn');
const spotifyControlsPanel = document.getElementById('spotify-controls-panel');

bgToggleBtn.addEventListener('click', () => {
    if (bgControlsPanel.style.display === 'none') {
        bgControlsPanel.style.display = 'block';
        spotifyControlsPanel.style.display = 'none';
    } else {
        bgControlsPanel.style.display = 'none';
    }
});

spotifyToggleBtn.addEventListener('click', () => {
    if (spotifyControlsPanel.style.display === 'none') {
        spotifyControlsPanel.style.display = 'block';
        bgControlsPanel.style.display = 'none';
    } else {
        spotifyControlsPanel.style.display = 'none';
    }
});

// --- SPOTIFY EMBED LOGIC ---
const setSpotifyBtn = document.getElementById('set-spotify-btn');
const spotifyLinkInput = document.getElementById('spotify-link-input');
const spotifyPlayerWidget = document.getElementById('spotify-player-widget');
const spotifyIframe = document.getElementById('spotify-iframe');

setSpotifyBtn.addEventListener('click', () => {
    const link = spotifyLinkInput.value.trim();
    if (!link) return;
    
    try {
        const urlObj = new URL(link);
        if (urlObj.hostname.includes('spotify.com')) {
            const pathname = urlObj.pathname;
            
            // Format URL for embed iframe
            // example: https://open.spotify.com/playlist/37i9dQZF1EIfWq2v... -> https://open.spotify.com/embed/playlist/37i9dQZF1EIfWq2v?utm_source=generator
            const embedUrl = `https://open.spotify.com/embed${pathname}?utm_source=generator`;
            
            spotifyIframe.src = embedUrl;
            spotifyPlayerWidget.style.display = 'block';
            spotifyControlsPanel.style.display = 'none';
            spotifyLinkInput.value = '';
        } else {
            alert('Please paste a valid Spotify link.');
        }
    } catch (e) {
        alert('Invalid link format. Please paste a full Spotify URL.');
    }
});

// Initialize
updateDisplay();
updateTally();
updateStatsDisplay();
renderTodos();
