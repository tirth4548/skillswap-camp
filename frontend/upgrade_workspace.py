import os
import re

ws_html = 'c:/Users/HP/OneDrive/Desktop/skillswaprec/skill/frontend/workspace.html'
ws_js = 'c:/Users/HP/OneDrive/Desktop/skillswaprec/skill/frontend/assets/js/workspace.js'

# --- 1. Modify workspace.html ---
with open(ws_html, 'r', encoding='utf-8') as f:
    html_content = f.read()

# Replace DOING column with IN REVIEW
html_content = html_content.replace('<h6 class="text-warning fw-bold mb-0 letter-spacing-1 small"><i\n                                            class="bi bi-circle-fill me-2 extra-small"></i>DOING</h6>', '<h6 class="text-warning fw-bold mb-0 letter-spacing-1 small" style="text-shadow: 0 0 10px rgba(234, 179, 8, 0.5);"><i class="bi bi-shield-lock-fill me-2 extra-small text-warning"></i>IN REVIEW</h6>')
html_content = html_content.replace('id="doingCount"', 'id="reviewCount"')
html_content = html_content.replace('id="doingCol"', 'id="reviewCol"')

with open(ws_html, 'w', encoding='utf-8') as f:
    f.write(html_content)


# --- 2. Modify workspace.js ---
with open(ws_js, 'r', encoding='utf-8') as f:
    js_content = f.read()

# Update renderTasks logic to map 'doing' to 'review' and implement Assignment & Approval Security Mockup
render_tasks_replacement = """function renderTasks(tasks) {
    const todoCol = document.getElementById('todoCol');
    const reviewCol = document.getElementById('reviewCol');
    const doneCol = document.getElementById('doneCol');

    const todoCount = document.getElementById('todoCount');
    const reviewCount = document.getElementById('reviewCount');
    const doneCount = document.getElementById('doneCount');

    todoCol.innerHTML = '';
    reviewCol.innerHTML = '';
    doneCol.innerHTML = '';

    let counts = { todo: 0, review: 0, done: 0 };

    // Injecting Mock Tasks for UI demonstration if DB empty
    if(tasks.length === 0) {
        tasks = [
            { id: 101, title: 'Design Landing Page', description: 'Create Figma wires', status: 'todo', assignee: { full_name: 'Alex M.' } },
            { id: 102, title: 'Setup Auth API', description: 'Connect JWT endpoints', status: 'review', assignee: { full_name: 'Sarah T.' } }
        ];
    }

    tasks.forEach(task => {
        // Map 'doing' to 'review' if fetching from old DB logic
        const status = task.status === 'doing' ? 'review' : task.status;
        counts[status]++;
        
        const assignee = task.assignee || { username: 'Unassigned', full_name: 'Unassigned' };
        const avatarName = assignee.full_name || assignee.username;
        const colorClass = status === 'todo' ? 'border-info' : status === 'review' ? 'border-warning shadow-sm' : 'border-success opacity-75';

        // Security / Actions Logic Mockup
        let actionButtons = '';
        if (status === 'todo') {
            actionButtons = `<button class="btn btn-xs btn-outline-warning w-100 mt-2" onclick="alert('Submitted for review!'); updateTaskStatus(${task.id}, 'doing')"><i class="bi bi-send-check"></i> Submit for Review</button>`;
        } else if (status === 'review') {
            actionButtons = `
                <div class="d-flex gap-2 mt-2">
                    <button class="btn btn-xs btn-outline-danger w-50" onclick="alert('Task rejected. Sending back to TODO.'); updateTaskStatus(${task.id}, 'todo')">Reject</button>
                    <button class="btn btn-xs btn-success w-50" onclick="alert('Task Officially Approved!'); updateTaskStatus(${task.id}, 'done')"><i class="bi bi-shield-check"></i> Approve</button>
                </div>
            `;
        } else if (status === 'done') {
            actionButtons = `<button class="btn btn-xs btn-outline-success w-100 mt-2 disabled" disabled><i class="bi bi-check2-all"></i> Approved & Closed</button>`;
        }

        const card = `
            <div class="task-card glass-card border-0 border-start border-4 ${colorClass} p-3 mb-3 animate-fade-in hover-scale" style="background: rgba(15, 23, 42, 0.8);">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="fw-bold mb-0 small text-white">${task.title}</h6>
                    ${status === 'review' ? '<span class="badge bg-warning text-dark extra-small rounded-pill animate-pulse">LOCKED</span>' : ''}
                </div>
                <p class="text-secondary extra-small mb-3">${task.description || 'No description provided.'}</p>
                <div class="d-flex justify-content-between align-items-center bg-dark bg-opacity-50 rounded p-2 mb-2">
                    <div class="d-flex align-items-center gap-2">
                        <img src="https://ui-avatars.com/api/?name=${avatarName}&background=random&color=fff" class="rounded-circle border border-secondary border-opacity-25" width="24" height="24">
                        <div>
                            <span class="d-block text-white extra-small fw-bold">${avatarName}</span>
                            <span class="d-block text-secondary" style="font-size:0.6rem">Assignee</span>
                        </div>
                    </div>
                </div>
                ${actionButtons}
            </div>
        `;

        if (status === 'todo') todoCol.innerHTML += card;
        else if (status === 'review') reviewCol.innerHTML += card;
        else if (status === 'done') doneCol.innerHTML += card;
    });

    if (todoCount) todoCount.textContent = counts.todo;
    if (reviewCount) reviewCount.textContent = counts.review;
    if (doneCount) doneCount.textContent = counts.done;
}"""

