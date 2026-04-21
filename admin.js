// Admin Panel Logic

const DEFAULT_DATA = {
    event: {
        name: "Shri Bettada Gavi Ranganatha Swamy Devasthana",
        location: "Parle-G Toll (6:00 AM Meet-up)",
        datetime: "2026-04-12T06:00"
    },
    general: {
        brand: "Kalyana Karnataka Riders",
        motto: '"Safety is greater than speed, friendship is more precious than the ride."'
    },
    races: []
};

// Initialize State
let state = JSON.parse(localStorage.getItem('rr_club_data')) || DEFAULT_DATA;

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

    // Event
    document.getElementById('ev_name').value = state.event.name;
    document.getElementById('ev_location').value = state.event.location;
    document.getElementById('ev_datetime').value = state.event.datetime;
    
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
    
    if (user === 'admin' && pass === 'admin') {
        sessionStorage.setItem('rr_admin_auth', 'true');
        document.getElementById('loginOverlay').style.display = 'none';
        document.body.style.overflow = 'auto';
        errorEl.style.display = 'none';
    } else {
        errorEl.style.display = 'block';
    }
}

// 1. Save Event
window.saveEvent = () => {
    state.event.name = document.getElementById('ev_name').value;
    state.event.location = document.getElementById('ev_location').value;
    state.event.datetime = document.getElementById('ev_datetime').value;
    saveState();
    showSuccess();
}

// 2. Save General
window.saveGeneral = () => {
    state.general.brand = document.getElementById('gen_brand').value;
    state.general.motto = document.getElementById('gen_motto').value;
    saveState();
    showSuccess();
}

// 3. Race Panel
window.addRaceLap = () => {
    const name = document.getElementById('race_name').value.trim();
    const time = document.getElementById('race_time').value.trim();
    
    if(!name || !time) return alert("Please fill both name and time.");
    
    state.races.push({ id: Date.now(), name, time });
    
    // Sort logic (Assuming 'MM:SS' format, simple string sort works if digits are 0-padded)
    state.races.sort((a,b) => a.time.localeCompare(b.time));
    
    document.getElementById('race_name').value = '';
    document.getElementById('race_time').value = '';
    
    saveState();
    renderLeaderboard();
    showSuccess();
}

window.deleteRace = (id) => {
    state.races = state.races.filter(r => r.id !== id);
    saveState();
    renderLeaderboard();
}

const renderLeaderboard = () => {
    const list = document.getElementById('admin-leaderboard');
    list.innerHTML = '';
    state.races.forEach((race, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span><strong>#${index+1}</strong> ${race.name} | ⏱️ ${race.time}</span>
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
