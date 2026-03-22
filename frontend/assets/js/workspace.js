const API_URL = 'https://skillswap-api-p79d.onrender.com';
const token = localStorage.getItem('token');
const urlParams = new URLSearchParams(window.location.search);
const wsId = urlParams.get('id');

if (!token || !wsId) {
    window.location.href = 'dashboard.html';
}

async function initWorkspace() {
    await fetchMyProfile();
    await fetchWorkspaceDetails();
    await fetchResources();
    await fetchMessages();
    setupChatPolling();
}

async function fetchMyProfile() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const user = await response.json();
            window.myProfileId = user.id;
            const avatar = document.getElementById('userAvatar');
            if (avatar) avatar.src = `https://ui-avatars.com/api/?name=${user.full_name || user.username}&background=random&color=fff`;
        }
    } catch (e) { console.error(e); }
}

async function fetchWorkspaceDetails() {
    try {
        const response = await fetch(`${API_URL}/workspaces/${wsId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            console.error('Failed to fetch workspace');
            return;
        }

        const ws = await response.json();
        if (ws) {
            window.currentWorkspace = ws; // Store for Team rendering
            const titleEl = document.getElementById('wsTitleHead');
            if (titleEl) titleEl.textContent = ws.title;

            populateAssigneeDropdown(ws.members);
            renderTasks(ws.tasks || []);
        }

    } catch (error) {
        console.error('Error fetching workspace data:', error);
    }
}

function populateAssigneeDropdown(members) {
    console.log("Populating assignee dropdown with members:", members);
    const select = document.getElementById('taskAssign');
    if (!select) return;

    // Keep the "Select Member" option
    select.innerHTML = '<option value="">Select Member</option>';

    if (!members || members.length === 0) {
        console.warn("No members found for this workspace");
        return;
    }

    members.forEach(member => {
        const name = member.full_name || member.username;
        select.innerHTML += `<option value="${member.id}">${name}</option>`;
    });
}

function renderTasks(tasks) {
    const todoCol = document.getElementById('todoCol');
    const doingCol = document.getElementById('doingCol');
    const doneCol = document.getElementById('doneCol');

    const todoCount = document.getElementById('todoCount');
    const doingCount = document.getElementById('doingCount');
    const doneCount = document.getElementById('doneCount');

    todoCol.innerHTML = '';
    doingCol.innerHTML = '';
    doneCol.innerHTML = '';

    let counts = { todo: 0, doing: 0, done: 0 };

    tasks.forEach(task => {
        counts[task.status]++;
        const assignee = task.assignee || { username: 'Unassigned', full_name: 'Unassigned' };
        const avatarName = assignee.full_name || assignee.username;
        const colorClass = task.status === 'todo' ? 'border-info' : task.status === 'doing' ? 'border-warning' : 'border-success';

        const card = `
            <div class="task-card glass-card border-0 border-start border-4 ${colorClass} p-3 mb-3 animate-fade-in hover-scale">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="fw-bold mb-0 small text-white">${task.title}</h6>
                    <div class="dropdown">
                        <i class="bi bi-three-dots-vertical text-secondary cursor-pointer" data-bs-toggle="dropdown"></i>
                        <ul class="dropdown-menu dropdown-menu-dark">
                            <li><a class="dropdown-item small" href="#" onclick="updateTaskStatus(${task.id}, 'todo')">Move to Todo</a></li>
                            <li><a class="dropdown-item small" href="#" onclick="updateTaskStatus(${task.id}, 'doing')">Move to Doing</a></li>
                            <li><a class="dropdown-item small" href="#" onclick="updateTaskStatus(${task.id}, 'done')">Move to Done</a></li>
                        </ul>
                    </div>
                </div>
                <p class="text-secondary extra-small mb-3">${task.description || 'No description provided.'}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center gap-2">
                        <img src="https://ui-avatars.com/api/?name=${avatarName}&background=random&color=fff" class="rounded-circle border border-secondary border-opacity-25" width="20" height="20">
                        <span class="text-secondary extra-small">${avatarName}</span>
                    </div>
                    <div class="btn-group">
                        ${task.status !== 'todo' ? `<button class="btn btn-xs btn-link text-secondary p-0" onclick="updateTaskStatus(${task.id}, 'todo')"><i class="bi bi-arrow-left"></i></button>` : ''}
                        ${task.status !== 'done' ? `<button class="btn btn-xs btn-link text-primary p-0 ms-2" onclick="updateTaskStatus(${task.id}, '${task.status === 'todo' ? 'doing' : 'done'}')"><i class="bi bi-arrow-right"></i></button>` : ''}
                    </div>
                </div>
            </div>
        `;

        if (task.status === 'todo') todoCol.innerHTML += card;
        else if (task.status === 'doing') doingCol.innerHTML += card;
        else if (task.status === 'done') doneCol.innerHTML += card;
    });

    if (todoCount) todoCount.textContent = counts.todo;
    if (doingCount) doingCount.textContent = counts.doing;
    if (doneCount) doneCount.textContent = counts.done;
}

// Add Task
document.getElementById('addTaskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const assignVal = document.getElementById('taskAssign').value;
    const data = {
        title: document.getElementById('taskTitle').value,
        description: '', // Optional for now
        assigned_to: assignVal ? parseInt(assignVal) : null,
        workspace_id: parseInt(wsId)
    };

    try {
        const response = await fetch(`${API_URL}/workspaces/${wsId}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            console.log('Task created successfully');
            // Close modal
            const modalEl = document.getElementById('addTaskModal');
            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.hide();

            document.getElementById('addTaskForm').reset();
            fetchWorkspaceDetails(); // Refresh
        } else {
            const err = await response.json();
            console.error('Task creation failed:', err);
            alert(`Failed to create task: ${typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail)}`);
        }
    } catch (error) {
        console.error('Error creating task:', error);
        alert('An unexpected error occurred. Check console.');
    }
});

