// Default Fallback Data if admin hasn't configured anything
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
    const eventsListEl = document.getElementById('hero-events-list');
    if (eventsListEl && state.events && state.events.length > 0) {
        const now = new Date().getTime();
        const upcomingEvents = state.events.filter(e => new Date(e.datetime).getTime() > now - 86400000).sort((a,b) => new Date(a.datetime) - new Date(b.datetime));
        
        if (upcomingEvents.length === 0) {
            eventsListEl.innerHTML = '<p style="color:var(--color-text-secondary); padding: 1rem; border: 1px dashed rgba(255,255,255,0.2); border-radius: 8px;">No upcoming events planned currently.</p>';
        } else {
            let html = '';
            upcomingEvents.forEach((ev, idx) => {
                const isNext = idx === 0;
                const glowClass = isNext ? 'dynamic-glow' : '';
                const borderStyle = isNext ? 'border: 1px solid var(--color-red);' : 'border: 1px solid rgba(255, 215, 0, 0.2); opacity: 0.85;';
                html += `
                <div class="event-card ${glowClass}" style="${borderStyle} min-width: 320px; flex: 0 0 auto; scroll-snap-align: center; flex-direction: column; justify-content: center; text-align: center; padding: 1.5rem; gap: 1.5rem;">
                    <div class="event-info" style="width: 100%; text-align: center;">
                        <span class="tag">${isNext ? 'NEXT RIDE' : 'UPCOMING'}</span>
                        <h3 style="font-size: 1.2rem; margin-top: 5px;">${ev.name}</h3>
                        <p style="font-size: 0.9rem;"><i class="fa-solid fa-map-pin"></i> ${ev.location}</p>
                        <p style="margin-top: 8px; font-size: 0.85rem; color: var(--color-yellow);"><i class="fa-regular fa-calendar"></i> ${new Date(ev.datetime).toLocaleString()}</p>
                    </div>
                    <div class="timer-container" id="countdown-timer-${ev.id || idx}" style="justify-content: center; width: 100%; gap: 0.8rem;">
                        <!-- Timer populated by JS -->
                        <div class="time-box" style="padding: 0.8rem; min-width: 60px;"><span id="days-${ev.id || idx}" style="font-size: 1.5rem;">00</span><label>DAYS</label></div>
                        <div class="time-box" style="padding: 0.8rem; min-width: 60px;"><span id="hours-${ev.id || idx}" style="font-size: 1.5rem;">00</span><label>HRS</label></div>
                        <div class="time-box" style="padding: 0.8rem; min-width: 60px;"><span id="mins-${ev.id || idx}" style="font-size: 1.5rem;">00</span><label>MIN</label></div>
                        <div class="time-box" style="padding: 0.8rem; min-width: 60px;"><span id="secs-${ev.id || idx}" style="font-size: 1.5rem;">00</span><label>SEC</label></div>
                    </div>
                    <button onclick="window.viewEventRoute('${ev.startCoords || '16.2008, 77.3621'}', '${ev.endCoords || '13.3786, 77.2550'}', '${ev.name.replace(/'/g, "\\'")}')" class="btn btn-primary outlined" style="padding: 0.5rem 1rem; font-size: 0.8rem; width: 100%; margin-top: 5px;"><i class="fa-solid fa-location-arrow"></i> View Route on Map</button>
                </div>
                `;
            });
            eventsListEl.innerHTML = html;
            
            // Re-run timer logic since elements were recreated
            runCountdown();
        }
    }

    // Races
    const raceList = document.getElementById('main-leaderboard');
    const noData = document.getElementById('no-race-data');
    if (raceList && noData) {
        if (state.races.length > 0) {
            noData.style.display = 'none';
            let html = '';
            state.races.forEach((r, index) => {
                let badge = index === 0 ? '🏆' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : '🏁'));
                let cStr = r.color ? `color:${r.color}; text-shadow: 0 0 5px ${r.color}55;` : `color:var(--color-yellow);`;
                html += `
                    <li style="display:flex; justify-content:space-between; padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <span style="font-size:1.1rem;"><strong>${badge} #${index+1}</strong> <span style="margin-left:10px; font-weight: bold; ${cStr}">${r.name}</span></span>
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

    // Gallery
    const galleryContainer = document.getElementById('gallery-container');
    if (galleryContainer && state.gallery && state.gallery.length > 0) {
        let html = '';
        state.gallery.forEach((g) => {
            html += `
            <div class="gallery-item glass-card" data-caption="${g.caption}">
                <img src="${g.url}" alt="${g.caption}" loading="lazy" style="object-fit: cover;">
                <div class="gallery-overlay">
                    <span>${g.caption}</span>
                </div>
            </div>
            `;
        });
        galleryContainer.innerHTML = html;
    }
}

// 2. Countdown Timer Configured dynamically
let activeTimers = [];
const runCountdown = () => {
    // Clear old timers
    activeTimers.forEach(t => clearInterval(t));
    activeTimers = [];

    const state = getState();
    if (!state.events || state.events.length === 0) return;
    
    const now = new Date().getTime();
    const upcomingEvents = state.events.filter(e => new Date(e.datetime).getTime() > now - 86400000);
    
    upcomingEvents.forEach((ev, idx) => {
        const eventTimestamp = new Date(ev.datetime).getTime();
        const evId = ev.id || idx;
        
        const timer = setInterval(() => {
            const currentTime = new Date().getTime();
            const distance = eventTimestamp - currentTime;

            if (distance < 0) {
                clearInterval(timer);
                const container = document.getElementById(`countdown-timer-${evId}`);
                if (container) container.innerHTML = "<div class='time-box'><span>LIVE</span><label>Now Riding</label></div>";
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            const elDays = document.getElementById(`days-${evId}`);
            if(elDays) {
                elDays.innerText = days.toString().padStart(2, '0');
                document.getElementById(`hours-${evId}`).innerText = hours.toString().padStart(2, '0');
                document.getElementById(`mins-${evId}`).innerText = minutes.toString().padStart(2, '0');
                document.getElementById(`secs-${evId}`).innerText = seconds.toString().padStart(2, '0');
            }
        }, 1000);
        
        activeTimers.push(timer);
    });
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

const syncCloudData = async () => {
    const dbUrl = localStorage.getItem('rr_db_url');
    if (dbUrl) {
        try {
            const res = await fetch(dbUrl);
            const cloudData = await res.json();
            
            // If valid data from cloud differs from current state, update and re-render
            const currentState = JSON.stringify(getState());
            if (cloudData && cloudData.events && JSON.stringify(cloudData) !== currentState) {
                localStorage.setItem('rr_club_data', JSON.stringify(cloudData));
                inflateDynamicData();
                runCountdown();
                initMap();
            }
        } catch (e) {
            console.log("Background cloud sync failed or not configured.");
        }
    }
}

// Initialize scripts
document.addEventListener("DOMContentLoaded", () => {
    inflateDynamicData();
    runCountdown();
    generateSpotlight();
    handleNavbar();
    initMap();
    
    // Attempt cloud sync in the background
    syncCloudData();
});

// Interactive Map Logic
const initMap = (specificEvent = null) => {
    const mapEl = document.getElementById('event-map');
    if (!mapEl) return;
    
    // Safety check for Leaflet presence
    if (typeof L === 'undefined') return;

    if (window.globalMap) {
        window.globalMap.remove();
        window.globalMap = null;
    }

    const state = getState();
    let activeEvent = specificEvent;
    
    if (!activeEvent) {
        if (state.events && state.events.length > 0) {
            const now = new Date().getTime();
            activeEvent = state.events.find(e => new Date(e.datetime).getTime() > now) || state.events[state.events.length - 1];
        } else if (state.event) {
            activeEvent = state.event;
        }
    }

    // Default coords (Raichur roughly)
    let startLat = 16.2008, startLng = 77.3621;
    let endLat = 13.3786, endLng = 77.2550;

    if (activeEvent) {
        if (activeEvent.startCoords) {
           const sc = activeEvent.startCoords.split(',');
           if(sc.length === 2) { startLat = parseFloat(sc[0]); startLng = parseFloat(sc[1]); }
        }
        if (activeEvent.endCoords) {
           const ec = activeEvent.endCoords.split(',');
           if(ec.length === 2) { endLat = parseFloat(ec[0]); endLng = parseFloat(ec[1]); }
        }
    }

    window.globalMap = L.map('event-map', { zoomControl: false }).setView([startLat, startLng], 10);
    const map = window.globalMap;
    
    // Premium Dark Theme using CartoDB Dark Matter tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 20
    }).addTo(map);

    // Calculate Best Road Route
    if (typeof L.Routing !== 'undefined') {
        const routeControl = L.Routing.control({
            waypoints: [
                L.latLng(startLat, startLng),
                L.latLng(endLat, endLng)
            ],
            lineOptions: {
                styles: [{color: 'var(--color-red, #E6192B)', opacity: 0.8, weight: 5, dashArray: '10, 10'}]
            },
            router: L.Routing.osrmv1({
                serviceUrl: 'https://router.project-osrm.org/route/v1'
            }),
            createMarker: function(i, wp, nWps) {
                const color = i === 0 ? 'var(--color-yellow, #FFD700)' : 'var(--color-red, #E6192B)';
                const label = i === 0 ? "Start Line" : "Finish Line";
                return L.circleMarker(wp.latLng, {
                    color: color, fillColor: color, fillOpacity: 1, radius: 8
                }).bindPopup(`<b>${label}</b>`);
            },
            show: false, // Don't show turn-by-turn panel
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            showAlternatives: false
        }).addTo(map);
        
        // Hide the white instruction UI that the plugin adds by default
        setTimeout(() => {
            const rc = document.querySelector('.leaflet-routing-container');
            if(rc) rc.style.display = 'none';
        }, 500);
    } else {
        // Fallback to straight line if routing machine fails
        L.polyline([[startLat, startLng], [endLat, endLng]], { color: '#E6192B', weight: 4 }).addTo(map);
        map.fitBounds([[startLat, startLng], [endLat, endLng]], { padding: [50, 50] });
    }

    // Add custom zoom controls to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);
}

// Function to handle "View Route" button clicks on event cards
window.viewEventRoute = (startCoords, endCoords, name) => {
    const mapSection = document.getElementById('track');
    if(mapSection) {
        mapSection.scrollIntoView({behavior: 'smooth'});
        const titleEl = mapSection.querySelector('h2');
        if(titleEl) {
            titleEl.innerHTML = `Route: <span class="text-red">${name}</span>`;
        }
    }
    initMap({ startCoords: startCoords, endCoords: endCoords, name: name });
}

// Live update listener: listen for data changes from the Admin Panel and reflect them instantly!
window.addEventListener('storage', (e) => {
    if (e.key === 'rr_club_data') {
        inflateDynamicData();
        // The event and leaderboard will instantly refresh without reloading the page.
    }
});
