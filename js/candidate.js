/* =============================================
   DMless - Candidate Application Logic
   
   This page is deliberately simple:
   1. Load job data from ?link= URL param
   2. Collect candidate name + email
   3. Run MCQ quiz question by question
   4. If wrong answer → knockout screen
   5. If all correct → resume upload
   6. Save result to localStorage
   ============================================= */

// Current state variables
let jobLink       = null;  // The hiring link object
let candidateData = {};    // Name + email
let currentQ      = 0;     // Current question index (0–4)
let answered      = false; // Prevent double-clicks

// -----------------------------------------------
// Init: runs when page loads
// -----------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  // If demo mode, use sample link
  const params = new URLSearchParams(window.location.search);
  const isDemo = params.get('demo') === 'true';
  const linkId = isDemo ? 'sample01' : params.get('link');

  if (!linkId) {
    showView('error');
    return;
  }

  // Simulate loading delay for UX polish
  setTimeout(() => {
    const links = getData('dmless_links') || [];
    jobLink = links.find(l => l.id === linkId);

    if (!jobLink) {
      showView('error');
      return;
    }

    populateJobDetails();
    showView('welcome');
  }, 600);

  // Set up drag-and-drop for resume upload
  setupDragDrop();
});

// -----------------------------------------------
// Populate welcome screen with job data
// -----------------------------------------------
function populateJobDetails() {
  document.title = `Apply – ${jobLink.jobRole} | DMless`;
  document.getElementById('job-title').textContent = jobLink.jobRole;
  document.getElementById('job-description-text').textContent = jobLink.jobDescription;
}

