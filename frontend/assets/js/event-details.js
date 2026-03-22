const API_URL = 'https://skillswap-api-p79d.onrender.com';
const token = localStorage.getItem('token');

if (!token) window.location.href = 'index.html';

const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');

if (!eventId) window.location.href = 'events.html';

async function fetchEventDetails() {
    console.log("Fetching details for event ID:", eventId);
    try {
        const response = await fetch(`${API_URL}/events/${eventId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log("Fetch response status:", response.status);
        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error data:", errorData);
            throw new Error('Event not found');
        }

        const event = await response.json();
        console.log("Event data received:", event);
        renderEventDetails(event);
    } catch (error) {
        console.error('Error in fetchEventDetails:', error);
        alert('Could not load event details. ' + error.message);
    }
}

function renderEventDetails(event) {
    document.getElementById('eventTitle').textContent = event.title;
    document.getElementById('eventDesc').textContent = event.description || 'No description provided.';
    document.getElementById('eventLoc').textContent = event.location || 'Campus';
    document.getElementById('eventTime').textContent = new Date(event.event_time).toLocaleString();
    document.getElementById('eventType').textContent = (event.type || 'Event').toUpperCase();

    // Render Participants List
    const participantsList = document.getElementById('participantsList');
    if (event.participants && event.participants.length > 0) {
        participantsList.innerHTML = event.participants.map(p => `
            <div class="d-flex align-items-center gap-3 p-3 bg-dark bg-opacity-25 rounded-4 border border-secondary border-opacity-10">
                <img src="https://ui-avatars.com/api/?name=${p.full_name || p.username}&background=random&color=fff" class="rounded-circle" width="40" height="40">
                <div>
                    <p class="mb-0 fw-bold text-white">${p.full_name || p.username}</p>
                    <small class="text-secondary">${p.department || 'Student'}</small>
                </div>
            </div>
        `).join('');
    } else {
        participantsList.innerHTML = '<div class="text-center py-3 text-secondary italic">No one has registered yet. Be the first!</div>';
    }

    // Handle Join Button State
    const joinBtn = document.getElementById('joinBtn');
    // We would need to know current user ID to check if joined. 
    // For now, let the API handle the logic and just show "Registered" if RSVP is successful.
}

async function joinEvent() {
    try {
        const response = await fetch(`${API_URL}/events/${eventId}/join`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert('RSVP successful! You are registered.');
            location.reload();
        } else {
            const err = await response.json();
            alert(`Failed: ${err.detail}`);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

document.getElementById('joinBtn').addEventListener('click', joinEvent);

// Logout logic
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
});

fetchEventDetails();
