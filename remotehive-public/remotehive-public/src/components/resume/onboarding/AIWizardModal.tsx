import { useState } from "react";
import { Loader2, Sparkles, X, ChevronRight } from "lucide-react";
import { generateResumeContent } from "../../../lib/openrouter";
import { Resume } from "../../../types/resume";

interface AIWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: Partial<Resume>) => void;
}

export function AIWizardModal({ isOpen, onClose, onComplete }: AIWizardModalProps) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // 1. Generate Summary
      const summary = await generateResumeContent("summary", {
        role,
        background: `Experience: ${experience}. Skills: ${skills}`
      });

      // 2. Generate Skills List
      const skillsText = await generateResumeContent("skills", {
        role,
        background: skills
      });
      
      const parsedSkills = skillsText?.split(',').map(s => ({ 
        skill: s.trim(), 
        rating: 4 
      })) || [];

      // 3. Construct Resume Data
      const resumeData: Partial<Resume> = {
        profile: {
          name: "", // Will be filled from auth
          email: "",
          phone: "",
          location: "",
          url: "",
          summary: summary || ""
        },
        skills: {
          featuredSkills: parsedSkills,
          descriptions: []
        },
        // We could also generate dummy experience based on the input if we wanted
        workExperiences: []
      };

      onComplete(resumeData);
    } catch (error) {
      console.error("Wizard Generation Error:", error);
      alert("Failed to generate resume content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-purple-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-300" />
                AI Resume Wizard
              </h2>
              <p className="text-purple-100 text-sm mt-1">Tell us a bit about yourself, and we'll build a draft.</p>
            </div>
            <button onClick={onClose} className="text-purple-200 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Target Job Title</label>
                <input 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Frontend Developer"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Years of Experience</label>
                <select 
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                >
                  <option value="">Select experience level...</option>
                  <option value="Entry Level (0-2 years)">Entry Level (0-2 years)</option>
                  <option value="Mid Level (3-5 years)">Mid Level (3-5 years)</option>
                  <option value="Senior Level (5-8 years)">Senior Level (5-8 years)</option>
                  <option value="Lead / Principal (8+ years)">Lead / Principal (8+ years)</option>
                </select>
              </div>
              <button 
                onClick={() => setStep(2)}
                disabled={!role || !experience}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-200 disabled:opacity-50 disabled:shadow-none transition-all flex justify-center items-center gap-2"
              >
                Next Step <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Key Skills (Comma separated)</label>
                <textarea 
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. React, TypeScript, Node.js, AWS, Docker"
                  className="w-full h-32 p-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all resize-none"
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setStep(1)}
                  className="px-4 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-all"
                >
                  Back
                </button>
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !skills}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-200 disabled:opacity-50 disabled:shadow-none transition-all flex justify-center items-center gap-2"
                >
                  {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                  Generate Resume
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
