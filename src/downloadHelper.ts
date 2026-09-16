import JSZip from "jszip";
import {
  APP_PY,
  README_MD,
  REQUIREMENTS_TXT,
  ENV_EXAMPLE,
  SAMPLE_CV_SHORTLISTED,
  SAMPLE_CV_REJECTED
} from "./projectAssets";

export function downloadFile(filename: string, content: string, mimeType = "text/plain") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadProjectZip() {
  const zip = new JSZip();

  // Root files
  zip.file("app.py", APP_PY);
  zip.file("README.md", README_MD);
  zip.file("requirements.txt", REQUIREMENTS_TXT);
  zip.file(".env.example", ENV_EXAMPLE);

  // Sample resumes folder
  const sampleFolder = zip.folder("sample_resumes");
  if (sampleFolder) {
    sampleFolder.file("alex_morgan_shortlisted.txt", SAMPLE_CV_SHORTLISTED);
    sampleFolder.file("sam_taylor_rejected.txt", SAMPLE_CV_REJECTED);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "agentic-recruitment-system.zip";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
