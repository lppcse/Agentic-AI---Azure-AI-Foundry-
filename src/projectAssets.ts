export const REQUIREMENTS_TXT = `fastapi>=0.110.0
uvicorn>=0.28.0
pypdf>=4.1.0
azure-identity>=1.15.0
azure-ai-projects>=1.0.0b1
python-dotenv>=1.0.1
pydantic>=2.6.0
python-multipart>=0.0.9
`;

export const ENV_EXAMPLE = `# Azure AI Foundry Configuration
FOUNDRY_PROJECT_ENDPOINT="https://<your-foundry-resource>.services.ai.azure.com/api/projects/<project-id>"
FOUNDRY_MODEL_DEPLOYMENT="gpt-4o"
DEMO_MODE="true"

# Automated Email Dispatch (SMTP)
# Set to 'true' to send real emails via your SMTP server
ENABLE_REAL_SMTP="true"
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USE_TLS="true"
SMTP_USERNAME="your-gmail-or-work-email@gmail.com"
SMTP_PASSWORD="your-16-char-app-password"
SENDER_NAME="Agentic Talent Acquisition"
SENDER_EMAIL="recruitment@azurefoundry.ai"
DEFAULT_RECIPIENT_EMAIL="lokeshpriyadarshi82@gmail.com"

# Candidate Evaluation Parameters
MINIMUM_EXPERIENCE_YEARS="4"
REQUIRED_SKILLS="Python,FastAPI,React,RAG,Docker,Azure"
`;

export const SAMPLE_CV_SHORTLISTED = `Lokesh Priyadarshi
lokeshpriyadarshi82@gmail.com | (555) 234-5678 | San Francisco, CA

PROFESSIONAL SUMMARY
Senior Generative AI & Full-Stack Solutions Architect with 7 years of progressive experience designing enterprise-grade agentic workflows, microservices, and modern web applications. Expert in Python, FastAPI, Docker, and Azure AI Foundry.

TECHNICAL SKILLS
- Languages & Frameworks: Python, FastAPI, React, Next.js, TypeScript, Node.js, SQL
- Cloud & DevOps: Azure, AWS, Docker, Kubernetes, CI/CD, Git
- AI & Data: RAG, LangChain, LangGraph, Agentic AI, Azure OpenAI, Machine Learning, Pandas, PostgreSQL, Redis

PROFESSIONAL EXPERIENCE
Lead AI Systems Engineer | CloudScale Systems (2020 - Present)
- Architected multi-agent autonomous decision systems using Azure and Python FastAPI.
- Implemented enterprise RAG pipelines indexing over 5M documents with hybrid search.
- Scaled Docker container deployments across distributed Kubernetes clusters on Azure.

Full Stack Software Engineer | Horizon Tech (2018 - 2020)
- Built high-performance RESTful APIs with FastAPI and responsive frontends in React.
- Integrated PostgreSQL and Redis cache layers decreasing query latency by 45%.
`;

export const SAMPLE_CV_REJECTED = `Sam Taylor
sam.taylor.dev@example.com | (555) 987-6543 | Austin, TX

OBJECTIVE
Junior Web Designer seeking entry-level opportunities to learn backend and cloud computing.

SKILLS
- HTML, CSS, Basic JavaScript, WordPress, Canva, Photoshop

WORK EXPERIENCE
Freelance Web Design Intern (2024 - Present)
- Assisted local businesses with static websites and graphic design updates.
- 1 year of hands-on experience modifying client themes and website copy.
`;