# Inject renderTasks replacement
js_content = re.sub(
    r'function renderTasks\(tasks\) \{[\s\S]*?(?=\n// Add Task)',
    render_tasks_replacement + '\n',
    js_content
)


# Update renderResources to inject Mock Beautiful Grid if empty
render_resources_replacement = """function renderResources(resources) {
    const list = document.getElementById('resourcesList');
    if (!list) return;

    // Premium Mock Injection
    if (resources.length === 0) {
        resources = [
            { type: 'file', title: 'Q3 UI Architecture.fig', url: '#', uploader: 'Sarah T.' },
            { type: 'link', title: 'React Performance Auth Auth...', url: '#', uploader: 'Alex M.' },
            { type: 'video', title: 'API Endpoints Guide 101', url: '#', uploader: 'You' }
        ];
    }

    list.innerHTML = resources.map(res => {
        let icon = 'bi-link-45deg';
        let bgClass = 'bg-primary';
        let textClass = 'text-primary';
        
        if (res.type === 'file') {
            icon = 'bi-filetype-figma';
            bgClass = 'bg-pink-500';
            textClass = 'text-pink-400';
        } else if (res.type === 'video') {
            icon = 'bi-youtube';
            bgClass = 'bg-danger';
            textClass = 'text-danger';
        } else {
             icon = 'bi-github';
             textClass = 'text-white';
        }
        
        const avatarName = res.uploader || 'User';

        return `
            <div class="col-md-6 animate-fade-in">
                <a href="${res.url}" target="_blank" class="text-decoration-none text-reset">
                    <div class="glass-card p-3 border border-secondary border-opacity-25 hover-scale h-100 position-relative overflow-hidden" style="background: rgba(15, 23, 42, 0.7);">
                        <div class="position-absolute top-0 end-0 p-2">
                             <img src="https://ui-avatars.com/api/?name=${avatarName}&background=random&color=fff" class="rounded-circle shadow-sm" width="24" height="24" title="Uploaded by ${avatarName}">
                        </div>
                        <div class="d-flex align-items-center gap-3">
                            <div class="${bgClass} bg-opacity-10 p-3 rounded-3 ${textClass} border border-${textClass} border-opacity-25 shadow-sm">
                                <i class="bi ${icon} fs-3"></i>
                            </div>
                            <div class="overflow-hidden pe-4">
                                <h6 class="text-white fw-bold mb-1 text-truncate" title="${res.title}">${res.title}</h6>
                                <p class="text-secondary opacity-75 mb-0" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px;">${res.type} RESOURCE</p>
                            </div>
                        </div>
                    </div>
                </a>
            </div>
        `;
    }).join('');
}"""

js_content = re.sub(
    r'function renderResources\(resources\) \{[\s\S]*?(?=\n// Team & Endorsements Logic|\ndocument\.getElementById\(\'addResourceForm)',
    render_resources_replacement + '\n',
    js_content
)

with open(ws_js, 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Workspace Upgrade Executed Successfully.")
