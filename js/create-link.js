/* =============================================
   DMless - Create Hiring Link Logic
   ============================================= */

requireAuth();

const user = getCurrentUser();
let currentStep    = 1;
let generatedLinkId = null;

// -----------------------------------------------
// Init
// -----------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  // Show user info in sidebar
  document.getElementById('user-info').innerHTML = `
    <div class="user-name">${user.name}</div>
    <div class="user-company">${user.company}</div>
  `;

  // Build the 5 question blocks
  buildQuestionBlocks();
  setupMobileMenu();
});

// -----------------------------------------------
// Multi-step navigation
// Validates current step before advancing
// -----------------------------------------------
function goToStep(stepNum) {
  // Validate the current step before moving forward
  if (stepNum > currentStep) {
    if (!validateStep(currentStep)) return;
  }

  // Update progress indicators
  for (let i = 1; i <= 3; i++) {
    const indicator = document.getElementById(`step-indicator-${i}`);
    indicator.classList.remove('active', 'done');
    if (i < stepNum) indicator.classList.add('done');
    if (i === stepNum) indicator.classList.add('active');
  }

  // Show/hide form steps
  for (let i = 1; i <= 3; i++) {
    document.getElementById(`step-${i}`).classList.toggle('hidden', i !== stepNum);
  }

  currentStep = stepNum;

  // If reaching review step, build the summary
  if (stepNum === 3) buildReviewSummary();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// -----------------------------------------------
// Validate each step
// -----------------------------------------------
function validateStep(step) {
  if (step === 1) {
    const role = document.getElementById('job-role').value.trim();
    const jd   = document.getElementById('job-description').value.trim();
    if (!role) {
      showToast('Please enter a job role / title.', 'error');
      document.getElementById('job-role').focus();
      return false;
    }
    if (!jd || jd.length < 30) {
      showToast('Please write a job description (at least 30 characters).', 'error');
      document.getElementById('job-description').focus();
      return false;
    }
  }

  if (step === 2) {
    const questions = collectQuestions();
    for (let i = 0; i < 5; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        showToast(`Question ${i + 1} is empty. Please fill it in.`, 'error');
        return false;
      }
      if (q.options.some(opt => !opt.trim())) {
        showToast(`All 4 answer options for Question ${i + 1} must be filled in.`, 'error');
        return false;
      }
      if (q.correct === -1) {
        showToast(`Please select the correct answer for Question ${i + 1}.`, 'error');
        return false;
      }
    }
  }

  return true;
}

