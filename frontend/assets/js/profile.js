const API_URL = 'http://127.0.0.1:8000';
const token = localStorage.getItem('token');

if (!token) window.location.href = 'index.html';

async function fetchProfile() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const user = await response.json();
            renderProfile(user);
        } else {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderProfile(user) {
    document.getElementById('profileName').textContent = user.full_name;
    document.getElementById('profileDept').textContent = user.department;
    document.getElementById('profileYear').textContent = user.year;
    document.getElementById('profileCredits').textContent = `${user.credits} Credits`;
    document.getElementById('profileXP').textContent = `${user.xp} XP`;
    document.getElementById('profileLevel').textContent = `Lvl ${user.level}`;
    document.getElementById('profileBio').textContent = user.bio || 'No bio added yet.';

    // Set Profile Picture
    const profilePic = document.getElementById('profilePic');
    if (profilePic) {
        profilePic.src = `https://ui-avatars.com/api/?name=${user.full_name}&background=6366f1&color=fff&size=128`;
    }

    // Set edit form values
    document.getElementById('editName').value = user.full_name;
    document.getElementById('editBio').value = user.bio || '';

    // Update Sidebar Profile Hub
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    if (sidebarAvatar) sidebarAvatar.src = `https://ui-avatars.com/api/?name=${user.full_name || user.username}&background=random&color=fff`;
    const sidebarUser = document.getElementById('sidebarUserName');
    if (sidebarUser) sidebarUser.textContent = user.full_name || user.username;
    const sidebarCredits = document.getElementById('sidebarCredits');
    if (sidebarCredits) sidebarCredits.textContent = `${user.credits || 0} Credits`;

    // Render skills
    const teachList = document.getElementById('teachingSkills');
    const learnList = document.getElementById('learningSkills');

    teachList.innerHTML = '';
    learnList.innerHTML = '';

    const skills = user.skills || [];
    // Check for legendary status (skill with 5+ endorsements)
    const legendarySkill = skills.find(s => s.endorsements && s.endorsements.length >= 5);
    if (legendarySkill) {
        document.getElementById('profilePic').classList.add('legendary-aura');
        const nameHeader = document.getElementById('profileName');
        nameHeader.innerHTML += ' <i class="bi bi-patch-check-fill legendary-badge-star ms-2" title="Legendary Status"></i>';
    }

    const skillsToRender = user.skills || [];
    skillsToRender.forEach(us => {
        const badge = document.createElement('span');
        const isHighlyRated = us.endorsements && us.endorsements.length >= 5;
        badge.className = `badge bg-dark border ${isHighlyRated ? 'border-warning shadow-sm animate-pulse' : 'border-secondary'} d-flex align-items-center gap-2`;
        badge.textContent = us.skill.name;

        if (us.endorsements && us.endorsements.length > 0) {
            const count = document.createElement('span');
            count.className = isHighlyRated ? 'text-warning fw-bold' : 'text-warning extra-small';
            count.innerHTML = `<i class="bi bi-check-circle-fill"></i> ${us.endorsements.length}`;
            badge.appendChild(count);
        }

        if (us.type === 'teach') {
            teachList.appendChild(badge);
        } else {
            learnList.appendChild(badge);
        }
    });

    // Initialize Neural Network Visualization with a slight delay to ensure container sizing is ready
    setTimeout(() => {
        initNeuralNetwork(skills);
    }, 100);
}

function initNeuralNetwork(userSkills) {
    const container = document.getElementById('neuralNetworkSkills');
    if (!container) return;

    // Remove old canvas if exists
    const oldCanvas = container.querySelector('canvas');
    if (oldCanvas) oldCanvas.remove();

    // Initialize the advanced 3D Three.js Particle System
    if (window.initThreeNeuralWeb) {
        window.threeWeb = window.initThreeNeuralWeb('neuralNetworkSkills', userSkills);

        // Add gesture helper hint
        const hint = document.createElement('div');
        hint.className = 'position-absolute top-0 end-0 p-3 extra-small text-info opacity-75';
        hint.innerHTML = '<i class="bi bi-mouse me-1"></i> Double Click to Change Shapes | Scroll to Expand';
        container.appendChild(hint);
    } else {
        // Fallback or wait for module load
        setTimeout(() => initNeuralNetwork(userSkills), 500);
    }
}

// Edit Profile Submit
document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        full_name: document.getElementById('editName').value,
        bio: document.getElementById('editBio').value
    };

    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            method: 'PATCH', // Assuming we add a partial update endpoint or use PUT
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

fetchProfile();

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    window.location.href = 'index.html';
});
