import { useUser, useAuth } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createUser, UserProfile } from "../lib/api";
import { Briefcase, User, MapPin, Globe, Linkedin, FileText, ChevronRight, Check, Star, Heart, Target, Sparkles, Building2, ShieldCheck, Loader2, RefreshCw } from "lucide-react";
import { sendOtp } from "../lib/fast2sms";
import { clsx } from "clsx";

export function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  // Phone Verification
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Form State
  const [formData, setFormData] = useState({
    // Personal
    phone: "",
    phone_country_code: "IN", // Default
    city: "",
    country: "",
    
    // Work History (Simple version for MVP)
    current_role: "",
    current_company: "",
    years_of_experience: "",
    
    // Professional Identity
    headline: "",
    bio: "",
    experience_level: "Mid-Level",
    skills: "",
    linkedin_url: "",
    portfolio_url: "",
    
    // Interests & Preferences
    interests: [] as string[],
    job_types: [] as string[], // Full-time, Contract, etc.
  });

  const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Freelance", "Internship"];
  const INTEREST_OPTIONS = [
    "Frontend Development", "Backend Development", "Full Stack", "DevOps", 
    "Mobile App Dev", "UI/UX Design", "Data Science", "Machine Learning",
    "Product Management", "Blockchain", "Cybersecurity", "Cloud Computing"
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    
    // Reset verification if phone changes
    if (e.target.name === 'phone' || e.target.name === 'phone_country_code') {
      setPhoneVerified(false);
      setOtpSent(false);
      setEnteredOtp("");
      setResendTimer(0);
    }
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[0-9]{10}$/; // Simple 10 digit validation
    return phoneRegex.test(phone);
  };

  const handleVerifyPhone = async () => {
    if (!formData.phone) return;

    // Basic validation
    if (!validatePhone(formData.phone)) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }

    setIsVerifyingPhone(true);
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    
    // Simple format assuming India default for Fast2SMS or standard
    // If country is India (IN), use last 10 digits if longer
    const phoneNumber = formData.phone.replace(/\D/g, '');
    const finalNumber = formData.phone_country_code === 'IN' ? phoneNumber.slice(-10) : phoneNumber;
    
    const sent = await sendOtp(finalNumber, otp);
    
    if (sent) {
      setOtpSent(true);
      setResendTimer(30);
      alert(`OTP sent to ${finalNumber}`);
    } else {
      alert("Failed to send OTP. Please try again.");
    }
    
    setIsVerifyingPhone(false);
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    await handleVerifyPhone();
  };

  const handleConfirmOtp = () => {
    if (enteredOtp === generatedOtp) {
      setPhoneVerified(true);
      setOtpSent(false);
      setGeneratedOtp(null);
      setEnteredOtp("");
    } else {
      alert("Invalid OTP.");
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest) 
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const toggleJobType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      job_types: prev.job_types.includes(type)
        ? prev.job_types.filter(t => t !== type)
        : [...prev.job_types, type]
    }));
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!user) {
      setError("You must be logged in to continue.");
      setIsLoading(false);
      return;
    }

    try {
        // Construct work experience if provided
        const workExperience = formData.current_role && formData.current_company ? [{
          role: formData.current_role,
          company: formData.current_company,
          current: true,
          description: `Experience: ${formData.years_of_experience} years`
        }] : [];

        const profileData: UserProfile = {
          clerk_id: user.id,
          email: user.primaryEmailAddress?.emailAddress || "",
          full_name: user.fullName || "",
          role: 'jobseeker',
          headline: formData.headline,
          bio: formData.bio,
          experience_level: formData.experience_level,
          skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
          phone: formData.phone,
          phone_country_code: formData.phone_country_code,
          phone_verified: phoneVerified,
          city: formData.city,
          country: formData.country,
          linkedin_url: formData.linkedin_url,
          portfolio_url: formData.portfolio_url,
          work_experience: workExperience,
          interests: formData.interests,
          job_preferences: {
            types: formData.job_types,
            remote_only: true // Default for RemoteHive
          }
        };

        const token = await getToken({ template: 'supabase' });
        await createUser(profileData, token || undefined);
        
        navigate('/dashboard');
      } catch (err: any) {
      console.error("Onboarding error:", err);
      if (err.message && (err.message.includes('duplicate key') || err.message.includes('unique constraint'))) {
        navigate('/dashboard');
      } else {
        setError(err.message || "Failed to create profile. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

  // Neumorphic Styles (Refactored to Glassmorphism/White Theme)
  const cardStyle = "neu-card p-8 md:p-12";
  const inputStyle = "neu-input";
  const labelStyle = "mb-2 block text-sm font-bold text-gray-700 ml-1 flex items-center gap-1";
  const buttonPrimaryStyle = "flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-400/80 to-cyan-400/80 px-8 py-3 font-bold text-white shadow-neu-button transition-all hover:opacity-90 active:shadow-neu-button-active disabled:opacity-50 disabled:cursor-not-allowed border border-white/20";
  const buttonSecondaryStyle = "flex items-center justify-center gap-2 rounded-xl bg-white/40 backdrop-blur-sm px-8 py-3 font-bold text-gray-600 shadow-neu-button transition-all hover:bg-white/60 active:shadow-neu-button-active border border-white/40";
  const chipStyle = (active: boolean) => clsx(
    "cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-all select-none border border-white/40 backdrop-blur-sm",
    active 
      ? "bg-white/60 text-purple-600 shadow-neu-pressed border-purple-200"
      : "bg-white/40 text-gray-600 shadow-neu-button hover:bg-white/60 active:shadow-neu-pressed"
  );

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="mx-auto max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-12 flex justify-center">
          <div className="flex items-center gap-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center">
                <div className={clsx(
                  "flex h-10 w-10 items-center justify-center rounded-full font-bold transition-all border border-white/40 backdrop-blur-sm",
                  step >= s 
                    ? "bg-white/60 text-purple-600 shadow-neu-pressed"
                    : "bg-white/30 text-gray-400 shadow-neu-flat"
                )}>
                  {step > s ? <Check className="h-5 w-5" /> : s}
                </div>
                {s < 5 && (
                  <div className={clsx(
                    "mx-2 h-2 w-8 sm:w-16 rounded-full transition-all duration-500",
                    step > s 
                      ? "bg-purple-500 shadow-inner" 
                      : "bg-white/30 shadow-inner"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={cardStyle}>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
              {step === 1 && "Profile Details"}
              {step === 2 && "Work History"}
              {step === 3 && "Skills & Summary"}
              {step === 4 && "Interests & Preferences"}
              {step === 5 && "Review & Submit"}
            </h2>
            <p className="mt-2 text-gray-500">
              {step === 1 && "Let's start with your basic information."}
              {step === 2 && "Tell us about your professional background."}
              {step === 3 && "Showcase your expertise and professional identity."}
              {step === 4 && "Help us personalize your job recommendations."}
              {step === 5 && "Almost there! Review your profile before launching."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="rounded-[12px] bg-red-50 p-4 text-red-600 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.1)]">
                {error}
              </div>
            )}

            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className={labelStyle}>Full Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={user?.fullName || ""}
                      disabled
                      className={`${inputStyle} opacity-70 cursor-not-allowed`}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Email <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      value={user?.primaryEmailAddress?.emailAddress || ""}
                      disabled
                      className={`${inputStyle} opacity-70 cursor-not-allowed`}
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className={labelStyle} htmlFor="phone">Phone Number <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                       <select
                          name="phone_country_code"
                          value={formData.phone_country_code}
                          onChange={handleChange}
                          className="neu-input w-24 px-2"
                        >
                          <option value="IN">+91</option>
                          <option value="US">+1</option>
                          <option value="UK">+44</option>
                        </select>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className={`${inputStyle} flex-1`}
                        placeholder="00000 00000"
                      />
                    </div>
                    {formData.phone && (
                        <div className="mt-2 flex items-center gap-3">
                          {phoneVerified ? (
                            <div className="flex items-center text-green-600 gap-1 text-sm font-medium px-3 py-1 rounded-full bg-green-50 border border-green-200">
                              <ShieldCheck className="h-4 w-4" /> Verified
                            </div>
                          ) : otpSent ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="OTP"
                                value={enteredOtp}
                                onChange={(e) => setEnteredOtp(e.target.value)}
                                className="neu-input w-24 py-1 px-2 text-center text-sm"
                                maxLength={6}
                              />
                              <button
                                type="button"
                                onClick={handleConfirmOtp}
                                className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700"
                              >
                                Verify
                              </button>
                              
                              {resendTimer > 0 ? (
                                <span className="text-xs text-gray-500 font-medium ml-2">
                                  Resend in {resendTimer}s
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={handleResendOtp}
                                  className="ml-2 p-1.5 text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                                  title="Resend OTP"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handleVerifyPhone}
                              disabled={isVerifyingPhone}
                              className="text-sm bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 flex items-center gap-1"
                            >
                              {isVerifyingPhone ? <Loader2 className="h-3 w-3 animate-spin" /> : "Verify Number"}
                            </button>
                          )}
                        </div>
                      )}
                  </div>
                  <div>
                    <label className={labelStyle} htmlFor="city">City <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        id="city"
                        name="city"
                        type="text"
                        required
                        value={formData.city}
                        onChange={handleChange}
                        className={`${inputStyle} pl-12`}
                        placeholder="San Francisco"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className={labelStyle} htmlFor="country">Country <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      id="country"
                      name="country"
                      type="text"
                      required
                      value={formData.country}
                      onChange={handleChange}
                      className={`${inputStyle} pl-12`}
                      placeholder="United States"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Work History */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className={labelStyle} htmlFor="current_role">Current/Latest Role <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        id="current_role"
                        name="current_role"
                        type="text"
                        required
                        value={formData.current_role}
                        onChange={handleChange}
                        className={`${inputStyle} pl-12`}
                        placeholder="e.g. Frontend Developer"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelStyle} htmlFor="current_company">Company Name <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        id="current_company"
                        name="current_company"
                        type="text"
                        required
                        value={formData.current_company}
                        onChange={handleChange}
                        className={`${inputStyle} pl-12`}
                        placeholder="e.g. Acme Inc."
                      />
                    </div>
                  </div>
                </div>

                <div>
                   <label className={labelStyle} htmlFor="years_of_experience">Years of Experience</label>
                   <input
                     id="years_of_experience"
                     name="years_of_experience"
                     type="number"
                     min="0"
                     value={formData.years_of_experience}
                     onChange={handleChange}
                     className={inputStyle}
                     placeholder="e.g. 5"
                   />
                </div>
              </div>
            )}

            {/* Step 3: Skills & Summary */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
                 <div>
                  <label className={labelStyle} htmlFor="headline">Professional Headline <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Sparkles className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      id="headline"
                      name="headline"
                      type="text"
                      required
                      value={formData.headline}
                      onChange={handleChange}
                      className={`${inputStyle} pl-12`}
                      placeholder="e.g. Senior React Developer | UI/UX Enthusiast"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelStyle} htmlFor="bio">Professional Summary</label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={handleChange}
                    className={inputStyle}
                    placeholder="Briefly describe your expertise and what you're looking for..."
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className={labelStyle} htmlFor="experience_level">Experience Level <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select
                        id="experience_level"
                        name="experience_level"
                        value={formData.experience_level}
                        onChange={handleChange}
                        className={`${inputStyle} appearance-none`}
                      >
                        <option>Entry Level</option>
                        <option>Mid-Level</option>
                        <option>Senior</option>
                        <option>Lead / Manager</option>
                        <option>Executive</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                        <ChevronRight className="h-4 w-4 rotate-90" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={labelStyle} htmlFor="skills">Skills (comma separated) <span className="text-red-500">*</span></label>
                    <input
                      id="skills"
                      name="skills"
                      type="text"
                      required
                      value={formData.skills}
                      onChange={handleChange}
                      className={inputStyle}
                      placeholder="React, Node.js, TypeScript..."
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className={labelStyle} htmlFor="linkedin_url">LinkedIn URL</label>
                    <div className="relative">
                      <Linkedin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        id="linkedin_url"
                        name="linkedin_url"
                        type="url"
                        value={formData.linkedin_url}
                        onChange={handleChange}
                        className={`${inputStyle} pl-12`}
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelStyle} htmlFor="portfolio_url">Portfolio URL</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        id="portfolio_url"
                        name="portfolio_url"
                        type="url"
                        value={formData.portfolio_url}
                        onChange={handleChange}
                        className={`${inputStyle} pl-12`}
                        placeholder="https://myportfolio.com"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Interests & Preferences */}
            {step === 4 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right duration-500">
                <div>
                  <label className={`${labelStyle} mb-4`}>Job Type Preferences</label>
                  <div className="flex flex-wrap gap-4">
                    {JOB_TYPES.map(type => (
                       <div 
                        key={type}
                        onClick={() => toggleJobType(type)}
                        className={chipStyle(formData.job_types.includes(type))}
                      >
                        {type}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`${labelStyle} mb-4`}>Fields of Interest</label>
                  <div className="flex flex-wrap gap-3">
                    {INTEREST_OPTIONS.map(interest => (
                      <div 
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={chipStyle(formData.interests.includes(interest))}
                      >
                        {interest}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {step === 5 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
                <div className="rounded-[20px] bg-[#E0E5EC] p-6 shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff]">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-indigo-500" /> Personal Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="block text-gray-500">Name</span>
                      <span className="font-medium text-gray-900">{user?.fullName}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500">Email</span>
                      <span className="font-medium text-gray-900">{user?.primaryEmailAddress?.emailAddress}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500">Phone</span>
                      <span className="font-medium text-gray-900">{formData.phone || "-"}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500">Location</span>
                      <span className="font-medium text-gray-900">{formData.city}, {formData.country}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[20px] bg-[#E0E5EC] p-6 shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff]">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-indigo-500" /> Professional Profile
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <span className="block text-gray-500">Current Role</span>
                      <span className="font-medium text-gray-900">{formData.current_role} at {formData.current_company}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500">Headline</span>
                      <span className="font-medium text-gray-900">{formData.headline}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500">Skills</span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {formData.skills.split(',').filter(Boolean).map((skill, i) => (
                          <span key={i} className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[20px] bg-[#E0E5EC] p-6 shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff]">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-indigo-500" /> Preferences
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <span className="block text-gray-500">Job Types</span>
                      <div className="mt-1 flex flex-wrap gap-2">
                         {formData.job_types.length > 0 ? formData.job_types.map((type, i) => (
                          <span key={i} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                            {type}
                          </span>
                        )) : <span className="text-gray-400">None selected</span>}
                      </div>
                    </div>
                    <div>
                      <span className="block text-gray-500">Interests</span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {formData.interests.length > 0 ? formData.interests.map((interest, i) => (
                          <span key={i} className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
                            {interest}
                          </span>
                        )) : <span className="text-gray-400">None selected</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className={buttonSecondaryStyle}
                >
                  Back
                </button>
              ) : (
                <div></div> // Spacer
              )}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className={buttonPrimaryStyle}
                >
                  Next <ChevronRight className="h-5 w-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className={buttonPrimaryStyle}
                >
                  {isLoading ? "Creating Profile..." : "Complete Setup"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
