/* =============================================
   DMless - Utility / Helper Functions
   All pages include this script
   ============================================= */

// -----------------------------------------------
// localStorage Helpers
// localStorage is like a mini database in the browser.
// Data stays even after you close the tab.
// -----------------------------------------------

/** Save any JavaScript object to localStorage as JSON text */
function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/** Read back data from localStorage and convert from JSON text to JS object */
function getData(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

/** Remove a specific key from localStorage */
function removeData(key) {
  localStorage.removeItem(key);
}

// -----------------------------------------------
// Auth Helpers
// -----------------------------------------------

/** Returns the currently logged-in recruiter object, or null */
function getCurrentUser() {
  return getData('dmless_current_user');
}

/** Redirect to login if the user is NOT logged in.
 *  Call this at the top of every protected page. */
function requireAuth() {
  if (!getCurrentUser()) {
    window.location.href = 'login.html';
  }
}

/** Log out the current user and go to landing page */
function logout() {
  removeData('dmless_current_user');
  window.location.href = 'index.html';
}

// -----------------------------------------------
// Toast Notification System
// Shows a small popup message (like "Saved!" or "Error!")
// -----------------------------------------------

function showToast(message, type = 'info') {
  // Create the container if it doesn't exist yet
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
  container.appendChild(toast);

  // Auto-remove toast after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(120%)';
    toast.style.transition = '0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// -----------------------------------------------
// ID Generator
// Creates a short unique ID like "abc123"
// Used to identify hiring links and applications
// -----------------------------------------------

function generateId(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// -----------------------------------------------
// Date Formatter
// Converts a date to "Feb 21, 2026" format
// -----------------------------------------------

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// -----------------------------------------------
// Clipboard Helper
// Copies text to the user's clipboard
// -----------------------------------------------

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Link copied to clipboard!', 'success');
    });
  } else {
    // Fallback for older browsers
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast('Link copied!', 'success');
  }
}

// -----------------------------------------------
// Data Seeders (Demo Data so Dashboard isn't empty)
// -----------------------------------------------

