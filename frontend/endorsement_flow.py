import os

html_profile = 'c:/Users/HP/OneDrive/Desktop/skillswaprec/skill/frontend/profile.html'
js_profile = 'c:/Users/HP/OneDrive/Desktop/skillswaprec/skill/frontend/assets/js/profile.js'
html_dashboard = 'c:/Users/HP/OneDrive/Desktop/skillswaprec/skill/frontend/dashboard.html'
js_dashboard = 'c:/Users/HP/OneDrive/Desktop/skillswaprec/skill/frontend/assets/js/dashboard.js'

# --- 1. Modify Profile HTML ---
with open(html_profile, 'r', encoding='utf-8') as f:
    p_html = f.read()

ask_modal = """
    <!-- Ask for Endorsement Modal -->
    <div class="modal fade" id="askEndorsementModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content glass-card p-3">
                <div class="modal-header border-0">
                    <h5 class="modal-title fw-bold">Ask for Endorsement</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="askEndorsementForm">
                        <div class="mb-3">
                            <label class="form-label small text-secondary">Select Mentor</label>
                            <select class="form-select bg-dark border-secondary text-white" id="endorseMentor">
                                <option value="Alex M." selected>Alex M. (React.js Session)</option>
                                <option value="Sarah T.">Sarah T. (UI Design Session)</option>
                                <option value="Dr. Chen">Dr. Chen (Algorithms)</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label small text-secondary">Message</label>
                            <textarea class="form-control bg-dark border-secondary text-white" rows="3" placeholder="Hey, could you verify this project we built together?"></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary-gradient w-100 mt-2">Send Request</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
"""

# Add "Ask for endorsement" button to the unverified Hawk Street UI project
if 'id="askEndorseBtn"' not in p_html:
    p_html = p_html.replace(
        '<div class="d-flex align-items-center gap-2 extra-small text-secondary opacity-75">\n                                    <i class="bi bi-shield-check"></i> Self-Reported\n                                </div>',
        '<div class="d-flex justify-content-between align-items-center w-100">\n                                    <div class="d-flex align-items-center gap-2 extra-small text-secondary opacity-75" id="selfReportedBadge">\n                                        <i class="bi bi-shield-check"></i> Self-Reported\n                                    </div>\n                                    <button class="btn btn-sm btn-outline-info rounded-pill extra-small py-0 px-2 border-opacity-50" id="askEndorseBtn" data-bs-toggle="modal" data-bs-target="#askEndorsementModal">Ask for Endorsement</button>\n                                </div>'
    )
    p_html = p_html.replace('<script src="assets/js/theme.js"></script>', ask_modal + '\n    <script src="assets/js/theme.js"></script>')

with open(html_profile, 'w', encoding='utf-8') as f:
    f.write(p_html)


# --- 2. Modify Dashboard HTML ---
with open(html_dashboard, 'r', encoding='utf-8') as f:
    d_html = f.read()

bell_ui = """
                <div class="d-flex gap-3 align-items-center">
                    <button class="btn btn-outline-secondary position-relative rounded-circle shadow-sm" data-bs-toggle="modal" data-bs-target="#mentorReviewModal" id="notificationBell">
                        <i class="bi bi-bell-fill"></i>
                        <span id="notifDot" class="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle d-none">
                            <span class="visually-hidden">New alerts</span>
                        </span>
                    </button>
                </div>
"""

