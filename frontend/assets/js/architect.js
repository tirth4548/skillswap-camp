// Venture Architect AI Logic
let currentPhase = 0;
const archData = {
    title: '',
    problem: '',
    platform: '',
    complexity: 'Moderate'
};

const phases = [
    {
        title: "Phase 1: The Core Vision",
        subtitle: "Defining your project's identity",
        content: `
            <div class="mb-4">
                <label class="extra-small fw-bold text-secondary text-uppercase mb-2">Project Name</label>
                <input type="text" id="v-title" class="form-control bg-dark border-secondary border-opacity-25 text-white p-3 rounded-3" placeholder="e.g. Campus Connect">
            </div>
            <div>
                <label class="extra-small fw-bold text-secondary text-uppercase mb-2">The Problem (What are you solving?)</label>
                <textarea id="v-problem" class="form-control bg-dark border-secondary border-opacity-25 text-white p-3 rounded-3" rows="4" placeholder="e.g. Students waste hours looking for reliable study partners..."></textarea>
            </div>
        `
    },
    {
        title: "Phase 2: Platform Selection",
        subtitle: "Where will your users find you?",
        content: `
            <div class="row g-4">
                <div class="col-md-4">
                    <div class="choice-card" onclick="selectArchOption('platform', 'Mobile App', this)">
                        <i class="bi bi-phone fs-1 text-primary mb-2 d-block"></i>
                        <h6 class="fw-bold mb-1">Mobile App</h6>
                        <p class="extra-small text-secondary mb-0">iOS & Android</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="choice-card" onclick="selectArchOption('platform', 'Web Platform', this)">
                        <i class="bi bi-laptop fs-1 text-info mb-2 d-block"></i>
                        <h6 class="fw-bold mb-1">Web Platform</h6>
                        <p class="extra-small text-secondary mb-0">Browsers & SEO</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="choice-card" onclick="selectArchOption('platform', 'Hardware/IoT', this)">
                        <i class="bi bi-cpu fs-1 text-warning mb-2 d-block"></i>
                        <h6 class="fw-bold mb-1">Physical Device</h6>
                        <p class="extra-small text-secondary mb-0">Sensors & Robotics</p>
                    </div>
                </div>
            </div>
        `
    },
    {
        title: "Phase 3: Synthesis",
        subtitle: "Venture AI is forging your blueprint",
        content: `
            <div class="text-center py-5">
                <div class="spinner-border text-primary fs-3 mb-3" style="width: 3rem; height: 3rem;"></div>
                <p class="text-secondary">Analyzing skill availability on campus...</p>
                <p class="extra-small text-primary opacity-50 pulse-animation">Matching tech stacks with active learners...</p>
            </div>
        `
    }
];

document.addEventListener('DOMContentLoaded', () => {
    fetchProfile();

    const startBtn = document.getElementById('startWizardBtn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            document.getElementById('architect-initial').classList.add('d-none');
            document.getElementById('architect-wizard').classList.remove('d-none');
            renderPhase();
        });
    }

    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');

    if (nextBtn) nextBtn.addEventListener('click', proceedPhase);
    if (prevBtn) prevBtn.addEventListener('click', backtrackPhase);

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        });
    }
});

async function fetchProfile() {
    try {
        const res = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const user = await res.json();
            document.getElementById('sidebarUserName').textContent = user.username;
            document.getElementById('sidebarCredits').textContent = `${user.credits} Credits`;
            if (user.profile_pic) {
                document.getElementById('sidebarAvatar').src = user.profile_pic;
            }
        }
    } catch (e) {
        console.error('Fetch profile failed', e);
    }
}

function selectArchOption(key, value, el) {
    archData[key] = value;
    const cards = el.parentElement.parentElement.querySelectorAll('.choice-card');
    cards.forEach(c => c.classList.remove('active'));
    el.classList.add('active');
}

function renderPhase() {
    const phase = phases[currentPhase];
    document.getElementById('wizard-title').innerText = phase.title;
    document.getElementById('wizard-subtitle').innerText = phase.subtitle;
    document.getElementById('wizard-body').innerHTML = phase.content;

    const progress = ((currentPhase + 1) / phases.length) * 100;
    document.getElementById('wizard-progress-text').innerText = Math.round(progress) + '%';
    document.getElementById('wizard-progress-bar').style.width = progress + '%';

    document.getElementById('prevBtn').disabled = (currentPhase === 0);

    if (currentPhase === phases.length - 1) {
        document.getElementById('nextBtn').classList.add('d-none');
        setTimeout(showFinalBlueprint, 2500);
    } else {
        document.getElementById('nextBtn').classList.remove('d-none');
        document.getElementById('nextBtn').innerText = (currentPhase === phases.length - 2) ? "Generate Blueprint" : "Continue";
    }

    // Save inputs if moving back and forth
    if (currentPhase === 0) {
        const tInput = document.getElementById('v-title');
        const pInput = document.getElementById('v-problem');
        if (tInput) tInput.value = archData.title;
        if (pInput) pInput.value = archData.problem;

        tInput.onchange = (e) => archData.title = e.target.value;
        pInput.onchange = (e) => archData.problem = e.target.value;
    }
}

function proceedPhase() {
    if (currentPhase === 0) {
        archData.title = document.getElementById('v-title').value;
        archData.problem = document.getElementById('v-problem').value;
        if (!archData.title) return alert('Please name your venture!');
    }
    if (currentPhase < phases.length - 1) {
        currentPhase++;
        renderPhase();
    }
}

