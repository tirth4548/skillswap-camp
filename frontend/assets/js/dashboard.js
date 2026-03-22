const API_URL = 'https://skillswap-api-p79d.onrender.com';
const token = localStorage.getItem('token');

if (!token) window.location.href = 'index.html';

// === Typewriter Effect Utility ===
function typewriterEffect(element, text, speed = 40) {
    if (!element) return;
    element.textContent = '';
    let i = 0;
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}

// === Animated Counter Utility ===
function animateCounter(element, target, duration = 1200) {
    if (!element) return;
    const start = 0;
    const startTime = performance.now();
    element.classList.add('counting');

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (target - start) * eased);
        element.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = target;
            element.classList.remove('counting');
        }
    }
    requestAnimationFrame(update);
}

async function fetchDashboardData() {
    try {
        // Fetch Profile
        const profileRes = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!profileRes.ok) {
            console.error('Failed to fetch profile');
            if (profileRes.status === 401) {
                localStorage.removeItem('token');
                window.location.href = 'index.html';
            }
            return;
        }

        const profile = await profileRes.json();

        // Update UI with Profile Data
        document.getElementById('userName').textContent = profile.full_name || profile.username || 'User';

        // Animate credits counter
        const creditsEl = document.getElementById('userCredits');
        animateCounter(creditsEl, profile.credits || 0);

        // Animate XP counter
        const xpEl = document.getElementById('userXP');
        animateCounter(xpEl, profile.xp || 0);

        const levelEl = document.getElementById('userLevel');
        if (levelEl) levelEl.textContent = profile.level || 1;

        document.getElementById('userAvatar').src = `https://ui-avatars.com/api/?name=${profile.full_name || profile.username}&background=6366f1&color=fff`;

        // Update Sidebar Profile Hub
        const sidebarAvatar = document.getElementById('sidebarAvatar');
        if (sidebarAvatar) sidebarAvatar.src = `https://ui-avatars.com/api/?name=${profile.full_name || profile.username}&background=random&color=fff`;

        const sidebarUser = document.getElementById('sidebarUserName');
        if (sidebarUser) sidebarUser.textContent = profile.full_name || profile.username;

        const sidebarCredits = document.getElementById('sidebarCredits');
        if (sidebarCredits) sidebarCredits.textContent = `${profile.credits || 0} Credits`;

        // Typewriter subtitle
        typewriterEffect(
            document.getElementById('subtitleText'),
            'Your campus journey is looking productive today.',
            35
        );

        // Update Skills Taught Count with animation
        const teachCount = (profile.skills || []).filter(s => s.type === 'teach').length;
        animateCounter(document.getElementById('skillsTaughtCount'), teachCount);

        // Fetch Friend Requests
        try {
            const frRes = await fetch(`${API_URL}/friends/pending`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (frRes.ok) {
                const friendReqs = await frRes.json();
                renderFriendRequests(friendReqs);
            }
        } catch (e) {
            console.error('Friends fetch failed', e);
        }

        // Fetch Mentorship Requests
        try {
            const mRes = await fetch(`${API_URL}/skills/mentorship/pending`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (mRes.ok) {
                const mentReqs = await mRes.json();
                renderMentorshipRequests(mentReqs, profile.id);
            }
        } catch (e) {
            console.error('Mentorship fetch failed', e);
        }

        // Fetch Active Gigs (In Progress)
        try {
            const agRes = await fetch(`${API_URL}/gigs/my-active`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (agRes.ok) {
                const activeGigs = await agRes.ok ? await agRes.json() : [];
                renderActiveGigs(activeGigs, profile.id);
            }
        } catch (e) {
            console.error('Active gigs fetch failed', e);
        }

        // Fetch Remaining Data in Parallel
        const [wsRes, gigRes, appRes, eventRes, matchRes, allEventsRes] = await Promise.all([
            fetch(`${API_URL}/workspaces/`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_URL}/gigs/my-stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_URL}/gigs/my-applications`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_URL}/events/joined`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_URL}/skills/match`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_URL}/events/`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (wsRes.ok) {
            const workspaces = await wsRes.json();
            renderWorkspaces(workspaces);
            animateCounter(document.getElementById('activeProjectsCount'), workspaces.length);
        }

        if (gigRes.ok) {
            const gigStats = await gigRes.json();
            animateCounter(document.getElementById('gigsDoneCount'), gigStats.completed_count || 0);
        }

        if (appRes.ok) {
            const applications = await appRes.json();
            renderApplications(applications);
        }

        if (eventRes.ok) {
            const joinedEvents = await eventRes.json();
            renderJoinedEvents(joinedEvents);
        }

        if (matchRes.ok) {
            const matches = await matchRes.json();
            renderMatches(matches);
        }

        if (allEventsRes.ok) {
            const allEvents = await allEventsRes.json();
            renderUpcomingEvents(allEvents);
        }

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
    }
}

function renderUpcomingEvents(events) {
    const list = document.getElementById('upcomingEventsList');
    if (!list) return;

    if (!events || events.length === 0) {
        list.innerHTML = `
            <div class="text-center py-3">
                <p class="text-secondary extra-small mb-0">No upcoming events found.</p>
            </div>
        `;
        return;
    }

    // Sort by date (nearest first) and take top 3
    const upcoming = events
        .filter(e => new Date(e.event_time) > new Date())
        .sort((a, b) => new Date(a.event_time) - new Date(b.event_time))
        .slice(0, 3);

    if (upcoming.length === 0) {
        list.innerHTML = `
            <div class="text-center py-3">
                <p class="text-secondary extra-small mb-0">No upcoming events scheduled.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = upcoming.map(event => `
        <div class="glass-card p-2 d-flex align-items-center gap-2 mb-0 animate-fade-in hover-scale shadow-sm border-secondary border-opacity-10 cursor-pointer" 
             onclick="window.location.href='events.html'">
            <div class="bg-primary-gradient rounded-3 p-1 text-center text-white shadow-sm" style="min-width: 44px;">
                <span class="d-block fw-bold" style="font-size: 0.65rem;">${new Date(event.event_time).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                <span class="d-block fw-bold fs-6 lh-1">${new Date(event.event_time).getDate()}</span>
            </div>
            <div class="flex-grow-1" style="min-width: 0;">
                <h6 class="mb-0 fw-bold small text-white text-truncate">${event.title}</h6>
                <div class="d-flex align-items-center text-secondary" style="font-size: 0.75rem;">
                     <i class="bi bi-geo-alt-fill me-1 text-primary"></i> <span class="text-truncate">${event.location || 'Campus'}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderJoinedEvents(events) {
    const list = document.getElementById('registeredEvents');
    if (!list) return;

    if (!events || events.length === 0) {
        list.innerHTML = '<div class="col-12 text-center py-4 text-secondary small italic">You haven\'t joined any events yet. Check out the Campus Hub!</div>';
        return;
    }

    list.innerHTML = events.map(event => {
        const participants = event.participants || [];
        const attendeeAvatars = participants.slice(0, 5).map(p =>
            `<img src="https://ui-avatars.com/api/?name=${p.full_name || p.username}&background=random&color=fff" 
                  class="rounded-circle border border-dark border-opacity-50 ms-n2" 
                  width="28" height="28" 
                  title="${p.full_name || p.username}">`
        ).join('');

        const extraCount = participants.length > 5 ? `<span class="extra-small text-secondary ms-1">+${participants.length - 5} others</span>` : '';

        return `
            <div class="col-md-6 mb-3">
                <div class="glass-card stat-card border-info border-opacity-25 h-100 animate-fade-in shadow-sm">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div class="bg-primary-gradient rounded-3 p-2 shadow-sm">
                            <i class="bi bi-calendar-check-fill text-white fs-5"></i>
                        </div>
                        <span class="badge bg-info text-dark rounded-pill extra-small">${new Date(event.event_time).toLocaleDateString()}</span>
                    </div>
                    <h5 class="fw-bold mb-1">${event.title}</h5>
                    <p class="text-secondary extra-small mb-4"><i class="bi bi-geo-alt-fill me-1"></i> ${event.location || 'Campus Main'}</p>
                    
                    <div class="pt-3 border-top border-secondary border-opacity-25">
                        <div class="d-flex align-items-center mb-2">
                             <small class="text-secondary extra-small me-3">WHO'S COMING:</small>
                             <div class="d-flex align-items-center" style="padding-left: 10px;">
                                ${attendeeAvatars}
                                ${extraCount}
                             </div>
                        </div>
                        <p class="text-secondary extra-small italic mb-0">
                            ${participants.length} students registered.
                        </p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderWorkspaces(workspaces) {
    const list = document.getElementById('workspaceList');
    if (!list) return;

    if (!workspaces || workspaces.length === 0) {
        list.innerHTML = `
            <div class="col-12 text-center py-5 glass-card border-dashed">
                <i class="bi bi-folder2-open fs-1 text-secondary opacity-50"></i>
                <p class="mt-2 text-secondary">No active workspaces. Start a collaboration!</p>
            </div>
        `;
        return;
    }

    list.innerHTML = workspaces.map(ws => `
        <div class="col-md-6 mb-3">
            <div class="glass-card stat-card border-0 border-start border-4 border-primary p-4 h-100 animate-fade-in hover-scale shadow-sm">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <h5 class="fw-bold mb-1 text-white">${ws.title}</h5>
                        <span class="badge bg-primary bg-opacity-25 text-primary rounded-pill extra-small">Project Active</span>
                    </div>
                    <div class="bg-dark bg-opacity-50 p-2 rounded-3 border border-secondary border-opacity-25">
                         <i class="bi bi-kanban text-primary"></i>
                    </div>
                </div>
                <p class="text-secondary small mb-4" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                    ${ws.description || 'No description provided.'}
                </p>
                <div class="d-flex justify-content-between align-items-center mt-auto">
                    <div class="d-flex align-items-center gap-2">
                         <div class="bg-primary bg-opacity-10 p-1 rounded-circle">
                             <i class="bi bi-people text-primary extra-small px-1"></i>
                         </div>
                        <span class="text-secondary extra-small">${ws.members?.length || 1} members</span>
                    </div>
                    <a href="workspace.html?id=${ws.id}" class="btn btn-sm btn-primary-gradient px-4 rounded-pill">Open Workspace</a>
                </div>
            </div>
        </div>
    `).join('');
}

function renderMatches(matches) {
    const list = document.getElementById('matchSuggestions');
    if (!list) return;

    if (!matches || matches.length === 0) {
        list.innerHTML = '<div class="glass-card p-3 text-center text-secondary extra-small italic">Add skills to get recommendations!</div>';
        return;
    }

    list.innerHTML = matches.map(match => `
        <div class="glass-card p-2 d-flex align-items-center gap-2 mb-1 animate-fade-in hover-scale shadow-sm border-0 bg-white bg-opacity-10 cursor-pointer" 
             onclick="window.location.href='social.html'" title="View in Social Hub">
            <div class="position-relative">
                <img src="https://ui-avatars.com/api/?name=${match.full_name || match.username}&background=fff&color=6366f1" 
                     class="rounded-circle border border-2 border-white shadow-sm" width="40" height="40" alt="User">
                <span class="position-absolute bottom-0 end-0 bg-success border border-2 border-white rounded-circle" style="padding: 3px;"></span>
            </div>
            <div class="flex-grow-1" style="min-width: 0;">
                <h6 class="mb-0 fw-bold small text-white text-truncate">${match.full_name || match.username}</h6>
                <p class="mb-0 text-white text-opacity-75" style="font-size: 0.75rem;">${match.department}</p>
            </div>
            <button class="btn btn-light text-primary rounded-circle p-0 d-flex align-items-center justify-content-center shadow-sm hover-scale" 
                    style="width:28px; height:28px;" title="Connect">
                <i class="bi bi-arrow-right-short fs-6"></i>
            </button>
        </div>
        `).join('');
}

function renderApplications(apps) {
    const section = document.getElementById('applicationsSection');
    const list = document.getElementById('applicationList');
    if (!section || !list) return;

    if (!apps || apps.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    list.innerHTML = apps.map(app => `
        <div class="glass-card stat-card border-0 border-top border-4 border-warning p-4 h-100 animate-fade-in hover-scale shadow-sm position-relative">
            <span class="position-absolute top-0 end-0 mt-3 me-3 badge bg-warning text-dark shadow-sm">Pending</span>
            <div class="d-flex align-items-center gap-3 mb-3">
                <div class="position-relative">
                    <img src="https://ui-avatars.com/api/?name=${app.applicant.full_name || app.applicant.username}&background=random&color=fff"
                        class="rounded-circle border border-secondary border-opacity-50 shadow-sm" width="45" height="45" alt="Avatar">
                </div>
                <div>
                    <h6 class="fw-bold mb-0 text-white">${app.gig.title}</h6>
                    <p class="text-secondary extra-small mb-0">Applicant: <b>${app.applicant.full_name || app.applicant.username}</b></p>
                </div>
            </div>

            <div class="bg-dark bg-opacity-25 p-3 rounded-3 mb-4 border border-secondary border-opacity-10 flex-grow-1">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="text-secondary extra-small italic">${app.applicant.email}</span>
                </div>
                <p class="text-white text-opacity-75 small mb-0 mt-2 line-clamp-2">${app.cover_letter}</p>
            </div>

            <div class="d-flex flex-column gap-2 mt-auto">
                <button class="btn btn-sm btn-primary-gradient w-100 rounded-pill shadow-sm py-2" onclick="approveApplication(${app.id})">Approve & Assign</button>
                <button class="btn btn-sm btn-outline-secondary w-100 rounded-pill" onclick="alert('Feature coming soon')">Decline</button>
            </div>
        </div>
    `).join('');
}

async function approveApplication(appId) {
    try {
        const response = await fetch(`${API_URL}/gigs/applications/${appId}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert('Application approved! Gig is now in progress.');
            location.reload();
        } else {
            const err = await response.json();
            alert(`Failed to approve: ${err.detail}`);
        }
    } catch (error) {
        console.error('Error approving application:', error);
    }
}

function renderActiveGigs(gigs, myId) {
    const section = document.getElementById('activeGigsSection');
    const list = document.getElementById('activeGigsList');
    const countBadge = document.getElementById('activeGigsCount');

    if (!gigs || gigs.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    countBadge.textContent = gigs.length;

    list.innerHTML = gigs.map(gig => {
        const isPoster = gig.poster_id == myId || (gig.is_system && myId == 1);
        const roleBadge = isPoster ?
            '<span class="badge bg-info bg-opacity-25 text-info rounded-pill extra-small px-3">POSTER</span>' :
            '<span class="badge bg-warning bg-opacity-25 text-warning rounded-pill extra-small px-3">EXECUTOR</span>';

        return `
    <div class="glass-card stat-card border-0 border-start border-4 border-info p-4 h-100 animate-fade-in hover-scale shadow-lg flex-column d-flex">
        <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
                <h6 class="fw-bold mb-1 text-white">${gig.title}</h6>
                ${roleBadge}
            </div>
            <div class="credit-badge shadow-sm px-3 py-1">
                <span class="fw-bold text-warning">${gig.credit_reward} C</span>
            </div>
        </div>
        <div class="d-flex align-items-center gap-2 mb-4">
            <div class="spinner-grow spinner-grow-sm text-primary" role="status"></div>
            <span class="text-primary small fw-bold letter-spacing-1 extra-small">IN PROGRESS</span>
        </div>
        <div class="mt-auto pt-3 border-top border-secondary border-opacity-25">
        ${isPoster ? `
            <button class="btn btn-sm btn-primary-gradient w-100 rounded-pill shadow-sm py-2" onclick="completeGig(${gig.id})">
                <i class="bi bi-check2-circle me-2"></i> Mark as Complete & Pay
            </button>
        ` : `
            <div class="bg-dark bg-opacity-25 p-3 rounded-pill text-center border border-secondary border-opacity-10 shadow-inner">
                <p class="text-secondary extra-small mb-0 italic">
                    <i class="bi bi-info-circle me-1"></i> Waiting for Poster verification...
                </p>
            </div>
        `}
        </div>
    </div>
        `;
    }).join('');
}

async function completeGig(gigId) {
    if (!confirm('Are you sure the work is complete? This will transfer credits to the executor.')) return;

    try {
        const response = await fetch(`${API_URL}/gigs/${gigId}/complete`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert('Gig completed! Credits transferred successfully.');
            location.reload();
        } else {
            const err = await response.json();
            alert(`Error: ${err.detail}`);
        }
    } catch (error) {
        console.error('Error completing gig:', error);
    }
}

function renderFriendRequests(reqs) {
    const list = document.getElementById('friendRequests');
    if (!list) return;

    if (!reqs || reqs.length === 0) {
        list.innerHTML = ''; // Hide if no requests
        return;
    }

    list.innerHTML = `<h6 class="text-secondary small fw-bold mb-2">Friend Requests</h6>` + reqs.map(req => `
    <div class="glass-card p-2 d-flex align-items-center justify-content-between mb-2" style="font-size: 0.8rem;">
            <span><b>${req.sender.full_name || req.sender.username}</b> sent a request</span>
            <button class="btn btn-xs btn-primary-gradient py-0 px-2" onclick="acceptFriendRequest(${req.id})">Accept</button>
        </div>
        `).join('');
}

async function acceptFriendRequest(reqId) {
    try {
        const response = await fetch(`${API_URL}/friends/accept/${reqId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            alert('Friend request accepted!');
            location.reload();
        }
    } catch (e) { console.error(e); }
}

function renderMentorshipRequests(reqs, myId) {
    const list = document.getElementById('mentorshipApprovals');
    if (!list) return;

    // Filter incoming requests (where I am the mentor)
    const incoming = reqs.filter(r => r.mentor_id === myId && r.status === 'pending');

    if (incoming.length === 0) {
        list.innerHTML = '';
        return;
    }

    list.innerHTML = `<h6 class="text-secondary small fw-bold mb-2">Mentorship Requests</h6>` + incoming.map(req => `
    <div class="glass-card p-2 d-flex flex-column gap-1 mb-2" style="font-size: 0.8rem;">
            <span><b>${req.learner.full_name}</b> wants to learn <b>${req.skill.name}</b></span>
            <div class="d-flex justify-content-between align-items-center mt-1">
                <span class="text-success fw-bold">+${req.credits_offered} C</span>
                <button class="btn btn-xs btn-primary-gradient py-0 px-2" onclick="acceptMentorship(${req.id})">Accept & Start</button>
            </div>
        </div>
        `).join('');
}

async function acceptMentorship(reqId) {
    try {
        const response = await fetch(`${API_URL}/skills/mentorship/${reqId}/accept`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            alert('Mentorship accepted! Credits have been transferred.');
            location.reload();
        } else {
            const err = await response.json();
            alert(`Error: ${err.detail}`);
        }
    } catch (e) { console.error(e); }
}

// Create Workspace Event Listener
const createWSForm = document.getElementById('createWorkspaceForm');
if (createWSForm) {
    createWSForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            title: document.getElementById('wsTitle').value,
            description: document.getElementById('wsDesc').value
        };

        try {
            const response = await fetch(`${API_URL}/workspaces/`, {
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
            console.error('Error creating workspace:', error);
        }
    });
}

// Logout Event Listener
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
}

// Initialize
fetchDashboardData();

// Init Deep Space Background
if (window.initDashboardGalaxy) {
    window.initDashboardGalaxy('dashboard-galaxy');
}
