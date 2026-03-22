const API_URL = 'http://127.0.0.1:8000';
const token = localStorage.getItem('token');

if (!token) window.location.href = 'index.html';

async function initWallet() {
    await fetchProfile();
    await fetchTransactions();
    await fetchIncomingRequests();
}

async function fetchProfile() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const profile = await response.json();
            document.getElementById('walletBalance').textContent = profile.credits + " Credits";
            const refEl = document.getElementById('referralCode');
            if (refEl) refEl.textContent = profile.referral_code || "N/A";

            // Update Sidebar Profile Hub
            const sidebarAvatar = document.getElementById('sidebarAvatar');
            if (sidebarAvatar) sidebarAvatar.src = `https://ui-avatars.com/api/?name=${profile.full_name || profile.username}&background=random&color=fff`;
            const sidebarUser = document.getElementById('sidebarUserName');
            if (sidebarUser) sidebarUser.textContent = profile.full_name || profile.username;
            const sidebarCredits = document.getElementById('sidebarCredits');
            if (sidebarCredits) sidebarCredits.textContent = `${profile.credits || 0} Credits`;

            window.currentUser = profile;
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
    }
}

async function fetchIncomingRequests() {
    try {
        const prRes = await fetch(`${API_URL}/wallet/requests/incoming`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const requests = prRes.ok ? await prRes.json() : [];

        let bountyApps = [];
        if (window.currentUser && window.currentUser.id === 1) {
            const baRes = await fetch(`${API_URL}/gigs/my-applications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            bountyApps = baRes.ok ? await baRes.json() : [];
        }

        renderIncomingRequests(requests, bountyApps);
    } catch (e) {
        console.error('Error fetching items:', e);
    }
}

function renderIncomingRequests(requests, bountyApps = []) {
    const section = document.getElementById('incomingRequestsSection');
    const list = document.getElementById('incomingRequestsList');
    if (!section || !list) return;

    if (requests.length === 0 && bountyApps.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    const reqHtml = requests.map(req => {
        const senderName = req.sender.full_name || req.sender.username;
        return `
            <div class="glass-card p-3 border border-secondary border-opacity-25 d-flex justify-content-between align-items-center animate-fade-in shadow-sm">
                <div class="d-flex align-items-center gap-3">
                    <img src="https://ui-avatars.com/api/?name=${senderName}&background=random&color=fff" class="rounded-circle border border-secondary border-opacity-25" width="40" height="40">
                    <div>
                        <h6 class="text-white fw-bold mb-0 small">${senderName} requested <span class="text-warning">${req.amount} C</span></h6>
                        <p class="text-secondary extra-small mb-0">"${req.message || 'No message provided'}"</p>
                    </div>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-xs btn-success py-1 px-3 rounded-pill extra-small fw-bold" onclick="respondToRequest(${req.id}, true)">Accept</button>
                    <button class="btn btn-xs btn-outline-danger py-1 px-3 rounded-pill extra-small fw-bold" onclick="respondToRequest(${req.id}, false)">Decline</button>
                </div>
            </div>
        `;
    });

    const bountyHtml = bountyApps.map(app => {
        const applicantName = app.applicant.full_name || app.applicant.username;
        return `
            <div class="glass-card p-3 border border-primary border-opacity-25 d-flex justify-content-between align-items-center animate-fade-in shadow-sm">
                <div class="d-flex align-items-center gap-3">
                    <div class="bg-primary bg-opacity-10 p-2 rounded-circle" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                        <i class="bi bi-lightning-charge text-primary"></i>
                    </div>
                    <div>
                        <h6 class="text-white fw-bold mb-0 small">Bounty: ${app.gig.title}</h6>
                        <p class="text-secondary extra-small mb-0">Applicant: <b>${applicantName}</b> (${app.gig.credit_reward} C)</p>
                    </div>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-xs btn-primary-gradient py-1 px-3 rounded-pill extra-small fw-bold" onclick="approveBounty(${app.id})">Approve</button>
                </div>
            </div>
        `;
    });

    list.innerHTML = [...reqHtml, ...bountyHtml].join('');
}

async function approveBounty(appId) {
    try {
        const response = await fetch(`${API_URL}/gigs/applications/${appId}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert('Bounty application approved and credits paid successfully!');
            initWallet();
        } else {
            const err = await response.json();
            alert(`Failed to approve: ${err.detail}`);
        }
    } catch (error) {
        console.error('Error approving bounty:', error);
    }
}

async function respondToRequest(requestId, approve) {
    try {
        const response = await fetch(`${API_URL}/wallet/requests/${requestId}/respond?approve=${approve}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert(approve ? 'Credits sent successfully!' : 'Request declined.');
            initWallet();
        } else {
            const err = await response.json();
            alert(`Failed: ${err.detail}`);
        }
    } catch (e) { console.error(e); }
}

function copyReferral() {
    const code = document.getElementById('referralCode').textContent;
    navigator.clipboard.writeText(code);
    alert('Referral code copied to clipboard!');
}

async function fetchTransactions() {
    try {
        const response = await fetch(`${API_URL}/gigs/credits/transactions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const transactions = await response.json();
            renderTransactions(transactions);
        }
    } catch (error) {
        console.error('Error fetching transactions:', error);
    }
}

function renderTransactions(transactions) {
    const list = document.getElementById('transactionList');
    if (!list) return;

    if (transactions.length === 0) {
        list.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-secondary">No transactions yet.</td></tr>';
        return;
    }

    list.innerHTML = transactions.map(t => {
        const isIncoming = t.to_user_id === window.currentUser?.id;
        const amountClass = isIncoming ? 'text-success' : 'text-danger';
        const amountSign = isIncoming ? '+' : '-';
        const date = new Date(t.created_at).toLocaleDateString();

        const otherUser = isIncoming ? t.from_user : t.to_user;
        const otherName = otherUser ? (otherUser.full_name || otherUser.username) : 'Campus System';

        return `
            <tr class="border-secondary">
                <td>
                    <div class="d-flex flex-column text-white">
                        <span class="fw-bold">${t.reason}</span>
                        <small class="text-secondary extra-small">${isIncoming ? 'Received from' : 'Sent to'} <b>${otherName}</b></small>
                    </div>
                </td>
                <td class="${amountClass} fw-bold">${amountSign}${t.amount} C</td>
                <td class="text-secondary small">${date}</td>
                <td><span class="badge bg-success-subtle text-success small">Completed</span></td>
            </tr>
        `;
    }).join('');
}

initWallet();

// Logout Event Listener
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
});