// Workspace Chat
async function fetchMessages() {
    try {
        const response = await fetch(`${API_URL}/workspaces/${wsId}/messages`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const messages = await response.json();
            renderMessages(messages);
        }
    } catch (e) { console.error('Error fetching messages:', e); }
}

function renderMessages(messages) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const myId = window.myProfileId;
    const startPlaceholder = `
        <div class="text-center my-3 animate-fade-in">
            <span class="text-secondary extra-small px-3 py-1 bg-dark bg-opacity-50 rounded-pill">Conversation Started</span>
        </div>
    `;

    chatMessages.innerHTML = startPlaceholder + messages.map(msg => {
        const isSent = msg.sender_id === myId;
        const senderName = msg.sender ? (msg.sender.full_name || msg.sender.username) : `User ${msg.sender_id}`;

        // Trigger pulse for received messages
        if (!isSent && window.chatPulse) {
            window.chatPulse.triggerPulse(0x6366f1);
        }

        return `
            <div class="d-flex ${isSent ? 'justify-content-end' : 'justify-content-start'} mb-2 animate-fade-in">
                <div class="${isSent ? 'order-2 ms-2' : 'order-1 me-2'}">
                    <img src="https://ui-avatars.com/api/?name=${senderName}&background=${isSent ? '6366f1' : '334155'}&color=fff" class="rounded-circle shadow-sm" width="24" height="24">
                </div>
                <div class="msg-bubble shadow-sm ${isSent ? 'msg-sent order-1' : 'msg-received order-2'}" style="margin-bottom: 0; padding: 0.5rem 0.8rem; font-size: 0.85rem;">
                    ${!isSent ? `<small class="text-info fw-bold d-block mb-1" style="font-size: 0.6rem;">${senderName}</small>` : ''}
                    ${msg.content}
                    <div class="text-end">
                        <small class="${isSent ? 'text-white-50' : 'text-secondary'} mt-1" style="font-size: 0.5rem;">${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function updateTaskStatus(taskId, newStatus) {
    try {
        const response = await fetch(`${API_URL}/workspaces/tasks/${taskId}/status?status=${newStatus}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            fetchWorkspaceDetails(); // Refresh
        } else {
            const err = await response.json();
            alert(`Failed to update status: ${err.detail}`);
        }
    } catch (e) { console.error('Error updating task status:', e); }
}

