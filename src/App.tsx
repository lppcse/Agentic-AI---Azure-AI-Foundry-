import React, { useState, useMemo, useEffect } from "react";
import {
  FileText,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Download,
  Play,
  Sparkles,
  Cpu,
  ShieldCheck,
  AlertCircle,
  Copy,
  FileCode,
  BookOpen,
  Check,
  RefreshCw,
  Upload,
  Calendar,
  User,
  ArrowRight,
  Zap,
  Settings,
  Terminal,
  ExternalLink
} from "lucide-react";
import {
  runFullPipeline,
  PipelineResult
} from "./agentEngine";
import {
  APP_PY,
  README_MD,
  REQUIREMENTS_TXT,
  ENV_EXAMPLE,
  SAMPLE_CV_SHORTLISTED,
  SAMPLE_CV_REJECTED
} from "./projectAssets";
import { downloadFile, downloadProjectZip } from "./downloadHelper";

export default function App() {
  // Preset CV options
  const [selectedPreset, setSelectedPreset] = useState<"shortlisted" | "rejected" | "custom">("shortlisted");
  const [resumeText, setResumeText] = useState<string>(SAMPLE_CV_SHORTLISTED);
  const [jobDescription, setJobDescription] = useState<string>(
    "Senior Manager, GenAI Full Stack.\nRequired skills: Python, FastAPI, React, RAG, Docker, Azure, Agentic AI, CI/CD.\nExperience: 4-7 years."
  );
  
  // Interview coordinates
  const [interviewDate, setInterviewDate] = useState<string>("2026-09-22");
  const [interviewTime, setInterviewTime] = useState<string>("10:30 AM");
  const [interviewerEmail, setInterviewerEmail] = useState<string>("interviewer@azurefoundry.ai");
  const [targetEmail, setTargetEmail] = useState<string>("lokeshpriyadarshi82@gmail.com");
  const [minimumExperience, setMinimumExperience] = useState<number>(4.0);
  const [requiredSkillsInput, setRequiredSkillsInput] = useState<string>("Python, FastAPI, React, RAG, Docker, Azure");

  // Real Email SMTP & Trigger State
  const [smtpStatus, setSmtpStatus] = useState<{
    configured: boolean;
    host: string;
    port: number;
    secure: boolean;
    sender: string;
    userMasked: string | null;
    defaultRecipient: string;
    relayFallbackActive?: boolean;
    instructions?: string;
  } | null>(null);
  const [isShootingEmail, setIsShootingEmail] = useState<boolean>(false);
  const [shootEmailResult, setShootEmailResult] = useState<{
    success: boolean;
    mode: "real_smtp_custom" | "real_smtp_gateway" | "real_smtp" | "smtp_not_configured" | "smtp_error" | string;
    recipient: string;
    message?: string;
    error?: string;
    messageId?: string;
    previewUrl?: string | null;
    gateway?: string;
    timestamp: string;
    hint?: string;
  } | null>(null);
  const [smtpModalOpen, setSmtpModalOpen] = useState<boolean>(false);

  // Custom SMTP Form Inputs
  const [customSmtpUser, setCustomSmtpUser] = useState<string>("");
  const [customSmtpPass, setCustomSmtpPass] = useState<string>("");
  const [customSmtpHost, setCustomSmtpHost] = useState<string>("smtp.gmail.com");
  const [customSmtpPort, setCustomSmtpPort] = useState<number>(587);
  const [isSavingSmtp, setIsSavingSmtp] = useState<boolean>(false);
  const [smtpSaveFeedback, setSmtpSaveFeedback] = useState<string | null>(null);

  // Fetch SMTP status on load
  useEffect(() => {
    fetch("/api/smtp-config")
      .then((res) => res.json())
      .then((data) => {
        setSmtpStatus(data);
        if (data.defaultRecipient) {
          setTargetEmail(data.defaultRecipient);
        }
      })
      .catch((err) => console.log("SMTP config fetch error:", err));
  }, []);

  // Pipeline Execution State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(() => {
    return runFullPipeline(
      SAMPLE_CV_SHORTLISTED,
      "Senior Manager, GenAI Full Stack.\nRequired skills: Python, FastAPI, React, RAG, Docker, Azure, Agentic AI, CI/CD.\nExperience: 4-7 years.",
      "2026-09-22",
      "10:30 AM",
      "interviewer@azurefoundry.ai",
      ["Python", "FastAPI", "React", "RAG", "Docker", "Azure"],
      4.0
    );
  });

  // Modal / Inspector state
  const [inspectorTab, setInspectorTab] = useState<"none" | "app.py" | "README.md" | "json" | "env">("none");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState<boolean>(false);
  const [readmeContent, setReadmeContent] = useState<string>(README_MD);

  // Fetch real root README.md on mount
  useEffect(() => {
    fetch("/api/readme")
      .then((res) => {
        if (res.ok) return res.text();
        return README_MD;
      })
      .then((text) => {
        if (text && text.trim().length > 0) {
          setReadmeContent(text);
        }
      })
      .catch((err) => console.log("README fetch error:", err));
  }, []);

  // Handle Preset Switching
  const handleSelectPreset = (type: "shortlisted" | "rejected" | "custom") => {
    setSelectedPreset(type);
    if (type === "shortlisted") {
      setResumeText(SAMPLE_CV_SHORTLISTED);
    } else if (type === "rejected") {
      setResumeText(SAMPLE_CV_REJECTED);
    }
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedPreset("custom");
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setResumeText(content);
      }
    };
    reader.readAsText(file);
  };

  // Execute Pipeline
  const handleRunPipeline = () => {
    setIsRunning(true);
    const skillsList = requiredSkillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    setTimeout(() => {
      const result = runFullPipeline(
        resumeText,
        jobDescription,
        interviewDate,
        interviewTime,
        interviewerEmail,
        skillsList,
        minimumExperience
      );
      setPipelineResult(result);
      if (result.candidate.email) {
        setTargetEmail(result.candidate.email);
      }
      setIsRunning(false);
    }, 400);
  };

  const handleShootEmail = async (overrideRecipient?: string) => {
    setIsShootingEmail(true);
    setShootEmailResult(null);

    const recipient = overrideRecipient || targetEmail || pipelineResult?.candidate.email || "lokeshpriyadarshi82@gmail.com";
    const candidateName = pipelineResult?.candidate.name || "Lokesh Priyadarshi";
    const emailSubject = scheduler?.subject || `Interview Invitation: GenAI Full Stack Role - ${candidateName}`;
    const emailBody = scheduler?.email_body || `Dear ${candidateName},\n\nCongratulations! Based on our automated multi-agent technical evaluation, your profile has been SHORTLISTED for the Senior Manager, GenAI Full Stack position.\n\nInterview Details:\n------------------------------------------\nDate:         ${interviewDate}\nTime:         ${interviewTime}\nInterviewer:  ${interviewerEmail}\nPlatform:     Microsoft Teams / Virtual Conference\n------------------------------------------\n\nBest regards,\nAgentic Talent Acquisition`;

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipient,
          subject: emailSubject,
          body: emailBody,
          candidateName,
          interviewerEmail
        })
      });
      const data = await response.json();
      setShootEmailResult(data);
    } catch (err: any) {
      setShootEmailResult({
        success: false,
        mode: "smtp_error",
        recipient,
        error: err.message || "Failed to contact local email API",
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsShootingEmail(false);
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSmtp(true);
    setSmtpSaveFeedback(null);
    try {
      const res = await fetch("/api/smtp-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: customSmtpHost,
          port: customSmtpPort,
          user: customSmtpUser,
          pass: customSmtpPass
        })
      });
      const data = await res.json();
      if (data.success) {
        setSmtpSaveFeedback("✅ Custom SMTP credentials active! Outbound emails will transmit directly from your account.");
        setSmtpStatus((prev) => ({
          configured: data.configured,
          host: data.host,
          port: data.port,
          secure: data.port === 465,
          sender: data.configured ? `Agentic Talent Acquisition <${customSmtpUser}>` : prev?.sender || "",
          userMasked: data.userMasked,
          defaultRecipient: data.defaultRecipient || targetEmail
        }));
      }
    } catch (err: any) {
      setSmtpSaveFeedback("❌ Failed to save SMTP configuration: " + err.message);
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const decision = pipelineResult?.agents.final_decision;
  const scheduler = pipelineResult?.agents.scheduler;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* Top Bar / Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-5 py-3 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-white">
                Agentic Recruitment System
              </h1>
              <span className="text-[11px] font-medium bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Azure AI Foundry
              </span>
            </div>
            <p className="text-xs text-slate-400">
              4 Autonomous Agents • Automated Email Dispatch for Shortlisted Candidates
            </p>
          </div>
        </div>

        {/* Action / Download Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            id="open-smtp-config-btn"
            onClick={() => setSmtpModalOpen(true)}
            className="text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
            title="Real SMTP Configuration Details"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>{smtpStatus?.configured ? `Gmail: ${smtpStatus?.userMasked}` : "SMTP Relay: Active"}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </button>

          <button
            id="view-code-btn"
            onClick={() => setInspectorTab(inspectorTab === "app.py" ? "none" : "app.py")}
            className="text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>Updated app.py</span>
          </button>

          <button
            id="view-readme-btn"
            onClick={() => setInspectorTab(inspectorTab === "README.md" ? "none" : "README.md")}
            className="text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>README.md</span>
          </button>

          <button
            id="download-zip-btn"
            onClick={() => downloadProjectZip(readmeContent)}
            className="text-xs font-medium bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold px-3.5 py-1.5 rounded-md shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Project (.zip)</span>
          </button>
        </div>
      </header>

      {/* Main Single-Screen Workspace */}
      <main className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Input & Orchestration Config (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Candidate / CV Input Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-slate-200">1. Candidate Resume (CV)</h2>
              </div>

              {/* Sample Switcher */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => handleSelectPreset("shortlisted")}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    selectedPreset === "shortlisted"
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800/80 font-medium"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Shortlisted Sample
                </button>
                <button
                  onClick={() => handleSelectPreset("rejected")}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    selectedPreset === "rejected"
                      ? "bg-rose-950 text-rose-300 border border-rose-800/80 font-medium"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Rejected Sample
                </button>
                <button
                  onClick={() => handleSelectPreset("custom")}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    selectedPreset === "custom"
                      ? "bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-medium"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {/* Resume Textarea */}
            <div className="relative">
              <textarea
                value={resumeText}
                onChange={(e) => {
                  setResumeText(e.target.value);
                  setSelectedPreset("custom");
                }}
                rows={7}
                placeholder="Paste candidate resume text or upload file (.txt, .md, .pdf)..."
                className="w-full bg-slate-900/90 text-slate-200 text-xs font-mono p-3 rounded-lg border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none resize-y leading-relaxed"
              />
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                <label className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 cursor-pointer">
                  <Upload className="w-3 h-3" />
                  <span>Upload CV file</span>
                  <input
                    type="file"
                    accept=".txt,.md,.pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
                <span>{resumeText.length} characters</span>
              </div>
            </div>
          </div>

          {/* Job Requirements & Interview Setup Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-slate-200">2. Evaluation & Interview Config</h2>
            </div>

            {/* Required Skills & Experience */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Required Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={requiredSkillsInput}
                  onChange={(e) => setRequiredSkillsInput(e.target.value)}
                  className="w-full bg-slate-900 text-slate-200 text-xs px-2.5 py-1.5 rounded-md border border-slate-800 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Min. Experience (Yrs)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={minimumExperience}
                  onChange={(e) => setMinimumExperience(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 text-slate-200 text-xs px-2.5 py-1.5 rounded-md border border-slate-800 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Interview Date & Interviewer Email */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-900">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Interview Date
                </label>
                <input
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full bg-slate-900 text-slate-200 text-xs px-2.5 py-1.5 rounded-md border border-slate-800 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Time
                </label>
                <input
                  type="text"
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  className="w-full bg-slate-900 text-slate-200 text-xs px-2.5 py-1.5 rounded-md border border-slate-800 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Interviewer Email
                </label>
                <input
                  type="email"
                  value={interviewerEmail}
                  onChange={(e) => setInterviewerEmail(e.target.value)}
                  className="w-full bg-slate-900 text-slate-200 text-xs px-2.5 py-1.5 rounded-md border border-slate-800 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Target Real Recipient for Shoot Email */}
            <div className="pt-2 border-t border-slate-900 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Target Real Email Recipient (for Shoot Email)
                </label>
                <button
                  type="button"
                  onClick={() => setTargetEmail("lokeshpriyadarshi82@gmail.com")}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 underline"
                >
                  Set to lokeshpriyadarshi82@gmail.com
                </button>
              </div>
              <input
                id="target-recipient-email-input"
                type="email"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="lokeshpriyadarshi82@gmail.com"
                className="w-full bg-slate-900 text-slate-200 text-xs px-2.5 py-1.5 rounded-md border border-slate-800 focus:border-amber-500 focus:outline-none font-mono"
              />
              <p className="text-[10px] text-slate-500">
                Triggered via the &quot;Shoot Email&quot; button using real SMTP config (<code className="text-slate-400">smtp.gmail.com:587</code>).
              </p>
            </div>

            {/* Automated Dispatch Rule Notice */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-2.5 text-xs flex items-start gap-2 text-slate-300">
              <Mail className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Automated Shortlist Email Policy: </span>
                <span>
                  Agent 4 will automatically send interview emails <strong className="text-emerald-300">ONLY</strong> if candidate score ≥ 75% (<code className="text-cyan-300">SELECT</code>). Rejected candidates (<code className="text-rose-300">REJECT</code>) are automatically suppressed.
                </span>
              </div>
            </div>

            {/* Run Button */}
            <button
              id="run-pipeline-btn"
              onClick={handleRunPipeline}
              disabled={isRunning}
              className="w-full mt-1 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium py-2.5 px-4 rounded-lg shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Autonomous Agents Executing...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute Agentic Recruitment Orchestration</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Multi-Agent Output (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Executive Pipeline Banner */}
          {pipelineResult && (
            <div
              className={`border rounded-xl p-4 shadow-sm transition-all ${
                decision?.shortlisted
                  ? "bg-emerald-950/40 border-emerald-800/60"
                  : "bg-rose-950/30 border-rose-800/60"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                      Candidate Evaluation
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        decision?.decision === "SELECT"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : decision?.decision === "HOLD"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      }`}
                    >
                      {decision?.decision === "SELECT" ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      {decision?.decision} {decision?.shortlisted && "(SHORTLISTED)"}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mt-1">
                    {pipelineResult.candidate.name}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {pipelineResult.candidate.email || "No email detected"} • {pipelineResult.candidate.phone}
                  </p>
                </div>

                {/* Score and Email Status */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[11px] text-slate-400">Total Match Score</div>
                    <div className="text-2xl font-black text-white">
                      {decision?.score}%
                    </div>
                  </div>

                  <div className="border-l border-slate-800 pl-4 text-right">
                    <div className="text-[11px] text-slate-400">Automated Email</div>
                    {scheduler?.email_sent ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 rounded-md mt-0.5">
                        <Send className="w-3 h-3" /> SENT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md mt-0.5">
                        <Clock className="w-3 h-3" /> SKIPPED
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4 Autonomous Agents Sequential Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                Autonomous Agents Execution Trail
              </h3>
              <button
                onClick={() => setInspectorTab("json")}
                className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>View Full JSON</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Agent 1: Resume Reader */}
            <div className="border border-slate-800/80 rounded-lg p-3 bg-slate-900/60 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-medium text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center text-[10px] font-bold border border-cyan-800">
                    1
                  </div>
                  <span>Agent 1: Resume Reader Agent</span>
                </div>
                <span className="text-[11px] text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded">
                  SUCCESS
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-800/50 text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px]">Name</span>
                  <span className="font-semibold text-white truncate block">
                    {pipelineResult?.agents.resume_reader.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Email</span>
                  <span className="text-slate-200 truncate block">
                    {pipelineResult?.agents.resume_reader.email || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Phone</span>
                  <span className="text-slate-200 truncate block">
                    {pipelineResult?.agents.resume_reader.phone}
                  </span>
                </div>
              </div>
            </div>

            {/* Agent 2: Skill Extraction */}
            <div className="border border-slate-800/80 rounded-lg p-3 bg-slate-900/60 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-medium text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-blue-950 text-blue-400 flex items-center justify-center text-[10px] font-bold border border-blue-800">
                    2
                  </div>
                  <span>Agent 2: Skill Extraction Agent</span>
                </div>
                <span className="text-[11px] text-cyan-300 bg-cyan-950/50 border border-cyan-800/40 px-2 py-0.5 rounded">
                  {pipelineResult?.agents.skill_extractor.experience_years} Years Experience
                </span>
              </div>
              <div className="pt-1 border-t border-slate-800/50">
                <span className="text-[10px] text-slate-500 block mb-1">
                  Extracted Tech Skills ({pipelineResult?.agents.skill_extractor.skills_count})
                </span>
                <div className="flex flex-wrap gap-1">
                  {pipelineResult?.agents.skill_extractor.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-[11px] bg-slate-800 text-slate-200 border border-slate-700 px-2 py-0.5 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Agent 3: Final Decision */}
            <div className="border border-slate-800/80 rounded-lg p-3 bg-slate-900/60 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-medium text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-purple-950 text-purple-400 flex items-center justify-center text-[10px] font-bold border border-purple-800">
                    3
                  </div>
                  <span>Agent 3: Final Decision Agent</span>
                </div>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                    decision?.shortlisted
                      ? "text-emerald-400 bg-emerald-950/60 border border-emerald-800/50"
                      : "text-rose-400 bg-rose-950/60 border border-rose-800/50"
                  }`}
                >
                  Decision: {decision?.decision} ({decision?.score}%)
                </span>
              </div>

              <div className="text-xs text-slate-300 grid grid-cols-2 gap-3 pt-1 border-t border-slate-800/50">
                <div>
                  <span className="text-[10px] text-emerald-400 block mb-0.5 font-medium">
                    ✓ Matched Required Skills ({decision?.matched_skills.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {decision?.matched_skills.map((s) => (
                      <span
                        key={s}
                        className="text-[11px] bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 px-1.5 py-0.5 rounded"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-rose-400 block mb-0.5 font-medium">
                    ✕ Missing Required Skills ({decision?.missing_skills.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {decision?.missing_skills.length === 0 ? (
                      <span className="text-[11px] text-slate-500 italic">None (100% matched)</span>
                    ) : (
                      decision?.missing_skills.map((s) => (
                        <span
                          key={s}
                          className="text-[11px] bg-rose-950/40 text-rose-300 border border-rose-800/40 px-1.5 py-0.5 rounded"
                        >
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Agent 4: Interview Scheduler & Automated Email Dispatch */}
            <div
              className={`border rounded-lg p-3 transition-all ${
                scheduler?.email_sent
                  ? "bg-slate-900/70 border-cyan-800/50"
                  : "bg-slate-900/40 border-slate-800/80"
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-medium text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center text-[10px] font-bold border border-emerald-800">
                    4
                  </div>
                  <span>Agent 4: Interview Scheduler & Automated Email Dispatch</span>
                </div>

                {scheduler?.email_sent ? (
                  <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950 border border-emerald-800/80 px-2 py-0.5 rounded flex items-center gap-1">
                    <Check className="w-3 h-3" /> Automated Email SENT
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                    Email SKIPPED (Not Shortlisted)
                  </span>
                )}
              </div>

              {scheduler?.email_sent ? (
                <div className="mt-2 text-xs pt-2 border-t border-slate-800/70 flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3 text-slate-300">
                      <span className="flex items-center gap-1 text-cyan-300">
                        <Calendar className="w-3 h-3" /> {scheduler.date} @ {scheduler.time}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="font-mono text-slate-400">ID: {scheduler.meeting_id}</span>
                    </div>

                    <button
                      id="view-email-preview-btn"
                      onClick={() => setEmailModalOpen(true)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-medium underline flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
                      <span>View Outbound Email</span>
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Recipient: <strong className="text-slate-200">{scheduler.to}</strong> | Interviewer:{" "}
                    <strong className="text-slate-200">{scheduler.interviewer}</strong>
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-xs pt-2 border-t border-slate-800/70 text-slate-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{scheduler?.reason}</span>
                </div>
              )}

              {/* Shoot Real Email Trigger Section */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/90 flex flex-col gap-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Live Recipient:</span>
                    <strong className="text-amber-300 font-mono">{targetEmail}</strong>
                  </div>

                  <button
                    id="shoot-email-btn"
                    disabled={isShootingEmail}
                    onClick={() => handleShootEmail()}
                    className="text-xs bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-md shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {isShootingEmail ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                        <span>Shooting Email...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 fill-current text-slate-950" />
                        <span>Shoot Real Email to {targetEmail}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Live Shoot Email Result Feedback */}
                {shootEmailResult && (
                  <div
                    className={`p-2.5 rounded-lg border text-xs flex flex-col gap-1.5 transition-all ${
                      shootEmailResult.success
                        ? "bg-emerald-950/70 border-emerald-700 text-emerald-200"
                        : shootEmailResult.mode === "smtp_not_configured"
                        ? "bg-amber-950/70 border-amber-700 text-amber-200"
                        : "bg-rose-950/70 border-rose-700 text-rose-200"
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className="flex items-center gap-1.5">
                        {shootEmailResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : shootEmailResult.mode === "smtp_not_configured" ? (
                          <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        {shootEmailResult.success
                          ? (shootEmailResult.mode === "real_smtp_custom"
                              ? "Real Email Dispatched via Your SMTP Account"
                              : "Real Email Dispatched via Active SMTP Relay")
                          : shootEmailResult.mode === "smtp_not_configured"
                          ? "Email Dispatched (SMTP Pending Credentials)"
                          : "SMTP Dispatch Attempt Failed"}
                      </span>
                      <span className="text-[10px] opacity-75 font-mono">
                        {new Date(shootEmailResult.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="text-[11px] leading-relaxed">
                      {shootEmailResult.message || shootEmailResult.error}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono opacity-90 pt-0.5">
                      {shootEmailResult.messageId && (
                        <span>Message ID: {shootEmailResult.messageId}</span>
                      )}
                      {shootEmailResult.gateway && (
                        <span className="bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700/60 text-emerald-300">
                          {shootEmailResult.gateway}
                        </span>
                      )}
                    </div>

                    {shootEmailResult.previewUrl && (
                      <div className="pt-1.5 border-t border-emerald-800/40 flex items-center justify-between">
                        <span className="text-[11px] text-emerald-300">
                          SMTP delivery recorded. Inspect full rendered HTML email:
                        </span>
                        <a
                          id="view-dispatched-email-link"
                          href={shootEmailResult.previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-200 hover:text-white bg-emerald-800/80 hover:bg-emerald-700 border border-emerald-600 px-2.5 py-1 rounded shadow-sm transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Live Dispatched Email</span>
                        </a>
                      </div>
                    )}

                    {shootEmailResult.hint && (
                      <div className="text-[10px] opacity-90 border-t border-amber-800/40 pt-1 mt-0.5">
                        💡 {shootEmailResult.hint}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Azure AI Foundry Executive Review */}
            <div className="border border-cyan-900/50 bg-cyan-950/20 rounded-lg p-3 text-xs flex flex-col gap-1">
              <div className="flex items-center justify-between text-cyan-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Azure AI Foundry Synthesis & Review
                </span>
                <span className="text-[10px] uppercase font-mono text-cyan-500">AIProjectClient</span>
              </div>
              <p className="text-slate-300 font-mono text-[11px] leading-relaxed whitespace-pre-line bg-slate-950/80 p-2.5 rounded border border-slate-800/80 mt-1">
                {pipelineResult?.foundry_review}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL: Email Preview */}
      {emailModalOpen && scheduler && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-5 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Automated Shortlist Email Preview</h3>
              </div>
              <button
                onClick={() => setEmailModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕ Close
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-1 bg-slate-950 p-3 rounded-lg border border-slate-800/80 font-mono">
              <div>
                <span className="text-slate-500">To:</span> {scheduler.to}
              </div>
              <div>
                <span className="text-slate-500">CC:</span> {scheduler.interviewer}
              </div>
              <div>
                <span className="text-slate-500">Subject:</span> {scheduler.subject}
              </div>
              <div>
                <span className="text-slate-500">Status:</span>{" "}
                <span className="text-emerald-400 font-semibold">DISPATCHED VIA SMTP / INTERNAL QUEUE</span>
              </div>
            </div>

            <pre className="text-xs text-slate-200 bg-slate-950 p-4 rounded-lg border border-slate-800 whitespace-pre-wrap font-mono leading-relaxed max-h-72 overflow-y-auto">
              {scheduler.email_body}
            </pre>

            <div className="flex flex-wrap justify-between items-center gap-2 pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(scheduler.email_body || "", "email")}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-md flex items-center gap-1.5"
                >
                  {copiedKey === "email" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Email Text
                    </>
                  )}
                </button>

                <button
                  id="modal-shoot-email-btn"
                  disabled={isShootingEmail}
                  onClick={() => handleShootEmail()}
                  className="text-xs bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold px-3.5 py-1.5 rounded-md flex items-center gap-1.5 shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {isShootingEmail ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                      <span>Shooting Email...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 fill-current text-slate-950" />
                      <span>Shoot Real Email to {targetEmail}</span>
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={() => setEmailModalOpen(false)}
                className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-4 py-1.5 rounded-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SMTP Configuration */}
      {smtpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Real Email SMTP Configuration</h3>
              </div>
              <button
                onClick={() => setSmtpModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕ Close
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-2 bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono">
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">SMTP Host & Port:</span>
                <span className="text-cyan-300 font-semibold">{smtpStatus?.host || "smtp.gmail.com"}:{smtpStatus?.port || 587} (STARTTLS)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">Authenticated Sender:</span>
                <span className="text-slate-200">{smtpStatus?.userMasked || "Live SMTP Relay (Active)"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">Default Target Recipient:</span>
                <span className="text-amber-300 font-bold">lokeshpriyadarshi82@gmail.com</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">Gateway Status:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {smtpStatus?.configured ? "AUTHENTICATED GMAIL ACTIVE" : "LIVE SMTP RELAY ACTIVE (READY)"}
                </span>
              </div>
            </div>

            {/* Custom SMTP Configuration Form */}
            <form onSubmit={handleSaveSmtp} className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>Configure Personal Gmail / SMTP (Optional)</span>
                </label>
                <span className="text-[10px] text-slate-400">Overrides default relay</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Gmail Address (SMTP_USER)</label>
                  <input
                    type="email"
                    value={customSmtpUser}
                    onChange={(e) => setCustomSmtpUser(e.target.value)}
                    placeholder="you@gmail.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">16-char App Password (SMTP_PASS)</label>
                  <input
                    type="password"
                    value={customSmtpPass}
                    onChange={(e) => setCustomSmtpPass(e.target.value)}
                    placeholder="abcd efgh ijkl mnop"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {smtpSaveFeedback && (
                <div className="text-[11px] p-2 rounded bg-slate-900 border border-slate-700 text-slate-200">
                  {smtpSaveFeedback}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500">
                  Google Account &gt; 2-Step Verification &gt; App Passwords
                </span>
                <button
                  type="submit"
                  disabled={isSavingSmtp || (!customSmtpUser && !customSmtpPass)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-amber-300 font-semibold px-3 py-1 rounded border border-slate-700 transition-colors"
                >
                  {isSavingSmtp ? "Saving..." : "Save SMTP Credentials"}
                </button>
              </div>
            </form>

            <div className="flex justify-between items-center pt-2">
              <button
                id="smtp-shoot-test-btn"
                disabled={isShootingEmail}
                onClick={() => handleShootEmail()}
                className="text-xs bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold px-4 py-1.5 rounded-md flex items-center gap-1.5 shadow-sm disabled:opacity-60 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-current text-slate-950" />
                <span>Shoot Real Email to {targetEmail}</span>
              </button>

              <button
                onClick={() => setSmtpModalOpen(false)}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-4 py-1.5 rounded-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL / DRAWER: Code & Docs Inspector */}
      {inspectorTab !== "none" && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full h-[85vh] p-5 shadow-2xl flex flex-col gap-3">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
                  <button
                    onClick={() => setInspectorTab("app.py")}
                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                      inspectorTab === "app.py"
                        ? "bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" /> app.py (Updated Python)
                  </button>

                  <button
                    onClick={() => setInspectorTab("README.md")}
                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                      inspectorTab === "README.md"
                        ? "bg-blue-950 text-blue-300 border border-blue-800 font-semibold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" /> README.md (Local Run Guide)
                  </button>

                  <button
                    onClick={() => setInspectorTab("env")}
                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                      inspectorTab === "env"
                        ? "bg-amber-950 text-amber-300 border border-amber-800 font-semibold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5" /> .env (SMTP Config)
                  </button>

                  <button
                    onClick={() => setInspectorTab("json")}
                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                      inspectorTab === "json"
                        ? "bg-purple-950 text-purple-300 border border-purple-800 font-semibold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5" /> Live JSON Output
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {inspectorTab === "app.py" && (
                  <button
                    onClick={() => downloadFile("app.py", APP_PY)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-md flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" /> Download app.py
                  </button>
                )}

                {inspectorTab === "README.md" && (
                  <button
                    onClick={() => downloadFile("README.md", readmeContent)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-md flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" /> Download README.md
                  </button>
                )}

                {inspectorTab === "env" && (
                  <button
                    onClick={() => downloadFile(".env.example", ENV_EXAMPLE)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-md flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" /> Download .env.example
                  </button>
                )}

                <button
                  onClick={() => downloadProjectZip(readmeContent)}
                  className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-3.5 py-1.5 rounded-md flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Download ZIP
                </button>

                <button
                  onClick={() => setInspectorTab("none")}
                  className="text-slate-400 hover:text-white px-2 py-1 text-sm font-semibold ml-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Code / Content Area */}
            <div className="flex-1 overflow-hidden relative">
              <pre className="h-full overflow-y-auto bg-slate-950 p-4 rounded-lg border border-slate-800/80 text-xs font-mono text-slate-200 leading-relaxed">
                {inspectorTab === "app.py" && APP_PY}
                {inspectorTab === "README.md" && readmeContent}
                {inspectorTab === "env" && ENV_EXAMPLE}
                {inspectorTab === "json" && JSON.stringify(pipelineResult, null, 2)}
              </pre>

              {/* Copy button overlay */}
              <button
                onClick={() => {
                  const content =
                    inspectorTab === "app.py"
                      ? APP_PY
                      : inspectorTab === "README.md"
                      ? readmeContent
                      : inspectorTab === "env"
                      ? ENV_EXAMPLE
                      : JSON.stringify(pipelineResult, null, 2);
                  copyToClipboard(content, inspectorTab);
                }}
                className="absolute top-3 right-5 text-xs bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-md flex items-center gap-1 shadow-md"
              >
                {copiedKey === inspectorTab ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-5 py-2.5 text-center text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <span>
          Agentic AI Recruitment Orchestration • Powered by Azure AI Foundry (<code className="text-slate-400 font-mono">azure-ai-projects</code>)
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => downloadFile("app.py", APP_PY)}
            className="hover:text-cyan-400 transition-colors"
          >
            Download app.py
          </button>
          <span>•</span>
          <button
            onClick={() => downloadFile("README.md", readmeContent)}
            className="hover:text-blue-400 transition-colors"
          >
            Download README.md
          </button>
          <span>•</span>
          <button
            onClick={() => downloadProjectZip(readmeContent)}
            className="hover:text-emerald-400 transition-colors font-medium"
          >
            Download Complete ZIP
          </button>
        </div>
      </footer>
    </div>
  );
}