// -----------------------------------------------
// Show/hide views
// -----------------------------------------------
function showView(name) {
  const views = ['loading','error','welcome','quiz','knocked-out','resume','done'];
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.toggle('hidden', v !== name);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// -----------------------------------------------
// Step 1 → 2: Validate name/email and start quiz
// -----------------------------------------------
function startQuiz() {
  const name  = document.getElementById('candidate-name').value.trim();
  const email = document.getElementById('candidate-email').value.trim().toLowerCase();
  const msgEl = document.getElementById('welcome-form-message');

  // Validate
  if (!name) {
    msgEl.innerHTML = `<div class="alert alert-error">Please enter your full name.</div>`;
    document.getElementById('candidate-name').focus();
    return;
  }

  if (!email || !email.includes('@')) {
    msgEl.innerHTML = `<div class="alert alert-error">Please enter a valid email address.</div>`;
    document.getElementById('candidate-email').focus();
    return;
  }

  candidateData = { name, email };
  currentQ      = 0;
  answered      = false;
  msgEl.innerHTML = '';

  // ── Returning candidate check ──────────────────────────────
  // If this email already has an application for this link,
  // skip the quiz and show their current status instead.
  const existingApp = (getData('dmless_applications') || [])
    .find(a => a.email === email && a.linkId === jobLink.id);

  if (existingApp) {
    showReturningStatus(existingApp);
    return;
  }
  // ───────────────────────────────────────────────────────────

  showView('quiz');
  renderQuestion();
}

// -----------------------------------------------
// Render current question in the quiz view
// -----------------------------------------------
function renderQuestion() {
  const q       = jobLink.questions[currentQ];
  const letters = ['A', 'B', 'C', 'D'];

  // Update progress bar and label
  const pct = Math.round(((currentQ) / 5) * 100);
  document.getElementById('quiz-progress-text').textContent = `Question ${currentQ + 1} of 5`;
  document.getElementById('quiz-progress-bar').style.width  = `${pct}%`;

  // Update question number + text
  document.getElementById('quiz-q-num').textContent  = `Q${currentQ + 1}`;
  document.getElementById('quiz-q-text').textContent = q.question;

  // Build options
  document.getElementById('quiz-options').innerHTML = q.options.map((opt, i) => `
    <div class="quiz-option" id="option-${i}" onclick="selectOption(${i})">
      <div class="quiz-option-letter">${letters[i]}</div>
      <div class="quiz-option-text">${escapeHtml(opt)}</div>
    </div>
  `).join('');

  // Hide feedback and next button
  document.getElementById('quiz-feedback').className = 'quiz-feedback hidden';
  document.getElementById('quiz-feedback').textContent = '';
  document.getElementById('quiz-next-btn').style.display = 'none';

  answered = false;
}

// -----------------------------------------------
// Handle option click
// -----------------------------------------------
function selectOption(selectedIndex) {
  if (answered) return; // Prevent clicking after already answered
  answered = true;

  const q       = jobLink.questions[currentQ];
  const correct = q.correct;
  const isRight = selectedIndex === correct;

  // Highlight selected option
  document.getElementById(`option-${selectedIndex}`).classList.add('selected');

  // Disable all options (no more clicking)
  for (let i = 0; i < 4; i++) {
    const el = document.getElementById(`option-${i}`);
    if (el) el.classList.add('disabled');
  }

  if (isRight) {
    // ✅ Correct answer
    document.getElementById(`option-${selectedIndex}`).classList.add('correct-answer');
    document.getElementById(`option-${selectedIndex}`).classList.remove('selected');

    const feedback = document.getElementById('quiz-feedback');
    feedback.textContent = '✅ Correct! Great job.';
    feedback.className   = 'quiz-feedback correct';

    // Short delay then show next button
    setTimeout(() => {
      document.getElementById('quiz-next-btn').style.display = 'block';
      // Update progress bar
      const pct = Math.round(((currentQ + 1) / 5) * 100);
      document.getElementById('quiz-progress-bar').style.width = `${pct}%`;
    }, 500);

  } else {
    // ❌ Wrong answer – show correct one too
    document.getElementById(`option-${selectedIndex}`).classList.add('wrong-answer');
    document.getElementById(`option-${selectedIndex}`).classList.remove('selected');
    document.getElementById(`option-${correct}`).classList.add('correct-answer');

    const feedback = document.getElementById('quiz-feedback');
    feedback.textContent = '❌ Incorrect. Unfortunately you have been knocked out of this application.';
    feedback.className   = 'quiz-feedback wrong';

    // Record knockout application
    saveApplication('knocked_out', currentQ);

    // Redirect to knockout screen after delay
    setTimeout(() => {
      showView('knocked-out');
    }, 2000);
  }
}

// -----------------------------------------------
// Move to next question or resume upload
// -----------------------------------------------
function nextQuestion() {
  currentQ++;

  if (currentQ >= 5) {
    // All 5 questions answered correctly!
    showView('resume');
  } else {
    renderQuestion();
  }
}

// -----------------------------------------------
// Resume Upload Handling
// -----------------------------------------------

// Clicking anywhere on the zone opens file picker
document.addEventListener('DOMContentLoaded', () => {
  const zone = document.getElementById('upload-zone');
  if (zone) {
    zone.addEventListener('click', () => {
      document.getElementById('resume-file').click();
    });
  }
});

function setupDragDrop() {
  // This runs after DOM is ready
  window.addEventListener('DOMContentLoaded', () => {
    const zone = document.getElementById('upload-zone');
    if (!zone) return;

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('drag-over');
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    });
  });
}

function handleFileSelect() {
  const file = document.getElementById('resume-file').files[0];
  if (file) handleFile(file);
}

function handleFile(file) {
  const allowed = ['application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  if (!allowed.includes(file.type)) {
    document.getElementById('resume-form-message').innerHTML =
      `<div class="alert alert-error">Please upload a PDF or Word document.</div>`;
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    document.getElementById('resume-form-message').innerHTML =
      `<div class="alert alert-error">File is too large. Max 5MB.</div>`;
    return;
  }

  document.getElementById('resume-form-message').innerHTML = '';
  document.getElementById('upload-zone').classList.add('hidden');
  document.getElementById('file-selected').classList.remove('hidden');
  document.getElementById('file-name-display').textContent = file.name;
}

function clearFile() {
  document.getElementById('resume-file').value = '';
  document.getElementById('upload-zone').classList.remove('hidden');
  document.getElementById('file-selected').classList.add('hidden');
  document.getElementById('file-name-display').textContent = '';
}

