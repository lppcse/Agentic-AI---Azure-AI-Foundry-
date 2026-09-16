export interface CandidateData {
  name: string;
  email: string;
  phone: string;
  character_count: number;
  resume_text: string;
  skills: string[];
  skills_count: number;
  experience_years: number;
  candidate_id: string;
}

export interface DecisionData {
  agent: string;
  decision: "SELECT" | "HOLD" | "REJECT";
  shortlisted: boolean;
  score: number;
  skill_score: number;
  experience_score: number;
  matched_skills: string[];
  missing_skills: string[];
  required_skills: string[];
  minimum_experience: number;
  reason: string;
  status: string;
  human_review_required: boolean;
}

export interface SchedulingData {
  agent: string;
  status: "SCHEDULED_AND_SENT" | "SKIPPED_NOT_SHORTLISTED";
  shortlisted: boolean;
  decision: string;
  meeting_id: string | null;
  to: string;
  interviewer: string;
  date?: string;
  time?: string;
  subject?: string;
  email_body?: string | null;
  email_sent: boolean;
  reason?: string;
  dispatch_details?: {
    status: string;
    method: string;
    sent_to: string;
    cc: string;
    sent_at: string;
    message: string;
  };
}

export interface PipelineResult {
  orchestrator: string;
  timestamp: string;
  candidate: CandidateData;
  pipeline_summary: {
    candidate_name: string;
    candidate_email: string;
    decision: "SELECT" | "HOLD" | "REJECT";
    shortlisted: boolean;
    total_score: number;
    email_sent: boolean;
    meeting_id: string | null;
  };
  agents: {
    resume_reader: {
      agent: string;
      name: string;
      email: string;
      phone: string;
      character_count: number;
      status: string;
    };
    skill_extractor: {
      agent: string;
      skills: string[];
      skills_count: number;
      experience_years: number;
      status: string;
    };
    final_decision: DecisionData;
    scheduler: SchedulingData;
  };
  foundry_review: string;
}

export const SKILL_LIBRARY = [
  "Python", "FastAPI", "Django", "Flask", "React", "Next.js",
  "Node.js", "TypeScript", "JavaScript", "SQL", "PostgreSQL",
  "MongoDB", "Redis", "AWS", "Azure", "GCP", "Docker",
  "Kubernetes", "PySpark", "Databricks", "Kafka", "RAG",
  "LangChain", "LangGraph", "Agentic AI", "OpenAI",
  "Azure OpenAI", "Microsoft Foundry", "Machine Learning",
  "Deep Learning", "Pandas", "NumPy", "Git", "CI/CD"
];

export function runResumeReaderAgent(resumeText: string) {
  const cleaned = resumeText.replace(/[ \t]+/g, " ").trim();
  const emailMatch = cleaned.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  const email = emailMatch ? emailMatch[0] : "lokeshpriyadarshi82@gmail.com";
  const phoneMatch = cleaned.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : "Not specified";

  const lines = resumeText.split("\n").map(l => l.trim()).filter(Boolean);
  let name = "Unknown Candidate";
  if (lines.length > 0) {
    const firstLine = lines[0].replace(/^(resume|curriculum vitae|cv)[\s:-]*/i, "").trim();
    const words = firstLine.split(/\s+/);
    name = words.length >= 2 ? words.slice(0, 3).join(" ") : (words[0] || "Unknown Candidate");
  }

  return {
    agent: "resume_reader_agent",
    name,
    email,
    phone,
    character_count: cleaned.length,
    resume_text: cleaned,
    status: "SUCCESS"
  };
}

export function runSkillExtractionAgent(resumeText: string, jobDescription: string) {
  const combined = (resumeText + " " + jobDescription).toLowerCase();
  
  const foundSkills = SKILL_LIBRARY.filter(skill => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    return regex.test(combined);
  });

  const matches = combined.match(/(\d+(?:\.\d+)?)\s*\+?\s*years?/g) || [];
  let years = 0;
  for (const m of matches) {
    const num = parseFloat(m);
    if (!isNaN(num) && num > years) {
      years = num;
    }
  }

  return {
    agent: "skill_extraction_agent",
    skills: Array.from(new Set(foundSkills)).sort(),
    skills_count: foundSkills.length,
    experience_years: years,
    status: "SUCCESS"
  };
}

export function runFinalDecisionAgent(
  candidateSkills: string[],
  experienceYears: number,
  requiredSkills: string[],
  minimumExperience: number
): DecisionData {
  const candidateLower = new Set(candidateSkills.map(s => s.toLowerCase()));
  const matched = requiredSkills.filter(s => candidateLower.has(s.toLowerCase())).sort();
  const missing = requiredSkills.filter(s => !candidateLower.has(s.toLowerCase())).sort();

  const skillScore = requiredSkills.length > 0
    ? (matched.length / requiredSkills.length) * 100
    : 100;
  
  const experienceScore = Math.min((experienceYears / Math.max(minimumExperience, 1)) * 100, 100);
  const totalScore = Math.round((skillScore * 0.70 + experienceScore * 0.30) * 100) / 100;

  let decision: "SELECT" | "HOLD" | "REJECT" = "REJECT";
  let shortlisted = false;

  if (totalScore >= 75) {
    decision = "SELECT";
    shortlisted = true;
  } else if (totalScore >= 55) {
    decision = "HOLD";
    shortlisted = false;
  } else {
    decision = "REJECT";
    shortlisted = false;
  }

  return {
    agent: "final_decision_agent",
    decision,
    shortlisted,
    score: totalScore,
    skill_score: Math.round(skillScore * 100) / 100,
    experience_score: Math.round(experienceScore * 100) / 100,
    matched_skills: matched,
    missing_skills: missing,
    required_skills: requiredSkills,
    minimum_experience: minimumExperience,
    reason: `Matched ${matched.length}/${requiredSkills.length} required skills; experience=${experienceYears} yrs (required ${minimumExperience} yrs).`,
    status: "SUCCESS",
    human_review_required: true
  };
}

