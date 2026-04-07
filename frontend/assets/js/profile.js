const API_URL = 'https://skillswap-api-p79d.onrender.com';
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
        badge.className = `badge bg-dark border ${isHighlyRated ? 'border-warning shadow-sm animate-pulse' : 'border-secondary border-opacity-50'} d-flex justify-content-between align-items-center gap-3 p-2`;
        
        // Simulate proficiency if not available
        const proficiency = us.proficiency || 'Intermediate';

        badge.innerHTML = `
            <div class="d-flex flex-column align-items-start text-start">
                <span class="fw-bold">${us.skill.name}</span>
                <span class="text-secondary opacity-75" style="font-size: 0.65rem; text-transform: uppercase;">${proficiency}</span>
            </div>
        `;

        const verificationContainer = document.createElement('div');
        if (us.endorsements && us.endorsements.length > 0) {
            verificationContainer.className = isHighlyRated ? 'text-warning fw-bold fs-6' : 'text-success extra-small';
            verificationContainer.innerHTML = `<i class="bi bi-patch-check-fill"></i> ${us.endorsements.length}`;
            badge.title = `Community Verified: Endorsed by ${us.endorsements.length} peers`;
        } else {
            verificationContainer.className = 'text-secondary opacity-50 extra-small';
            verificationContainer.innerHTML = `<i class="bi bi-shield"></i>`;
            badge.title = "Self-Reported Skill";
        }
        badge.appendChild(verificationContainer);

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


// ==========================================
// MOCK FUNCTIONALITY FOR TRUST FEATURES
// (Built for local UI testing without DB risk)
// ==========================================

// 1. Request Verification Logic
const verifyForm = document.getElementById('verifyForm');
if (verifyForm) {
    verifyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Close Modal
        const modalEl = document.getElementById('requestVerificationModal');
        const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.hide();

        // Update UI to Verified
        const badge = document.getElementById('verificationBadge');
        if (badge) {
            badge.className = 'badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3 py-1 d-flex align-items-center';
            badge.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i> Verified Student';
            badge.removeAttribute('data-bs-toggle');
            badge.title = 'Identity verified via University Email';
            badge.style.cursor = 'default';
        }
    });
}

// 2. Edit Profile Social Links update
const editProfileFormObj = document.getElementById('editProfileForm');
if (editProfileFormObj) {
    // Intercept standard edit profile form submission for mockup purposes
    editProfileFormObj.addEventListener('submit', (e) => {
        // Find existing inputs
        const linkedIn = document.getElementById('editLinkedin');
        const github = document.getElementById('editGithub');
        const portfolio = document.getElementById('editPortfolio');
        
        // Grab header links
        const socialLinks = document.querySelectorAll('.profile-header .d-flex.gap-2 a');
        if (socialLinks.length >= 3) {
            if (linkedIn && linkedIn.value) {
                socialLinks[0].href = linkedIn.value;
                socialLinks[0].classList.add('text-primary', 'border-primary');
            }
            if (github && github.value) {
                socialLinks[1].href = github.value;
                socialLinks[1].classList.add('text-white', 'border-light');
            }
            if (portfolio && portfolio.value) {
                socialLinks[2].href = portfolio.value;
                socialLinks[2].classList.add('text-info', 'border-info');
            }
        }
    });
}

// 3. Add Skill Logic
const addSkillForm = document.getElementById('addSkillForm');
if (addSkillForm) {
    addSkillForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const skillName = document.getElementById('newSkillName').value;
        const category = document.querySelector('input[name="skillCategory"]:checked').value;
        const proficiency = document.getElementById('skillProficiency').value;

        // Create Badge HTML visually identical to profile.js logic
        const badge = document.createElement('span');
        // New simulated skills are inherently self-reported (not verified), so border-secondary
        badge.className = 'badge bg-dark border border-secondary border-opacity-50 d-flex justify-content-between align-items-center gap-3 p-2';
        
        badge.innerHTML = `
            <div class="d-flex flex-column align-items-start text-start">
                <span class="fw-bold">${skillName}</span>
                <span class="text-secondary opacity-75" style="font-size: 0.65rem; text-transform: uppercase;">${proficiency}</span>
            </div>
            <div class="text-secondary opacity-50 extra-small" title="Self-Reported Skill">
                <i class="bi bi-shield"></i>
            </div>
        `;

        if (category === 'teach') {
            document.getElementById('teachingSkills')?.appendChild(badge);
        } else {
            document.getElementById('learningSkills')?.appendChild(badge);
        }

        // Reset and close
        addSkillForm.reset();
        const modalEl = document.getElementById('addSkillModal');
        const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.hide();
    });
}

// 4. Add Project/Portfolio Logic
const addProjectForm = document.getElementById('addProjectForm');
if (addProjectForm) {
    addProjectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('projTitle').value;
        const stack = document.getElementById('projStack').value;
        const url = document.getElementById('projUrl').value;

        const container = document.getElementById('proofOfWorkContainer');
        if (container) {
            const projectHTML = `
                <a href="${url}" target="_blank" class="text-decoration-none text-reset">
                    <div class="p-3 bg-dark border border-secondary border-opacity-25 rounded hover-scale transition-premium">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="fw-bold text-white mb-0">${title}</h6>
                            <i class="bi bi-box-arrow-up-right text-secondary extra-small"></i>
                        </div>
                        <p class="text-secondary extra-small mb-2">${stack}</p>
                        <div class="d-flex align-items-center gap-2 extra-small text-secondary opacity-75">
                            <i class="bi bi-shield-check"></i> Self-Reported
                        </div>
                    </div>
                </a>
            `;
            container.insertAdjacentHTML('beforeend', projectHTML);
        }

        addProjectForm.reset();
        const modalEl = document.getElementById('addProjectModal');
        const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.hide();
    });
}


// --- Endorsement State Sync (Profile) ---
document.addEventListener('DOMContentLoaded', () => {
    const askForm = document.getElementById('askEndorsementForm');
    const badge = document.getElementById('selfReportedBadge');
    const btn = document.getElementById('askEndorseBtn');

    // Check if previously endorsed
    if (localStorage.getItem('hawkProjectState') === 'endorsed') {
        if (badge) {
            badge.className = 'd-flex align-items-center gap-2 extra-small text-success';
            badge.innerHTML = '<i class="bi bi-check-circle-fill"></i> Verified by Alex M.';
        }
        if (btn) btn.remove();
    } else if (localStorage.getItem('hawkProjectState') === 'pending') {
        if (btn) {
            btn.textContent = 'Pending...';
            btn.classList.replace('btn-outline-info', 'btn-outline-warning');
            btn.disabled = true;
        }
    }

    if (askForm) {
        askForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Save state to cross-talk with dashboard
            localStorage.setItem('hawkProjectState', 'pending');
            
            // Visual Update
            if (btn) {
                btn.textContent = 'Pending...';
                btn.classList.replace('btn-outline-info', 'btn-outline-warning');
                btn.disabled = true;
                btn.removeAttribute('data-bs-toggle');
            }
            
            const modalEl = document.getElementById('askEndorsementModal');
            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.hide();
        });
    }
});
