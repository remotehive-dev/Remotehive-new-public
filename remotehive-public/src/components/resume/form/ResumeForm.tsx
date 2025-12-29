import { useState } from "react";
import { Resume, ResumeWorkExperience, ResumeEducation, ResumeProject, FeaturedSkill, SectionKey, Settings, ShowForm } from "../../../types/resume";
import { generateResumeContent } from "../../../lib/openrouter";
import { Loader2, Sparkles, Plus, Trash2, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ResumeFormProps {
  resume: Resume;
  setResume: React.Dispatch<React.SetStateAction<Resume>>;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

export function ResumeForm({ resume, setResume, settings, setSettings }: ResumeFormProps) {
  const [activeSection, setActiveSection] = useState<string | null>("profile");
  
  // Initialize sections from settings.formsOrder, prepending 'profile'
  const [sections, setSections] = useState<SectionKey[]>(() => {
    const order = settings.formsOrder as SectionKey[];
    return ["profile", ...order.filter(k => k !== "profile")];
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.indexOf(active.id as SectionKey);
        const newIndex = items.indexOf(over.id as SectionKey);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update settings.formsOrder (excluding profile)
        const newFormsOrder = newItems.filter(item => item !== "profile") as ShowForm[];
        setSettings(prev => ({
          ...prev,
          formsOrder: newFormsOrder
        }));
        
        return newItems;
      });
    }
  };

  const renderSection = (section: SectionKey) => {
    switch (section) {
      case "profile":
        return (
          <SortableSectionItem key={section} id={section}>
            <ProfileForm 
              resume={resume} 
              setResume={setResume} 
              isOpen={activeSection === "profile"}
              onToggle={() => toggleSection("profile")}
            />
          </SortableSectionItem>
        );
      case "workExperiences":
        return (
          <SortableSectionItem key={section} id={section}>
            <WorkExperienceForm 
              resume={resume} 
              setResume={setResume} 
              isOpen={activeSection === "workExperiences"}
              onToggle={() => toggleSection("workExperiences")}
            />
          </SortableSectionItem>
        );
      case "educations":
        return (
          <SortableSectionItem key={section} id={section}>
            <EducationForm 
              resume={resume} 
              setResume={setResume} 
              isOpen={activeSection === "educations"}
              onToggle={() => toggleSection("educations")}
            />
          </SortableSectionItem>
        );
      case "skills":
        return (
          <SortableSectionItem key={section} id={section}>
            <SkillsForm 
              resume={resume} 
              setResume={setResume} 
              isOpen={activeSection === "skills"}
              onToggle={() => toggleSection("skills")}
            />
          </SortableSectionItem>
        );
      case "projects":
        return (
          <SortableSectionItem key={section} id={section}>
            <ProjectsForm 
              resume={resume} 
              setResume={setResume} 
              isOpen={activeSection === "projects"}
              onToggle={() => toggleSection("projects")}
            />
          </SortableSectionItem>
        );
      default:
        return null;
    }
  };

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={sections} 
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-6">
          {sections.map(renderSection)}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// --- Sub-Components ---

function SortableSectionItem({ id, children }: { id: string, children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Drag Handle - Only visible on hover */}
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute left-[-24px] top-4 p-1 cursor-grab opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
        title="Drag to reorder"
      >
        <GripVertical className="h-5 w-5" />
      </div>
      {children}
    </div>
  );
}

