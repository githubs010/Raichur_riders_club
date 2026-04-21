// Default Fallback Data if admin hasn't configured anything
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

// Fetch dynamic state
const getState = () => {
    return JSON.parse(localStorage.getItem('rr_club_data')) || DEFAULT_DATA;
}

// 1. Inflate site with Admin data
const inflateDynamicData = () => {
    const state = getState();

    // General
    const brandEls = document.querySelectorAll('.main-title');
    if (brandEls.length > 0) {
        brandEls[0].innerHTML = `${state.general.brand.split(' ')[0]} <span class="gradient-text">${state.general.brand.split(' ').slice(1).join(' ')}</span>`;
    }
    
    const mottoEl = document.querySelector('.motto');
    if (mottoEl) mottoEl.innerText = state.general.motto;

    // Event
    const evNameEl = document.querySelector('.event-info h3');
    if (evNameEl) evNameEl.innerText = state.event.name;
    
    const evLocEl = document.querySelector('.event-info p');
    if (evLocEl) evLocEl.innerHTML = `<i class="fa-solid fa-map-pin"></i> ${state.event.location}`;

    // Races
    const raceList = document.getElementById('main-leaderboard');
    const noData = document.getElementById('no-race-data');
    if (raceList && noData) {
        if (state.races.length > 0) {
            noData.style.display = 'none';
            let html = '';
            state.races.forEach((r, index) => {
                let badge = index === 0 ? '🏆' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : '🏁'));
                html += `
                    <li style="display:flex; justify-content:space-between; padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <span style="font-size:1.1rem;"><strong>${badge} #${index+1}</strong> <span style="margin-left:10px; color:var(--color-yellow);">${r.name}</span></span>
                        <span style="font-size:1.2rem; font-family:var(--font-display); font-weight:800;">${r.time}</span>
                    </li>
                `;
            });
            raceList.innerHTML = html;
        } else {
            raceList.innerHTML = '';
            noData.style.display = 'block';
        }
    }
}

// 2. Countdown Timer Configured dynamically
const runCountdown = () => {
    const state = getState();
    const eventTimestamp = new Date(state.event.datetime).getTime();
    
    const timer = setInterval(() => {
        const currentTime = new Date().getTime();
        const distance = eventTimestamp - currentTime;

        if (distance < 0) {
            clearInterval(timer);
            document.getElementById("countdown-timer").innerHTML = "<div class='time-box'><span>LIVE</span><label>Now Riding</label></div>";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById("days").innerText = days.toString().padStart(2, '0');
        document.getElementById("hours").innerText = hours.toString().padStart(2, '0');
        document.getElementById("mins").innerText = minutes.toString().padStart(2, '0');
        document.getElementById("secs").innerText = seconds.toString().padStart(2, '0');
    }, 1000);
}

// Generate Dummy Data for Spotlight
const generateSpotlight = () => {
    const spotlightContainer = document.getElementById('spotlight-container');
    if(!spotlightContainer) return;
    const dummyNames = [
        "Vikram S", "Anand K", "Ramesh Babu", "Darshan Gowda", "Vinay R",
        "Kishore B", "Sneha P", "Manoj Tiwari", "Girish N", "Tejas V"
    ];

    let html = '';
    dummyNames.forEach((name, index) => {
        html += `
            <div class="spot-card">
                <div class="spot-rank">#${index + 1}</div>
                <div class="spot-info">
                    <h4>${name}</h4>
                    <span style="font-size: 0.8rem; color: #aaa;">Active Rider</span>
                </div>
            </div>
        `;
    });

    spotlightContainer.innerHTML = html;
}

// Sticky Navbar logic
const handleNavbar = () => {
    const navbar = document.getElementById('navbar');
    if(!navbar) return;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 10, 10, 0.95)';
            navbar.style.boxShadow = '0 5px 20px rgba(0,0,0,0.5)';
        } else {
            navbar.style.background = 'rgba(10, 10, 10, 0.8)';
            navbar.style.boxShadow = 'none';
        }
    });
}

// Initialize scripts
document.addEventListener("DOMContentLoaded", () => {
    inflateDynamicData();
    runCountdown();
    generateSpotlight();
    handleNavbar();
});
