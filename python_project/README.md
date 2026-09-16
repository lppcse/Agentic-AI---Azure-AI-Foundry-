# Agentic AI Recruitment System (Azure AI Foundry + Automated Email Dispatch)

An autonomous multi-agent recruitment orchestration platform built with **FastAPI**, **Azure AI Foundry (AIProjectClient)**, **React**, and **Automated SMTP Email Dispatch**.

---

## 📋 Table of Contents

- [What the Application Does](#what-the-application-does)
- [Architecture: 4 Autonomous Agents](#architecture-4-autonomous-agents)
- [Prerequisites](#prerequisites)
- [How to Install and Run Locally](#how-to-install-and-run-locally)
  - [Option A: FastAPI REST Server with Swagger UI (Recommended)](#option-a-fastapi-rest-server-with-swagger-ui-recommended)
  - [Option B: Interactive CLI Mode](#option-b-interactive-cli-mode)
  - [Option C: Full-Stack React Web Dashboard](#option-c-full-stack-react-web-dashboard)
- [How to Use Step-by-Step](#how-to-use-step-by-step)
- [Automated Email Dispatch & SMTP](#automated-email-dispatch--smtp)
- [API Endpoints Reference](#api-endpoints-reference)
- [Sample Resumes](#sample-resumes)
- [Environment Variables](#environment-variables)

---

## 🎯 What the Application Does

The system automates the talent acquisition lifecycle through a team of 4 specialized autonomous AI agents:

1. **Agent 1: Resume Reader Agent**
   - Ingests resumes in PDF, TXT, or Markdown format.
   - Extracts candidate name, email address, phone number, and structured text content.
2. **Agent 2: Skill Extraction Agent**
   - Scans candidate text and job descriptions against a library of 35+ technology skills.
   - Computes total cumulative years of industry experience.
3. **Agent 3: Final Decision Agent**
   - Compares candidate skills against job requirements (70% weight) and experience requirements (30% weight).
   - Classifies candidates into:
     - `SELECT` (Total Score ≥ 75%) ➔ **Shortlisted**
     - `HOLD` (55% ≤ Total Score < 75%) ➔ **Under Review**
     - `REJECT` (Total Score < 55%) ➔ **Declined**
4. **Agent 4: Interview Scheduler & Automated Email Agent**
   - **Automated Email Dispatch**: Runs **ONLY** for shortlisted candidates (`SELECT`).
   - Generates calendar invite, unique `INT-...` meeting ID, and virtual conference coordinates.
   - Dispatches automated email notification via real SMTP or active relay.
   - If the candidate is on `HOLD` or `REJECT`, the interview invitation is automatically suppressed to protect recruiter time.
5. **Azure AI Foundry Reviewer**
   - Employs Azure AI Foundry's `AIProjectClient` to generate an executive summarization of the multi-agent decision trail.

---

## 🤖 Architecture: 4 Autonomous Agents

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Recruitment Orchestrator                        │
└──────┬──────────────────────┬──────────────────┬────────────────┬──────┘
       │                      │                  │                │
       ▼                      ▼                  ▼                ▼
┌──────────────┐      ┌──────────────┐    ┌──────────────┐ ┌──────────────┐
│   Agent 1    │      │   Agent 2    │    │   Agent 3    │ │   Agent 4    │
│Resume Reader │ ───► │Skill Extract │───►│Final Decision│─► Interview &  │
│(Parses CV,   │      │(Matches tech,│    │(Scores %,    │ │Email Dispatch│
│Email, Phone) │      │detects exp)  │    │SELECT/REJECT)│ │(Shortlist    │
└──────────────┘      └──────────────┘    └──────────────┘ │ only!)       │
                                                           └──────────────┘
                                                                  │
                                                        [Azure AI Foundry]
                                                        Executive Review
```

---

## 📦 Prerequisites

- **Python**: 3.10, 3.11, or 3.12
- **pip** package installer
- (Optional) **Azure AI Foundry** project endpoint + model deployment (e.g. `gpt-4o`)
- (Optional) **SMTP Credentials** (e.g. Gmail App Password, SendGrid, or Office 365) to send real emails

---

## 🚀 How to Install and Run Locally

### Step 1: Navigate to the python_project Directory
```bash
cd python_project
```

### Step 2: Create and Activate a Python Virtual Environment
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

### Step 3: Install Required Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` to suit your requirements:
```env
# Mode: set to "false" to connect to real Azure AI Foundry
DEMO_MODE="true"

# Azure AI Foundry credentials (optional if in DEMO_MODE)
FOUNDRY_PROJECT_ENDPOINT="https://<your-resource>.services.ai.azure.com/api/projects/<id>"
FOUNDRY_MODEL_DEPLOYMENT="gpt-4o"

# Email Configuration
ENABLE_REAL_SMTP="false"             # Set "true" to send real emails
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USE_TLS="true"
SMTP_USERNAME="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"    # Google App Password
SENDER_NAME="Agentic Talent Acquisition"
SENDER_EMAIL="recruitment@azurefoundry.ai"
DEFAULT_RECIPIENT_EMAIL="lokeshpriyadarshi82@gmail.com"
```

---

## 💻 Running the Application

### Option A: FastAPI REST Server with Swagger UI (Recommended)
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```
- Open your browser to: **http://localhost:8000/docs**
- Use the Swagger UI to test `/recruit` (with file upload) or `/recruit-json` (with raw text).

### Option B: Interactive CLI Mode
```bash
python app.py
```
You will be prompted to enter:
1. Resume file path (e.g. `sample_resumes/alex_morgan_shortlisted.txt`)
2. Interview date (e.g. `2026-09-22`)
3. Interview time (e.g. `10:30 AM`)
4. Interviewer email (e.g. `interviewer@azurefoundry.ai`)

The terminal will print out the full JSON decision pipeline, agent actions, and email delivery status.

### Option C: Full-Stack React Web Dashboard
If you want the visual React web interface, from the project root:
```bash
cd ..
npm install
npm run dev
```
Open **http://localhost:3000** in your browser.

---

## 🖱️ How to Use Step-by-Step

1. **Provide Candidate Resume**: Upload a PDF/TXT/MD resume or select one from `sample_resumes/`.
2. **Set Job Description & Thresholds**: Specify desired technical skills (Python, FastAPI, React, Docker, Azure) and minimum years of experience (4 years).
3. **Execute Pipeline**:
   - Agent 1 parses contact details.
   - Agent 2 matches skills and computes total career duration.
   - Agent 3 scores candidate fit:
     - If score ≥ 75%: `SELECT` (Shortlisted)
     - If 55% - 74%: `HOLD` (Under Review)
     - If < 55%: `REJECT` (Declined)
   - Agent 4 evaluates decision:
     - If `SELECT`: Generates interview coordinates, unique `INT-...` meeting ID, and dispatches automated invitation.
     - If `HOLD` or `REJECT`: Interview scheduling and email dispatch are **safely suppressed**.
4. **Inspect Output**: Review the JSON response or audit logs.

---

## 🛡️ Automated Email Dispatch & SMTP

- Candidate evaluation happens **prior** to any calendar scheduling.
- When `decision == "SELECT"`, Agent 4 crafts personalized email with interview date, time, meeting ID, and evaluation score.
- Sends via SMTP (when configured) or queues in simulated dispatch audit log.
- When `decision == "REJECT"` or `"HOLD"`, email dispatch is safely suppressed with audit explanation.

---

## 📡 API Endpoints Reference

### 1. `POST /recruit` (File Upload)
Accepts multipart form-data:
- `resume`: File (`.pdf`, `.txt`, or `.md`)
- `job_description`: string
- `interview_date`: string (`YYYY-MM-DD`)
- `interview_time`: string (`10:00 AM`)
- `interviewer_email`: string

**Example using cURL:**
```bash
curl -X POST "http://localhost:8000/recruit" \
  -F "resume=@sample_resumes/alex_morgan_shortlisted.txt" \
  -F "job_description=Senior Manager, GenAI Full Stack. Required: Python, FastAPI, React, RAG, Docker, Azure." \
  -F "interview_date=2026-09-22" \
  -F "interview_time=10:30 AM" \
  -F "interviewer_email=interviewer@azurefoundry.ai"
```

### 2. `POST /recruit-json` (JSON Payload)
```bash
curl -X POST "http://localhost:8000/recruit-json" \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "Lokesh Priyadarshi, lokeshpriyadarshi82@gmail.com. 7 years experience with Python, FastAPI, React, Docker, Azure, RAG and Agentic AI.",
    "job_description": "GenAI Full Stack Developer. Python, React, Azure.",
    "interview_date": "2026-09-22",
    "interview_time": "10:30 AM",
    "interviewer_email": "interviewer@azurefoundry.ai"
  }'
```

### 3. `POST /api/shoot-email` (Manual / Trigger Email)
```bash
curl -X POST "http://localhost:8000/api/shoot-email" \
  -H "Content-Type: application/json" \
  -d '{
    "to_email": "lokeshpriyadarshi82@gmail.com",
    "candidate_name": "Lokesh Priyadarshi",
    "subject": "Interview Invitation: GenAI Full Stack Role - Lokesh Priyadarshi"
  }'
```

---

## 🧪 Sample Resumes

We include two sample resumes in `sample_resumes/`:

1. **`alex_morgan_shortlisted.txt`**:
   - 7 years experience with Python, FastAPI, React, Docker, Azure, RAG, LangChain.
   - **Expected Outcome**: `SELECT` (Score: 100%), Automated Email **SENT**.
2. **`sam_taylor_rejected.txt`**:
   - 1 year experience, missing primary backend & cloud skills.
   - **Expected Outcome**: `REJECT` (Score: ~21%), Interview & Email **SKIPPED**.

---

## 📄 License

This project is licensed under the MIT License.
