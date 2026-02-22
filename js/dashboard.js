/* =============================================
   DMless - Dashboard Logic
   Handles fetching data from localStorage and 
   building all the dashboard UI dynamically with JS
   ============================================= */

// Protect this page – redirects to login if not logged in
requireAuth();

const user = getCurrentUser();

// Color palette for avatars (cycles through)
const AVATAR_COLORS = ['#6C47FF','#00D5C0','#ef4444','#f59e0b','#3b82f6','#22c55e','#8B5CF6','#ec4899'];

// -----------------------------------------------
// Init: run everything when the page loads
// -----------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  renderUserInfo();
  renderStats();
  renderLinks();
  renderRecentApplications();
  setupMobileMenu();
  renderNotifBell();
});

// -----------------------------------------------
// Show/hide the sidebar sections
// -----------------------------------------------
function showSection(name) {
  // Hide all sections
  ['overview', 'applications', 'analytics'].forEach(s => {
    const el = document.getElementById(`section-${s}`);
    if (el) el.classList.add('hidden');
  });

  // Show the requested section
  const target = document.getElementById(`section-${name}`);
  if (target) target.classList.remove('hidden');

  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const navMap = {
    overview: 0,
    applications: 2,
    analytics: 3
  };
  const navItems = document.querySelectorAll('.nav-item');
  if (navItems[navMap[name]]) navItems[navMap[name]].classList.add('active');

  // Render content specific to the section
  if (name === 'applications') renderApplications();
  if (name === 'analytics')    renderAnalytics();
}

// -----------------------------------------------
// Show the main Overview section (default)
// -----------------------------------------------
function showOverview() {
  showSection('overview');
}

// -----------------------------------------------
// Render logged-in user info in sidebar
// -----------------------------------------------
function renderUserInfo() {
  document.getElementById('welcome-msg').textContent = `Welcome back, ${user.name.split(' ')[0]}!`;
  document.getElementById('user-info').innerHTML = `
    <div class="user-name">${user.name}</div>
    <div class="user-company">${user.company}</div>
  `;
}

// -----------------------------------------------
// Render the 4 stat cards at the top
// -----------------------------------------------
function renderStats() {
  const links = getMyLinks();
  const apps  = getMyApplications();

  const total         = apps.length;
  const knockedOut    = apps.filter(a => a.status === 'knocked_out').length;
  const pendingReview = apps.filter(a => a.status === 'pending_review').length;
  const shortlisted   = apps.filter(a => a.status === 'shortlisted').length;
  const rate          = total > 0 ? Math.round((shortlisted / total) * 100) : 0;

  document.getElementById('stats-row').innerHTML = `
    <div class="stat-card">
      <div class="stat-card-icon">🔗</div>
      <div class="stat-card-num" style="color:var(--primary)">${links.length}</div>
      <div class="stat-card-label">Hiring Links</div>
      <div class="stat-card-sub">Active job posts</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-icon">👥</div>
      <div class="stat-card-num" style="color:var(--info)">${total}</div>
      <div class="stat-card-label">Total Applied</div>
      <div class="stat-card-sub">Across all roles</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-icon">❌</div>
      <div class="stat-card-num" style="color:var(--danger)">${knockedOut}</div>
      <div class="stat-card-label">Knocked Out</div>
      <div class="stat-card-sub">Failed MCQ screening</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-icon">📋</div>
      <div class="stat-card-num" style="color:var(--warning)">${pendingReview}</div>
      <div class="stat-card-label">Pending Review</div>
      <div class="stat-card-sub">Awaiting your review</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-icon">✅</div>
      <div class="stat-card-num" style="color:var(--success)">${shortlisted}</div>
      <div class="stat-card-label">Shortlisted</div>
      <div class="stat-card-sub">${rate}% pass rate</div>
    </div>
  `;
}