mentor_modal = """
    <!-- Mentor Review Modal -->
    <div class="modal fade" id="mentorReviewModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content glass-card p-3">
                <div class="modal-header border-0">
                    <h5 class="modal-title fw-bold">Pending Project Reviews</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body" id="reviewModalBody">
                    <div class="text-center text-secondary py-4" id="emptyNotifs">
                        <i class="bi bi-inbox fs-1 opacity-50 mb-2"></i>
                        <p>No pending endorsement requests.</p>
                    </div>
                    
                    <div id="pendingRequest" class="d-none">
                        <div class="p-3 bg-dark border border-primary border-opacity-50 rounded mb-3">
                            <div class="d-flex align-items-center gap-3 mb-3">
                                <img src="https://ui-avatars.com/api/?name=User&background=6366f1&color=fff" class="rounded-circle" width="40">
                                <div>
                                    <h6 class="mb-0 fw-bold">User requested an endorsement</h6>
                                    <p class="text-secondary extra-small mb-0">Project: Hawk Street App UI (Figma)</p>
                                </div>
                            </div>
                            <div class="p-2 bg-black bg-opacity-25 rounded small text-secondary fst-italic mb-3">
                                "Hey, could you verify this project we discussed in our UI Design session?"
                            </div>
                            <a href="#" class="btn btn-sm btn-outline-info w-100 mb-3"><i class="bi bi-link-45deg"></i> View Project</a>
                            <div class="d-flex gap-2">
                                <button class="btn btn-sm btn-outline-danger w-50">Reject</button>
                                <button class="btn btn-sm btn-success w-50" id="endorseSubmitBtn">Endorse Project <i class="bi bi-check-circle"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
"""

if 'id="notificationBell"' not in d_html:
    d_html = d_html.replace(
        '<h2 class="fw-bold mb-1 holographic-header">Welcome back, <span id="userName" class="kinetic-name">User</span>! 👋</h2>\n                    <p class="text-secondary">Here\'s what\'s happening in your campus network.</p>\n                </div>',
        '<h2 class="fw-bold mb-1 holographic-header">Welcome back, <span id="userName"\n                            class="kinetic-name">User</span>! 👋</h2>\n                    <p class="text-secondary">Here\'s what\'s happening in your campus network.</p>\n                </div>\n' + bell_ui
    )
    d_html = d_html.replace('<script src="assets/js/theme.js"></script>', mentor_modal + '\n    <script src="assets/js/theme.js"></script>')

with open(html_dashboard, 'w', encoding='utf-8') as f:
    f.write(d_html)


# --- 3. Modify Profile JS ---
with open(js_profile, 'r', encoding='utf-8') as f:
    p_js = f.read()

profile_state_logic = """
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
"""

if '// --- Endorsement State Sync (Profile) ---' not in p_js:
    with open(js_profile, 'a', encoding='utf-8') as f:
        f.write('\n' + profile_state_logic)


# --- 4. Modify Dashboard JS ---
with open(js_dashboard, 'r', encoding='utf-8') as f:
    d_js = f.read()

dashboard_state_logic = """
// --- Endorsement State Sync (Dashboard) ---
document.addEventListener('DOMContentLoaded', () => {
    const state = localStorage.getItem('hawkProjectState');
    const dot = document.getElementById('notifDot');
    const emptyUI = document.getElementById('emptyNotifs');
    const pendingUI = document.getElementById('pendingRequest');
    const endorseBtn = document.getElementById('endorseSubmitBtn');

    // If there is a pending request, show the red dot and the modal UI
    if (state === 'pending') {
        if (dot) dot.classList.remove('d-none');
        if (emptyUI) emptyUI.classList.add('d-none');
        if (pendingUI) pendingUI.classList.remove('d-none');
    }

    if (endorseBtn) {
        endorseBtn.addEventListener('click', () => {
            // Mentor approves it!
            localStorage.setItem('hawkProjectState', 'endorsed');
            
            // UI updates
            endorseBtn.innerHTML = 'Approved! <i class="bi bi-check2-all"></i>';
            endorseBtn.classList.replace('btn-success', 'btn-outline-success');
            setTimeout(() => {
                const modalEl = document.getElementById('mentorReviewModal');
                const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                modal.hide();
                if (dot) dot.classList.add('d-none');
                if (emptyUI) emptyUI.classList.remove('d-none');
                if (pendingUI) pendingUI.classList.add('d-none');
            }, 1000);
        });
    }
});
"""

if '// --- Endorsement State Sync (Dashboard) ---' not in d_js:
    with open(js_dashboard, 'a', encoding='utf-8') as f:
        f.write('\n' + dashboard_state_logic)

print("Endorsement UI Workflow Successfully Generated!")