function submitResume() {
  const fileInput = document.getElementById('resume-file');
  const file = fileInput.files[0];

  if (!file) {
    document.getElementById('resume-form-message').innerHTML =
      `<div class="alert alert-error">Please select your résumé file before submitting.</div>`;
    return;
  }

  // Save application as pending_review (awaiting recruiter to shortlist)
  saveApplication('pending_review', null, file.name);

  // Notify the recruiter via in-app notification (no email needed)
  addRecruiterNotification(
    jobLink.recruiterId,
    `New Application: ${candidateData.name}`,
    `${candidateData.name} (${candidateData.email}) passed all 5 MCQs and uploaded their résumé for the ${jobLink.jobRole} role. Open Applications to review and shortlist.`
  );

  // Show done screen
  document.getElementById('done-name').textContent = candidateData.name;
  document.getElementById('done-summary').innerHTML = `
    <p style="font-weight:600;color:var(--text-primary);margin-bottom:12px">Application Summary</p>
    <div style="display:flex;flex-direction:column;gap:8px;text-align:left;font-size:14px">
      <div><span style="color:var(--text-muted)">Role:</span>
           <span style="color:var(--text-primary);font-weight:600;margin-left:8px">${escapeHtml(jobLink.jobRole)}</span></div>
      <div><span style="color:var(--text-muted)">Name:</span>
           <span style="color:var(--text-primary);font-weight:600;margin-left:8px">${escapeHtml(candidateData.name)}</span></div>
      <div><span style="color:var(--text-muted)">Email:</span>
           <span style="color:var(--text-primary);font-weight:600;margin-left:8px">${escapeHtml(candidateData.email)}</span></div>
      <div><span style="color:var(--text-muted)">MCQ Result:</span>
           <span class="badge badge-success" style="margin-left:8px">Passed all 5</span></div>
      <div><span style="color:var(--text-muted)">Résumé:</span>
           <span style="color:var(--success);font-weight:600;margin-left:8px">📄 ${escapeHtml(file.name)}</span></div>
    </div>
  `;

  showView('done');
  checkCandidateStatus(); // auto-show current status
}

// -----------------------------------------------
// Returning Candidate — show status without re-test
// -----------------------------------------------
function showReturningStatus(app) {
  const allLinks = getData('dmless_links') || [];
  const link     = allLinks.find(l => l.id === app.linkId) || jobLink;

  // Swap the done-view headings for a returning-visitor message
  document.getElementById('done-heading').textContent   = 'Welcome Back!';
  document.getElementById('done-name').textContent      = app.name;
  document.getElementById('done-subtext').innerHTML =
    `You've already applied for this role, <strong style="color:var(--text-primary)">${escapeHtml(app.name)}</strong>.`;
  document.getElementById('done-subtext2').textContent  =
    'Each candidate can apply only once per position. Here\'s your current application status:';

  const statusLabel = {
    pending_review: '📋 Pending Review',
    shortlisted:    '✅ Shortlisted',
    knocked_out:    '❌ Knocked Out'
  }[app.status] || app.status;

  document.getElementById('done-summary').innerHTML = `
    <p style="font-weight:600;color:var(--text-primary);margin-bottom:12px">Application Summary</p>
    <div style="display:flex;flex-direction:column;gap:8px;text-align:left;font-size:14px">
      <div><span style="color:var(--text-muted)">Role:</span>
           <span style="color:var(--text-primary);font-weight:600;margin-left:8px">${escapeHtml(link.jobRole)}</span></div>
      <div><span style="color:var(--text-muted)">Name:</span>
           <span style="color:var(--text-primary);font-weight:600;margin-left:8px">${escapeHtml(app.name)}</span></div>
      <div><span style="color:var(--text-muted)">Email:</span>
           <span style="color:var(--text-primary);font-weight:600;margin-left:8px">${escapeHtml(app.email)}</span></div>
      <div><span style="color:var(--text-muted)">Status:</span>
           <span style="font-weight:600;margin-left:8px">${statusLabel}</span></div>
      <div><span style="color:var(--text-muted)">Applied:</span>
           <span style="color:var(--text-primary);font-weight:600;margin-left:8px">${formatDate(app.appliedAt)}</span></div>
      ${app.resumeName ? `<div><span style="color:var(--text-muted)">Résumé:</span>
           <span style="color:var(--success);font-weight:600;margin-left:8px">📄 ${escapeHtml(app.resumeName)}</span></div>` : ''}
    </div>
  `;

  showView('done');
  checkCandidateStatus();   // live shortlist notification
}

