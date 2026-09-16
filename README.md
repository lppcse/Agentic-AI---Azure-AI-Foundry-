# Agentic AI Recruitment System (Azure AI Foundry + Automated Email Dispatch)

An autonomous multi-agent recruitment orchestration platform built with **React**, **Node.js/Express**, **FastAPI**, **Azure AI Foundry (AIProjectClient)**, and **Automated SMTP Email Dispatch**.

The system automates the talent acquisition lifecycle through a team of 4 specialized autonomous AI agents that read resumes, extract and quantify tech skills and years of experience, score candidates against job descriptions, automatically schedule interviews, and dispatch personalized invitation emails to shortlisted candidates over SMTP.

---

## 📋 Table of Contents

- [What the Application Does](#-what-the-application-does)
- [Architecture: 4 Autonomous Agents](#-architecture-4-autonomous-agents)
- [Key Features](#-key-features)
- [Prerequisites](#-prerequisites)
- [How to Install and Run Locally](#-how-to-install-and-run-locally)
  - [Method 1: Full-Stack Web App (React + Express) - Recommended](#method-1-full-stack-web-app-react--express---recommended)
  - [Method 2: Standalone Python Backend (FastAPI + CLI)](#method-2-standalone-python-backend-fastapi--cli)
- [How to Use the App Step-by-Step](#-how-to-use-the-app-step-by-step)
- [Email Dispatch & SMTP Configuration](#-email-dispatch--smtp-configuration)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Environment Variables Reference](#-environment-variables-reference)

---

## 🎯 What the Application Does

Manual resume screening and interview coordination consume hours of recruiter time. This application eliminates manual bottlenecks using an autonomous multi-agent pipeline:

1. **Ingests and Parses Resumes**: Reads uploaded PDF, TXT, or Markdown documents (or pasted text), extracting key contact details (name, email, phone).
2. **Analyzes Technical Competencies**: Scans candidate qualifications against 35+ technology skills (e.g., Python, FastAPI, React, RAG, Docker, Azure, TypeScript) and automatically calculates cumulative years of experience.
3. **Applies Weighted Evaluation Scoring**:
   - **70% Weight**: Technical skill match ratio against mandatory job requirements.
   - **30% Weight**: Relevant experience duration against the minimum threshold.
4. **Makes Objective Hiring Decisions**:
   - `SELECT` (**Shortlisted**, Total Score ≥ 75%): Automatically triggers calendar coordination and email dispatch.
   - `HOLD` (**Under Review**, 55% ≤ Total Score < 75%): Placed on hold; automated emails are suppressed.
   - `REJECT` (**Declined**, Total Score < 55%): Disqualified; interview invitations are safely prevented.
5. **Enforces Automated Safety Rules**: Calendar bookings and invitation emails are dispatched **strictly to shortlisted candidates**, eliminating accidental scheduling for non-qualifying profiles.
6. **Dispatches Real Emails via SMTP**: Features an active live SMTP gateway relay with delivery verification, Message ID tracking, and browser HTML preview, with support for custom Gmail credentials.
7. **Generates Executive Audit Summaries**: Uses Azure AI Foundry (`AIProjectClient`) to produce an executive synthesis explaining the rationale behind every decision.

---

## 🤖 Architecture: 4 Autonomous Agents

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        Autonomous Recruitment Orchestrator                             │
└───────────┬──────────────────────┬──────────────────────┬──────────────────────┬───────┘
            │                      │                      │                      │
            ▼                      ▼                      ▼                      ▼
    ┌──────────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
    │   Agent 1    │      │   Agent 2    │      │   Agent 3    │      │   Agent 4    │
    │Resume Reader │ ───► │Skill Extract │ ───► │Final Decision│ ───► │Interview &   │
    │(Parses CV,   │      │(Matches tech,│      │(Scores %,    │      │Email Dispatch│
    │Email, Phone) │      │detects exp)  │      │SELECT/REJECT)│      │(Shortlist    │
    └──────────────┘      └──────────────┘      └──────────────┘      │ ONLY!)       │
                                                                      └──────┬───────┘
                                                                             │
                                                                      [Live SMTP Relay]
                                                                      lokeshpriyadarshi82@gmail.com
                                                                             │
                                                         ┌───────────────────┴───────────────────┐
                                                         ▼                                       ▼
                                                [Azure AI Foundry]                      [Real-Time Audit]
                                                Executive Review                        Status & Message ID
```

| Agent | Name | Role & Responsibility |
|---|---|---|
| **Agent 1** | **Resume Reader Agent** | Reads raw PDF/TXT/MD resumes using regex and text extractors. Parses candidate full name, email, phone number, and professional summary. |
| **Agent 2** | **Skill Extraction Agent** | Cross-references candidate skills against a 35+ technology keyword library. Extracts career history and computes cumulative industry experience in years. |
| **Agent 3** | **Final Decision Agent** | Calculates mathematical scores for skill alignment (70%) and experience duration (30%). Issues a definitive status: `SELECT`, `HOLD`, or `REJECT`. |
| **Agent 4** | **Interview Scheduler Agent** | Generates calendar coordinates, assigns a unique `INT-...` meeting ID, and composes an invitation email. Automatically suppresses emails if the candidate was not shortlisted. |
| **Orchestrator** | **Azure AI Foundry Reviewer** | Coordinates the 4 agents in sequence and invokes Azure AI Foundry's `AIProjectClient` to synthesize an executive audit summary. |

---

## ✨ Key Features

- **Dual-Engine Architecture**: Modern React + TypeScript + Express web dashboard + standalone Python FastAPI backend.
- **One-Click Real Email Trigger**: Dedicated **"⚡ Shoot Real Email to lokeshpriyadarshi82@gmail.com"** button that sends live SMTP emails with delivery confirmation.
- **Zero-Config Active SMTP Gateway**: Transmits real SMTP packets out-of-the-box via Ethereal TLS relay without needing manual Gmail passwords.
- **Custom Gmail / SMTP Support**: In-app SMTP settings modal allows entering personal Gmail credentials (`SMTP_USER` and 16-character App Password).
- **Live Rendered HTML Email Inspection**: Direct link to view the fully formatted HTML email in the browser.
- **Interactive Preset Loader**: One-click buttons to load sample shortlisted (`Lokesh Priyadarshi`, 7 yrs exp) and rejected (`Sam Taylor`, 1 yr exp) resumes.
- **Export & Code Inspector**: In-browser inspector to view and download `app.py`, `requirements.txt`, `.env.example`, JSON schemas, and complete ZIP project archive.

---

## 📦 Prerequisites

Ensure you have the following installed on your system:

### For the Web Application (Recommended):
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm** (comes with Node.js) or **bun** / **yarn** / **pnpm**

### For the Python Backend Engine:
- **Python**: 3.10, 3.11, or 3.12
- **pip** package installer

---

## 🚀 How to Install and Run Locally

### Method 1: Full-Stack Web App (React + Express) - Recommended

This runs the complete interactive browser UI with live backend API endpoints and SMTP email triggers.

#### 1. Clone or Extract the Repository
```bash
git clone <repository-url>
cd <repository-directory>
```

#### 2. Install Node Dependencies
```bash
npm install
```

#### 3. (Optional) Configure Environment Variables
Copy the sample environment file:
```bash
cp .env.example .env
```
*(The app includes a built-in zero-config SMTP relay, so configuring `.env` is optional for local testing).*

#### 4. Start the Development Server
```bash
npm run dev
```

#### 5. Access the Application
Open your web browser and navigate to:
```
http://localhost:3000
```

---

### Method 2: Standalone Python Backend (FastAPI + CLI)

You can also run the self-contained Python recruitment engine located in the `python_project/` folder.

#### 1. Navigate to the Python Directory
```bash
cd python_project
```

#### 2. Create and Activate a Virtual Environment
```bash
# macOS / Linux:
python3 -m venv venv
source venv/bin/activate

# Windows (Command Prompt):
python -m venv venv
venv\Scripts\activate

# Windows (PowerShell):
venv\Scripts\Activate.ps1
```

#### 3. Install Python Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### 4. Configure Environment Variables
```bash
cp .env.example .env
```
Edit `.env` to configure your preferences:
```env
DEMO_MODE="true"
ENABLE_REAL_SMTP="false"
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USERNAME="your-email@gmail.com"
SMTP_PASSWORD="your-google-app-password"
DEFAULT_RECIPIENT_EMAIL="lokeshpriyadarshi82@gmail.com"
```

#### 5. Run the Python Engine

**Option A: Interactive CLI Mode**
```bash
python app.py
```
*Follow the interactive terminal prompts to select a resume file (e.g. `sample_resumes/alex_morgan_shortlisted.txt`), enter interview dates, and view the orchestration output.*

**Option B: FastAPI REST Server with Swagger UI**
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```
Open **http://localhost:8000/docs** in your browser to test endpoints interactively via Swagger UI.

---

## 🖱️ How to Use the App Step-by-Step

Follow these steps to evaluate a candidate and trigger automated email dispatch:

### Step 1: Launch the Application
Start the server with `npm run dev` and open `http://localhost:3000`.

### Step 2: Ingest a Candidate Resume
You have three convenient options in the **Candidate Input** panel:
- **Option A (Instant Test)**: Click **"Load Shortlisted Profile"** to load the pre-configured profile for *Lokesh Priyadarshi* (7 years exp, Full Stack & GenAI).
- **Option B (Rejection Test)**: Click **"Load Rejected Profile"** to test how the system safely suppresses emails for unqualified profiles.
- **Option C (Custom Resume)**: Drag and drop a `.pdf`, `.txt`, or `.md` file, or paste raw resume text into the text area.

### Step 3: Configure Target Role & Interview Parameters
In the right column, verify or customize:
- **Job Description**: Set required skills (e.g., Python, FastAPI, React, RAG, Docker, Azure).
- **Experience Requirement**: Set minimum required years (e.g., 4 years).
- **Interview Scheduling**: Choose the proposed interview date, time, and interviewer email.

### Step 4: Verify Target Email Recipient
- Locate the **"Target Real Email Recipient"** field.
- By default, it is set to **`lokeshpriyadarshi82@gmail.com`**.
- Click *"Set to lokeshpriyadarshi82@gmail.com"* anytime to reset it.

### Step 5: Execute the 4-Agent Pipeline
Click the prominent **"Run 4-Agent Pipeline"** button. The system will sequentially execute:
1. **Agent 1**: Extracts candidate name, email, and phone.
2. **Agent 2**: Scans and highlights matching tech skills and calculates years of experience.
3. **Agent 3**: Scores candidate fit and assigns a status badge (`SHORTLISTED`, `ON HOLD`, or `REJECTED`).
4. **Agent 4**: Prepares the calendar coordinates, generates a meeting ID, and composes the interview invitation.
5. **Azure AI Foundry**: Summarizes the executive evaluation trail.

### Step 6: Trigger Real Outbound Email Dispatch
Once the candidate is evaluated:
- Scroll to the **Agent 4: Interview Scheduler & Automated Email** card.
- Click the amber **"⚡ Shoot Real Email to lokeshpriyadarshi82@gmail.com"** button.
- The system will transmit the email across the live SMTP gateway.
- A green confirmation banner will appear displaying:
  - **Delivery Status**: `Real Email Dispatched via Active SMTP Relay`
  - **Message ID**: Unique SMTP transaction identifier.
  - **Timestamp**: Exact delivery time.
  - **"View Live Dispatched Email" Button**: Click this button to view the rendered HTML email in your browser!

### Step 7: (Optional) Connect Your Personal Gmail Account
- Click the **"SMTP Relay: Active"** pill in the top navigation bar.
- Enter your Gmail address in `SMTP_USER` and your 16-character **Google App Password** in `SMTP_PASS`.
- Click **"Save SMTP Credentials"**. Outbound emails will now transmit directly from your personal address.

### Step 8: View Code and Download Assets
- Click **"View Code & Architecture"** in the header to inspect `app.py`, `README.md`, or the live pipeline JSON output.
- Click **"Download Project (.zip)"** to download the entire deployable package.

---

## 📧 Email Dispatch & SMTP Configuration

The application includes two email delivery modes:

### 1. Active Live SMTP Relay (Zero-Config Default)
- Requires no API keys or passwords.
- Sends live SMTP network packets via TLS over port 587.
- Generates an authentic `250 Accepted` SMTP response and a web preview URL where you can view the dispatched email.

### 2. Custom Gmail / SMTP Credentials
To send emails directly from your own Gmail or corporate email:
1. Enable **2-Step Verification** on your Google Account.
2. Navigate to **Google Account > Security > 2-Step Verification > App Passwords**.
3. Generate a new App Password named "Recruitment Agent".
4. Open the **SMTP Configuration** panel in the app and save your email and 16-character App Password.

---

## 📡 API Reference

The server exposes the following RESTful API endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Healthcheck endpoint returning server status. |
| `GET` | `/api/smtp-config` | Returns current SMTP host, port, authentication status, and default recipient. |
| `POST` | `/api/smtp-config` | Updates runtime SMTP credentials (`user`, `pass`, `host`, `port`). |
| `POST` | `/api/send-email` | Dispatches an interview invitation email over SMTP to the specified recipient. |

### Example: Dispatching an Email via cURL
```bash
curl -X POST http://localhost:3000/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "lokeshpriyadarshi82@gmail.com",
    "candidateName": "Lokesh Priyadarshi",
    "subject": "Interview Invitation: GenAI Full Stack Role - Lokesh Priyadarshi",
    "body": "Dear Lokesh,\n\nCongratulations! You have been shortlisted."
  }'
```

---

## 📁 Project Structure

```
├── .env.example             # Example environment variables template
├── index.html               # Web application HTML entry point
├── metadata.json            # AI Studio app metadata
├── package.json             # Node.js dependencies and run scripts
├── server.ts                # Express backend + Nodemailer SMTP service + Vite middleware
├── vite.config.ts           # Vite bundler configuration
├── src/
│   ├── App.tsx              # Main interactive React application & UI
│   ├── main.tsx             # React client entry point
│   ├── index.css            # Tailwind CSS styling
│   ├── types.ts             # TypeScript interfaces for agents, pipelines, and results
│   ├── pipeline.ts          # 4-Agent client-side recruitment engine
│   └── projectAssets.ts     # Bundled asset templates (app.py, README, sample resumes)
├── python_project/
│   ├── app.py               # Standalone Python FastAPI backend & CLI orchestrator
│   ├── requirements.txt     # Python dependencies (FastAPI, uvicorn, pypdf, azure-identity)
│   ├── .env.example         # Python environment configuration template
│   ├── README.md            # Python-specific setup and documentation
│   └── sample_resumes/      # Sample resumes for testing
│       ├── alex_morgan_shortlisted.txt
│       └── sam_taylor_rejected.txt
└── README.md                # Comprehensive documentation (this file)
```

---

## ⚙️ Environment Variables Reference

| Variable | Description | Default |
|---|---|---|
| `SMTP_HOST` / `SMTP_SERVER` | SMTP server host address | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port (`587` for STARTTLS, `465` for SSL) | `587` |
| `SMTP_USER` / `SMTP_USERNAME` | Sender email address for authentication | *(Optional - falls back to live relay)* |
| `SMTP_PASS` / `SMTP_PASSWORD` | 16-character Google App Password or SMTP token | *(Optional - falls back to live relay)* |
| `DEFAULT_RECIPIENT_EMAIL` | Target email for one-click interview dispatches | `lokeshpriyadarshi82@gmail.com` |
| `FOUNDRY_PROJECT_ENDPOINT` | Azure AI Foundry Project Resource URL | *(Optional - demo mode active)* |
| `FOUNDRY_MODEL_DEPLOYMENT` | Azure AI Foundry deployment name | `gpt-4o` |
| `DEMO_MODE` | Toggle simulated vs live Azure AI Foundry calls | `true` |

---

## 📄 License

This project is licensed under the MIT License.
