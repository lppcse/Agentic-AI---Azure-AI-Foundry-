# Agentic AI Recruitment System (Azure AI Foundry + Automated Email Dispatch)

An autonomous multi-agent recruitment orchestration platform built with **FastAPI**, **Azure AI Foundry (AIProjectClient)**, and **Automated Email Dispatch**.

---

## 🤖 Architecture: 4 Autonomous Agents & Orchestrator

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
     - `HOLD` (55% ≤ Total Score < 75%)
     - `REJECT` (Total Score < 55%)
4. **Agent 4: Interview Scheduler & Automated Email Agent**
   - **Automated Email Dispatch**: Runs **ONLY** for shortlisted candidates (`SELECT`).
   - Generates calendar invite, unique `INT-...` meeting ID, and virtual conference coordinates.
   - Dispatches automated email notification via real SMTP or simulated local queue.
   - If the candidate is on `HOLD` or `REJECT`, the interview invitation is automatically suppressed to protect recruiter time.
5. **Azure AI Foundry Reviewer**
   - Employs Azure AI Foundry's `AIProjectClient` to generate an executive summarization of the multi-agent decision trail.

---

## 📦 Prerequisites

- **Python**: 3.10 or higher
- **pip** package manager
- (Optional) **Azure AI Foundry** project endpoint + model deployment (e.g. `gpt-4o`)
- (Optional) **SMTP Credentials** (e.g. Gmail App Password, SendGrid, or Office 365) to send real emails

---

## 🚀 Quick Start & Installation

### Step 1: Clone or Unpack the Project
```bash
cd recruitment-system
```

### Step 2: Create and Activate a Python Virtual Environment
```bash
# macOS / Linux:
python3 -m venv venv
source venv/bin/activate

# Windows:
python -m venv venv
venv\Scripts\activate
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
SENDER_NAME="Talent Acquisition Team"
SENDER_EMAIL="your-email@gmail.com"
```

---

## 💻 Running the Application

### Option A: Run the FastAPI Web Server (Recommended)
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```
- Open your browser to: **http://localhost:8000/docs**
- Use the Swagger UI to test `/recruit` (with file upload) or `/recruit-json` (with raw text).

### Option B: Run Interactive CLI Mode
```bash
python app:app # Or run directly:
python app.py
```
You will be prompted to enter:
1. Resume file path (e.g. `sample_resumes/alex_morgan_shortlisted.txt`)
2. Interview date (e.g. `2026-09-20`)
3. Interview time (e.g. `02:00 PM`)
4. Interviewer email (e.g. `lead-interviewer@company.com`)

The terminal will print out the full JSON decision pipeline, agent actions, and email delivery status.

---

## 📡 API Endpoints

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
  -F "interview_time=11:00 AM" \
  -F "interviewer_email=interviewer@company.com"
```

### 2. `POST /recruit-json` (JSON Payload)
```bash
curl -X POST "http://localhost:8000/recruit-json" \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "Alex Morgan, alex.morgan@example.com. 7 years experience with Python, FastAPI, React, Docker, Azure, RAG and Agentic AI.",
    "job_description": "GenAI Full Stack Developer. Python, React, Azure.",
    "interview_date": "2026-09-22",
    "interview_time": "03:00 PM",
    "interviewer_email": "tech-lead@company.com"
  }'
```

---

## 🧪 Testing with Included Samples

We include two sample resumes in `sample_resumes/`:

1. **`alex_morgan_shortlisted.txt`**:
   - 7 years experience with Python, FastAPI, React, Docker, Azure, RAG, LangChain.
   - **Expected Outcome**: `SELECT` (Score: 100%), Automated Email **SENT**.
2. **`sam_taylor_rejected.txt`**:
   - 1 year experience, missing primary backend & cloud skills.
   - **Expected Outcome**: `REJECT` (Score: ~21%), Interview & Email **SKIPPED**.

---

## 🛡️ Automated Email Verification Checklist

- [x] Candidate evaluation happens **prior** to any calendar scheduling.
- [x] When `decision == "SELECT"`, Agent 4 crafts personalized email with interview date, time, meeting ID, and evaluation score.
- [x] Sends via SMTP (when configured) or queues in simulated dispatch audit log.
- [x] When `decision == "REJECT"` or `"HOLD"`, email dispatch is safely suppressed with audit explanation.
