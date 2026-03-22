const API_URL = 'http://127.0.0.1:8000';
const token = localStorage.getItem('token');

if (!token) window.location.href = 'index.html';

async function fetchEvents() {
    try {
        const response = await fetch(`${API_URL}/events/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const events = await response.json();
        renderEvents(events);
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderEvents(events) {
    const list = document.getElementById('eventList');
    if (events.length === 0) {
        list.innerHTML = '<div class="col-12 text-center py-5 text-secondary">No upcoming events. Be the first to host!</div>';
        return;
    }

    list.innerHTML = events.map(event => `
        <div class="col-md-6 mb-4">
            <a href="event-details.html?id=${event.id}" class="text-decoration-none">
                <div class="glass-card stat-card h-100 p-0 overflow-hidden cursor-pointer hover-scale animate-fade-in">
                    <div class="p-4">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="badge bg-primary-gradient px-3 py-2 rounded-pill">Campus Event</span>
                            <small class="text-secondary"><i class="bi bi-clock me-1"></i> ${new Date(event.event_time).toLocaleDateString()}</small>
                        </div>
                        <h4 class="fw-bold text-white mb-2">${event.title}</h4>
                        <p class="text-secondary small mb-4 line-clamp-2">${event.description}</p>
                        <div class="d-flex align-items-center gap-2 mb-4">
                            <i class="bi bi-geo-alt-fill text-primary"></i>
                            <span class="small text-secondary">${event.location}</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-auto pt-3 border-top border-secondary border-opacity-10">
                            <span class="text-primary small fw-bold">View Details <i class="bi bi-arrow-right ms-1"></i></span>
                            <span class="badge bg-dark border border-secondary text-secondary extra-small rounded-pill px-3">RSVP Open</span>
                        </div>
                    </div>
                </div>
            </a>
        </div>
    `).join('');
}

// Create Event
document.getElementById('createEventForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        title: document.getElementById('eventTitleInput')?.value || '',
        description: document.getElementById('eventDescInput')?.value || '',
        location: document.getElementById('eventLocInput')?.value || '',
        event_time: document.getElementById('eventTimeInput')?.value || '',
        type: 'fest'
    };

    try {
        const response = await fetch(`${API_URL}/events/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            location.reload();
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

async function joinEvent(id) {
    try {
        const response = await fetch(`${API_URL}/events/${id}/join`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert('RSVP successful! See you there.');
            location.reload();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Logout Event Listener
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
});

async function fetchProfile() {
    try {
        const res = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const profile = await res.json();
            const sidebarAvatar = document.getElementById('sidebarAvatar');
            if (sidebarAvatar) sidebarAvatar.src = `https://ui-avatars.com/api/?name=${profile.full_name || profile.username}&background=random&color=fff`;
            const sidebarUser = document.getElementById('sidebarUserName');
            if (sidebarUser) sidebarUser.textContent = profile.full_name || profile.username;
            const sidebarCredits = document.getElementById('sidebarCredits');
            if (sidebarCredits) sidebarCredits.textContent = `${profile.credits || 0} Credits`;
        }
    } catch (e) { console.error('Fetch profile failed', e); }
}

fetchProfile();
fetchEvents();
