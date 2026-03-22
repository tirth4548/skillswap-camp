const API_URL = 'https://skillswap-api-p79d.onrender.com';
const token = localStorage.getItem('token');

if (!token) window.location.href = 'index.html';

let users = [];
let currentIndex = 0;

async function fetchMatches() {
    const cardStack = document.getElementById('cardStack');
    try {
        const response = await fetch(`${API_URL}/social/matches`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'index.html?error=session_expired';
            return;
        }

        if (response.ok) {
            users = await response.json();
            renderCards();
        } else {
            throw new Error(`Social Matches error: ${response.status}`);
        }
    } catch (error) {
        console.error('Error fetching matches:', error);
        if (cardStack) {
            cardStack.innerHTML = `
                <div class="text-center py-5 glass-card-vibrant border-danger border-opacity-25 shadow-lg">
                    <i class="bi bi-wifi-off fs-1 text-danger opacity-50"></i>
                    <h4 class="mt-3 fw-bold text-white">Connection Issue</h4>
                    <p class="text-secondary small">Failed to reach the neural campus server.</p>
                    <button class="btn btn-outline-primary rounded-pill mt-3 px-4" onclick="location.reload()">Retry Connection</button>
                    <p class="text-secondary extra-small mt-3">Error: ${error.message}</p>
                </div>
            `;
        }
    }
}

