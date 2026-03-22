const API_URL = 'http://127.0.0.1:8000';
const token = localStorage.getItem('token');

if (!token) window.location.href = 'index.html';

async function initMarketplace() {
    await fetchProfile();
    try {
        // Fetch skills for the modal
        const skillsRes = await fetch(`${API_URL}/skills/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const skills = await skillsRes.json();
        populateSkillSelect(skills);

        // Fetch market data (teachers and learners)
        const marketRes = await fetch(`${API_URL}/skills/market`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const marketData = await marketRes.json();

        renderMarket(marketData.teachers, 'mentorGrid', 'teaching');
        renderMarket(marketData.learners, 'learnerGrid', 'learning');

    } catch (error) {
        console.error('Error:', error);
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

function populateSkillSelect(skills) {
    const select = document.getElementById('skillSelect');
    select.innerHTML = skills.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
}

function renderMarket(users, gridId, type) {
    const grid = document.getElementById(gridId);
    if (!users || users.length === 0) {
        grid.innerHTML = `<div class="col-12 text-center text-secondary py-4">${type === 'teaching' ? 'No mentors available yet.' : 'No learners found yet.'}</div>`;
        return;
    }

    grid.innerHTML = users.map(user => {
        // Find relevant skills for this type
        const relevantSkills = user.skills.filter(s => s.type === (type === 'teaching' ? 'teach' : 'learn'));
        const skillNames = relevantSkills.map(s => s.skill.name).join(', ');

        return `
            <div class="col-md-6">
                <div class="glass-card p-4 h-100 d-flex align-items-center gap-4">
                    <img src="https://ui-avatars.com/api/?name=${user.full_name}&background=6366f1&color=fff" class="rounded-circle" width="60" height="60">
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between">
                            <h5 class="fw-bold mb-1">${user.full_name}</h5>
                        </div>
                        <p class="text-secondary small mb-2">${user.department} • Year ${user.year}</p>
                        <p class="text-secondary small mb-3"><i class="bi bi-envelope me-1"></i> ${user.email}</p>
                        <div class="d-flex flex-wrap gap-2 mb-3">
                            ${relevantSkills.map(s => {
            const isLegendary = s.endorsements && s.endorsements.length >= 5;
            return `<span class="badge ${isLegendary ? 'bg-warning text-dark border-warning' : 'bg-dark border-secondary'} border small">
                                    ${isLegendary ? '<i class="bi bi-star-fill me-1"></i>' : ''}${s.skill.name}
                                </span>`;
        }).join('')}
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-primary-gradient px-4" onclick="requestMentorship(${user.id}, ${relevantSkills[0].skill.id})">${type === 'teaching' ? 'Request Mentorship' : 'Offer to Teach'}</button>
                            <button class="btn btn-sm btn-outline-primary px-3" onclick="sendFriendRequest(${user.id})" title="Add Friend"><i class="bi bi-person-plus"></i></button>
                            <button class="btn btn-sm btn-outline-secondary px-3" onclick="contactUser('${user.email}')"><i class="bi bi-chat-dots"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function sendFriendRequest(userId) {
    try {
        const response = await fetch(`${API_URL}/friends/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ receiver_id: userId })
        });

        if (response.ok) {
            alert('Friend request sent!');
        } else {
            const err = await response.json();
            alert(`Failed: ${err.detail}`);
        }
    } catch (error) {
        console.error('Error sending friend request:', error);
    }
}

async function requestMentorship(mentorId, skillId) {
    try {
        const response = await fetch(`${API_URL}/skills/mentorship/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ mentor_id: mentorId, skill_id: skillId })
        });

        if (response.ok) {
            alert('Mentorship request sent! 50 credits will be deducted upon teacher acceptance.');
        } else {
            const err = await response.json();
            alert(`Failed: ${err.detail}`);
        }
    } catch (error) {
        console.error('Error requesting mentorship:', error);
    }
}

function contactUser(email) {
    alert(`Contact student at: ${email}\n\nTip: You can also create a Workspace and invite them using their username for better collaboration!`);
}

// Add My Skill
document.getElementById('addSkillForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        skill_id: parseInt(document.getElementById('skillSelect').value),
        type: document.querySelector('input[name="skillType"]:checked').value,
        proficiency: document.getElementById('proficiency').value
    };

    try {
        const response = await fetch(`${API_URL}/skills/my`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Skill added successfully!');
            location.reload();
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

initMarketplace();

// Logout Event Listener
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
});
