// Admin Panel Logic

const DEFAULT_DATA = {
    events: [
        {
            id: 1,
            name: "Shri Bettada Gavi Ranganatha Swamy Devasthana",
            location: "Parle-G Toll (6:00 AM Meet-up)",
            datetime: "2026-05-12T06:00",
            startCoords: "16.2008, 77.3621",
            endCoords: "15.8398, 77.4042"
        }
    ],
    general: {
        brand: "Kalyana Karnataka Riders",
        motto: '"Safety is greater than speed, friendship is more precious than the ride."'
    },
    races: []
};

// Initialize State
let state = JSON.parse(localStorage.getItem('rr_club_data')) || DEFAULT_DATA;
if (state.event && (!state.events || state.events.length === 0)) {
    state.events = [{ id: Date.now(), name: state.event.name, location: state.event.location, datetime: state.event.datetime }];
}
if (!state.events) state.events = [];

// Load inputs on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check Auth
    if (sessionStorage.getItem('rr_admin_auth') !== 'true') {
        const overlay = document.getElementById('loginOverlay');
        if (overlay) overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    } else {
        const overlay = document.getElementById('loginOverlay');
        if (overlay) overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Events
    renderEvents();
    
    // General
    document.getElementById('gen_brand').value = state.general.brand;
    document.getElementById('gen_motto').value = state.general.motto;
    
    renderLeaderboard();
});

const showSuccess = () => {
    const el = document.getElementById('status-message');
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 3000);
}

// Login Logic
window.checkLogin = () => {
    const user = document.getElementById('login_user').value.trim();
    const pass = document.getElementById('login_pass').value.trim();
    const errorEl = document.getElementById('login_error');
    
    if (user === 'admin' && pass === '123') {
        sessionStorage.setItem('rr_admin_auth', 'true');
        document.getElementById('loginOverlay').style.display = 'none';
        document.body.style.overflow = 'auto';
        errorEl.style.display = 'none';
    } else {
        errorEl.style.display = 'block';
    }
}

// 1. Event Panel
window.addEvent = () => {
    const name = document.getElementById('ev_name').value.trim();
    const location = document.getElementById('ev_location').value.trim();
    const datetime = document.getElementById('ev_datetime').value;
    const startCoords = document.getElementById('ev_start_coords').value.trim() || '16.2008, 77.3621';
    const endCoords = document.getElementById('ev_end_coords').value.trim() || '15.8398, 77.4042';
    
    if(!name || !location || !datetime) return alert("Please fill all event details.");
    
    state.events.push({ id: Date.now(), name, location, datetime, startCoords, endCoords });
    state.events.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    
    document.getElementById('ev_name').value = '';
    document.getElementById('ev_location').value = '';
    document.getElementById('ev_datetime').value = '';
    
    saveState();
    renderEvents();
    showSuccess();
}

window.deleteEvent = (id) => {
    state.events = state.events.filter(e => e.id !== id);
    saveState();
    renderEvents();
}

const renderEvents = () => {
    const list = document.getElementById('admin-events-list');
    list.innerHTML = '';
    const now = new Date().getTime();
    
    state.events.forEach((ev) => {
        const evTime = new Date(ev.datetime).getTime();
        const distance = evTime - now;
        let timeLeft = "Past Event";
        
        if (distance > 0) {
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            timeLeft = `${days}d ${hours}h left`;
        }
        
        const li = document.createElement('li');
        li.innerHTML = `<div style="flex-grow:1;">
                            <strong>${ev.name}</strong><br>
                            <span style="font-size:0.8rem; color:var(--color-text-secondary);">${ev.location} | ${new Date(ev.datetime).toLocaleString()}</span><br>
                            <span style="font-size:0.8rem; color:rgba(255,255,255,0.4);">Route: ${ev.startCoords||'N/A'} ➡️ ${ev.endCoords||'N/A'}</span><br>
                            <span style="font-size:0.85rem; color:var(--color-yellow);">${timeLeft}</span>
                        </div>
                        <button class="btn-del" onclick="deleteEvent(${ev.id})">Del</button>`;
        list.appendChild(li);
    });
}

// 2. Save General
window.saveGeneral = () => {
    state.general.brand = document.getElementById('gen_brand').value;
    state.general.motto = document.getElementById('gen_motto').value;
    saveState();
    showSuccess();
}

// 3. Live Race Tracker Logic
let liveRacers = [];

window.addLiveRacer = () => {
    const name = document.getElementById('live_race_name').value.trim();
    const color = document.getElementById('live_race_color').value;
    
    if(!name) return alert("Please enter a racer name.");
    
    liveRacers.push({
        id: Date.now(),
        name,
        color,
        startTime: null,
        elapsedTime: 0,
        running: false
    });
    
    document.getElementById('live_race_name').value = '';
    renderLiveRacers();
};