// -----------------------------------------------
// Build 5 MCQ question input blocks dynamically
// -----------------------------------------------
function buildQuestionBlocks() {
  const container = document.getElementById('questions-container');
  const letters   = ['A', 'B', 'C', 'D'];

  container.innerHTML = Array.from({ length: 5 }, (_, qi) => `
    <div class="question-block">
      <div class="question-block-header">
        <div class="question-num">
          <div class="question-num-badge">${qi + 1}</div>
          Question ${qi + 1}
        </div>
      </div>

      <!-- Question text input -->
      <div class="form-group">
        <label>Question *</label>
        <input type="text" 
               id="q${qi}-text" 
               placeholder="e.g. Which hook is used for state in React?" />
      </div>

      <!-- 4 answer options in a 2x2 grid -->
      <div class="options-grid">
        ${letters.map((letter, oi) => `
          <div class="option-row">
            <div class="option-letter">${letter}</div>
            <input type="text" 
                   id="q${qi}-opt${oi}" 
                   placeholder="Option ${letter}" />
          </div>
        `).join('')}
      </div>

      <!-- Correct answer selector -->
      <div class="correct-selector">
        <label>✅ Mark correct answer *</label>
        <div class="correct-options">
          ${letters.map((letter, oi) => `
            <label class="correct-radio">
              <input type="radio" name="q${qi}-correct" value="${oi}" />
              <span>Option ${letter}</span>
            </label>
          `).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

// -----------------------------------------------
// Collect all question data from the form inputs
// -----------------------------------------------
function collectQuestions() {
  return Array.from({ length: 5 }, (_, qi) => {
    const questionText = document.getElementById(`q${qi}-text`).value.trim();
    const options = [0, 1, 2, 3].map(oi =>
      document.getElementById(`q${qi}-opt${oi}`).value.trim()
    );
    const correctRadio = document.querySelector(`input[name="q${qi}-correct"]:checked`);
    const correct = correctRadio ? parseInt(correctRadio.value) : -1;

    return { question: questionText, options, correct };
  });
}

// -----------------------------------------------
// Build the review summary shown in Step 3
// -----------------------------------------------
function buildReviewSummary() {
  const role      = document.getElementById('job-role').value.trim();
  const jd        = document.getElementById('job-description').value.trim();
  const questions = collectQuestions();
  const letters   = ['A', 'B', 'C', 'D'];

  document.getElementById('review-summary').innerHTML = `
    <div class="review-section">
      <h4>Job Details</h4>
      <div class="review-role">${escapeHtml(role)}</div>
      <div class="review-jd">${escapeHtml(jd)}</div>
    </div>

    <div class="review-section">
      <h4>Screening Questions (5 MCQs)</h4>
      <div class="review-questions">
        ${questions.map((q, i) => `
          <div class="review-question-item">
            <div class="review-q-text">Q${i + 1}: ${escapeHtml(q.question)}</div>
            <div class="review-options">
              ${q.options.map((opt, oi) => `
                <div class="review-option ${oi === q.correct ? 'is-correct' : ''}">
                  <span>${letters[oi]}.</span>
                  <span>${escapeHtml(opt)}</span>
                  ${oi === q.correct ? '<span>✓ Correct</span>' : ''}
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// -----------------------------------------------
// Form Submit: Generate the hiring link
// -----------------------------------------------
document.getElementById('create-link-form').addEventListener('submit', function(e) {
  e.preventDefault();

  if (!validateStep(2)) return;

  const role      = document.getElementById('job-role').value.trim();
  const jd        = document.getElementById('job-description').value.trim();
  const questions = collectQuestions();

  // Build the link object
  const linkId = generateId(10);
  const newLink = {
    id: linkId,
    recruiterId: user.id,
    jobRole: role,
    jobDescription: jd,
    questions,
    createdAt: new Date().toISOString()
  };

  // Save to localStorage
  const links = getData('dmless_links') || [];
  links.push(newLink);
  saveData('dmless_links', links);

  // Build the shareable URL
  generatedLinkId = linkId;
  const pageUrl = `${window.location.origin}${window.location.pathname.replace('create-link.html', '')}candidate.html?link=${linkId}`;

  // Show success screen
  document.getElementById('create-form-view').classList.add('hidden');
  document.getElementById('success-view').classList.remove('hidden');
  document.getElementById('generated-link-url').textContent = pageUrl;
  document.getElementById('generated-link-url').dataset.url = pageUrl;
  document.getElementById('success-role').textContent = role;

  window.scrollTo({ top: 0, behavior: 'smooth' });
  showToast('Hiring link created! 🎉', 'success');
});

// -----------------------------------------------
// Copy the generated link
// -----------------------------------------------
function copyGeneratedLink() {
  const url = document.getElementById('generated-link-url').dataset.url;
  copyToClipboard(url);
}

// -----------------------------------------------
// Open candidate page in new tab (preview)
// -----------------------------------------------
function openCandidatePreview() {
  if (generatedLinkId) {
    window.open(`candidate.html?link=${generatedLinkId}`, '_blank');
  }
}

// -----------------------------------------------
// Mobile Menu Toggle
// -----------------------------------------------
function setupMobileMenu() {
  const toggle  = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  if (!toggle) return;
  toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
}

// -----------------------------------------------
// XSS prevention helper (same as dashboard.js)
// -----------------------------------------------
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
