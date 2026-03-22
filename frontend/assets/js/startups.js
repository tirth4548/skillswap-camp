const API_URL = 'https://skillswap-api-p79d.onrender.com';
const token = localStorage.getItem('token');

if (!token) window.location.href = 'index.html';

let allSkills = [];

// === Initialization ===
document.addEventListener('DOMContentLoaded', () => {
    fetchProfile();
    fetchStartups();
    fetchSynergyMatches();
    loadSkills();

    const startupForm = document.getElementById('startupForm');
    if (startupForm) {
        startupForm.addEventListener('submit', handleStartupSubmit);
    }
    fetchPendingRequests();
    fetchMyInvitations();
});

let activeStartupId = null;

// === API Functions ===

async function fetchStartups() {
    try {
        const res = await fetch(`${API_URL}/startups/`);
        if (res.ok) {
            const startups = await res.json();
            renderPitchFeed(startups);
            document.getElementById('totalStartups').textContent = startups.length;

            // Calculate open roles (dummy logic for now: count startups with < 3 members)
            const openRoles = startups.filter(s => s.members.length < 3).length * 2;
            document.getElementById('openRoles').textContent = openRoles;
        }
    } catch (e) {
        console.error('Fetch startups failed', e);
    }
}

async function fetchSynergyMatches() {
    const list = document.getElementById('synergyMatches');
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(`${API_URL}/startups/synergy/match`, {
            headers: { 'Authorization': `Bearer ${token}` },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const matches = await res.json();
            renderSynergyMatches(matches);
        } else {
            throw new Error(`Server returned ${res.status}`);
        }
    } catch (e) {
        console.error('Fetch synergy matches failed', e);
        if (list) {
            list.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-exclamation-triangle text-warning fs-3 mb-2"></i>
                    <p class="text-secondary extra-small">Could not calculate synergy.</p>
                    <button class="btn btn-sm btn-outline-primary extra-small rounded-pill mt-2" onclick="fetchSynergyMatches()">Retry</button>
                </div>
            `;
        }
    }
}

async function loadSkills() {
    try {
        const res = await fetch(`${API_URL}/skills/`);
        if (res.ok) {
            allSkills = await res.json();
            const container = document.getElementById('skillsSelectContainer');
            if (container) {
                container.innerHTML = allSkills.map(skill => `
                    <div class="form-check form-check-inline">
                        <input class="form-check-input startup-skill-check" type="checkbox" value="${skill.id}" id="skill_${skill.id}">
                        <label class="form-check-label extra-small text-white" for="skill_${skill.id}">${skill.name}</label>
                    </div>
                `).join('');
            }
        }
    } catch (e) { console.error('Load skills failed', e); }
}

async function fetchProfile() {
    try {
        const res = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const profile = await res.json();
            // Update Sidebar Profile Hub
            const sidebarAvatar = document.getElementById('sidebarAvatar');
            if (sidebarAvatar) sidebarAvatar.src = `https://ui-avatars.com/api/?name=${profile.full_name || profile.username}&background=random&color=fff`;
            const sidebarUser = document.getElementById('sidebarUserName');
            if (sidebarUser) sidebarUser.textContent = profile.full_name || profile.username;
            const sidebarCredits = document.getElementById('sidebarCredits');
            if (sidebarCredits) sidebarCredits.textContent = `${profile.credits || 0} Credits`;
        }
    } catch (e) { console.error('Fetch profile failed', e); }
}