// -----------------------------------------------
// Render the list of hiring links
// -----------------------------------------------
function renderLinks() {
  const links    = getMyLinks();
  const allApps  = getMyApplications();
  const container = document.getElementById('links-list');

  if (links.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔗</div>
        <p>No hiring links yet.</p>
        <a href="create-link.html" class="btn btn-primary btn-sm">Create Your First Link</a>
      </div>
    `;
    return;
  }

  container.innerHTML = links.map(link => {
    const linkApps = allApps.filter(a => a.linkId === link.id);
    const applied   = linkApps.length;
    const knocked   = linkApps.filter(a => a.status === 'knocked_out').length;
    const pending   = linkApps.filter(a => a.status === 'pending_review').length;
    const listed    = linkApps.filter(a => a.status === 'shortlisted').length;
    const pageUrl    = `${window.location.origin}${window.location.pathname.replace('dashboard.html','')}candidate.html?link=${link.id}`;

    return `
      <div class="link-row">
        <div class="link-row-top">
          <span class="link-role">${escapeHtml(link.jobRole)}</span>
          <span class="link-date">${formatDate(link.createdAt)}</span>
        </div>
        <div class="link-row-meta">
          <span class="link-meta-item">👥 <strong style="color:var(--info)">${applied}</strong> applied</span>
          <span class="link-meta-item">❌ <strong style="color:var(--danger)">${knocked}</strong> knocked out</span>
          <span class="link-meta-item">📋 <strong style="color:var(--warning)">${pending}</strong> pending review</span>
          <span class="link-meta-item">✅ <strong style="color:var(--success)">${listed}</strong> shortlisted</span>
        </div>
        <div class="link-url" onclick="copyToClipboard('${pageUrl}')" title="Click to copy">
          🔗 ${pageUrl}
        </div>
        <div class="link-row-actions">
          <button class="btn btn-secondary btn-sm" onclick="copyToClipboard('${pageUrl}')">Copy Link</button>
          <button class="btn btn-secondary btn-sm" onclick="openCandidatePage('${link.id}')">Preview</button>
          <button class="btn btn-danger btn-sm"    onclick="openDeleteModal('${link.id}')">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

// -----------------------------------------------
// Render 5 most recent applications on Overview
// -----------------------------------------------
function renderRecentApplications() {
  const apps = getMyApplications()
    .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
    .slice(0, 5);

  const container = document.getElementById('recent-applications');

  if (apps.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <p>No applications yet. Share your hiring links!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = apps.map(app => {
    const initials = getInitials(app.name);
    const color    = AVATAR_COLORS[app.name.charCodeAt(0) % AVATAR_COLORS.length];
    const badge = app.status === 'shortlisted'
      ? `<span class="badge badge-success">Shortlisted</span>`
      : app.status === 'pending_review'
      ? `<span class="badge badge-warning">Pending Review</span>`
      : `<span class="badge badge-danger">Knocked Out</span>`;

    return `
      <div class="app-row">
        <div class="app-avatar" style="background:${color}">${initials}</div>
        <div class="app-info">
          <div class="app-name">${escapeHtml(app.name)}</div>
          <div class="app-email">${escapeHtml(app.email)}</div>
        </div>
        ${badge}
      </div>
    `;
  }).join('');
}

// -----------------------------------------------
// Render All Applications table (with filters)
// -----------------------------------------------
function renderApplications() {
  const links  = getMyLinks();
  const allApps = getMyApplications();

  // Populate filter dropdowns
  const linkFilter   = document.getElementById('filter-link');
  const statusFilter = document.getElementById('filter-status');
  const searchInput  = document.getElementById('filter-search');

  // Re-populate link dropdown (keep current selection)
  const selectedLink = linkFilter.value;
  linkFilter.innerHTML = `<option value="">All Hiring Links</option>` +
    links.map(l => `<option value="${l.id}" ${l.id === selectedLink ? 'selected' : ''}>${escapeHtml(l.jobRole)}</option>`).join('');

  // Apply filters
  let filtered = allApps;

  if (linkFilter.value) {
    filtered = filtered.filter(a => a.linkId === linkFilter.value);
  }

  if (statusFilter.value) {
    filtered = filtered.filter(a => a.status === statusFilter.value);
  }

  const search = searchInput.value.toLowerCase();
  if (search) {
    filtered = filtered.filter(a =>
      a.name.toLowerCase().includes(search) ||
      a.email.toLowerCase().includes(search)
    );
  }

  // Sort newest first
  filtered.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

  const container = document.getElementById('applications-table');

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <p>No applications match your filters.</p>
      </div>
    `;
    return;
  }

  // Build the link ID → role name map for quick lookup
  const linkMap = {};
  links.forEach(l => linkMap[l.id] = l.jobRole);

  container.innerHTML = `
    <div id="bulk-bar" class="bulk-bar hidden">
      <span id="bulk-count">0 selected</span>
      <button class="btn btn-danger btn-sm" onclick="deleteSelectedApplications()">🗑 Delete Selected</button>
      <button class="btn btn-secondary btn-sm" onclick="clearSelection()">Clear</button>
    </div>
    <div class="table-wrap">
      <table class="candidates-table">
        <thead>
          <tr>
            <th style="width:36px">
              <input type="checkbox" id="select-all-chk" title="Select all" onchange="toggleSelectAll(this.checked)" />
            </th>
            <th>Candidate</th>
            <th>Role</th>
            <th>Status</th>
            <th>Applied</th>
            <th>Resume</th>
            <th style="text-align:center">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(app => {
            const color    = AVATAR_COLORS[app.name.charCodeAt(0) % AVATAR_COLORS.length];
            const initials = getInitials(app.name);
            const badge = app.status === 'shortlisted'
              ? `<span class="badge badge-success">✅ Shortlisted</span>`
              : app.status === 'pending_review'
              ? `<span class="badge badge-warning">📋 Pending Review</span>`
              : `<span class="badge badge-danger">❌ Knocked Out${app.knockoutAt === 'recruiter' ? ' (Recruiter)' : ` (Q${app.knockoutAt + 1})`}</span>`;
            const actionBtns = app.status === 'pending_review'
              ? `<div style="display:flex;gap:6px;justify-content:center">
                   <button class="icon-action-btn shortlist-btn" title="Shortlist" onclick="shortlistCandidate('${app.id}')">✅</button>
                   <button class="icon-action-btn knockout-btn" title="Knock Out" onclick="knockoutByRecruiter('${app.id}')">❌</button>
                 </div>`
              : `<span style="color:var(--text-muted);font-size:12px;display:block;text-align:center">—</span>`;
            const resume   = app.resumeName
              ? `<span class="resume-link">📄 ${escapeHtml(app.resumeName)}</span>`
              : `<span style="color:var(--text-muted);font-size:12px">—</span>`;

            return `
              <tr>
                <td style="text-align:center">
                  <input type="checkbox" class="app-checkbox" data-id="${app.id}" onchange="updateBulkBar()" />
                </td>
                <td>
                  <div style="display:flex;align-items:center;gap:10px">
                    <div class="app-avatar" style="background:${color};width:32px;height:32px;font-size:12px">${initials}</div>
                    <div>
                      <div style="font-weight:600;color:var(--text-primary)">${escapeHtml(app.name)}</div>
                      <div style="font-size:12px;color:var(--text-muted)">${escapeHtml(app.email)}</div>
                    </div>
                  </div>
                </td>
                <td>${escapeHtml(linkMap[app.linkId] || '—')}</td>
                <td>${badge}</td>
                <td style="font-size:13px">${formatDate(app.appliedAt)}</td>
                <td>${resume}</td>
                <td>${actionBtns}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// -----------------------------------------------
// Render Analytics section
// -----------------------------------------------
function renderAnalytics() {
  const apps        = getMyApplications();
  const total         = apps.length;
  const knockedOut    = apps.filter(a => a.status === 'knocked_out').length;
  const pendingReview = apps.filter(a => a.status === 'pending_review').length;
  const shortlisted   = apps.filter(a => a.status === 'shortlisted').length;
  const passedMCQ     = pendingReview + shortlisted;

  // --- Funnel Chart (applied → shortlisted) ---
  const funnelData = [
    { label: 'Total Applied',  value: total,         color: 'var(--info)',    max: total },
    { label: 'Passed MCQs',    value: passedMCQ,     color: 'var(--accent)',  max: total },
    { label: 'Pending Review', value: pendingReview, color: 'var(--warning)', max: total },
    { label: 'Shortlisted',    value: shortlisted,   color: 'var(--success)', max: total },
    { label: 'Knocked Out',    value: knockedOut,    color: 'var(--danger)',  max: total },
  ];

  document.getElementById('funnel-chart').innerHTML = funnelData.map(item => {
    const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
    return `
      <div class="funnel-item">
        <div class="funnel-label">
          <span>${item.label}</span>
          <strong>${item.value} <span style="color:var(--text-muted);font-weight:400">(${pct}%)</span></strong>
        </div>
        <div class="funnel-bar-track">
          <div class="funnel-bar-fill" style="width:${pct}%;background:${item.color}"></div>
        </div>
      </div>
    `;
  }).join('');

  // --- Per-Job Breakdown ---
  const links   = getMyLinks();
  const allApps = getMyApplications();

  document.getElementById('per-job-chart').innerHTML = links.map(link => {
    const la        = allApps.filter(a => a.linkId === link.id);
    const lTotal    = la.length;
    const lKnocked  = la.filter(a => a.status === 'knocked_out').length;
    const lPending  = la.filter(a => a.status === 'pending_review').length;
    const lListed   = la.filter(a => a.status === 'shortlisted').length;

    const pctK = lTotal > 0 ? Math.round((lKnocked  / lTotal) * 100) : 0;
    const pctP = lTotal > 0 ? Math.round((lPending  / lTotal) * 100) : 0;
    const pctL = lTotal > 0 ? Math.round((lListed   / lTotal) * 100) : 0;

    return `
      <div class="per-job-item">
        <div class="per-job-title">${escapeHtml(link.jobRole)}</div>
        <div class="per-job-bars">
          <div class="per-job-bar-row">
            <span class="per-job-bar-label" style="color:var(--info)">Applied</span>
            <div class="per-job-bar-track">
              <div class="per-job-bar-fill" style="width:100%;background:var(--info)"></div>
            </div>
            <span class="per-job-bar-count" style="color:var(--info)">${lTotal}</span>
          </div>
          <div class="per-job-bar-row">
            <span class="per-job-bar-label" style="color:var(--success)">Shortlisted</span>
            <div class="per-job-bar-track">
              <div class="per-job-bar-fill" style="width:${pctL}%;background:var(--success)"></div>
            </div>
            <span class="per-job-bar-count" style="color:var(--success)">${lListed}</span>
          </div>
          <div class="per-job-bar-row">
            <span class="per-job-bar-label" style="color:var(--warning)">Pending Review</span>
            <div class="per-job-bar-track">
              <div class="per-job-bar-fill" style="width:${pctP}%;background:var(--warning)"></div>
            </div>
            <span class="per-job-bar-count" style="color:var(--warning)">${lPending}</span>
          </div>
          <div class="per-job-bar-row">
            <span class="per-job-bar-label" style="color:var(--danger)">Knocked Out</span>
            <div class="per-job-bar-track">
              <div class="per-job-bar-fill" style="width:${pctK}%;background:var(--danger)"></div>
            </div>
            <span class="per-job-bar-count" style="color:var(--danger)">${lKnocked}</span>
          </div>
        </div>
      </div>
    `;
  }).join('') || '<p style="color:var(--text-muted);font-size:14px">No data yet.</p>';

  // --- Timeline: Applications per day (last 7 days) ---
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]); // YYYY-MM-DD
  }

  const maxPerDay = Math.max(1, ...days.map(day =>
    allApps.filter(a => a.appliedAt.startsWith(day)).length
  ));

  document.getElementById('timeline-chart').innerHTML = days.map(day => {
    const count = allApps.filter(a => a.appliedAt.startsWith(day)).length;
    const pct   = Math.round((count / maxPerDay) * 100);
    const label = new Date(day + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return `
      <div class="timeline-row">
        <span class="timeline-date">${label}</span>
        <div class="timeline-bar-track">
          <div class="timeline-bar-fill" 
               style="width:${count > 0 ? Math.max(pct, 8) : 0}%;background:linear-gradient(135deg,var(--primary),var(--accent))">
            ${count > 0 ? count : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// -----------------------------------------------
// Delete Link
// -----------------------------------------------
let pendingDeleteId = null;

function openDeleteModal(linkId) {
  pendingDeleteId = linkId;
  document.getElementById('delete-modal').classList.remove('hidden');
  document.getElementById('confirm-delete-btn').onclick = confirmDelete;
}

function closeDeleteModal() {
  pendingDeleteId = null;
  document.getElementById('delete-modal').classList.add('hidden');
}

function confirmDelete() {
  if (!pendingDeleteId) return;

  // Remove the link
  let links = getData('dmless_links') || [];
  links = links.filter(l => l.id !== pendingDeleteId);
  saveData('dmless_links', links);

  // Remove its applications too
  let apps = getData('dmless_applications') || [];
  apps = apps.filter(a => a.linkId !== pendingDeleteId);
  saveData('dmless_applications', apps);

  closeDeleteModal();
  renderStats();
  renderLinks();
  renderRecentApplications();
  showToast('Hiring link deleted.', 'success');
}

// -----------------------------------------------
// Knock Out a Candidate (recruiter decision)
// -----------------------------------------------
function knockoutByRecruiter(appId) {
  const apps = getData('dmless_applications') || [];
  const app  = apps.find(a => a.id === appId);
  if (!app) return;

  app.status     = 'knocked_out';
  app.knockoutAt = 'recruiter';   // distinguish from MCQ knockout
  saveData('dmless_applications', apps);

  renderApplications();
  renderStats();
  renderRecentApplications();
  showToast(`${app.name} has been knocked out.`, 'info');
}

// -----------------------------------------------
// Bulk-select helpers
// -----------------------------------------------
function toggleSelectAll(checked) {
  document.querySelectorAll('.app-checkbox').forEach(cb => cb.checked = checked);
  updateBulkBar();
}

function updateBulkBar() {
  const checked = document.querySelectorAll('.app-checkbox:checked');
  const bar     = document.getElementById('bulk-bar');
  const countEl = document.getElementById('bulk-count');
  const selectAllChk = document.getElementById('select-all-chk');
  if (!bar) return;

  if (checked.length > 0) {
    bar.classList.remove('hidden');
    countEl.textContent = `${checked.length} selected`;
  } else {
    bar.classList.add('hidden');
  }

  // Sync select-all checkbox state
  const total = document.querySelectorAll('.app-checkbox').length;
  if (selectAllChk) {
    selectAllChk.indeterminate = checked.length > 0 && checked.length < total;
    selectAllChk.checked = checked.length === total && total > 0;
  }
}

function clearSelection() {
  document.querySelectorAll('.app-checkbox').forEach(cb => cb.checked = false);
  updateBulkBar();
}

function deleteSelectedApplications() {
  const ids = [...document.querySelectorAll('.app-checkbox:checked')].map(cb => cb.dataset.id);
  if (ids.length === 0) return;

  let apps = getData('dmless_applications') || [];
  apps = apps.filter(a => !ids.includes(a.id));
  saveData('dmless_applications', apps);

  renderApplications();
  renderStats();
  renderRecentApplications();
  renderLinks();
  showToast(`${ids.length} application${ids.length > 1 ? 's' : ''} deleted.`, 'success');
}

// -----------------------------------------------
// Shortlist a Candidate (after resume review)
// -----------------------------------------------
function shortlistCandidate(appId) {
  const apps = getData('dmless_applications') || [];
  const app  = apps.find(a => a.id === appId);
  if (!app) return;

  app.status = 'shortlisted';
  saveData('dmless_applications', apps);

  // Email the candidate to inform them they've been shortlisted
  const allUsers  = getData('dmless_users') || [];
  const recruiter = allUsers.find(u => u.id === user.id);
  const recruiterName = recruiter ? recruiter.name : user.name;
  const allLinks  = getData('dmless_links') || [];
  const link      = allLinks.find(l => l.id === app.linkId);
  const jobRole   = link ? link.jobRole : 'the position';

  // Notify candidate via in-app message (no email needed)
  addCandidateNotification(
    app.email,
    app.linkId,
    `🎉 Congratulations! ${recruiterName} has reviewed your résumé and shortlisted you for the ${jobRole} role. They will contact you directly soon.`
  );

  renderNotifBell();
  renderApplications();
  renderStats();
  renderRecentApplications();
  showToast(`${app.name} has been shortlisted! 🎉`, 'success');
}

// -----------------------------------------------
// Notification Bell
// Renders the unread badge; panel shown/hidden on click
// -----------------------------------------------
function renderNotifBell() {
  const count = getUnreadCount(user.id);
  ['notif-badge', 'notif-badge-mobile'].forEach(id => {
    const badge = document.getElementById(id);
    if (!badge) return;
    badge.textContent = count;
    badge.classList.toggle('hidden', count === 0);
  });
}

function toggleNotifPanel() {
  const panel   = document.getElementById('notif-panel');
  const overlay = document.getElementById('notif-overlay');
  const isOpen  = !panel.classList.contains('hidden');

  if (isOpen) {
    panel.classList.add('hidden');
    overlay.classList.add('hidden');
  } else {
    renderNotifPanel();
    panel.classList.remove('hidden');
    overlay.classList.remove('hidden');
    // Mark all as read
    markAllRead(user.id);
    renderNotifBell();
  }
}

function renderNotifPanel() {
  const all    = getData('dmless_notifications') || [];
  const mine   = all.filter(n => n.recruiterId === user.id);
  const listEl = document.getElementById('notif-list');
  if (!listEl) return;

  if (mine.length === 0) {
    listEl.innerHTML = `<div class="notif-empty">🔔<br>No notifications yet.<br><span style="font-size:12px">They'll appear here when candidates apply.</span></div>`;
    return;
  }

  listEl.innerHTML = mine.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}">
      <div class="notif-item-title">${escapeHtml(n.title)}</div>
      <div class="notif-item-msg">${escapeHtml(n.message)}</div>
      <div class="notif-item-time">${formatDate(n.createdAt)}</div>
    </div>
  `).join('');
}

// -----------------------------------------------
// Open candidate page in a new tab
// -----------------------------------------------
function openCandidatePage(linkId) {
  window.open(`candidate.html?link=${linkId}`, '_blank');
}

// -----------------------------------------------
// Mobile Menu Toggle
// -----------------------------------------------
function setupMobileMenu() {
  const toggle  = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');

  if (!toggle) return;

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // Close sidebar when clicking outside
  document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
}

// -----------------------------------------------
// Helpers
// -----------------------------------------------

/** Get all hiring links created by the current recruiter */
function getMyLinks() {
  const all = getData('dmless_links') || [];
  return all.filter(l => l.recruiterId === user.id);
}

/** Get all applications for the current recruiter */
function getMyApplications() {
  const all = getData('dmless_applications') || [];
  return all.filter(a => a.recruiterId === user.id);
}

/** Get first+last initials from a name, e.g. "Alice Johnson" → "AJ" */
function getInitials(name) {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

/** Prevent XSS: convert special HTML characters to safe versions 
 *  e.g. <script> becomes &lt;script&gt; */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