document.getElementById('sendBtn').addEventListener('click', async () => {
    const input = document.getElementById('msgInput');
    if (!input.value) return;

    try {
        const response = await fetch(`${API_URL}/workspaces/${wsId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content: input.value })
        });

        if (response.ok) {
            input.value = '';
            if (window.chatPulse) window.chatPulse.triggerPulse(0xec4899); // Pink pulse for sent message
            fetchMessages(); // Refresh immediately
        }
    } catch (e) { console.error('Error sending message:', e); }
});

// Initial Profile Fetch for Chat
async function initChat() {
    try {
        const res = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const profile = await res.json();
        window.myProfileId = profile.id;

        fetchMessages();

        // Init Pulse Background
        if (window.initChatPulse) {
            window.chatPulse = window.initChatPulse('chat-pulse-bg');
        }

        // Start polling
        setInterval(fetchMessages, 3000);
    } catch (e) { console.error(e); }
}

initChat();

// Invite Member
document.getElementById('inviteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('inviteUsername').value;

    try {
        const response = await fetch(`${API_URL}/workspaces/${wsId}/members?username=${username}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert(`User ${username} added to the workspace!`);
            location.reload();
        } else {
            const err = await response.json();
            alert(`Failed to add user: ${err.detail}`);
        }
    } catch (error) {
        console.error('Error inviting member:', error);
    }
});

async function fetchFriends() {
    try {
        const response = await fetch(`${API_URL}/friends/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const friends = await response.json();
            renderFriends(friends);
        }
    } catch (e) { console.error('Error fetching friends:', e); }
}

function renderFriends(friends) {
    const list = document.getElementById('friendsListInvite');
    if (!list) return;

    if (friends.length === 0) {
        list.innerHTML = '<p class="text-secondary small">Add some friends first!</p>';
        return;
    }

    list.innerHTML = friends.map(friend => `
        <div class="glass-card p-2 d-flex justify-content-between align-items-center" style="font-size: 0.85rem;">
            <span><i class="bi bi-person me-2"></i><b>${friend.username}</b></span>
            <button class="btn btn-xs btn-outline-primary py-0 px-2" onclick="inviteFriend('${friend.username}')">Add</button>
        </div>
    `).join('');
}

async function inviteFriend(username) {
    try {
        const response = await fetch(`${API_URL}/workspaces/${wsId}/members?username=${username}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert(`User ${username} added!`);
            location.reload();
        } else {
            const err = await response.json();
            alert(`Error: ${err.detail}`);
        }
    } catch (e) { console.error(e); }
}

// Resource Library Logic
async function fetchResources() {
    try {
        const response = await fetch(`${API_URL}/workspaces/${wsId}/resources`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const resources = await response.json();
            renderResources(resources);
        }
    } catch (e) {
        console.error('Error fetching resources:', e);
    }
}

function renderResources(resources) {
    const list = document.getElementById('resourcesList');
    if (!list) return;

    if (resources.length === 0) {
        list.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-folder2-open fs-1 text-secondary opacity-25"></i>
                <p class="text-secondary mt-2">No resources shared yet.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = resources.map(res => {
        let icon = 'bi-link-45deg';
        if (res.type === 'file') icon = 'bi-file-earmark-text';
        if (res.type === 'video') icon = 'bi-play-circle';

        return `
            <div class="col-md-6 animate-fade-in">
                <a href="${res.url}" target="_blank" class="text-decoration-none">
                    <div class="glass-card p-3 border border-secondary border-opacity-10 hover-scale h-100">
                        <div class="d-flex align-items-center gap-3">
                            <div class="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
                                <i class="bi ${icon} fs-4"></i>
                            </div>
                            <div class="overflow-hidden">
                                <h6 class="text-white fw-bold mb-1 text-truncate" title="${res.title}">${res.title}</h6>
                                <p class="text-secondary extra-small mb-0 text-uppercase letter-spacing-1">${res.type}</p>
                            </div>
                        </div>
                    </div>
                </a>
            </div>
        `;
    }).join('');
}

document.getElementById('addResourceForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        title: document.getElementById('resTitle').value,
        url: document.getElementById('resUrl').value,
        type: document.getElementById('resType').value
    };

    try {
        const response = await fetch(`${API_URL}/workspaces/${wsId}/resources`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const modalEl = document.getElementById('addResourceModal');
            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.hide();
            document.getElementById('addResourceForm').reset();
            fetchResources();
        } else {
            const err = await response.json();
            alert(`Failed: ${err.detail}`);
        }
    } catch (e) { console.error(e); }
});