async function handleStartupSubmit(e) {
    e.preventDefault();
    const selectedSkillIds = Array.from(document.querySelectorAll('.startup-skill-check:checked')).map(cb => parseInt(cb.value));

    const data = {
        title: document.getElementById('title').value,
        problem_statement: document.getElementById('problem').value,
        vision: document.getElementById('vision').value,
        max_members: parseInt(document.getElementById('maxMembers').value) || 5,
        required_skill_ids: selectedSkillIds
    };

    try {
        const res = await fetch(`${API_URL}/startups/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            alert('Your pitch is LIVE! 🚀');
            location.reload();
        } else {
            const err = await res.json();
            alert(`Error launching pitch: ${err.detail}`);
        }
    } catch (e) { console.error('Submit startup failed', e); }
}

async function joinSquad(startupId) {
    try {
        const res = await fetch(`${API_URL}/startups/${startupId}/join`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            alert('Squad request sent! Welcome aboard. 🤝');
            location.reload();
        } else {
            const err = await res.json();
            alert(`Failed to join: ${err.detail}`);
        }
    } catch (e) { console.error('Join squad failed', e); }
}

async function showSimilarMinds(startupId) {
    const list = document.getElementById('similarMindsList');
    if (!list) return;

    list.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border spinner-border-sm text-primary"></div>
        </div>
    `;

    activeStartupId = startupId;

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('squadModal'));
    modal.show();

    try {
        const res = await fetch(`${API_URL}/startups/${startupId}/similar-minds`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const minds = await res.json();
            if (minds.length === 0) {
                list.innerHTML = `
                    <div class="text-center py-4 text-secondary">
                        <i class="bi bi-person-slash fs-2 opacity-25"></i>
                        <p class="small mt-2">No matching minds found yet.</p>
                    </div>
                `;
                return;
            }

            list.innerHTML = minds.map(m => `
                <div class="glass-card p-3 d-flex align-items-center gap-3 animate-fade-in border-secondary border-opacity-10">
                    <img src="https://ui-avatars.com/api/?name=${m.full_name || m.username}&background=random&color=fff" 
                         class="rounded-circle" width="45" height="45">
                    <div class="flex-grow-1">
                        <h6 class="mb-0 fw-bold text-white small">${m.full_name || m.username}</h6>
                        <p class="text-secondary extra-small mb-0">${m.department} • Match Found!</p>
                    </div>
                    <div class="d-flex flex-column gap-1">
                        <button class="btn btn-sm btn-primary-gradient rounded-pill px-3 py-1 extra-small" onclick="inviteUserToSquad(${m.id})">Invite</button>
                        <button class="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 extra-small" onclick="window.location.href='social.html?user=${m.username}'">View</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {
        console.error('Fetch similar minds failed', e);
        list.innerHTML = '<p class="text-danger small">Error loading potential squadron.</p>';
    }
}

// === Rendering Functions ===

function renderPitchFeed(startups) {
    const feed = document.getElementById('pitchFeed');
    if (!feed) return;

    if (startups.length === 0) {
        feed.innerHTML = `
            <div class="col-12 text-center py-5 glass-card border-dashed">
                <i class="bi bi-rocket fs-1 text-secondary opacity-50"></i>
                <p class="mt-2 text-secondary">No pitches yet. Be the first to disrupt campus!</p>
            </div>
        `;
        return;
    }
    feed.innerHTML = startups.map(s => {
        const isFull = (s.members.length + 1) >= s.max_members;

        // Enrichment for demo profiles
        const username = s.creator.username.toLowerCase();
        let demoBio = s.vision;
        let demoXP = Math.floor(Math.random() * 500) + 200;

        if (username.includes('founder') || username.includes('alex')) {
            demoBio = "Visionary entrepreneur | 3x Hackathon winner | Building the future of campus DeFi.";
            demoXP = 2450;
        } else if (username.includes('design') || username.includes('sarah')) {
            demoBio = "Product Architect & UI/UX Specialist | Passionate about glassmorphism.";
            demoXP = 1800;
        }

        return `
        <div class="col-md-6 mb-4">
            <div class="glass-card stat-card pitch-card p-4 h-100 d-flex flex-column animate-fade-in shadow-lg">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <span class="badge ${isFull ? 'bg-danger' : 'bg-primary'} bg-opacity-10 ${isFull ? 'text-danger' : 'text-primary'} extra-small rounded-pill py-1 px-3">
                        ${isFull ? 'SQUAD FULL' : 'TRADING'}
                    </span>
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-warning text-dark extra-small rounded-pill px-2" style="font-size: 0.5rem;">XP: ${demoXP}</span>
                        <img src="https://ui-avatars.com/api/?name=${s.creator.full_name || s.creator.username}&background=random&color=fff" 
                             class="rounded-circle border border-dark border-opacity-50" width="30" height="30" title="Founder: ${s.creator.full_name}">
                    </div>
                </div>
                <h5 class="fw-bold mb-2">${s.title}</h5>
                <p class="text-info extra-small mb-3 italic" style="font-size: 0.65rem;">"${demoBio}"</p>
                <p class="text-white text-opacity-75 small mb-4 line-clamp-3">${s.problem_statement}</p>
                
                <div class="mt-auto">
                    <div class="mb-3">
                        <small class="text-secondary extra-small fw-bold">NEEDED SQUAD:</small>
                        <div class="d-flex flex-wrap gap-2 mt-2">
                            ${s.required_skills.map(sk => `<span class="badge bg-dark border border-secondary border-opacity-25 extra-small">${sk.name}</span>`).join('')}
                            ${s.required_skills.length === 0 ? '<span class="text-secondary extra-small">Open to all</span>' : ''}
                        </div>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center pt-3 border-top border-secondary border-opacity-10">
                        <div class="d-flex flex-column">
                            <span class="extra-small text-secondary"><i class="bi bi-people-fill me-1"></i> ${s.members.length + 1} / ${s.max_members} Members</span>
                            ${isFull ? '<span class="text-danger extra-small fw-bold">RECRUITMENT CLOSED</span>' : ''}
                        </div>
                        ${!isFull ? `<button class="btn btn-sm btn-outline-primary rounded-pill px-3" onclick="joinSquad(${s.id})">Join Squad</button>` : ''}
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

async function fetchPendingRequests() {
    try {
        const res = await fetch(`${API_URL}/startups/my/requests`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const requests = await res.json();
            renderPendingRequests(requests);
        }
    } catch (e) { console.error('Fetch requests failed', e); }
}

function renderPendingRequests(requests) {
    const list = document.getElementById('pendingRequestsList');
    const panel = document.getElementById('ownerRequestsPanel');
    if (!list || !panel) return;

    if (requests.length > 0) {
        panel.classList.remove('d-none');
        document.getElementById('requestCount').textContent = requests.length;
        list.innerHTML = requests.map(r => `
            <div class="glass-card p-3 border-secondary border-opacity-10 animate-fade-in shadow-sm">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="d-flex align-items-center gap-2">
                        <img src="https://ui-avatars.com/api/?name=${r.user.username}&background=random&color=fff" class="rounded-circle" width="30" height="30">
                        <div>
                            <h6 class="mb-0 extra-small fw-bold text-white">${r.user.username}</h6>
                            <p class="mb-0 text-secondary" style="font-size: 0.6rem;">Wants to join <strong>${r.startup.title}</strong></p>
                        </div>
                    </div>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-primary-gradient btn-sm extra-small flex-grow-1 py-1" onclick="processRequest(${r.id}, 'approve')">Approve</button>
                    <button class="btn btn-outline-danger btn-sm extra-small py-1" onclick="processRequest(${r.id}, 'reject')">Decline</button>
                </div>
            </div>
        `).join('');
    } else {
        panel.classList.add('d-none');
    }
}

async function processRequest(requestId, action) {
    try {
        const res = await fetch(`${API_URL}/startups/requests/${requestId}/${action}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            alert(`Squad member ${action === 'approve' ? 'enlisted' : 'declined'}.`);
            location.reload();
        } else {
            const err = await res.json();
            alert(`Error: ${err.detail}`);
        }
    } catch (e) { console.error('Process request failed', e); }
}

async function inviteUserToSquad(userId) {
    if (!activeStartupId) return;
    try {
        const res = await fetch(`${API_URL}/startups/${activeStartupId}/invite/${userId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            alert('Invitation beacon sent! 📡');
            bootstrap.Modal.getInstance(document.getElementById('squadModal')).hide();
        } else {
            const err = await res.json();
            alert(`Recall failed: ${err.detail}`);
        }
    } catch (e) { console.error('Invite failed', e); }
}

async function fetchMyInvitations() {
    try {
        const res = await fetch(`${API_URL}/startups/my/invitations`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const invites = await res.json();
            renderMyInvitations(invites);
        }
    } catch (e) { console.error('Fetch invites failed', e); }
}

function renderMyInvitations(invites) {
    const list = document.getElementById('receivedInvitationsList');
    const panel = document.getElementById('invitationsPanel');
    if (!list || !panel) return;

    if (invites.length > 0) {
        panel.classList.remove('d-none');
        document.getElementById('inviteCount').textContent = invites.length;
        list.innerHTML = invites.map(i => `
            <div class="glass-card p-3 border-warning border-opacity-10 animate-fade-in shadow-sm">
                <div class="mb-2">
                    <p class="mb-0 text-white extra-small fw-bold">${i.startup.title}</p>
                    <p class="mb-0 text-secondary" style="font-size: 0.6rem;">Has invited you to join their squad!</p>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-warning btn-sm extra-small flex-grow-1 py-1 text-dark fw-bold" onclick="processInvitation(${i.id}, 'accept')">Accept</button>
                    <button class="btn btn-outline-secondary btn-sm extra-small py-1" onclick="processInvitation(${i.id}, 'reject')">Decline</button>
                </div>
            </div>
        `).join('');
    } else {
        panel.classList.add('d-none');
    }
}

async function processInvitation(requestId, action) {
    try {
        const res = await fetch(`${API_URL}/startups/invitations/${requestId}/${action}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            alert(`Invitation ${action === 'accept' ? 'accepted! Welcome aboard.' : 'declined.'}`);
            location.reload();
        } else {
            const err = await res.json();
            alert(`Error: ${err.detail}`);
        }
    } catch (e) { console.error('Process invitation failed', e); }
}

function renderSynergyMatches(matches) {
    const list = document.getElementById('synergyMatches');
    if (!list) return;

    if (matches.length === 0) {
        list.innerHTML = '<p class="text-secondary extra-small italic text-center py-4">No direct matches found. Try adding more skills to your profile!</p>';
        return;
    }

    list.innerHTML = matches.map(m => {
        const score = m.synergy_score;
        let badgeColor = 'bg-secondary';
        let badgeText = 'Potential';

        if (score >= 90) { badgeColor = 'bg-danger'; badgeText = 'UNSTOPPABLE'; }
        else if (score >= 70) { badgeColor = 'bg-warning text-dark'; badgeText = 'PERFECT FIT'; }
        else if (score >= 50) { badgeColor = 'bg-primary'; badgeText = 'GREAT DUO'; }

        return `
            <div class="glass-card synergy-item p-3 mb-3 animate-fade-in border-secondary border-opacity-10 position-relative overflow-hidden">
                <div class="d-flex align-items-center gap-3 mb-2">
                    <div class="synergy-score-ring ${score >= 70 ? 'glow-ring' : ''}">
                        ${score}%
                    </div>
                    <div class="flex-grow-1" style="min-width: 0;">
                        <h6 class="mb-0 fw-bold small text-white text-truncate">${m.startup.title}</h6>
                        <span class="badge ${badgeColor} extra-small rounded-pill px-2" style="font-size: 0.55rem;">${badgeText}</span>
                    </div>
                </div>
                
                <div class="matched-skills-container mb-3">
                    <p class="extra-small text-secondary mb-1 fw-bold opacity-75">MATCHED SKILLS:</p>
                    <div class="d-flex flex-wrap gap-1">
                        ${m.matched_skills.map(sk => `<span class="badge bg-white bg-opacity-10 text-info extra-small border border-info border-opacity-25">${sk}</span>`).join('')}
                    </div>
                </div>

                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-primary-gradient flex-grow-1 py-1 extra-small rounded-pill" onclick="joinStartupDirectly(${m.startup.id})">
                        <i class="bi bi-person-plus-fill me-1"></i> Join Squad
                    </button>
                    <button class="btn btn-sm btn-outline-secondary py-1 px-2 extra-small rounded-pill" onclick="showSimilarMinds(${m.startup.id})">
                        <i class="bi bi-info-circle"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function joinStartupDirectly(startupId) {
    if (!confirm('Send request to join this squad?')) return;
    try {
        const res = await fetch(`${API_URL}/startups/${startupId}/join`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            alert('Join request sent successfully!');
            fetchStartups(); // Refresh
        } else {
            const err = await res.json();
            alert(`Error: ${err.detail}`);
        }
    } catch (e) {
        console.error('Join failed', e);
    }
}
