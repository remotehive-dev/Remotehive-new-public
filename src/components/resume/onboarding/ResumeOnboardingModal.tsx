import { 
  FileText, 
  Sparkles, 
  Upload, 
  Linkedin, 
  LayoutTemplate,
  X 
} from "lucide-react";
import { useEffect, useState } from "react";

interface ResumeOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (option: string) => void;
}

export function ResumeOnboardingModal({ isOpen, onClose, onSelectOption }: ResumeOnboardingModalProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
    } else {
      setTimeout(() => setShow(false), 200);
    }
  }, [isOpen]);

  if (!isOpen && !show) return null;

  const OPTIONS = [
    {
      id: "new",
      title: "Create new resume",
      icon: FileText,
      color: "text-gray-700",
      bg: "bg-gray-100",
      tag: null
    },
    {
      id: "ai",
      title: "Create with AI assistance",
      icon: Sparkles,
      color: "text-purple-600",
      bg: "bg-purple-100",
      tag: "Beta"
    },
    {
      id: "upload",
      title: "Upload resume",
      icon: Upload,
      color: "text-blue-600",
      bg: "bg-blue-100",
      tag: null
    },
    {
      id: "linkedin",
      title: "Create with LinkedIn profile",
      icon: Linkedin,
      color: "text-blue-700",
      bg: "bg-blue-100",
      tag: null
    },
    {
      id: "example",
      title: "Create from example",
      icon: LayoutTemplate,
      color: "text-orange-600",
      bg: "bg-orange-100",
      tag: null
    }
  ];

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-lg bg-white rounded-2xl shadow-2xl transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Let's get started</h2>
            <p className="mt-2 text-gray-500">How do you want to create your resume?</p>
          </div>

          <div className="space-y-3">
            {OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => onSelectOption(option.id)}
                className="w-full group flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 hover:shadow-neu-flat transition-all duration-200 bg-white"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-lg ${option.bg} ${option.color} group-hover:scale-110 transition-transform`}>
                    <option.icon className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-gray-700 group-hover:text-purple-700">{option.title}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  {option.tag && (
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-100 rounded-full">
                      {option.tag}
                    </span>
                  )}
                  <div className="text-gray-300 group-hover:text-purple-400 group-hover:translate-x-1 transition-all">
                    →
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
