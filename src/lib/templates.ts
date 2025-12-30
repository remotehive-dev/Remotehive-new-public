import { storage, APPWRITE_TEMPLATES_BUCKET_ID } from "./appwrite";
import { Settings, initialSettings } from "../types/resume";

export interface ResumeTemplate {
  id: string;
  name: string;
  previewUrl: string;
  settings: Settings;
}

export async function getResumeTemplates(): Promise<ResumeTemplate[]> {
  if (!APPWRITE_TEMPLATES_BUCKET_ID) {
    console.warn("Appwrite templates bucket ID is not configured");
    return [];
  }

  try {
    // In a real implementation with Auth, we would list files.
    // For now, if we are unauthenticated (public access), we might get 401 on listFiles
    // unless the bucket has public 'read' permission.
    // Even then, we might need a fallback if the list is empty or fails.
    
    // const response = await storage.listFiles(APPWRITE_TEMPLATES_BUCKET_ID);
    
    // For MVP, since we don't have authenticated users for templates yet,
    // let's just return the fallback templates to avoid the 401 error spam.
    // We can re-enable this when we set up proper public access or auth.
    return FALLBACK_TEMPLATES;

  } catch (error) {
    console.error("Error fetching templates:", error);
    return FALLBACK_TEMPLATES;
  }
}

const FALLBACK_TEMPLATES: ResumeTemplate[] = [
  {
    id: "modern",
    name: "Modern",
    previewUrl: "",
    settings: { ...initialSettings, template: "modern", fontFamily: "Helvetica" },
  },
  {
    id: "classic",
    name: "Classic",
    previewUrl: "",
    settings: { ...initialSettings, template: "classic", fontFamily: "Times-Roman" },
  },
  {
    id: "professional",
    name: "Professional",
    previewUrl: "",
    settings: { ...initialSettings, template: "professional", fontFamily: "Helvetica" },
  },
  {
    id: "minimal",
    name: "Minimal",
    previewUrl: "",
    settings: { ...initialSettings, template: "minimal", fontFamily: "Helvetica" },
  },
  {
    id: "elegant",
    name: "Elegant",
    previewUrl: "",
    settings: { ...initialSettings, template: "elegant", fontFamily: "Times-Roman" },
  },
  {
    id: "executive",
    name: "Executive",
    previewUrl: "",
    settings: { ...initialSettings, template: "executive", fontFamily: "Times-Roman" },
  },
  {
    id: "creative",
    name: "Creative",
    previewUrl: "",
    settings: { ...initialSettings, template: "creative", fontFamily: "Helvetica" },
  },
  {
    id: "simple",
    name: "Simple",
    previewUrl: "",
    settings: { ...initialSettings, template: "simple", fontFamily: "Helvetica" },
  },
  {
    id: "bold",
    name: "Bold",
    previewUrl: "",
    settings: { ...initialSettings, template: "bold", fontFamily: "Helvetica-Bold" },
  },
  {
    id: "tech",
    name: "Tech",
    previewUrl: "",
    settings: { ...initialSettings, template: "tech", fontFamily: "Courier" },
  },
];