// Team & Endorsements Logic
function updateActionBtn(tab) {
    const btn = document.getElementById('actionBtn');
    if (!btn) return;
    if (tab === 'task') {
        btn.innerHTML = '<i class="bi bi-plus-lg me-2"></i> New Task';
        btn.setAttribute('data-bs-target', '#addTaskModal');
    } else if (tab === 'resource') {
        btn.innerHTML = '<i class="bi bi-plus-lg me-2"></i> Add Resource';
        btn.setAttribute('data-bs-target', '#addResourceModal');
    } else {
        btn.innerHTML = '<i class="bi bi-person-plus me-2"></i> Invite';
        btn.setAttribute('data-bs-target', '#inviteMemberModal');
    }
}

async function fetchTeam() {
    // We already have members from fetchWorkspaceDetails, but we might want to refresh
    await fetchWorkspaceDetails();
    renderTeam(window.currentWorkspace.members || []);
}

function renderTeam(members) {
    const list = document.getElementById('teamList');
    if (!list) return;

    list.innerHTML = members.map(m => {
        const isMe = m.id === window.myProfileId;
        return `
            <div class="col-md-6 animate-fade-in">
                <div class="glass-card p-3 border border-secondary border-opacity-10 h-100">
                    <div class="d-flex align-items-center gap-3 mb-3">
                        <img src="https://ui-avatars.com/api/?name=${m.full_name || m.username}&background=random&color=fff" class="rounded-circle shadow-sm" width="48" height="48">
                        <div>
                            <h6 class="text-white fw-bold mb-0">${m.full_name || m.username} ${isMe ? '<span class="badge bg-secondary extra-small ms-1">You</span>' : ''}</h6>
                            <p class="text-secondary extra-small mb-0">${m.department || 'General'}</p>
                        </div>
                    </div>
                    <div class="d-flex flex-wrap gap-2 mb-3">
                        ${(m.skills || []).filter(s => s.type === 'teach').map(s => `
                            <span class="badge bg-dark border border-secondary extra-small d-flex align-items-center gap-1">
                                ${s.skill.name}
                                ${s.endorsements?.length > 0 ? `<span class="text-warning"><i class="bi bi-check-circle-fill"></i> ${s.endorsements.length}</span>` : ''}
                            </span>
                        `).join('') || '<small class="text-secondary extra-small">No teaching skills listed</small>'}
                    </div>
                    ${!isMe ? `<button class="btn btn-xs btn-outline-warning w-100 py-1" onclick="showEndorseModal(${m.id})"><i class="bi bi-award me-1"></i> Endorse Partner</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

async function showEndorseModal(memberId) {
    const member = window.currentWorkspace.members.find(m => m.id === memberId);
    if (!member) return;

    const list = document.getElementById('endorseSkillsList');
    const teachSkills = (member.skills || []).filter(s => s.type === 'teach');

    if (teachSkills.length === 0) {
        list.innerHTML = '<p class="text-secondary text-center">This member has no teaching skills to endorse.</p>';
    } else {
        list.innerHTML = teachSkills.map(s => `
            <div class="d-flex justify-content-between align-items-center bg-dark bg-opacity-25 p-3 rounded-3 border border-secondary border-opacity-10">
                <div>
                    <h6 class="text-white fw-bold mb-0">${s.skill.name}</h6>
                    <small class="text-secondary">${s.proficiency || 'Intermediate'}</small>
                </div>
                <button class="btn btn-sm btn-primary-gradient px-3 rounded-pill" onclick="endorseSkill(${s.id})">Endorse</button>
            </div>
        `).join('');
    }

    const modal = new bootstrap.Modal(document.getElementById('endorseModal'));
    modal.show();
}

async function endorseSkill(userSkillId) {
    try {
        const response = await fetch(`${API_URL}/skills/endorse`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ user_skill_id: userSkillId })
        });

        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('endorseModal')).hide();
            alert('Endorsement sent! Building trust on campus.');
            fetchTeam();
        } else {
            const err = await response.json();
            alert(`Failed: ${err.detail}`);
        }
    } catch (e) { console.error(e); }
}

initWorkspace();

// Logout Event Listener
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
});