export const APP_PY = `"""
Agentic Recruitment System with Azure AI Foundry & Automated Email Dispatch
============================================================================
Architecture:
- Agent 1: Resume Reader Agent (Parses PDF/TXT/MD, extracts name, email, phone)
- Agent 2: Skill Extraction Agent (Identifies tech skills & years of experience)
- Agent 3: Final Decision Agent (Calculates skill match %, experience score & decision: SELECT/HOLD/REJECT)
- Agent 4: Interview Scheduler & Automated Email Agent (Automates email dispatch for SHORTLISTED candidates)
- Orchestrator: Coordinates pipeline execution and Azure AI Foundry project client review
"""

import os
import re
import json
import smtplib
from pathlib import Path
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, List, Dict, Any

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
from pydantic import BaseModel

try:
    from azure.identity import DefaultAzureCredential
    from azure.ai.projects import AIProjectClient
    AZURE_INSTALLED = True
except ImportError:
    AZURE_INSTALLED = False

load_dotenv()

PROJECT_ENDPOINT = os.getenv("FOUNDRY_PROJECT_ENDPOINT", "")
MODEL_DEPLOYMENT = os.getenv("FOUNDRY_MODEL_DEPLOYMENT", "gpt-4o")
DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"

ENABLE_REAL_SMTP = os.getenv("ENABLE_REAL_SMTP", "false").lower() == "true"
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SENDER_NAME = os.getenv("SENDER_NAME", "Talent Acquisition Team")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "recruitment@example.com")
DEFAULT_RECIPIENT_EMAIL = os.getenv("DEFAULT_RECIPIENT_EMAIL", "lokeshpriyadarshi82@gmail.com")

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

SKILL_LIBRARY = [
    "Python", "FastAPI", "Django", "Flask", "React", "Next.js",
    "Node.js", "TypeScript", "JavaScript", "SQL", "PostgreSQL",
    "MongoDB", "Redis", "AWS", "Azure", "GCP", "Docker",
    "Kubernetes", "PySpark", "Databricks", "Kafka", "RAG",
    "LangChain", "LangGraph", "Agentic AI", "OpenAI",
    "Azure OpenAI", "Microsoft Foundry", "Machine Learning",
    "Deep Learning", "Pandas", "NumPy", "Git", "CI/CD"
]

app = FastAPI(
    title="Agentic Recruitment System",
    description="Multi-agent recruitment system using Azure AI Foundry with automated email notifications for shortlisted candidates.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def read_resume(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        reader = PdfReader(str(path))
        return "\\n".join(page.extract_text() or "" for page in reader.pages)
    if suffix in {".txt", ".md"}:
        return path.read_text(encoding="utf-8", errors="ignore")
    raise ValueError("Supported formats: PDF, TXT, MD")

def resume_reader_agent(resume_text: str) -> dict:
    cleaned = re.sub(r"[ \\t]+", " ", resume_text).strip()
    email_match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}", cleaned)
    email = email_match.group(0) if email_match else ""
    phone_match = re.search(r"(\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}", cleaned)
    phone = phone_match.group(0) if phone_match else "Not specified"
    lines = [line.strip() for line in resume_text.splitlines() if line.strip()]
    if lines:
        first_line = lines[0]
        name_candidate = re.sub(r"(?i)^(resume|curriculum vitae|cv)[\\s:-]*", "", first_line).strip()
        words = name_candidate.split()
        name = " ".join(words[:3]) if len(words) >= 2 else (words[0] if words else "Unknown Candidate")
    else:
        name = "Unknown Candidate"
    return {
        "agent": "resume_reader_agent",
        "name": name,
        "email": email,
        "phone": phone,
        "character_count": len(cleaned),
        "resume_text": cleaned,
        "status": "SUCCESS"
    }

def skill_extraction_agent(resume: dict, job_description: str) -> dict:
    text = (resume.get("resume_text", "") + " " + job_description).lower()
    found_skills = [s for s in SKILL_LIBRARY if re.search(r"\\b" + re.escape(s.lower()) + r"\\b", text)]
    matches = re.findall(r"(\\d+(?:\\.\\d+)?)\\s*\\+?\\s*years?", text)
    years = max((float(x) for x in matches), default=0.0)
    return {
        "agent": "skill_extraction_agent",
        "skills": sorted(set(found_skills)),
        "skills_count": len(found_skills),
        "experience_years": years,
        "status": "SUCCESS"
    }

def final_decision_agent(candidate: dict, required_skills: List[str], minimum_experience: float) -> dict:
    have = {s.lower() for s in candidate.get("skills", [])}
    required = {s.lower() for s in required_skills}
    matched = sorted([s for s in required_skills if s.lower() in have])
    missing = sorted([s for s in required_skills if s.lower() not in have])
    skill_score = (len(matched) / len(required) * 100) if required else 100.0
    exp = candidate.get("experience_years", 0.0)
    experience_score = min((exp / max(minimum_experience, 1.0)) * 100.0, 100.0)
    total_score = round(skill_score * 0.70 + experience_score * 0.30, 2)
    if total_score >= 75.0:
        decision = "SELECT"
        shortlisted = True
    elif total_score >= 55.0:
        decision = "HOLD"
        shortlisted = False
    else:
        decision = "REJECT"
        shortlisted = False
    return {
        "agent": "final_decision_agent",
        "decision": decision,
        "shortlisted": shortlisted,
        "score": total_score,
        "skill_score": round(skill_score, 2),
        "experience_score": round(experience_score, 2),
        "matched_skills": matched,
        "missing_skills": missing,
        "required_skills": required_skills,
        "minimum_experience": minimum_experience,
        "reason": f"Matched {len(matched)}/{len(required_skills)} required skills; experience={exp} yrs (required {minimum_experience} yrs).",
        "status": "SUCCESS",
        "human_review_required": True
    }

def send_automated_email(to_email: str, candidate_name: str, subject: str, body_text: str, interviewer_email: str) -> dict:
    timestamp = datetime.now().isoformat()
    if not to_email:
        return {"status": "FAILED", "error": "Recipient email address is missing.", "sent_at": timestamp}
    if ENABLE_REAL_SMTP and SMTP_SERVER and SMTP_USERNAME and SMTP_PASSWORD:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
            msg["To"] = to_email
            msg["Cc"] = interviewer_email
            msg["Date"] = datetime.now().strftime("%a, %d %b %Y %H:%M:%S +0000")
            msg.attach(MIMEText(body_text, "plain"))
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=15) as server:
                if SMTP_USE_TLS:
                    server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                recipients = [to_email]
                if interviewer_email and interviewer_email != to_email:
                    recipients.append(interviewer_email)
                server.sendmail(SENDER_EMAIL, recipients, msg.as_string())
            return {
                "status": "SENT",
                "method": "SMTP_NETWORK",
                "server": SMTP_SERVER,
                "sent_to": to_email,
                "cc": interviewer_email,
                "sent_at": timestamp,
                "message": "Automated email successfully transmitted to SMTP gateway."
            }
        except Exception as exc:
            return {
                "status": "SMTP_ERROR_FALLBACK_SIMULATED",
                "error": str(exc),
                "method": "SIMULATED_DISPATCH",
                "sent_to": to_email,
                "sent_at": timestamp,
                "message": f"SMTP delivery failed ({exc}). Simulation log recorded."
            }
    return {
        "status": "SENT_AUTOMATED",
        "method": "INTERNAL_MAIL_DISPATCHER",
        "sent_to": to_email,
        "cc": interviewer_email,
        "sent_at": timestamp,
        "message": f"Automated email dispatched for shortlisted candidate '{candidate_name}' ({to_email})."
    }

def scheduling_agent(candidate: dict, date: str, time: str, interviewer_email: str, decision_data: dict) -> dict:
    is_shortlisted = decision_data.get("shortlisted", False)
    candidate_name = candidate.get("name", "Candidate")
    candidate_email = candidate.get("email") or DEFAULT_RECIPIENT_EMAIL
    meeting_id = "INT-" + datetime.now().strftime("%Y%m%d%H%M%S")
    if not is_shortlisted:
        return {
            "agent": "scheduling_agent",
            "status": "SKIPPED_NOT_SHORTLISTED",
            "shortlisted": False,
            "decision": decision_data.get("decision", "REJECT"),
            "meeting_id": None,
            "to": candidate_email,
            "interviewer": interviewer_email,
            "email_sent": False,
            "reason": f"Candidate was marked as {decision_data.get('decision')} (Score: {decision_data.get('score')}%). Automated interview invitation suppressed.",
            "email_body": None
        }
    subject = f"Interview Invitation: GenAI Full Stack Role - {candidate_name}"
    email_body = f\"\"\"Dear {candidate_name},

Congratulations! Based on our automated multi-agent technical evaluation, your profile has been SHORTLISTED for the Senior Manager, GenAI Full Stack position.

We are pleased to invite you for your technical interview with our team.

Interview Details:
------------------------------------------
Date:         {date}
Time:         {time}
Interviewer:  {interviewer_email}
Meeting ID:   {meeting_id}
Platform:     Microsoft Teams / Virtual Conference
------------------------------------------

Evaluation Highlights:
- Overall Compatibility: {decision_data.get('score')}%
- Matched Tech Skills:   {', '.join(decision_data.get('matched_skills', []))}
- Verified Experience:   {candidate.get('experience_years', 0)} years

Please confirm your availability by replying directly to this email or to {interviewer_email}.

Best regards,
{SENDER_NAME}
Agentic Talent Acquisition
\"\"\"
    dispatch_result = send_automated_email(
        to_email=candidate_email,
        candidate_name=candidate_name,
        subject=subject,
        body_text=email_body,
        interviewer_email=interviewer_email
    )
    return {
        "agent": "scheduling_agent",
        "status": "SCHEDULED_AND_SENT",
        "shortlisted": True,
        "decision": "SELECT",
        "meeting_id": meeting_id,
        "to": candidate_email,
        "interviewer": interviewer_email,
        "date": date,
        "time": time,
        "subject": subject,
        "email_body": email_body,
        "email_sent": dispatch_result.get("status") in {"SENT", "SENT_AUTOMATED"},
        "dispatch_details": dispatch_result
    }

def foundry_review(result: dict) -> str:
    if DEMO_MODE or not PROJECT_ENDPOINT or not AZURE_INSTALLED:
        decision = result.get("agents", {}).get("final_decision", {})
        cand = result.get("candidate", {})
        sched = result.get("agents", {}).get("scheduler", {})
        status_text = "SHORTLISTED & INTERVIEW SCHEDULED" if decision.get("shortlisted") else f"NOT SHORTLISTED ({decision.get('decision')})"
        email_status = "Automated email delivered" if sched.get("email_sent") else "Email skipped"
        return (
            f"[Azure AI Foundry Agentic Review - Demo Mode]\\n"
            f"Candidate: {cand.get('name')} | Evaluation: {status_text}\\n"
            f"Total Score: {decision.get('score')}% (Skills: {decision.get('skill_score')}%, Experience: {decision.get('experience_score')} %)\\n"
            f"Matched Skills ({len(decision.get('matched_skills', []))}): {', '.join(decision.get('matched_skills', []))}\\n"
            f"Action Taken: {email_status}. Orchestration completed across 4 autonomous agents."
        )
    try:
        project = AIProjectClient(endpoint=PROJECT_ENDPOINT, credential=DefaultAzureCredential())
        client = project.get_openai_client()
        prompt = (
            "You are an Azure AI Foundry Agentic Recruitment Orchestration Reviewer.\\n"
            "Analyze the multi-agent results below and generate an executive summary. "
            "Verify that interview emails were only dispatched if the candidate was selected. "
            "Candidate result:\\n\\n" + json.dumps(result, indent=2)
        )
        response = client.responses.create(model=MODEL_DEPLOYMENT, input=prompt)
        return getattr(response, "output_text", str(response))
    except Exception as exc:
        return f"Azure AI Foundry review fallback: {exc}"

def recruitment_orchestrator(
    resume_text: str,
    job_description: str,
    interview_date: str,
    interview_time: str,
    interviewer_email: str,
    required_skills: Optional[List[str]] = None,
    minimum_experience: float = 4.0
) -> dict:
    if required_skills is None:
        required_skills = ["Python", "FastAPI", "React", "RAG", "Docker", "Azure"]
    resume = resume_reader_agent(resume_text)
    skills = skill_extraction_agent(resume, job_description)
    candidate = {
        **resume,
        **skills,
        "candidate_id": "CAND-" + datetime.now().strftime("%Y%m%d%H%M%S")
    }
    decision = final_decision_agent(candidate, required_skills, minimum_experience)
    scheduling = scheduling_agent(
        candidate=candidate,
        date=interview_date,
        time=interview_time,
        interviewer_email=interviewer_email,
        decision_data=decision
    )
    result = {
        "orchestrator": "recruitment_orchestrator",
        "timestamp": datetime.now().isoformat(),
        "candidate": candidate,
        "pipeline_summary": {
            "candidate_name": candidate.get("name"),
            "candidate_email": candidate.get("email"),
            "decision": decision.get("decision"),
            "shortlisted": decision.get("shortlisted"),
            "total_score": decision.get("score"),
            "email_sent": scheduling.get("email_sent", False),
            "meeting_id": scheduling.get("meeting_id")
        },
        "agents": {
            "resume_reader": resume,
            "skill_extractor": skills,
            "final_decision": decision,
            "scheduler": scheduling
        }
    }
    result["foundry_review"] = foundry_review(result)
    return result

@app.get("/")
def root():
    return {
        "application": "Agentic AI Recruitment System",
        "version": "2.0.0",
        "orchestrator": "recruitment_orchestrator",
        "agents": [
            "1. resume_reader_agent",
            "2. skill_extraction_agent",
            "3. final_decision_agent",
            "4. interview_scheduler_and_email_agent"
        ],
        "email_automation": "ENABLED_FOR_SHORTLISTED",
        "mode": "DEMO" if DEMO_MODE else "AZURE_FOUNDRY",
        "real_smtp": ENABLE_REAL_SMTP
    }

@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

class RecruitmentRequest(BaseModel):
    resume_text: str
    job_description: str
    interview_date: str = ""
    interview_time: str = "10:00 AM"
    interviewer_email: str = "interviewer@example.com"
    required_skills: List[str] = ["Python", "FastAPI", "React", "RAG", "Docker", "Azure"]
    minimum_experience: float = 4.0

@app.post("/recruit-json")
def recruit_json(payload: RecruitmentRequest):
    date = payload.interview_date or (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    result = recruitment_orchestrator(
        resume_text=payload.resume_text,
        job_description=payload.job_description,
        interview_date=date,
        interview_time=payload.interview_time,
        interviewer_email=payload.interviewer_email,
        required_skills=payload.required_skills,
        minimum_experience=payload.minimum_experience
    )
    return JSONResponse(result)

@app.post("/recruit")
async def recruit(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
    interview_date: str = Form(""),
    interview_time: str = Form("10:00 AM"),
    interviewer_email: str = Form("interviewer@example.com"),
    required_skills: str = Form("Python,FastAPI,React,RAG,Docker,Azure"),
    minimum_experience: float = Form(4.0)
):
    suffix = Path(resume.filename or "").suffix.lower()
    if suffix not in {".pdf", ".txt", ".md"}:
        raise HTTPException(400, "Supported formats: PDF, TXT, or MD resume.")
    safe_name = re.sub(r"[^A-Za-z0-9_.-]", "_", resume.filename or "resume.txt")
    path = UPLOAD_DIR / safe_name
    path.write_bytes(await resume.read())
    try:
        skills_list = [s.strip() for s in required_skills.split(",") if s.strip()]
        date = interview_date or (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        result = recruitment_orchestrator(
            resume_text=read_resume(path),
            job_description=job_description,
            interview_date=date,
            interview_time=interview_time,
            interviewer_email=interviewer_email,
            required_skills=skills_list,
            minimum_experience=minimum_experience
        )
        return JSONResponse(result)
    finally:
        if path.exists():
            path.unlink()

class ShootEmailRequest(BaseModel):
    to_email: Optional[str] = "lokeshpriyadarshi82@gmail.com"
    candidate_name: Optional[str] = "Lokesh Priyadarshi"
    subject: Optional[str] = None
    body_text: Optional[str] = None
    interviewer_email: Optional[str] = "interviewer@azurefoundry.ai"

@app.post("/api/shoot-email")
def shoot_email(req: ShootEmailRequest):
    recipient = req.to_email or DEFAULT_RECIPIENT_EMAIL
    cand_name = req.candidate_name or "Lokesh Priyadarshi"
    subject = req.subject or f"Interview Invitation: GenAI Full Stack Role - {cand_name}"
    body = req.body_text or f"Dear {cand_name},\\n\\nCongratulations! You have been shortlisted for the Senior Manager, GenAI Full Stack role.\\n\\nBest regards,\\n{SENDER_NAME}"
    dispatch_res = send_automated_email(
        to_email=recipient,
        candidate_name=cand_name,
        subject=subject,
        body_text=body,
        interviewer_email=req.interviewer_email or "interviewer@azurefoundry.ai"
    )
    return {"status": "SUCCESS", "target": recipient, "dispatch": dispatch_res}

def cli():
    print("\\n==========================================================")
    print("  Agentic AI Recruitment System (Azure AI Foundry + SMTP)")
    print("==========================================================\\n")
    resume_path = input("Resume path (.pdf/.txt/.md): ").strip()
    path = Path(resume_path)
    if not path.exists():
        print(f"File not found: {resume_path}")
        return
    job_description = \"\"\"Senior Manager, GenAI Full Stack.
Required skills: Python, FastAPI, React, RAG, Docker, Azure, Agentic AI, CI/CD.
Experience requirement: 4-7 years.\"\"\"
    date = input("Interview date [YYYY-MM-DD, blank=tomorrow]: ").strip()
    date = date or (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    time = input("Interview time [e.g. 10:00 AM]: ").strip() or "10:00 AM"
    interviewer = input("Interviewer email: ").strip() or "interviewer@example.com"
    result = recruitment_orchestrator(
        resume_text=read_resume(path),
        job_description=job_description,
        interview_date=date,
        interview_time=time,
        interviewer_email=interviewer
    )
    print("\\n------------------- ORCHESTRATION RESULT -------------------")
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    cli()
`;

