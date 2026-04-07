import os

js_path = 'c:/Users/HP/OneDrive/Desktop/skillswaprec/skill/frontend/assets/js/profile.js'

with open(js_path, 'r', encoding='utf-8') as f:
    js_content = f.read()

append_logic = """
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
"""

if '// 1. Request Verification Logic' not in js_content:
    with open(js_path, 'a', encoding='utf-8') as f:
        f.write('\n' + append_logic)

print("JS appended.")