function SectionHeader({ title, isOpen, onToggle }: { title: string, isOpen: boolean, onToggle: () => void }) {
  return (
    <button 
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-neu-flat hover:bg-gray-50 transition-all"
    >
      <span className="font-bold text-gray-800">{title}</span>
      {isOpen ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
    </button>
  );
}

function ProfileForm({ resume, setResume, isOpen, onToggle }: any) {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return <SectionHeader title="Profile & Summary" isOpen={isOpen} onToggle={onToggle} />;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setResume((prev: Resume) => ({
      ...prev,
      profile: { ...prev.profile, [e.target.name]: e.target.value }
    }));
  };

  const handleEnhanceSummary = async () => {
    setIsGenerating(true);
    try {
      const summary = await generateResumeContent("summary", {
        role: resume.profile.name,
        background: resume.workExperiences.map((w: any) => `${w.jobTitle} at ${w.company}`).join(", ")
      });
      if (summary) {
        setResume((prev: Resume) => ({
          ...prev,
          profile: { ...prev.profile, summary }
        }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-neu-flat overflow-hidden">
      <SectionHeader title="Profile & Summary" isOpen={isOpen} onToggle={onToggle} />
      <div className="p-4 space-y-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
            <input name="name" value={resume.profile.name} onChange={handleChange} className="neu-input w-full mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
            <input name="email" value={resume.profile.email} onChange={handleChange} className="neu-input w-full mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
            <input name="phone" value={resume.profile.phone} onChange={handleChange} className="neu-input w-full mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Location</label>
            <input name="location" value={resume.profile.location} onChange={handleChange} className="neu-input w-full mt-1" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Website / LinkedIn</label>
            <input name="url" value={resume.profile.url} onChange={handleChange} className="neu-input w-full mt-1" />
          </div>
          <div className="col-span-2">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Professional Summary</label>
              <button 
                onClick={handleEnhanceSummary} 
                disabled={isGenerating}
                className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 font-bold"
              >
                {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Enhance with AI
              </button>
            </div>
            <textarea 
              name="summary" 
              value={resume.profile.summary} 
              onChange={handleChange} 
              className="neu-input w-full h-32" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkExperienceForm({ resume, setResume, isOpen, onToggle }: any) {
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);

  if (!isOpen) return <SectionHeader title="Work Experience" isOpen={isOpen} onToggle={onToggle} />;

  const addExperience = () => {
    setResume((prev: Resume) => ({
      ...prev,
      workExperiences: [
        { company: "New Company", jobTitle: "Job Title", date: "2023 - Present", descriptions: ["Accomplishment 1"] },
        ...prev.workExperiences
      ]
    }));
  };

  const updateExperience = (index: number, field: keyof ResumeWorkExperience, value: any) => {
    const newExp = [...resume.workExperiences];
    newExp[index] = { ...newExp[index], [field]: value };
    setResume((prev: Resume) => ({ ...prev, workExperiences: newExp }));
  };

  const removeExperience = (index: number) => {
    const newExp = resume.workExperiences.filter((_: any, i: number) => i !== index);
    setResume((prev: Resume) => ({ ...prev, workExperiences: newExp }));
  };

  const handleEnhanceDescription = async (index: number) => {
    const exp = resume.workExperiences[index];
    const currentDesc = exp.descriptions.join("\n");
    if (!currentDesc) return;

    setGeneratingIndex(index);
    try {
      // Enhance the first bullet point or the whole text as a single block
      // Ideally we loop through bullet points, but for now let's enhance the block
      const enhanced = await generateResumeContent("experience", {
        description: currentDesc
      });
      
      if (enhanced) {
        // AI usually returns a single string, we might need to split it if it returns multiple bullets
        // For now, let's assume it returns a polished version of the text
        updateExperience(index, "descriptions", enhanced.split("\n").map(s => s.trim().replace(/^•\s*/, '')));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setGeneratingIndex(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-neu-flat overflow-hidden">
      <SectionHeader title="Work Experience" isOpen={isOpen} onToggle={onToggle} />
      <div className="p-4 space-y-6 border-t border-gray-100">
        <button onClick={addExperience} className="neu-btn-secondary w-full flex justify-center items-center gap-2 py-2">
          <Plus className="h-4 w-4" /> Add Position
        </button>

        {resume.workExperiences.map((exp: ResumeWorkExperience, index: number) => (
          <div key={index} className="p-4 rounded-xl border border-gray-200 space-y-3 relative bg-gray-50/50">
            <button onClick={() => removeExperience(index)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
            
            <div className="grid grid-cols-2 gap-3 pr-8">
              <input 
                value={exp.company} 
                onChange={(e) => updateExperience(index, "company", e.target.value)}
                placeholder="Company"
                className="neu-input w-full font-bold"
              />
              <input 
                value={exp.jobTitle} 
                onChange={(e) => updateExperience(index, "jobTitle", e.target.value)}
                placeholder="Job Title"
                className="neu-input w-full"
              />
              <div className="col-span-2 flex gap-2">
                <input 
                  type="month"
                  value={exp.startDate || ""} 
                  onChange={(e) => {
                    const val = e.target.value;
                    updateExperience(index, "startDate", val);
                    updateExperience(index, "date", `${val} - ${exp.isCurrent ? 'Present' : exp.endDate || ''}`);
                  }}
                  placeholder="Start Date"
                  className="neu-input w-full"
                />
                {!exp.isCurrent && (
                  <input 
                    type="month"
                    value={exp.endDate || ""} 
                    onChange={(e) => {
                      const val = e.target.value;
                      updateExperience(index, "endDate", val);
                      updateExperience(index, "date", `${exp.startDate || ''} - ${val}`);
                    }}
                    placeholder="End Date"
                    className="neu-input w-full"
                  />
                )}
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`current-${index}`}
                  checked={exp.isCurrent || false}
                  onChange={(e) => {
                    const isCurr = e.target.checked;
                    updateExperience(index, "isCurrent", isCurr);
                    updateExperience(index, "endDate", isCurr ? "" : exp.endDate);
                    updateExperience(index, "date", `${exp.startDate || ''} - ${isCurr ? 'Present' : exp.endDate || ''}`);
                  }}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor={`current-${index}`} className="text-sm text-gray-600">I currently work here</label>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-500 uppercase block">Key Achievements</label>
                <button 
                  onClick={() => handleEnhanceDescription(index)} 
                  disabled={generatingIndex === index}
                  className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 font-bold"
                >
                  {generatingIndex === index ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Enhance
                </button>
              </div>
              <textarea 
                value={exp.descriptions.join("\n")}
                onChange={(e) => updateExperience(index, "descriptions", e.target.value.split("\n"))}
                className="neu-input w-full h-32 text-sm"
                placeholder="• Led a team of 5 developers..."
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EducationForm({ resume, setResume, isOpen, onToggle }: any) {
  if (!isOpen) return <SectionHeader title="Education" isOpen={isOpen} onToggle={onToggle} />;

  const addEducation = () => {
    setResume((prev: Resume) => ({
      ...prev,
      educations: [
        { school: "University Name", degree: "Degree", date: "2019 - 2023", gpa: "", descriptions: [] },
        ...prev.educations
      ]
    }));
  };

  const updateEducation = (index: number, field: keyof ResumeEducation, value: any) => {
    const newEdu = [...resume.educations];
    newEdu[index] = { ...newEdu[index], [field]: value };
    setResume((prev: Resume) => ({ ...prev, educations: newEdu }));
  };

  const removeEducation = (index: number) => {
    const newEdu = resume.educations.filter((_: any, i: number) => i !== index);
    setResume((prev: Resume) => ({ ...prev, educations: newEdu }));
  };

  return (
    <div className="bg-white rounded-xl shadow-neu-flat overflow-hidden">
      <SectionHeader title="Education" isOpen={isOpen} onToggle={onToggle} />
      <div className="p-4 space-y-6 border-t border-gray-100">
        <button onClick={addEducation} className="neu-btn-secondary w-full flex justify-center items-center gap-2 py-2">
          <Plus className="h-4 w-4" /> Add Education
        </button>

        {resume.educations.map((edu: ResumeEducation, index: number) => (
          <div key={index} className="p-4 rounded-xl border border-gray-200 space-y-3 relative bg-gray-50/50">
            <button onClick={() => removeEducation(index)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
            
            <div className="grid grid-cols-2 gap-3 pr-8">
              <input 
                value={edu.school} 
                onChange={(e) => updateEducation(index, "school", e.target.value)}
                placeholder="School / University"
                className="neu-input w-full font-bold"
              />
              <input 
                value={edu.degree} 
                onChange={(e) => updateEducation(index, "degree", e.target.value)}
                placeholder="Degree / Major"
                className="neu-input w-full"
              />
              <div className="col-span-2 flex gap-2">
                <input 
                  type="month"
                  value={edu.startDate || ""} 
                  onChange={(e) => {
                    const val = e.target.value;
                    updateEducation(index, "startDate", val);
                    updateEducation(index, "date", `${val} - ${edu.isCurrent ? 'Present' : edu.endDate || ''}`);
                  }}
                  placeholder="Start Date"
                  className="neu-input w-full"
                />
                {!edu.isCurrent && (
                  <input 
                    type="month"
                    value={edu.endDate || ""} 
                    onChange={(e) => {
                      const val = e.target.value;
                      updateEducation(index, "endDate", val);
                      updateEducation(index, "date", `${edu.startDate || ''} - ${val}`);
                    }}
                    placeholder="End Date"
                    className="neu-input w-full"
                  />
                )}
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`edu-current-${index}`}
                  checked={edu.isCurrent || false}
                  onChange={(e) => {
                    const isCurr = e.target.checked;
                    updateEducation(index, "isCurrent", isCurr);
                    updateEducation(index, "endDate", isCurr ? "" : edu.endDate);
                    updateEducation(index, "date", `${edu.startDate || ''} - ${isCurr ? 'Present' : edu.endDate || ''}`);
                  }}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor={`edu-current-${index}`} className="text-sm text-gray-600">I am currently studying here</label>
              </div>
               <input 
                value={edu.gpa} 
                onChange={(e) => updateEducation(index, "gpa", e.target.value)}
                placeholder="GPA (Optional)"
                className="neu-input w-full"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillsForm({ resume, setResume, isOpen, onToggle }: any) {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return <SectionHeader title="Skills" isOpen={isOpen} onToggle={onToggle} />;

  const handleSuggestSkills = async () => {
    setIsGenerating(true);
    try {
      const skillsText = await generateResumeContent("skills", {
        role: resume.profile.name, // In a real app, we'd ask for target role
        background: resume.profile.summary
      });
      
      if (skillsText) {
        const newSkills = skillsText.split(',').map((s: string) => ({ skill: s.trim(), rating: 4 }));
        setResume((prev: Resume) => ({
          ...prev,
          skills: {
            ...prev.skills,
            featuredSkills: [...prev.skills.featuredSkills, ...newSkills]
          }
        }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateSkill = (index: number, val: string) => {
    const newSkills = [...resume.skills.featuredSkills];
    newSkills[index].skill = val;
    setResume((prev: Resume) => ({
      ...prev,
      skills: { ...prev.skills, featuredSkills: newSkills }
    }));
  };

  const removeSkill = (index: number) => {
    const newSkills = resume.skills.featuredSkills.filter((_: any, i: number) => i !== index);
    setResume((prev: Resume) => ({
      ...prev,
      skills: { ...prev.skills, featuredSkills: newSkills }
    }));
  };

  const addSkill = () => {
    setResume((prev: Resume) => ({
      ...prev,
      skills: {
        ...prev.skills,
        featuredSkills: [...prev.skills.featuredSkills, { skill: "New Skill", rating: 4 }]
      }
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-neu-flat overflow-hidden">
      <SectionHeader title="Skills" isOpen={isOpen} onToggle={onToggle} />
      <div className="p-4 space-y-4 border-t border-gray-100">
        <div className="flex justify-end">
           <button 
                onClick={handleSuggestSkills} 
                disabled={isGenerating}
                className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 font-bold mb-2"
              >
                {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Suggest Skills with AI
              </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {resume.skills.featuredSkills.map((skill: FeaturedSkill, index: number) => (
            <div key={index} className="flex items-center bg-gray-100 rounded-full px-3 py-1">
              <input 
                value={skill.skill} 
                onChange={(e) => updateSkill(index, e.target.value)}
                className="bg-transparent border-none focus:outline-none text-sm w-24"
              />
              <button onClick={() => removeSkill(index)} className="text-gray-400 hover:text-red-500 ml-1">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button onClick={addSkill} className="flex items-center gap-1 px-3 py-1 rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-purple-500 hover:text-purple-500 text-sm">
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectsForm({ resume, setResume, isOpen, onToggle }: any) {
  if (!isOpen) return <SectionHeader title="Projects" isOpen={isOpen} onToggle={onToggle} />;

   const addProject = () => {
    setResume((prev: Resume) => ({
      ...prev,
      projects: [
        { project: "Project Name", date: "2023", descriptions: ["Description"] },
        ...prev.projects
      ]
    }));
  };

  const updateProject = (index: number, field: keyof ResumeProject, value: any) => {
    const newProj = [...resume.projects];
    newProj[index] = { ...newProj[index], [field]: value };
    setResume((prev: Resume) => ({ ...prev, projects: newProj }));
  };

  const removeProject = (index: number) => {
    const newProj = resume.projects.filter((_: any, i: number) => i !== index);
    setResume((prev: Resume) => ({ ...prev, projects: newProj }));
  };

  return (
    <div className="bg-white rounded-xl shadow-neu-flat overflow-hidden">
      <SectionHeader title="Projects" isOpen={isOpen} onToggle={onToggle} />
      <div className="p-4 space-y-6 border-t border-gray-100">
         <button onClick={addProject} className="neu-btn-secondary w-full flex justify-center items-center gap-2 py-2">
          <Plus className="h-4 w-4" /> Add Project
        </button>

         {resume.projects.map((proj: ResumeProject, index: number) => (
          <div key={index} className="p-4 rounded-xl border border-gray-200 space-y-3 relative bg-gray-50/50">
             <button onClick={() => removeProject(index)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
             <div className="grid grid-cols-2 gap-3 pr-8">
              <input 
                value={proj.project} 
                onChange={(e) => updateProject(index, "project", e.target.value)}
                placeholder="Project Name"
                className="neu-input w-full font-bold"
              />
              <div className="col-span-2 flex gap-2">
                <input 
                  type="month"
                  value={proj.startDate || ""} 
                  onChange={(e) => {
                    const val = e.target.value;
                    updateProject(index, "startDate", val);
                    updateProject(index, "date", `${val} - ${proj.isCurrent ? 'Present' : proj.endDate || ''}`);
                  }}
                  placeholder="Start Date"
                  className="neu-input w-full"
                />
                {!proj.isCurrent && (
                  <input 
                    type="month"
                    value={proj.endDate || ""} 
                    onChange={(e) => {
                      const val = e.target.value;
                      updateProject(index, "endDate", val);
                      updateProject(index, "date", `${proj.startDate || ''} - ${val}`);
                    }}
                    placeholder="End Date"
                    className="neu-input w-full"
                  />
                )}
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`proj-current-${index}`}
                  checked={proj.isCurrent || false}
                  onChange={(e) => {
                    const isCurr = e.target.checked;
                    updateProject(index, "isCurrent", isCurr);
                    updateProject(index, "endDate", isCurr ? "" : proj.endDate);
                    updateProject(index, "date", `${proj.startDate || ''} - ${isCurr ? 'Present' : proj.endDate || ''}`);
                  }}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor={`proj-current-${index}`} className="text-sm text-gray-600">This project is ongoing</label>
              </div>
            </div>
             <div>
              <textarea 
                value={proj.descriptions.join("\n")}
                onChange={(e) => updateProject(index, "descriptions", e.target.value.split("\n"))}
                className="neu-input w-full h-24 text-sm"
                placeholder="Project details..."
              />
            </div>
          </div>
         ))}
      </div>
    </div>
  );
}