// -----------------------------------------------
// Candidate Status Checker
// Shows shortlist notification on the done screen
// without requiring any email.
// -----------------------------------------------
function checkCandidateStatus() {
  const el = document.getElementById('status-notification');
  if (!el || !candidateData || !jobLink) return;

  const apps = getData('dmless_applications') || [];
  const app  = apps.find(a => a.email === candidateData.email && a.linkId === jobLink.id);

  const msgs = getData('dmless_candidate_msgs') || [];
  const msg  = msgs.find(m => m.email === candidateData.email && m.linkId === jobLink.id);

  // Flash the card so the user can see it refreshed
  el.style.opacity = '0.3';
  setTimeout(() => { el.style.transition = 'opacity 0.3s'; el.style.opacity = '1'; }, 80);

  if (app && app.status === 'shortlisted') {
    el.innerHTML = `
      <div style="background:rgba(34,197,94,0.1);border:1.5px solid var(--success);border-radius:12px;padding:16px 18px;text-align:left">
        <div style="font-weight:700;color:var(--success);margin-bottom:6px">🎉 You've been Shortlisted!</div>
        <div style="font-size:13px;color:var(--text-secondary);line-height:1.6">
          ${msg ? escapeHtml(msg.message) : `Congratulations! The recruiter has reviewed your résumé and selected you for the ${escapeHtml(jobLink.jobRole)} role. They will contact you directly soon.`}
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:8px">${msg ? formatDate(msg.createdAt) : ''}</div>
      </div>
    `;
  } else if (app && app.status === 'knocked_out' && app.knockoutAt === 'recruiter') {
    el.innerHTML = `
      <div style="background:rgba(239,68,68,0.07);border:1.5px solid rgba(239,68,68,0.25);border-radius:12px;padding:16px 18px;text-align:left">
        <div style="font-weight:700;color:var(--danger);margin-bottom:6px">📋 Resume Not Selected</div>
        <div style="font-size:13px;color:var(--text-secondary);line-height:1.6">
          After reviewing your résumé, the recruiter has decided not to move forward with your application for the <strong>${escapeHtml(jobLink.jobRole)}</strong> role at this time. We encourage you to keep applying!
        </div>
      </div>
    `;
  } else {
    el.innerHTML = `
      <div style="background:rgba(59,130,246,0.08);border:1.5px solid rgba(59,130,246,0.2);border-radius:12px;padding:16px 18px;text-align:left">
        <div style="font-weight:700;color:var(--info);margin-bottom:6px">⏳ Application Under Review</div>
        <div style="font-size:13px;color:var(--text-secondary);line-height:1.6">
          The recruiter has received your application and is reviewing résumés. Bookmark this page and click <strong>Refresh Status</strong> to check for updates.
        </div>
      </div>
    `;
  }
}

// -----------------------------------------------
// Save application to localStorage
// -----------------------------------------------
function saveApplication(status, knockoutAt, resumeName = null) {
  const apps = getData('dmless_applications') || [];

  const app = {
    id:          generateId(),
    linkId:      jobLink.id,
    recruiterId: jobLink.recruiterId,
    name:        candidateData.name,
    email:       candidateData.email,
    status,
    knockoutAt,
    resumeName,
    appliedAt:   new Date().toISOString()
  };

  apps.push(app);
  saveData('dmless_applications', apps);
}

// -----------------------------------------------
// XSS Prevention
// -----------------------------------------------
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