window.startTimer = (id) => {
    const r = liveRacers.find(x => x.id === id);
    if(r && !r.running) {
        r.startTime = Date.now() - r.elapsedTime;
        r.running = true;
        renderLiveRacers();
    }
};

window.startAllRacers = () => {
    if (liveRacers.length === 0) return alert("Add players to the Live Track first!");
    const now = Date.now();
    let updated = false;
    liveRacers.forEach(r => {
        if (!r.running) {
            r.startTime = now - r.elapsedTime;
            r.running = true;
            updated = true;
        }
    });
    if (updated) renderLiveRacers();
};

window.stopTimer = (id) => {
    const r = liveRacers.find(x => x.id === id);
    if(r && r.running) {
        r.elapsedTime = Date.now() - r.startTime;
        r.running = false;
        renderLiveRacers(); // immediate update
    }
};

window.saveLapTime = (id) => {
    const r = liveRacers.find(x => x.id === id);
    if(r && !r.running) {
        const timeStr = formatTime(r.elapsedTime);
        state.races.push({ id: Date.now(), name: r.name, color: r.color, time: timeStr });
        state.races.sort((a,b) => a.time.localeCompare(b.time));
        
        // Remove from live
        liveRacers = liveRacers.filter(x => x.id !== id);
        saveState();
        renderLiveRacers();
        renderLeaderboard();
        showSuccess();
    } else {
        alert("Please stop the timer before saving the lap.");
    }
};

window.deleteLiveRacer = (id) => {
    liveRacers = liveRacers.filter(x => x.id !== id);
    renderLiveRacers();
};

const formatTime = (ms) => {
    const totalDeciseconds = Math.floor(ms / 10);
    const m = Math.floor(totalDeciseconds / 6000);
    const s = Math.floor((totalDeciseconds % 6000) / 100);
    const cs = totalDeciseconds % 100;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
};

const renderLiveRacers = () => {
    const list = document.getElementById('live-racers-list');
    list.innerHTML = '';
    liveRacers.forEach(r => {
        const li = document.createElement('li');
        li.style.borderLeft = `5px solid ${r.color}`;
        
        let tStr = r.running ? formatTime(Date.now() - r.startTime) : formatTime(r.elapsedTime);
        
        li.innerHTML = `
            <div style="flex-grow:1; display:flex; gap:10px; align-items:center;">
                <strong style="color:${r.color}">${r.name}</strong> 
                <span style="font-family:var(--font-display); font-size:1.5rem; font-weight:800; width:110px;text-align:right;" id="timer-${r.id}">${tStr}</span>
            </div>
            <div style="display:flex; gap:5px;">
                ${r.running 
                    ? `<button class="btn-del" style="background:#f97316;" onclick="stopTimer(${r.id})">Stop</button>`
                    : `<button class="btn-del" style="background:#22c55e;" onclick="startTimer(${r.id})">Start</button>`
                }
                <button class="btn-del" style="background:var(--color-yellow); color:black;" onclick="saveLapTime(${r.id})">Save Lap</button>
                <button class="btn-del" onclick="deleteLiveRacer(${r.id})">X</button>
            </div>
        `;
        list.appendChild(li);
    });
};

// Update active timers UI fast
setInterval(() => {
    liveRacers.forEach(r => {
        if (r.running) {
            const el = document.getElementById(`timer-${r.id}`);
            if(el) {
                el.innerText = formatTime(Date.now() - r.startTime);
            }
        }
    });
}, 50);

window.deleteRace = (id) => {
    state.races = state.races.filter(r => r.id !== id);
    saveState();
    renderLeaderboard();
}

const renderLeaderboard = () => {
    const list = document.getElementById('admin-leaderboard');
    list.innerHTML = '';
    state.races.forEach((race, index) => {
        const c = race.color || 'var(--color-yellow)';
        const li = document.createElement('li');
        li.innerHTML = `<span><strong>#${index+1}</strong> <span style="color:${c}; margin-right:10px;">${race.name}</span> | ⏱️ ${race.time}</span>
                        <button class="btn-del" onclick="deleteRace(${race.id})">Del</button>`;
        list.appendChild(li);
    });
}

const saveState = () => {
    localStorage.setItem('rr_club_data', JSON.stringify(state));
}

window.clearAllData = () => {
    if(confirm("Are you sure you want to reset everything back to the defaults?")) {
        localStorage.removeItem('rr_club_data');
        location.reload();
    }
}