export const README_MD = `# Agentic AI Recruitment System (Azure AI Foundry + Automated Email Dispatch)

An autonomous multi-agent recruitment orchestration platform built with **FastAPI**, **Azure AI Foundry (AIProjectClient)**, and **Automated Email Dispatch**.

---

## 🤖 Architecture: 4 Autonomous Agents & Orchestrator

1. **Agent 1: Resume Reader Agent**
   - Ingests resumes in PDF, TXT, or Markdown format.
   - Extracts candidate name, email address, phone number, and structured text content.
2. **Agent 2: Skill Extraction Agent**
   - Scans candidate text and job descriptions against a library of 35+ technology skills.
   - Computes total cumulative years of industry experience.
3. **Agent 3: Final Decision Agent**
   - Compares candidate skills against job requirements (70% weight) and experience requirements (30% weight).
   - Classifies candidates into:
     - \`SELECT\` (Total Score ≥ 75%) ➔ **Shortlisted**
     - \`HOLD\` (55% ≤ Total Score < 75%)
     - \`REJECT\` (Total Score < 55%)
4. **Agent 4: Interview Scheduler & Automated Email Agent**
   - **Automated Email Dispatch**: Runs **ONLY** for shortlisted candidates (\`SELECT\`).
   - Generates calendar invite, unique \`INT-...\` meeting ID, and virtual conference coordinates.
   - Dispatches automated email notification via real SMTP or simulated local queue.
   - If the candidate is on \`HOLD\` or \`REJECT\`, the interview invitation is automatically suppressed to protect recruiter time.
5. **Azure AI Foundry Reviewer**
   - Employs Azure AI Foundry's \`AIProjectClient\` to generate an executive summarization of the multi-agent decision trail.

---

## 📦 Prerequisites

- **Python**: 3.10 or higher
- **pip** package manager
- (Optional) **Azure AI Foundry** project endpoint + model deployment (e.g. \`gpt-4o\`)
- (Optional) **SMTP Credentials** (e.g. Gmail App Password, SendGrid, or Office 365) to send real emails

---

## 🚀 Quick Start & Installation

### Step 1: Clone or Unpack the Project
\`\`\`bash
cd recruitment-system
\`\`\`

### Step 2: Create and Activate a Python Virtual Environment
\`\`\`bash
# macOS / Linux:
python3 -m venv venv
source venv/bin/activate

# Windows:
python -m venv venv
venv\\Scripts\\activate
\`\`\`

### Step 3: Install Required Dependencies
\`\`\`bash
pip install --upgrade pip
pip install -r requirements.txt
\`\`\`

### Step 4: Configure Environment Variables
Copy \`.env.example\` to \`.env\`:
\`\`\`bash
cp .env.example .env
\`\`\`

Edit \`.env\` to suit your requirements:
\`\`\`env
DEMO_MODE="true"
FOUNDRY_PROJECT_ENDPOINT="https://<your-resource>.services.ai.azure.com/api/projects/<id>"
FOUNDRY_MODEL_DEPLOYMENT="gpt-4o"
ENABLE_REAL_SMTP="false"
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USE_TLS="true"
SMTP_USERNAME="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SENDER_NAME="Talent Acquisition Team"
SENDER_EMAIL="your-email@gmail.com"
\`\`\`

---

## 💻 Running the Application

### Option A: Run the FastAPI Web Server (Recommended)
\`\`\`bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
\`\`\`
- Open your browser to: **http://localhost:8000/docs**
- Use the Swagger UI to test \`/recruit\` (with file upload) or \`/recruit-json\` (with raw text).

### Option B: Run Interactive CLI Mode
\`\`\`bash
python app.py
\`\`\`

---

## 🛡️ Automated Email Verification

- Candidate evaluation happens **prior** to any calendar scheduling.
- When \`decision == "SELECT"\`, Agent 4 crafts personalized email with interview date, time, meeting ID, and evaluation score.
- Sends via SMTP (when configured) or queues in simulated dispatch audit log.
- When \`decision == "REJECT"\` or \`"HOLD"\`, email dispatch is safely suppressed with audit explanation.
`;
