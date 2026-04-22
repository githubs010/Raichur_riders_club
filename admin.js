// Admin Panel Logic

const DEFAULT_DATA = {
    events: [
        {
            id: 1,
            name: "Raichur - Goa Weekend Ride",
            location: "Parle-G Toll (5:00 AM Meet-up)",
            datetime: "2026-05-12T05:00",
            startCoords: "16.2008, 77.3621",
            endCoords: "15.2993, 74.1240"
        },
        {
            id: 2,
            name: "Heritage Ride: Hampi",
            location: "Navodaya Medical College (6:00 AM)",
            datetime: "2026-06-15T06:00",
            startCoords: "16.2008, 77.3621",
            endCoords: "15.3350, 76.4600"
        },
        {
            id: 3,
            name: "Hyderabad Night Ride",
            location: "Raichur Railway Station (9:00 PM)",
            datetime: "2026-07-20T21:00",
            startCoords: "16.2008, 77.3621",
            endCoords: "17.3850, 78.4867"
        }
    ],
    general: {
        brand: "Kalyana Karnataka Riders",
        motto: '"Safety is greater than speed, friendship is more precious than the ride."'
    },
    races: [],
    gallery: []
};

// Initialize State
let state = JSON.parse(localStorage.getItem('rr_club_data')) || DEFAULT_DATA;
if (state.event && (!state.events || state.events.length === 0)) {
    state.events = [{ id: Date.now(), name: state.event.name, location: state.event.location, datetime: state.event.datetime }];
}
if (!state.events) state.events = [];
if (!state.gallery) state.gallery = [];

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

    // General
    document.getElementById('gen_brand').value = state.general.brand;
    document.getElementById('gen_motto').value = state.general.motto;
    
    // DB URL
    const elDb = document.getElementById('db_url');
    if (elDb) elDb.value = localStorage.getItem('rr_db_url') || '';
    
    renderLeaderboard();
    if(typeof renderGallery !== 'undefined') renderGallery();
    
    // Initialize Map Picker & Sync Data
    setTimeout(initAdminMap, 300);
    syncCloudData();
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
    const endCoords = document.getElementById('ev_end_coords').value.trim() || '13.3786, 77.2550';
    
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

// 1.5 Interactive Map Picker & Search
let adminMap = null;
let startMarker = null;
let endMarker = null;
let routeLine = null;
let pickMode = 'end'; // 'start' or 'end'

// Initial coordinate state
let currentStart = [16.2008, 77.3621];
let currentEnd = [13.3786, 77.2550];

window.setPickMode = (mode) => {
    pickMode = mode;
    document.getElementById('btn_pick_start').style.background = mode === 'start' ? 'rgba(255,215,0,0.2)' : 'transparent';
    document.getElementById('btn_pick_end').style.background = mode === 'end' ? 'rgba(230,25,43,0.2)' : 'transparent';
};

window.swapLocations = () => {
    const startInput = document.getElementById('search_start');
    const endInput = document.getElementById('search_end');
    const tempText = startInput.value;
    startInput.value = endInput.value;
    endInput.value = tempText;
    
    const tempCoords = [...currentStart];
    currentStart = [...currentEnd];
    currentEnd = [...tempCoords];
    
    updateHiddenInputs();
    updateAdminMapMarkers();
};

window.setSearchLoc = (target, text) => {
    if(target === 'start') {
        document.getElementById('search_start').value = text;
        // Hardcode a few fast fallbacks for demo
        if(text.includes('Raichur')) currentStart = [16.2008, 77.3621];
    } else {
        document.getElementById('search_end').value = text;
        if(text.includes('Tumkur')) currentEnd = [13.3786, 77.2550];
    }
    updateHiddenInputs();
    updateAdminMapMarkers();
};

window.searchAndPlot = async () => {
    const startText = document.getElementById('search_start').value;
    const endText = document.getElementById('search_end').value;
    
    const fetchCoords = async (query) => {
        if(!query) return null;
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const data = await res.json();
            if(data && data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        } catch(e) { console.error("Search failed", e); }
        return null;
    };
    
    // Quick UX visual feedback
    const btn = document.querySelector('button[onclick="searchAndPlot()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Searching...';
    
    if(startText && !startText.includes('Raichur')) {
        const coords = await fetchCoords(startText);
        if(coords) currentStart = coords;
    }
    if(endText && !endText.includes('Tumkur')) {
        const coords = await fetchCoords(endText);
        if(coords) currentEnd = coords;
    }
    
    btn.innerHTML = originalText;
    updateHiddenInputs();
    updateAdminMapMarkers();
};

const updateHiddenInputs = () => {
    document.getElementById('ev_start_coords').value = `${currentStart[0].toFixed(4)}, ${currentStart[1].toFixed(4)}`;
    document.getElementById('ev_end_coords').value = `${currentEnd[0].toFixed(4)}, ${currentEnd[1].toFixed(4)}`;
};

const initAdminMap = () => {
    const mapEl = document.getElementById('admin-map');
    if (!mapEl || typeof L === 'undefined') return;
    
    adminMap = L.map('admin-map', { zoomControl: false }).setView([16.2008, 77.3621], 6);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18
    }).addTo(adminMap);
    
    L.control.zoom({ position: 'bottomright' }).addTo(adminMap);
    
    // Reverse geocoding on click
    adminMap.on('click', async (e) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        if (pickMode === 'start') {
            currentStart = [lat, lng];
            document.getElementById('search_start').value = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            setPickMode('end');
        } else {
            currentEnd = [lat, lng];
            document.getElementById('search_end').value = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
        updateHiddenInputs();
        updateAdminMapMarkers();
        
        // Try to reverse geocode name
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            if(data && data.display_name) {
                const shortName = data.display_name.split(',').slice(0,3).join(',');
                if (pickMode === 'end') document.getElementById('search_start').value = shortName; // because it switched
                else document.getElementById('search_end').value = shortName;
            }
        } catch(err){}
    });
    
    updateAdminMapMarkers();
    setPickMode('end');
};