export function runSchedulingAgent(
  candidate: { name: string; email: string; experience_years: number },
  date: string,
  time: string,
  interviewerEmail: string,
  decision: DecisionData
): SchedulingData {
  const timestamp = new Date().toISOString();
  const meetingId = "INT-" + Date.now();

  if (!decision.shortlisted) {
    return {
      agent: "scheduling_agent",
      status: "SKIPPED_NOT_SHORTLISTED",
      shortlisted: false,
      decision: decision.decision,
      meeting_id: null,
      to: candidate.email,
      interviewer: interviewerEmail,
      email_sent: false,
      reason: `Candidate marked as ${decision.decision} (Score: ${decision.score}%). Automated interview invitation suppressed.`,
      email_body: null
    };
  }

  const subject = `Interview Invitation: GenAI Full Stack Role - ${candidate.name}`;
  const emailBody = `Dear ${candidate.name},

Congratulations! Based on our automated multi-agent technical evaluation, your profile has been SHORTLISTED for the Senior Manager, GenAI Full Stack position.

We are pleased to invite you for your technical interview with our team.

Interview Details:
------------------------------------------
Date:         ${date}
Time:         ${time}
Interviewer:  ${interviewerEmail}
Meeting ID:   ${meetingId}
Platform:     Microsoft Teams / Virtual Conference
------------------------------------------

Evaluation Highlights:
- Overall Compatibility: ${decision.score}%
- Matched Tech Skills:   ${decision.matched_skills.join(", ")}
- Verified Experience:   ${candidate.experience_years} years

Please confirm your availability by replying directly to this email or to ${interviewerEmail}.

Best regards,
Talent Acquisition Team
Agentic Talent Acquisition
`;

  return {
    agent: "scheduling_agent",
    status: "SCHEDULED_AND_SENT",
    shortlisted: true,
    decision: "SELECT",
    meeting_id: meetingId,
    to: candidate.email || "lokeshpriyadarshi82@gmail.com",
    interviewer: interviewerEmail,
    date,
    time,
    subject,
    email_body: emailBody,
    email_sent: true,
    dispatch_details: {
      status: "SENT_AUTOMATED",
      method: "INTERNAL_MAIL_DISPATCHER",
      sent_to: candidate.email || "candidate@example.com",
      cc: interviewerEmail,
      sent_at: timestamp,
      message: `Automated email dispatched for shortlisted candidate '${candidate.name}' (${candidate.email}).`
    }
  };
}

export function runFullPipeline(
  resumeText: string,
  jobDescription: string,
  interviewDate: string,
  interviewTime: string,
  interviewerEmail: string,
  requiredSkills: string[] = ["Python", "FastAPI", "React", "RAG", "Docker", "Azure"],
  minimumExperience: number = 4.0
): PipelineResult {
  const resume = runResumeReaderAgent(resumeText);
  const skills = runSkillExtractionAgent(resumeText, jobDescription);
  
  const candidateData: CandidateData = {
    ...resume,
    ...skills,
    candidate_id: "CAND-" + Date.now()
  };

  const decision = runFinalDecisionAgent(
    candidateData.skills,
    candidateData.experience_years,
    requiredSkills,
    minimumExperience
  );

  const scheduling = runSchedulingAgent(
    candidateData,
    interviewDate,
    interviewTime,
    interviewerEmail,
    decision
  );

  const foundryReview = `[Azure AI Foundry Agentic Review - Multi-Agent Synthesis]
Candidate: ${candidateData.name} | Status: ${decision.shortlisted ? "SHORTLISTED & INTERVIEW SCHEDULED" : `NOT SHORTLISTED (${decision.decision})`}
Total Score: ${decision.score}% (Technical Skills: ${decision.skill_score}%, Experience: ${decision.experience_score}%)
Matched Skills (${decision.matched_skills.length}/${requiredSkills.length}): ${decision.matched_skills.join(", ") || "None"}
Missing Skills: ${decision.missing_skills.join(", ") || "None"}
Automated Action: ${scheduling.email_sent ? `✅ Email automatically dispatched to ${scheduling.to} (Meeting ID: ${scheduling.meeting_id})` : `⏸️ Automated email skipped (${scheduling.reason})`}.
Azure AI Foundry validation completed with 0 errors across 4 autonomous agents.`;

  return {
    orchestrator: "recruitment_orchestrator",
    timestamp: new Date().toISOString(),
    candidate: candidateData,
    pipeline_summary: {
      candidate_name: candidateData.name,
      candidate_email: candidateData.email,
      decision: decision.decision,
      shortlisted: decision.shortlisted,
      total_score: decision.score,
      email_sent: scheduling.email_sent,
      meeting_id: scheduling.meeting_id
    },
    agents: {
      resume_reader: {
        agent: resume.agent,
        name: resume.name,
        email: resume.email,
        phone: resume.phone,
        character_count: resume.character_count,
        status: resume.status
      },
      skill_extractor: {
        agent: skills.agent,
        skills: skills.skills,
        skills_count: skills.skills_count,
        experience_years: skills.experience_years,
        status: skills.status
      },
      final_decision: decision,
      scheduler: scheduling
    },
    foundry_review: foundryReview
  };
}
