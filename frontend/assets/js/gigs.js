const API_URL = 'http://127.0.0.1:8000';
const token = localStorage.getItem('token');

if (!token) window.location.href = 'index.html';

// Connectivity Check
(async () => {
    try {
        const res = await fetch(`${API_URL}/`);
        if (res.ok) console.log("✅ API is reachable at " + API_URL);
        else console.error("❌ API returned error at " + API_URL);
    } catch (e) {
        console.error("❌ API UNREACHABLE", e);
        // We only alert on actual network failure, not just 4xx/5xx
        alert("CRITICAL: Cannot connect to API at " + API_URL + ". Is the backend running?");
    }
})();

async function fetchGigs() {
    try {
        console.log("Fetching gigs...");
        const response = await fetch(`${API_URL}/gigs/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            console.error("Fetch gigs failed:", response.status);
            return;
        }

        const gigs = await response.json();
        console.log("Gigs received:", gigs);
        renderGigs(gigs);
    } catch (error) {
        console.error('Error fetching gigs:', error);
    }
}

function renderGigs(gigs) {
    const list = document.getElementById('gigList');
    if (!list) return;

    if (!gigs || !Array.isArray(gigs) || gigs.length === 0) {
        list.innerHTML = '<div class="col-12 text-center py-5 text-secondary"><i class="bi bi-inbox fs-1 d-block mb-3"></i>No open gigs available. Why not post one?</div>';
        return;
    }

    list.innerHTML = gigs.map((gig, index) => {
        const isSystem = gig.is_system;
        const posterName = isSystem ? "Campus Admin" : (gig.poster ? (gig.poster.full_name || gig.poster.username) : "Unknown User");
        const posterEmail = isSystem ? "admin@skillswap.edu" : (gig.poster ? gig.poster.email : "No contact info");
        const cardClass = isSystem ? "border-primary border-opacity-50 shadow-lg" : "";
        const badgeClass = isSystem ? "bg-primary" : "bg-secondary";
        const badgeText = isSystem ? "BOUNTY" : (gig.category || 'General');

        return `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="glass-card stat-card theme-card h-100 d-flex flex-column ${cardClass}" style="--card-index: ${index}">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="badge ${badgeClass} small">${badgeText}</span>
                        <span class="credit-badge"><i class="bi bi-coin"></i> ${gig.credit_reward}</span>
                    </div>
                    <h5 class="fw-bold mb-1">${gig.title}</h5>
                    <p class="text-secondary small mb-3">${isSystem ? 'Campus Task' : 'Posted by: <b>' + posterName + '</b>'}</p>
                    <p class="text-secondary small flex-grow-1">${gig.description}</p>
                    <div class="mt-4 pt-3 border-top border-secondary">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                             <span class="text-secondary small"><i class="bi bi-envelope me-1"></i> ${posterEmail}</span>
                        </div>
                        <button class="btn btn-sm btn-primary-gradient w-100" onclick="applyForGig(${gig.id})">${isSystem ? 'Complete Bounty' : 'Apply for Gig'}</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Post Gig logic
const postGigForm = document.getElementById('postGigForm');
if (postGigForm) {
    postGigForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Posting gig...");

        const rewardInput = document.getElementById('gigReward');
        const data = {
            title: document.getElementById('gigTitle').value,
            description: document.getElementById('gigDesc').value,
            credit_reward: parseInt(rewardInput.value) || 0,
            category: document.getElementById('gigCat').value
        };

        try {
            const response = await fetch(`${API_URL}/gigs/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                console.log("Gig posted successfully");
                // Close modal
                const modalEl = document.getElementById('postGigModal');
                const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                modal.hide();
                // Refresh list
                fetchGigs();
                // Reset form
                postGigForm.reset();
            } else {
                const err = await response.json();
                console.error("Post gig error:", err);
                alert(`Failed to post gig: ${typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail)}`);
            }
        } catch (error) {
            console.error('Error posting gig:', error);
        }
    });
}

async function applyForGig(id) {
    try {
        const response = await fetch(`${API_URL}/gigs/${id}/apply`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert('Application submitted! The poster will review your request.');
            location.reload();
        } else {
            const error = await response.json();
            alert(`Failed to apply: ${error.detail}`);
        }
    } catch (error) {
        console.error('Error applying for gig:', error);
    }
}

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
fetchGigs();


// Logout Event Listener
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
});