async function fetchLeaderboard() {
    const list = document.getElementById('leaderboardList');
    try {
        const response = await fetch(`${API_URL}/social/leaderboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const topUsers = await response.json();
            renderLeaderboard(topUsers);
        } else if (list) {
            throw new Error(`Leaderboard error: ${response.status}`);
        }
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        if (list) {
            list.innerHTML = `
                <div class="text-center py-4 border border-danger border-opacity-10 rounded-4">
                    <i class="bi bi-exclamation-triangle-fill text-danger opacity-50 mb-2"></i>
                    <p class="extra-small mb-0 text-secondary">Rankings unavailable.</p>
                </div>
            `;
        }
    }
}

function renderLeaderboard(topUsers) {
    const list = document.getElementById('leaderboardList');
    if (!list) return;

    if (!topUsers || topUsers.length === 0) {
        list.innerHTML = `
            <div class="text-center py-5 opacity-50">
                <i class="bi bi-person-dash fs-2 mb-2"></i>
                <p class="extra-small mb-0">No rankings available yet.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = topUsers.map((user, index) => {
        const skillsArray = user.skills || [];
        const isLegendary = skillsArray.some(us => us.endorsements && us.endorsements.length >= 5);

        // Better contrast rank colors
        const rankColor = index === 0 ? 'text-warning' : (index === 1 ? 'text-slate-300' : (index === 2 ? 'text-info' : 'text-secondary'));
        const rankIcon = index === 0 ? 'bi-trophy-fill' : 'bi-patch-check-fill';

        return `
            <div class="d-flex align-items-center gap-3 p-3 bg-dark bg-opacity-25 rounded-4 border border-white border-opacity-10 hover-lift luxury-card">
                <div class="fs-4 fw-bold ${rankColor}" style="width: 35px; text-shadow: 0 0 10px rgba(0,0,0,0.5);">#${index + 1}</div>
                <div class="position-relative">
                    <img src="https://ui-avatars.com/api/?name=${user.full_name || user.username}&background=random&color=fff&size=64" 
                         class="rounded-circle border border-white border-opacity-10" width="42" height="42">
                    ${index < 3 ? `<span class="position-absolute bottom-0 end-0 badge rounded-pill bg-dark border border-secondary p-1" style="font-size: 0.5rem;"><i class="bi bi-star-fill ${rankColor}"></i></span>` : ''}
                </div>
                <div class="flex-grow-1 overflow-hidden">
                    <h6 class="mb-0 fw-bold text-white small text-truncate">
                        ${user.full_name || user.username} 
                        ${isLegendary ? '<i class="bi bi-fire text-danger ms-1" title="Legendary Status"></i>' : ''}
                    </h6>
                    <div class="d-flex align-items-center gap-2 mt-1">
                        <span class="badge bg-white bg-opacity-10 text-secondary extra-small fw-bold border border-white border-opacity-5">LVL ${user.level || 1}</span>
                        <span class="text-secondary extra-small fw-bold opacity-75">${user.xp || 0} XP</span>
                    </div>
                </div>
                <div class="text-end">
                    <i class="bi ${rankIcon} ${rankColor} fs-5 opacity-75"></i>
                </div>
            </div>
        `;
    }).join('');
}

function renderCards() {
    const cardStack = document.getElementById('cardStack');
    if (!cardStack) return;

    if (!users || users.length === 0) {
        cardStack.innerHTML = `
            <div class="text-center py-5 glass-card-vibrant animate-fade-in shadow-lg">
                <i class="bi bi-emoji-smile fs-1 text-primary opacity-50"></i>
                <h4 class="mt-3 fw-bold text-white">All caught up!</h4>
                <p class="text-secondary small">Check back later for new potential matches.</p>
                <button class="btn btn-outline-primary rounded-pill mt-3 px-4" onclick="location.reload()">Refresh Hub</button>
            </div>
        `;
        return;
    }

    cardStack.innerHTML = users.map((user, index) => {
        const zIndex = users.length - index;
        const skillsArray = user.skills || [];
        const skills = skillsArray.slice(0, 3).map(s => `<span class="tag-badge tag-skill">${s.skill.name}</span>`).join('');
        const interests = (user.interests || "").split(",").slice(0, 3).filter(i => i.trim()).map(i => `<span class="tag-badge tag-interest">${i.trim().toLowerCase()}</span>`).join('');
        const hacks = (user.hackathons || "").split(",").slice(0, 2).filter(h => h.trim()).map(h => `<span class="tag-badge tag-hack">${h.trim()}</span>`).join('');
        const projects = user.workspaces ? `<span class="tag-badge tag-project">${user.workspaces.length} Projects</span>` : '';
        const isLegendary = skillsArray.some(us => us.endorsements && us.endorsements.length >= 5);

        return `
            <div class="swipe-card glass-card-vibrant p-0 overflow-hidden shadow-lg animate-fade-in" 
                 style="z-index: ${zIndex}; display: ${index === currentIndex ? 'block' : 'none'}" 
                 id="card-${index}">
                 
                <div class="position-relative" style="height: 320px;">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.username)}&background=6366f1&color=fff&size=512" 
                         class="w-100 h-100 object-fit-cover shadow-inner">
                    <div class="position-absolute top-0 end-0 p-3">
                         <span class="badge bg-primary-gradient px-3 py-2 shadow-sm">LVL ${user.level || 1}</span>
                    </div>
                    <div class="position-absolute bottom-0 start-0 w-100 p-4 bg-gradient-dark" 
                         style="background: linear-gradient(transparent, rgba(0,0,0,0.95))">
                        <h2 class="fw-bold mb-0 text-white">
                            ${user.full_name || user.username}${isLegendary ? ' <i class="bi bi-star-fill text-warning ms-1" style="text-shadow: 0 0 10px #fbbf24"></i>' : ''}, ${user.year || '?'}yr
                        </h2>
                        <p class="text-info extra-small fw-bold mb-0">${user.department || 'Campus Explorer'}</p>
                    </div>
                </div>

                <div class="p-4">
                    <div class="mb-3 d-flex flex-wrap gap-2">
                        ${skills}
                        ${interests.length > 0 ? interests : ''}
                        ${hacks.length > 0 ? hacks : ''}
                        ${projects}
                    </div>
                    
                    <p class="text-secondary small mb-4" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                        ${user.bio || 'This student is busy building the next big thing on campus! Join them to collaborate.'}
                    </p>

                    <div class="d-flex align-items-center justify-content-between p-3 bg-dark bg-opacity-25 rounded-3 border border-secondary border-opacity-10">
                         <div class="text-center">
                            <span class="d-block text-info fw-bold fs-5">${Math.min(100, (user.match_score || 0) * 2)}%</span>
                            <span class="text-secondary extra-small fw-bold">COMPATIBILITY</span>
                         </div>
                         <div class="text-end">
                            <span class="d-block text-white fw-bold fs-5">${user.xp || 0} XP</span>
                            <span class="text-secondary extra-small fw-bold">RANK POWER</span>
                         </div>
                    </div>
                </div>
                
                <div class="match-overlay match-like" id="like-overlay-${index}">VIBE</div>
                <div class="match-overlay match-dislike" id="dislike-overlay-${index}">NOPE</div>
            </div>
        `;
    }).join('');
}

let currentMatchUser = null;

async function swipe(direction) {
    if (currentIndex >= users.length || currentMatchUser) return;

    const userToSwipe = users[currentIndex];
    const card = document.getElementById(`card-${currentIndex}`);
    const likeOverlay = document.getElementById(`like-overlay-${currentIndex}`);
    const dislikeOverlay = document.getElementById(`dislike-overlay-${currentIndex}`);

    if (direction === 'right') {
        card.classList.add('swiped-right');
        if (likeOverlay) likeOverlay.style.opacity = '1';
    } else {
        card.classList.add('swiped-left');
        if (dislikeOverlay) dislikeOverlay.style.opacity = '1';
    }

    try {
        const res = await fetch(`${API_URL}/social/swipe?receiver_id=${userToSwipe.id}&action=${direction === 'right' ? 'like' : 'dislike'}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
            window.location.href = 'index.html?error=session_expired';
            return;
        }

        const data = await res.json();

        setTimeout(() => {
            if (data.status === 'match') {
                currentMatchUser = data.match_user;
                showMatchModal(data.match_user);
            } else {
                currentIndex++;
                if (currentIndex < users.length) {
                    const nextCard = document.getElementById(`card-${currentIndex}`);
                    if (nextCard) nextCard.style.display = 'block';
                } else {
                    renderCards();
                }
            }
        }, 300);

    } catch (e) {
        console.error("Swipe failed", e);
        setTimeout(() => {
            currentIndex++;
            if (currentIndex < users.length) {
                const nextCard = document.getElementById(`card-${currentIndex}`);
                if (nextCard) nextCard.style.display = 'block';
            } else {
                renderCards();
            }
        }, 300);
    }
}

function showMatchModal(user) {
    document.getElementById('matchUserName').textContent = user.full_name || user.username;
    document.getElementById('matchPartnerAvatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.username)}&background=6366f1&color=fff&size=256`;

    fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json()).then(me => {
        document.getElementById('matchMyAvatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(me.full_name || me.username)}&background=10b981&color=fff&size=256`;
    });

    document.getElementById('matchModal').style.display = 'block';
}

function closeMatchModal() {
    document.getElementById('matchModal').style.display = 'none';
    currentMatchUser = null;
    currentIndex++;
    if (currentIndex < users.length) {
        const nextCard = document.getElementById(`card-${currentIndex}`);
        if (nextCard) nextCard.style.display = 'block';
    } else {
        renderCards();
    }
}

async function initiateMatchChat() {
    if (!currentMatchUser) return;

    const btn = document.querySelector('#matchModal button');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Creating Chat...`;
    btn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/social/match-chat/${currentMatchUser.id}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const workspace = await res.json();
            window.location.href = `workspace.html?id=${workspace.id}&chat=true`;
        }
    } catch (e) {
        console.error("Chat initiation failed", e);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Support Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
}

// Initial triggers
window.addEventListener('load', () => {
    fetchProfile();
    fetchMatches();
    fetchLeaderboard();
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


function showRequestCreditsModal() {
    if (!currentMatchUser) return;
    const modal = new bootstrap.Modal(document.getElementById('reqCreditsModal'));
    modal.show();
}

const reqCreditsForm = document.getElementById('reqCreditsForm');
if (reqCreditsForm) {
    reqCreditsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentMatchUser) return;

        const data = {
            receiver_id: currentMatchUser.id,
            amount: parseInt(document.getElementById('reqAmount').value),
            message: document.getElementById('reqMessage').value
        };

        try {
            const res = await fetch(`${API_URL}/wallet/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                alert('Credit request sent!');
                bootstrap.Modal.getInstance(document.getElementById('reqCreditsModal')).hide();
                closeMatchModal();
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail}`);
            }
        } catch (e) { console.error(e); }
    });
}
