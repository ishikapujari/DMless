# ⚡ DMless — Hire Without the Noise

> A frictionless hiring tool that lets recruiters create smart job application links with built-in MCQ knock-out screening. Share anywhere. Auto-screen candidates. Collect résumés from only the best.

---

## 🚀 Live Demo

> _Coming soon — deploy link will go here after Vercel deployment_

**Demo Recruiter Account:**
- Email: `demo@dmless.io`
- Password: `demo1234`

---

## 📸 Pages Overview

| Page | File | Description |
|------|------|-------------|
| Landing Page | `index.html` | Marketing page with features, how it works, pricing |
| Sign Up | `signup.html` | Recruiter registration |
| Log In | `login.html` | Recruiter login |
| Dashboard | `dashboard.html` | Overview stats, hiring links, recent applications |
| Create Hiring Link | `create-link.html` | 3-step wizard: job details → MCQs → generate link |
| Candidate Page | `candidate.html?link=<id>` | Frictionless apply page for candidates |

---

## 🔧 How It Works

### For Recruiters
1. **Sign Up** at `/signup.html`
2. **Create a Hiring Link** — fill in job role, description, and 5 MCQ questions with correct answers marked
3. **Share the link** on LinkedIn, Instagram, WhatsApp, or anywhere
4. **Check your Dashboard** for real-time stats: applied / knocked out / shortlisted

### For Candidates
1. Click the recruiter's hiring link
2. Enter name + email
3. Answer 5 screening MCQs (one wrong = knocked out)
4. If all correct → upload résumé
5. Application submitted ✅

---

## 🗂 Project Structure

```
DMless/
├── index.html          ← Landing page
├── signup.html         ← Recruiter sign up
├── login.html          ← Recruiter log in
├── dashboard.html      ← Recruiter dashboard (analytics + links + apps)
├── create-link.html    ← Create a new hiring link (3-step wizard)
├── candidate.html      ← Candidate application page
│
├── css/
│   ├── global.css      ← Shared styles, design tokens, buttons, forms
│   ├── landing.css     ← Landing page specific styles
│   ├── auth.css        ← Signup & login page styles
│   ├── dashboard.css   ← Dashboard & app layout styles
│   ├── create-link.css ← Create link wizard styles
│   └── candidate.css   ← Candidate page styles
│
├── js/
│   ├── utils.js        ← Shared helpers: localStorage, toast, ID gen
│   ├── dashboard.js    ← Dashboard rendering + analytics logic
│   ├── create-link.js  ← Wizard logic + form validation + link generation
│   └── candidate.js    ← Quiz engine + knockout logic + résumé handling
│
└── README.md
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Markup | Pure HTML5 |
| Styling | Pure CSS3 (Custom Properties, Grid, Flexbox) |
| Logic | Vanilla JavaScript (ES6+) |
| Storage | `localStorage` (browser-side data persistence) |
| Deployment | Vercel (static hosting) |

> **No frameworks. No build tools. No Node.js required.** Just open `index.html` in any browser.

---

## 🧠 Key Features

### Core
- **MCQ Knockout Logic** — Recruiter sets correct answers; one wrong answer = instant elimination
- **Auto-screening** — No manual review of unqualified candidates
- **Real-time Analytics** — Funnel chart, per-job breakdown, 7-day application timeline
- **Résumé Collection** — Only candidates who pass all 5 MCQs can upload their CV
- **Zero login for candidates** — Completely frictionless apply experience
- **Shareable Links** — One unique URL per job, copyable with one click

### New in v1.1
- **🌙 Dark / Light Mode** — Start in dark mode; toggle to light via floating button (bottom-right corner). Preference saved in `localStorage`.
- **📥 Export Candidates to CSV** — Download all candidate data as a `.csv` file from the Applications section. Opens natively in Excel (UTF-8 BOM included).
- **📧 Recruiter Email Notification** — When a candidate passes all MCQs and uploads their résumé, DMless opens a pre-filled `mailto:` email to the recruiter.
- **📋 Pending Review Status** — Candidates who pass and upload a résumé are now marked as **Pending Review** (instead of instantly shortlisted), giving recruiters a clear inbox of CVs to evaluate.
- **✅ Manual Shortlist by Recruiter** — After reviewing a résumé in the Applications table, the recruiter clicks **✓ Shortlist** to move the candidate to **Shortlisted** status.
- **🎉 Candidate Shortlist Email** — When a recruiter clicks Shortlist, DMless opens a pre-filled `mailto:` congratulations email to the candidate.

---

## 🏃 Running Locally

No installation required. Just:

1. Clone or download this repository
2. Open `index.html` in your browser

```bash
git clone https://github.com/YOUR_USERNAME/dmless.git
cd dmless
# Open index.html in browser — or use Live Server in VS Code
```

> **Tip:** Use the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) VS Code extension for the best local development experience.

---

## 🚀 Deploying to Vercel

Since this is a static HTML/CSS/JS site, deployment is straightforward:

### Option 1: Vercel CLI

```bash
npm install -g vercel
cd dmless
vercel
```

### Option 2: Vercel Dashboard (Recommended for beginners)

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: DMless hiring tool"
   git remote add origin https://github.com/YOUR_USERNAME/dmless.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repository
4. Vercel auto-detects it as a static site
5. Click **Deploy** ✅

> No build command or output directory needed for static HTML.

---

## 📊 Data Storage

All data is stored in the browser's `localStorage`:

| Key | Contents |
|-----|----------|
| `dmless_users` | Array of recruiter accounts |
| `dmless_current_user` | Currently logged-in recruiter |
| `dmless_links` | Array of hiring link objects |
| `dmless_applications` | Array of candidate applications |
| `dmless_theme` | User's preferred theme (`"dark"` or `"light"`) |

> ⚠️ **Note:** `localStorage` is browser-local. Data does not sync across devices or users. For a production app, you would replace this with a real backend (e.g., Supabase, Firebase, or a custom API).

---

## 🔮 Future Enhancements

- [x] ~~Email notifications to recruiter when candidate applies~~ ✅ v1.1
- [x] ~~Email confirmation to shortlisted candidates~~ ✅ v1.1
- [x] ~~Export shortlisted candidates to CSV~~ ✅ v1.1 (exports all candidates)
- [x] ~~Dark / light mode toggle~~ ✅ v1.1
- [ ] Backend integration (Supabase / Firebase) for cross-device persistence
- [ ] Real email delivery (EmailJS / SendGrid) instead of `mailto:` links
- [ ] Custom branding / logo per hiring link
- [ ] ATS (Applicant Tracking) pipeline view (Kanban-style)
- [ ] Team / multi-recruiter accounts with role-based access
- [ ] Link expiry dates and maximum application limits
- [ ] Video intro from recruiter embedded on candidate page
- [ ] AI-powered résumé ranking after shortlisting

---

## 👤 Author

Built with ❤️ for modern recruiters.

---

## 📄 License

MIT License — free to use, modify, and deploy.
