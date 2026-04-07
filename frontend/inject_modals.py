import os
import re

profile_html = 'c:/Users/HP/OneDrive/Desktop/skillswaprec/skill/frontend/profile.html'
profile_js = 'c:/Users/HP/OneDrive/Desktop/skillswaprec/skill/frontend/assets/js/profile.js'

with open(profile_html, 'r', encoding='utf-8') as f:
    html_content = f.read()

# 1. Verification Badge clickable logic
html_content = html_content.replace(
    '<!-- Verified Student Badge -->',
    '<!-- Verified Student Badge / Request Action -->'
)
html_content = html_content.replace(
    '<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3 py-1 d-flex align-items-center" title="Identity verified via University Email">',
    '<span id="verificationBadge" class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-3 py-1 d-flex align-items-center" title="Click to Request Verification" style="cursor: pointer;" data-bs-toggle="modal" data-bs-target="#requestVerificationModal">'
)
html_content = html_content.replace(
    '<i class="bi bi-check-circle-fill me-2"></i> Verified Student\n                    </span>',
    '<i class="bi bi-patch-exclamation-fill me-2"></i> Unverified\n                    </span>'
)

# 2. Add Social Links inputs to edit modal
edit_modal_insertion = """
                        <div class="mb-3">
                            <label class="form-label small text-secondary">LinkedIn URL</label>
                            <input type="url" class="form-control bg-dark border-secondary text-white" id="editLinkedin" placeholder="https://linkedin.com/in/username">
                        </div>
                        <div class="mb-3">
                            <label class="form-label small text-secondary">GitHub URL</label>
                            <input type="url" class="form-control bg-dark border-secondary text-white" id="editGithub" placeholder="https://github.com/username">
                        </div>
                        <div class="mb-3">
                            <label class="form-label small text-secondary">Portfolio URL</label>
                            <input type="url" class="form-control bg-dark border-secondary text-white" id="editPortfolio" placeholder="https://mywebsite.com">
                        </div>
"""
if 'editLinkedin' not in html_content:
    html_content = html_content.replace(
        '<button type="submit" class="btn btn-primary-gradient w-100 mt-2">Save Changes</button>',
        edit_modal_insertion + '\n                        <button type="submit" class="btn btn-primary-gradient w-100 mt-2">Save Changes</button>'
    )

# 3. Add Skill Button
html_content = html_content.replace(
    '<h5 class="fw-bold mb-4">My Skills</h5>',
    '<div class="d-flex justify-content-between align-items-center mb-4"><h5 class="fw-bold mb-0">My Skills</h5><button class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#addSkillModal"><i class="bi bi-plus"></i> Add Skill</button></div>'
)

# 4. Proof of Work Container ID and button trigger
html_content = html_content.replace(
    '<button class="btn btn-sm btn-outline-primary rounded-pill"><i class="bi bi-plus-lg"></i> Add</button>',
    '<button class="btn btn-sm btn-outline-primary rounded-pill" data-bs-toggle="modal" data-bs-target="#addProjectModal"><i class="bi bi-plus-lg"></i> Add</button>'
)

html_content = html_content.replace(
    '<div class="d-flex flex-column gap-3">\n                        <!-- Project 1 -->',
    '<div class="d-flex flex-column gap-3" id="proofOfWorkContainer">\n                        <!-- Project 1 -->'
)

# 5. Append New Modals
new_modals = """
    <!-- Request Verification Modal -->
    <div class="modal fade" id="requestVerificationModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content glass-card p-3">
                <div class="modal-header border-0">
                    <h5 class="modal-title fw-bold">Request Student Verification</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="verifyForm">
                        <p class="text-secondary small mb-3">Please enter your university .edu email to verify your student status. A confirmation link will be sent.</p>
                        <div class="mb-3">
                            <label class="form-label small text-secondary">University Email</label>
                            <input type="email" class="form-control bg-dark border-secondary text-white" id="verifyEmail" placeholder="student@university.edu" required>
                        </div>
                        <button type="submit" class="btn btn-success w-100 mt-2">Send Verification</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Add Skill Modal -->
    <div class="modal fade" id="addSkillModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content glass-card p-3">
                <div class="modal-header border-0">
                    <h5 class="modal-title fw-bold">Add a Skill</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="addSkillForm">
                        <div class="mb-3">
                            <label class="form-label small text-secondary">Skill Name</label>
                            <input type="text" class="form-control bg-dark border-secondary text-white" id="newSkillName" placeholder="e.g. React.js, Public Speaking" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label small text-secondary">Category</label>
                            <div class="d-flex gap-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="skillCategory" id="catTeach" value="teach" checked>
                                    <label class="form-check-label text-white" for="catTeach">I want to TEACH this</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="skillCategory" id="catLearn" value="learn">
                                    <label class="form-check-label text-white" for="catLearn">I want to LEARN this</label>
                                </div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label small text-secondary">Proficiency</label>
                            <select class="form-select bg-dark border-secondary text-white" id="skillProficiency">
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate" selected>Intermediate</option>
                                <option value="Expert">Expert</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary-gradient w-100 mt-2">Add Skill</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Add Project/Portfolio Modal -->
    <div class="modal fade" id="addProjectModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content glass-card p-3">
                <div class="modal-header border-0">
                    <h5 class="modal-title fw-bold">Add Proof of Work</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="addProjectForm">
                        <div class="mb-3">
                            <label class="form-label small text-secondary">Project Title</label>
                            <input type="text" class="form-control bg-dark border-secondary text-white" id="projTitle" placeholder="e.g. Campus Event App" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label small text-secondary">Tech Stack / Tools</label>
                            <input type="text" class="form-control bg-dark border-secondary text-white" id="projStack" placeholder="e.g. Flutter, Firebase" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label small text-secondary">Project URL (GitHub, Figma, Live Site)</label>
                            <input type="url" class="form-control bg-dark border-secondary text-white" id="projUrl" placeholder="https://..." required>
                        </div>
                        <button type="submit" class="btn btn-primary-gradient w-100 mt-2">Add Project</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
"""

if 'id="requestVerificationModal"' not in html_content:
    # Append right before the scripts at the bottom
    html_content = html_content.replace('<script src="assets/js/theme.js"></script>', new_modals + '\n    <script src="assets/js/theme.js"></script>')

with open(profile_html, 'w', encoding='utf-8') as f:
    f.write(html_content)

print("HTML structure for all modals injected.")