/** Sets up a demo recruiter account on first load */
function seedDemoData() {
  // Bump this version string whenever seed data needs to change.
  // The old data will be wiped and replaced automatically.
  const SEED_VERSION = 'v3';
  if (localStorage.getItem('dmless_seed_version') === SEED_VERSION) return;

  // Clear previous demo data so stale statuses don't linger
  const users = getData('dmless_users') || [];
  const purgedUsers = users.filter(u => u.email !== 'demo@dmless.io');
  saveData('dmless_users', purgedUsers);

  let links = getData('dmless_links') || [];
  links = links.filter(l => l.recruiterId !== 'demo001');
  saveData('dmless_links', links);

  let apps = getData('dmless_applications') || [];
  apps = apps.filter(a => a.recruiterId !== 'demo001');
  saveData('dmless_applications', apps);

  const demoUser = {
    id: 'demo001',
    name: 'Demo Recruiter',
    company: 'Acme Corp',
    email: 'demo@dmless.io',
    password: 'demo1234',
    createdAt: new Date().toISOString()
  };
  users.push(demoUser);
  saveData('dmless_users', users);

  // Create a sample hiring link for the demo user
  const sampleLinkId = 'sample01';
  links.push({
    id: sampleLinkId,
    recruiterId: 'demo001',
    jobRole: 'Frontend Developer',
    jobDescription: 'We are looking for a skilled Frontend Developer with React experience.',
    questions: [
      {
        question: 'Which language runs in the browser natively?',
        options: ['Python', 'JavaScript', 'Java', 'C++'],
        correct: 1
      },
      {
        question: 'What does CSS stand for?',
        options: ['Computer Style Sheets', 'Creative Style System', 'Cascading Style Sheets', 'Colorful Style Sheets'],
        correct: 2
      },
      {
        question: 'Which HTML tag is used for the largest heading?',
        options: ['<h6>', '<heading>', '<h1>', '<bold>'],
        correct: 2
      },
      {
        question: 'What does DOM stand for?',
        options: ['Document Object Model', 'Data Object Management', 'Display Output Mode', 'Desktop Object Module'],
        correct: 0
      },
      {
        question: 'Which property hides an element in CSS?',
        options: ['display: none', 'hide: true', 'visible: false', 'opacity: hidden'],
        correct: 0
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  });
  saveData('dmless_links', links);

  // Create sample candidate applications
  apps = getData('dmless_applications') || [];
  const sampleApps = [
    { id: generateId(), linkId: sampleLinkId, recruiterId: 'demo001', name: 'Alice Johnson', email: 'alice@email.com', status: 'pending_review', knockoutAt: null, resumeName: 'alice_resume.pdf', appliedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: generateId(), linkId: sampleLinkId, recruiterId: 'demo001', name: 'Bob Smith', email: 'bob@email.com', status: 'knocked_out', knockoutAt: 2, resumeName: null, appliedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: generateId(), linkId: sampleLinkId, recruiterId: 'demo001', name: 'Carol White', email: 'carol@email.com', status: 'shortlisted', knockoutAt: null, resumeName: 'carol_cv.pdf', appliedAt: new Date(Date.now() - 86400000 * 1).toISOString() },
    { id: generateId(), linkId: sampleLinkId, recruiterId: 'demo001', name: 'David Lee', email: 'david@email.com', status: 'knocked_out', knockoutAt: 4, resumeName: null, appliedAt: new Date(Date.now() - 86400000 * 1).toISOString() },
    { id: generateId(), linkId: sampleLinkId, recruiterId: 'demo001', name: 'Eva Martinez', email: 'eva@email.com', status: 'pending_review', knockoutAt: null, resumeName: 'eva_resume.pdf', appliedAt: new Date().toISOString() }
  ];
  apps.push(...sampleApps);
  saveData('dmless_applications', apps);

  // Mark seed as applied
  localStorage.setItem('dmless_seed_version', SEED_VERSION);
}

// Run demo seed when the page loads
seedDemoData();

// -----------------------------------------------
// Theme System (Dark / Light)
// -----------------------------------------------

/** Apply saved theme and inject the floating toggle button */
function initTheme() {
  const saved = localStorage.getItem('dmless_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);

  // Inject toggle button into every page
  const btn = document.createElement('button');
  btn.className = 'theme-toggle-btn';
  btn.id = 'themeToggleBtn';
  btn.title = 'Toggle dark / light mode';
  btn.textContent = saved === 'light' ? '🌙' : '☀️';
  btn.addEventListener('click', toggleTheme);
  document.body.appendChild(btn);
}

/** Switch between dark and light themes */
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('dmless_theme', next);

  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.textContent = next === 'light' ? '🌙' : '☀️';
}

// -----------------------------------------------
// CSV Export
// Generates a .csv file with all candidate data
// Compatible with Excel (UTF-8 BOM included)
// -----------------------------------------------

/** Download all applications for the given recruiter as a CSV */
function exportToCSV(recruiterId) {
  const allApps   = getData('dmless_applications') || [];
  const allLinks  = getData('dmless_links') || [];
  const apps      = allApps.filter(a => a.recruiterId === recruiterId);

  if (apps.length === 0) {
    showToast('No candidates to export yet.', 'info');
    return;
  }

  const header = ['Name', 'Email', 'Job Role', 'Status', 'Resume', 'Applied At'];
  const rows = apps.map(a => {
    const link = allLinks.find(l => l.id === a.linkId);
    const role = link ? link.jobRole : 'Unknown';
    const statusLabel = {
      knocked_out: 'Knocked Out',
      pending_review: 'Pending Review',
      shortlisted: 'Shortlisted'
    }[a.status] || a.status;

    return [
      `"${a.name}"`,
      `"${a.email}"`,
      `"${role}"`,
      `"${statusLabel}"`,
      a.resumeName ? `"${a.resumeName}"` : '"-"',
      `"${formatDate(a.appliedAt)}"`
    ].join(',');
  });

  const csvContent = '\uFEFF' + [header.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);

  const a   = document.createElement('a');
  a.href    = url;
  a.download = `dmless_candidates_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('CSV exported successfully!', 'success');
}

// -----------------------------------------------
// In-App Notification System
// No email required — everything stored in localStorage.
// Recruiter sees notifications in the 🔔 bell panel.
// Candidates see their shortlist status on the hiring page.
// -----------------------------------------------

/**
 * Push a notification into the recruiter's inbox.
 * Called when a candidate submits their résumé.
 */
function addRecruiterNotification(recruiterId, title, message) {
  const notifications = getData('dmless_notifications') || [];
  notifications.unshift({
    id:          generateId(),
    recruiterId,
    title,
    message,
    read:        false,
    createdAt:   new Date().toISOString()
  });
  // Cap at 50 so localStorage doesn't grow forever
  saveData('dmless_notifications', notifications.slice(0, 50));
}

/**
 * Store a shortlist message for a candidate.
 * Keyed by email + linkId so it replaces any prior message for the same application.
 * Displayed on the candidate's done/status screen.
 */
function addCandidateNotification(email, linkId, message) {
  const msgs = getData('dmless_candidate_msgs') || [];
  const idx  = msgs.findIndex(m => m.email === email && m.linkId === linkId);
  const entry = { id: generateId(), email, linkId, message, createdAt: new Date().toISOString() };
  if (idx >= 0) msgs[idx] = entry;
  else msgs.unshift(entry);
  saveData('dmless_candidate_msgs', msgs);
}

/** How many unread notifications does a recruiter have? */
function getUnreadCount(recruiterId) {
  const notifications = getData('dmless_notifications') || [];
  return notifications.filter(n => n.recruiterId === recruiterId && !n.read).length;
}

/** Mark every notification as read for the given recruiter */
function markAllRead(recruiterId) {
  const notifications = getData('dmless_notifications') || [];
  notifications.forEach(n => { if (n.recruiterId === recruiterId) n.read = true; });
  saveData('dmless_notifications', notifications);
}

// Initialise theme on every page load
initTheme();