function backtrackPhase() {
    if (currentPhase > 0) {
        currentPhase--;
        renderPhase();
    }
}

function showFinalBlueprint() {
    document.getElementById('architect-wizard').classList.add('d-none');
    const result = document.getElementById('architect-result');
    result.classList.remove('d-none');

    result.innerHTML = `
        <div class="blueprint-card p-4 mb-4 rounded-4 shadow-lg animate__animated animate__fadeInUp">
            <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-white border-opacity-10">
                <h4 class="fw-bold text-white mb-0"><i class="bi bi-journal-check me-2 text-primary"></i>Technical Blueprint</h4>
                <div class="badge bg-primary text-white p-2 px-3">FORGED BY AI</div>
            </div>
            
            <div class="row g-4">
                <div class="col-md-7">
                    <p class="extra-small text-secondary fw-bold text-uppercase mb-2">Venture Overview</p>
                    <h5 class="text-white fw-bold mb-2">${archData.title || 'Untitled Venture'}</h5>
                    <p class="small text-secondary mb-4">${archData.problem || 'No problem statement provided.'}</p>
                    
                    <div class="p-4 rounded-4 bg-primary bg-opacity-10 border border-primary border-opacity-20 backdrop-blur">
                        <p class="extra-small text-primary fw-bold text-uppercase mb-3 letter-spacing-1">
                            <i class="bi bi-robot me-2"></i>AI Architecture Blueprint
                        </p>
                        <div class="row g-3">
                            <div class="col-6">
                                <label class="extra-small text-secondary mb-1">Architecture Pattern</label>
                                <p class="small text-white mb-0">${getPattern(archData.platform)}</p>
                            </div>
                            <div class="col-6">
                                <label class="extra-small text-secondary mb-1">Recommended Stack</label>
                                <p class="small text-white mb-0">${getStack(archData.platform)}</p>
                            </div>
                            <div class="col-12">
                                <label class="extra-small text-secondary mb-1">Escalation Roadmap</label>
                                <p class="extra-small text-secondary mb-0">
                                    Start with a monolithic MVP using ${getStack(archData.platform).split('/')[0].trim()}. 
                                    Integrate ${getService(archData.platform)} for rapid scalability and edge validation.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-5">
                    <p class="extra-small text-secondary fw-bold text-uppercase mb-2">Required Talent Pool</p>
                    <div class="d-flex flex-column gap-2 mb-4">
                        <div class="role-pill d-flex justify-content-between bg-dark bg-opacity-50 p-2 px-3 rounded-3 border border-white border-opacity-10">
                            <span class="extra-small">${getMainRole(archData.platform)}</span>
                            <i class="bi bi-person-plus text-info"></i>
                        </div>
                        <div class="role-pill d-flex justify-content-between bg-dark bg-opacity-50 p-2 px-3 rounded-3 border border-white border-opacity-10">
                            <span class="extra-small">${getSecondaryRole(archData.platform)}</span>
                            <i class="bi bi-palette text-warning"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="d-flex gap-3">
            <button class="btn btn-primary-gradient flex-grow-1 py-3 rounded-pill fw-bold shadow-lg" onclick="launchWithBlueprint()">
                BROADCAST TO STARTUP HUB
            </button>
            <button class="btn btn-outline-secondary rounded-pill px-4" onclick="location.reload()">
                RESET
            </button>
        </div>
    `;
}

function getStack(platform) {
    if (platform === 'Mobile App') return 'React Native / Flutter';
    if (platform === 'Web Platform') return 'Next.js / Tailwind';
    return 'C++ / Arduino Cloud';
}

function getPattern(platform) {
    if (platform === 'Mobile App') return 'Client-Server / REST';
    if (platform === 'Web Platform') return 'SSR / Microservices';
    return 'Event Driven / M2M';
}

function getService(platform) {
    if (platform === 'Mobile App') return 'Firebase SDK';
    if (platform === 'Web Platform') return 'Supabase / PostgreSQL';
    return 'MQTT Mesh Networking';
}

function getMainRole(platform) {
    if (platform === 'Mobile App') return 'Fullstack Flutter Dev';
    if (platform === 'Web Platform') return 'Fullstack React Dev';
    return 'Embedded Systems Eng';
}

function getSecondaryRole(platform) {
    if (platform === 'Mobile App') return 'UI/UX Mobile Designer';
    if (platform === 'Web Platform') return 'Product Designer';
    return 'PCB / Hardware Designer';
}

async function launchWithBlueprint() {
    document.getElementById('pitchTitle').value = archData.title;
    document.getElementById('pitchProblem').value = archData.problem;
    const modal = new bootstrap.Modal(document.getElementById('pitchModal'));
    modal.show();

    document.getElementById('autoPitchForm').onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            title: document.getElementById('pitchTitle').value,
            problem_statement: document.getElementById('pitchProblem').value,
            vision: `AI Architect Blueprint for ${archData.platform}`,
            max_members: 5
        };

        try {
            const res = await fetch(`${API_URL}/startups/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert('Success! Your venture blueprint has been broadcasted to the Startup Hub.');
                window.location.href = 'startups.html';
            } else {
                alert('Launch failed. Please check your data.');
            }
        } catch (err) {
            console.error(err);
        }
    }
}