const updateAdminMapMarkers = () => {
    if (!adminMap) return;
    
    if (startMarker) adminMap.removeLayer(startMarker);
    if (endMarker) adminMap.removeLayer(endMarker);
    if (routeLine) adminMap.removeLayer(routeLine);
    
    const hasStart = !isNaN(currentStart[0]);
    const hasEnd = !isNaN(currentEnd[0]);
    
    if (hasStart) {
        startMarker = L.circleMarker(currentStart, { color: 'var(--color-yellow)', fillColor: 'var(--color-yellow)', fillOpacity: 1, radius: 8 }).addTo(adminMap).bindPopup("Starting Point");
    }
    
    if (hasEnd) {
        endMarker = L.circleMarker(currentEnd, { color: 'var(--color-red)', fillColor: 'var(--color-red)', fillOpacity: 1, radius: 8 }).addTo(adminMap).bindPopup("Destination");
    }
    
    if (hasStart && hasEnd) {
        // Draw route line
        routeLine = L.polyline([currentStart, currentEnd], { color: '#3b82f6', weight: 4, dashArray: '10, 10' }).addTo(adminMap);
        adminMap.fitBounds([currentStart, currentEnd], { padding: [50, 50] });
    } else if (hasStart) {
        adminMap.setView(currentStart, 10);
    } else if (hasEnd) {
        adminMap.setView(currentEnd, 10);
    }
};

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

const saveState = async () => {
    localStorage.setItem('rr_club_data', JSON.stringify(state));
    
    // Cloud sync logic
    const dbUrl = localStorage.getItem('rr_db_url');
    if (dbUrl) {
        try {
            await fetch(dbUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(state)
            });
        } catch(e) {
            console.error("Cloud push failed", e);
        }
    }
}

window.saveDbUrl = () => {
    const url = document.getElementById('db_url').value.trim();
    localStorage.setItem('rr_db_url', url);
    if(url) saveState(); // Pushes data to the new DB instantly
    showSuccess();
}

const syncCloudData = async () => {
    const dbUrl = localStorage.getItem('rr_db_url');
    if (dbUrl) {
        try {
            const res = await fetch(dbUrl);
            const cloudData = await res.json();
            
            // Only update if cloud has valid events data and is different
            if (cloudData && cloudData.events && JSON.stringify(cloudData) !== JSON.stringify(state)) {
                state = cloudData;
                localStorage.setItem('rr_club_data', JSON.stringify(state));
                
                // Rerender UI
                document.getElementById('gen_brand').value = state.general.brand;
                document.getElementById('gen_motto').value = state.general.motto;
                renderEvents();
                renderLeaderboard();
                if(typeof renderGallery !== 'undefined') renderGallery();
            }
        } catch(e) { console.error("Cloud sync failed", e); }
    }
}

// 4. Gallery Logic
window.addGalleryImage = () => {
    let url = document.getElementById('gal_url').value.trim();
    const caption = document.getElementById('gal_caption').value.trim();
    
    if(!url || !caption) return alert("Please provide both an image URL and a caption.");
    
    // Smart Google Drive Link Converter
    if (url.includes('drive.google.com/file/d/')) {
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            const fileId = match[1];
            url = `https://drive.google.com/uc?export=view&id=${fileId}`;
        }
    } else if (url.includes('drive.google.com/open?id=')) {
        const match = url.match(/id=([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            const fileId = match[1];
            url = `https://drive.google.com/uc?export=view&id=${fileId}`;
        }
    }
    
    if(!state.gallery) state.gallery = [];
    state.gallery.push({ id: Date.now(), url: url, caption: caption });
    saveState();
    if(typeof renderGallery !== 'undefined') renderGallery();
    
    document.getElementById('gal_url').value = '';
    document.getElementById('gal_caption').value = '';
}

window.deleteGalleryImage = (id) => {
    state.gallery = state.gallery.filter(g => g.id !== id);
    saveState();
    if(typeof renderGallery !== 'undefined') renderGallery();
}

const renderGallery = () => {
    const list = document.getElementById('admin-gallery-list');
    if(!list) return;
    list.innerHTML = '';
    
    if(!state.gallery) return;
    state.gallery.forEach((g) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div style="flex-grow:1; display:flex; align-items:center; gap: 15px;">
                <img src="${g.url}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2);">
                <div>
                    <strong>${g.caption}</strong><br>
                    <a href="${g.url}" target="_blank" style="font-size:0.75rem; color:#60a5fa; text-decoration:none;">View Source Link</a>
                </div>
            </div>
            <button class="btn-del" onclick="deleteGalleryImage(${g.id})">Del</button>`;
        list.appendChild(li);
    });
}

window.clearAllData = () => {
    if(confirm("Are you sure you want to reset everything back to the defaults?")) {
        localStorage.removeItem('rr_club_data');
        location.reload();
    }
}
