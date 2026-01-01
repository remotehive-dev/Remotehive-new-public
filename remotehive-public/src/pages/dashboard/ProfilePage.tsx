import { useUser, useAuth } from "@clerk/clerk-react";
import { useEffect, useState, useRef } from "react";
import { getUserByClerkId, uploadResume, updateUser } from "../../lib/api";
import { extractTextFromPDF, extractTextFromDocx, parseResumeWithAI } from "../../lib/resumeParser";
import { calculateProfileScore, getMissingMandatoryFields } from "../../lib/profileScore";
import { Resume } from "../../types/resume";
import { sendOtp } from "../../lib/fast2sms";
import { FileText, Upload, Check, Loader2, X, Briefcase, User, MapPin, Globe, Linkedin, Save, Sparkles, AlertTriangle, Trash2, Wand2, Map, ShieldCheck, RotateCw } from "lucide-react";
import { clsx } from "clsx";

let googleMapsScriptLoadingPromise: Promise<void> | null = null;

function loadGoogleMapsScript(apiKey: string) {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).google?.maps?.places) return Promise.resolve();

  if (!googleMapsScriptLoadingPromise) {
    googleMapsScriptLoadingPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-remotehive-google-maps="true"]');
      if (existing) {
        if (existing.dataset.loaded === "true") {
          resolve();
          return;
        }
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps script")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.dataset.remotehiveGoogleMaps = "true";
      script.async = true;
      script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&v=weekly&loading=async`;
      script.addEventListener("load", () => {
        script.dataset.loaded = "true";
        resolve();
      }, { once: true });
      script.addEventListener("error", () => reject(new Error("Failed to load Google Maps script")), { once: true });
      document.head.appendChild(script);
    });
  }

  return googleMapsScriptLoadingPromise;
}

export function ProfilePage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [parsedResume, setParsedResume] = useState<Resume | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [storageProvider, setStorageProvider] = useState<'supabase' | 'appwrite'>('supabase');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addressSearchInputRef = useRef<HTMLInputElement>(null);
  const addressAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
  // Phone Verification State
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  const [profileScore, setProfileScore] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    headline: "",
    bio: "",
    experience_level: "",
    skills: "",
    phone: "",
    phone_country_code: "IN", // Default to India
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip_code: "",
    country: "India", // Default to India
    latitude: 0,
    longitude: 0,
    linkedin_url: "",
    portfolio_url: "",
  });

  const COUNTRIES = [
    { code: "IN", name: "India", dial_code: "+91" },
    { code: "US", name: "United States", dial_code: "+1" },
    { code: "UK", name: "United Kingdom", dial_code: "+44" },
    { code: "CA", name: "Canada", dial_code: "+1" },
    { code: "AU", name: "Australia", dial_code: "+61" },
    { code: "DE", name: "Germany", dial_code: "+49" },
    { code: "FR", name: "France", dial_code: "+33" },
    { code: "JP", name: "Japan", dial_code: "+81" },
    { code: "CN", name: "China", dial_code: "+86" },
    { code: "AE", name: "United Arab Emirates", dial_code: "+971" },
  ];

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
    const input = addressSearchInputRef.current;
    if (!apiKey || !input) return;

    let cancelled = false;

    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (cancelled) return;
        if (!(window as any).google?.maps?.places) return;
        if (addressAutocompleteRef.current) return;

        const autocomplete = new google.maps.places.Autocomplete(input, {
          types: ["geocode"],
          componentRestrictions: { country: "in" },
        });

        addressAutocompleteRef.current = autocomplete;

        const listener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place.address_components || !place.geometry) return;

          const location = place.geometry?.location;
          const addressComponents = place.address_components;
          let address1 = "";
          let city = "";
          let state = "";
          let zipCode = "";
          let country = "";

          addressComponents.forEach((component) => {
            const types = component.types;
            if (types.includes("street_number")) {
              address1 = component.long_name + " " + address1;
            }
            if (types.includes("route")) {
              address1 += component.long_name;
            }
            if (types.includes("locality")) {
              city = component.long_name;
            }
            if (types.includes("administrative_area_level_1")) {
              state = component.long_name;
            }
            if (types.includes("postal_code")) {
              zipCode = component.long_name;
            }
            if (types.includes("country")) {
              country = component.long_name;
            }
          });

          setFormData((prev) => ({
            ...prev,
            address_line1: address1.trim(),
            city,
            state,
            zip_code: zipCode,
            country,
            latitude: location?.lat?.() ?? prev.latitude,
            longitude: location?.lng?.() ?? prev.longitude,
          }));
        });

        (autocomplete as any).__remotehiveListener = listener;
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      const autocomplete = addressAutocompleteRef.current as any;
      if (autocomplete?.__remotehiveListener?.remove) {
        autocomplete.__remotehiveListener.remove();
      }
      addressAutocompleteRef.current = null;
    };
  }, []);

  // GPS Location with Reverse Geocoding
  const handleGPSLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng
          }));

          // Reverse Geocoding if Google Maps is loaded
          if ((window as any).google && (window as any).google.maps) {
            const geocoder = new (window as any).google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
              if (status === "OK" && results && results[0]) {
                const addressComponents = results[0].address_components;
                let address1 = "";
                let city = "";
                let state = "";
                let zipCode = "";
                let country = "";

                addressComponents.forEach((component: any) => {
                  const types = component.types;
                  if (types.includes("street_number")) {
                    address1 = component.long_name + " " + address1;
                  }
                  if (types.includes("route")) {
                    address1 += component.long_name;
                  }
                  if (types.includes("locality")) {
                    city = component.long_name;
                  }
                  if (types.includes("administrative_area_level_1")) {
                    state = component.long_name;
                  }
                  if (types.includes("postal_code")) {
                    zipCode = component.long_name;
                  }
                  if (types.includes("country")) {
                    country = component.long_name;
                  }
                });

                setFormData(prev => ({
                  ...prev,
                  address_line1: address1.trim(),
                  city,
                  state,
                  zip_code: zipCode,
                  country
                }));
              }
            });
          } else {
             alert(`Location captured: ${lat}, ${lng}`);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Could not retrieve location. Please enable GPS.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      try {
        const token = await getToken({ template: 'supabase' });
        
        // Log token header for debugging (console only)
        if (token) {
          try {
            const header = JSON.parse(atob(token.split('.')[0]));
            console.log('Auth Debug: Token Header:', header);
          } catch (e) {
            console.error('Auth Debug: Failed to parse token header');
          }
        }

        const data = await getUserByClerkId(user.id, token || undefined);
        setProfile(data);
        // Initialize form data
        if (data) {
          // Split full name if first/last not set (migration)
          const nameParts = (data.full_name || "").split(' ');
          const firstName = data.first_name || nameParts[0] || "";
          const lastName = data.last_name || nameParts.slice(1).join(' ') || "";

          setFormData({
            first_name: firstName,
            last_name: lastName,
            headline: data.headline || "",
            bio: data.bio || "",
            experience_level: data.experience_level || "Mid-Level",
            skills: Array.isArray(data.skills) ? data.skills.join(", ") : (data.skills || ""),
            phone: data.phone || "",
            phone_country_code: data.phone_country_code || "IN",
            address_line1: data.address_line1 || "",
            address_line2: data.address_line2 || "",
            city: data.city || "",
            state: data.state || "",
            zip_code: data.zip_code || "",
            country: data.country || "India",
            latitude: data.latitude || 0,
            longitude: data.longitude || 0,
            linkedin_url: data.linkedin_url || "",
            portfolio_url: data.portfolio_url || "",
          });
          
          // Calculate score
          const score = calculateProfileScore(data);
          setProfileScore(score);
          setMissingFields(getMissingMandatoryFields(data));
          
          // Set phone verified status
          setPhoneVerified(data.phone_verified || false);
        }
      } catch (error: any) {
        console.error("Error loading profile:", error);
        // Silent error for auth issues to avoid UI clutter, reliance on console
        if (error.message?.includes('signature') || error.message?.includes('401')) {
           console.error("Critical Auth Error: Clerk/Supabase key mismatch. Please verify JWT Secrets.");
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [user, getToken]);

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
    setSaveSuccess(false);
    
    // Reset verification if phone changes
    if (e.target.name === 'phone' || e.target.name === 'phone_country_code') {
      setPhoneVerified(false);
      setOtpSent(false);
      setEnteredOtp("");
      setResendTimer(0);
    }
  };

  const validatePhone = (phone: string) => {
    // Basic validation: 10 digits for India, or just ensure not empty/too short for others
    const cleanPhone = phone.replace(/\D/g, '');
    if (formData.phone_country_code === 'IN') {
       return cleanPhone.length >= 10;
    }
    return cleanPhone.length >= 8;
  };

  const handleVerifyPhone = async () => {
    if (!formData.phone) return;
    
    if (!validatePhone(formData.phone)) {
      alert("Please enter a valid phone number.");
      return;
    }

    setIsVerifyingPhone(true);
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    
    // Format phone number for Fast2SMS (10 digits for India)
    const dialCode = COUNTRIES.find(c => c.code === formData.phone_country_code)?.dial_code?.replace('+', '') || '91';
    const phoneNumber = `${formData.phone.replace(/\D/g, '')}`; 
    
    // If India, take last 10 digits. Else use full number with country code if needed.
    const finalNumber = formData.phone_country_code === 'IN' ? phoneNumber.slice(-10) : `${dialCode}${phoneNumber}`;

    const sent = await sendOtp(finalNumber, otp);
    
    if (sent) {
      setOtpSent(true);
      setResendTimer(30); // 30 seconds cooldown
      alert(`OTP sent to ${finalNumber}`);
    } else {
      alert("Failed to send OTP. Please check the number and try again.");
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
      alert("Phone number verified successfully!");
    } else {
      alert("Invalid OTP. Please try again.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const full_name = `${formData.first_name} ${formData.last_name}`.trim();
      
      // Filter out empty skills and ensure arrays are valid
      const processedSkills = formData.skills
        ? formData.skills.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const updates = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        full_name, // Maintain backward compatibility
        headline: formData.headline,
        bio: formData.bio,
        experience_level: formData.experience_level,
        skills: processedSkills,
        phone: formData.phone,
        phone_country_code: formData.phone_country_code,
        phone_verified: phoneVerified,
        address_line1: formData.address_line1,
        address_line2: formData.address_line2,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        country: formData.country,
        latitude: formData.latitude,
        longitude: formData.longitude,
        linkedin_url: formData.linkedin_url,
        portfolio_url: formData.portfolio_url,
        work_experience: parsedResume?.workExperiences,
        education: parsedResume?.educations,
        projects: parsedResume?.projects,
      };

      const token = await getToken({ template: 'supabase' });
      const updatedProfile = await updateUser(user.id, updates, token || undefined);
      
      setProfile(updatedProfile);
      setProfileScore(calculateProfileScore(updatedProfile));
      setMissingFields(getMissingMandatoryFields(updatedProfile));
      
      setSaveSuccess(true);
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving profile:", err);
      // Could add error toast here
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... (existing upload logic)
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      setUploadError("Please upload a PDF or Word file.");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be less than 5MB.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setIsParsing(true);

    try {
      // 1. Upload to Storage
      const token = await getToken({ template: 'supabase' });
      const url = await uploadResume(user.id, file, token || undefined, storageProvider);
      setProfile((prev: any) => ({ ...prev, resume_url: url }));
      
      // Update score immediately with new resume
      if (profile) {
          const tempProfile = { ...profile, resume_url: url };
          setProfileScore(calculateProfileScore(tempProfile));
          setMissingFields(getMissingMandatoryFields(tempProfile));
      }

      // 2. Parse File and Auto-fill
      try {
        let text = '';
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
           text = await extractTextFromPDF(file);
        } else {
           text = await extractTextFromDocx(file);
        }
        
        const parsedData = await parseResumeWithAI(text);
        
        console.log("Parsed Data:", parsedData);
        setParsedResume(parsedData);

        // Auto-fill form data with parsed results
        setFormData(prev => ({
          ...prev,
          first_name: parsedData.profile.name?.split(' ')[0] || prev.first_name,
          last_name: parsedData.profile.name?.split(' ').slice(1).join(' ') || prev.last_name,
          headline: parsedData.profile.summary ? parsedData.profile.summary.slice(0, 100) + (parsedData.profile.summary.length > 100 ? "..." : "") : prev.headline,
          bio: parsedData.profile.summary || prev.bio,
          skills: parsedData.skills.featuredSkills.map(s => s.skill).filter(Boolean).join(", "),
          phone: parsedData.profile.phone || prev.phone,
          city: parsedData.profile.location?.split(',')[0]?.trim() || prev.city,
          country: parsedData.profile.location?.split(',')[1]?.trim() || prev.country,
          linkedin_url: parsedData.profile.url.includes('linkedin') ? parsedData.profile.url : prev.linkedin_url,
          portfolio_url: (!parsedData.profile.url.includes('linkedin') && parsedData.profile.url) ? parsedData.profile.url : prev.portfolio_url,
        }));
        
      } catch (parseErr: any) {
        console.error("Parsing failed:", parseErr);
        // Don't block the upload success even if parsing fails
        setUploadError(`Resume uploaded, but auto-fill failed: ${parseErr.message || 'Unknown error'}`);
      }

    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(err.message || "Failed to upload resume.");
    } finally {
      setIsUploading(false);
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteResume = async () => {
    if (!user || !confirm("Are you sure you want to delete your resume?")) return;
    
    try {
        const token = await getToken({ template: 'supabase' });
        await updateUser(user.id, { resume_url: null } as any, token || undefined);
        setProfile((prev: any) => {
            const newProfile = { ...prev, resume_url: null };
            setProfileScore(calculateProfileScore(newProfile));
            setMissingFields(getMissingMandatoryFields(newProfile));
            return newProfile;
        });
    } catch (err) {
        console.error("Error deleting resume:", err);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">My Profile</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your public profile and resume.</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className={clsx(
            "neu-btn-primary flex items-center gap-2",
            isSaving && "opacity-70 cursor-not-allowed"
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : saveSuccess ? (
            <>
              <Check className="h-4 w-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Profile Score Alert */}
      {profileScore < 20 && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 shadow-neu-flat border border-red-100 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-red-800">Profile Incomplete ({profileScore}%)</h3>
            <p className="mt-1 text-sm text-red-700">
              Your profile score is low. Complete your profile to improve job visibility and recommendations.
            </p>
            {missingFields.length > 0 && (
              <p className="mt-2 text-xs text-red-600 font-medium">
                Missing: {missingFields.join(", ")}
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Profile Score Progress */}
      <div className="mb-8 neu-card p-6">
         <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Profile Completion</h3>
            <span className={clsx(
                "text-2xl font-bold drop-shadow-sm",
                profileScore < 50 ? "text-orange-500" : profileScore < 80 ? "text-indigo-500" : "text-green-500"
            )}>{profileScore}%</span>
         </div>
         <div className="h-4 w-full rounded-full bg-white/50 shadow-neu-pressed overflow-hidden p-1">
            <div 
                className={clsx(
                    "h-full rounded-full shadow-md transition-all duration-1000 ease-out",
                    profileScore < 50 ? "bg-orange-400" : profileScore < 80 ? "bg-indigo-400" : "bg-green-400"
                )}
                style={{ width: `${profileScore}%` }}
            />
         </div>
         <p className="mt-3 text-sm text-gray-500 font-medium">
            {profileScore < 100 ? "Complete all sections to reach 100%." : "Great job! Your profile is complete."}
         </p>
      </div>

      <div className="space-y-8">
        <form onSubmit={handleSave} className="space-y-8">
          {/* Basic Info Card */}
          <div className="neu-card p-8">
            <h2 className="flex items-center gap-3 text-lg font-bold text-gray-800 mb-6">
              <div className="p-2 rounded-lg bg-white/50 shadow-neu-flat text-purple-600">
                <User className="h-5 w-5" />
              </div>
              Basic Information
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">First Name <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="neu-input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Last Name <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="neu-input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Email <span className="text-red-500">*</span></label>
                <input 
                  type="email" 
                  defaultValue={profile?.email}
                  disabled
                  className="neu-input opacity-60 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Mobile Number <span className="text-gray-400 font-normal">(Optional)</span></label>
                <div className="flex gap-3">
                  <select
                    name="phone_country_code"
                    value={formData.phone_country_code}
                    onChange={handleChange}
                    className="neu-input w-24 sm:w-32 bg-white/40 backdrop-blur-md rounded-xl shadow-neu-pressed px-3 py-3 outline-none focus:ring-2 focus:ring-purple-400/50 border border-white/40 transition-all text-gray-800"
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>{c.dial_code} ({c.code})</option>
                    ))}
                  </select>
                  <input 
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="00000 00000"
                    className="neu-input flex-1 min-w-0"
                  />
                  {formData.phone && (
                    <div className="flex items-center">
                      {phoneVerified ? (
                        <div className="flex items-center text-green-600 px-3 py-2 rounded-xl bg-green-50/50 border border-green-200/50 shadow-sm backdrop-blur-sm" title="Verified">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                      ) : otpSent ? (
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="OTP"
                              value={enteredOtp}
                              onChange={(e) => setEnteredOtp(e.target.value)}
                              className="neu-input w-20 py-2 px-2 text-center !rounded-xl text-sm"
                              maxLength={6}
                            />
                            <button
                              type="button"
                              onClick={handleConfirmOtp}
                              className="bg-green-600 text-white px-3 py-2 rounded-xl font-medium shadow-sm hover:bg-green-700 transition-colors text-sm"
                            >
                              Verify
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={resendTimer > 0}
                            className="text-xs text-purple-600 font-medium hover:text-purple-800 disabled:opacity-50 flex items-center gap-1 mt-1 sm:mt-0"
                          >
                            <RotateCw className={clsx("h-3 w-3", resendTimer > 0 && "animate-spin")} />
                            {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleVerifyPhone}
                          disabled={isVerifyingPhone}
                          className="bg-purple-600 text-white px-4 py-2 rounded-xl font-medium shadow-sm hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                        >
                          {isVerifyingPhone ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Location & Address Card */}
          <div className="neu-card p-8">
            <h2 className="flex items-center gap-3 text-lg font-bold text-gray-800 mb-6">
              <div className="p-2 rounded-lg bg-white/50 shadow-neu-flat text-purple-600">
                <MapPin className="h-5 w-5" />
              </div>
              Location Details
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4 items-end">
                <div className="flex-grow relative">
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Search Address</label>
                  <div className="relative">
                    <input 
                      ref={addressSearchInputRef}
                      type="text"
                      placeholder="Start typing your address..."
                      className="neu-input pl-10"
                    />
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                  <p className="mt-2 text-xs text-gray-500 font-medium ml-1">
                    {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? "Powered by Google Maps" : "Google Maps API Key missing"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGPSLocation}
                  className="neu-btn-secondary h-[46px] flex items-center gap-2 whitespace-nowrap mb-6"
                >
                  <Map className="h-4 w-4" />
                  Use GPS
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Address Line 1</label>
                <input 
                  type="text"
                  name="address_line1"
                  value={formData.address_line1}
                  onChange={handleChange}
                  className="neu-input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Address Line 2 (Optional)</label>
                <input 
                  type="text"
                  name="address_line2"
                  value={formData.address_line2}
                  onChange={handleChange}
                  className="neu-input"
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">City</label>
                  <input 
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="neu-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">State / Province</label>
                  <input 
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="neu-input"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Zip / Postal Code</label>
                  <input 
                    type="text"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleChange}
                    className="neu-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Country</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="neu-input"
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-lg bg-white/50 shadow-neu-pressed">
                <div className="text-xs font-mono text-gray-500">Latitude: <span className="text-purple-600">{formData.latitude || 'N/A'}</span></div>
                <div className="text-xs font-mono text-gray-500">Longitude: <span className="text-purple-600">{formData.longitude || 'N/A'}</span></div>
              </div>
            </div>
          </div>

          {/* Professional Details Card */}
          <div className="neu-card p-8">
            <h2 className="flex items-center gap-3 text-lg font-bold text-gray-800 mb-6">
              <div className="p-2 rounded-lg bg-white/50 shadow-neu-flat text-purple-600">
                <Briefcase className="h-5 w-5" />
              </div>
              Professional Details
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Headline <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  name="headline"
                  value={formData.headline}
                  onChange={handleChange}
                  placeholder="e.g. Senior Full Stack Developer"
                  className="neu-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Bio</label>
                <textarea 
                  name="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself..."
                  className="neu-input"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Experience Level</label>
                  <select
                    name="experience_level"
                    value={formData.experience_level}
                    onChange={handleChange}
                    className="neu-input"
                  >
                    <option>Entry Level</option>
                    <option>Mid-Level</option>
                    <option>Senior</option>
                    <option>Lead / Manager</option>
                    <option>Executive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Skills (comma separated) <span className="text-red-500">*</span></label>
                  <input 
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    placeholder="React, Node.js, TypeScript..."
                    className="neu-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Social Links Card */}
          <div className="neu-card p-8">
            <h2 className="flex items-center gap-3 text-lg font-bold text-gray-800 mb-6">
              <div className="p-2 rounded-lg bg-white/50 shadow-neu-flat text-purple-600">
                <Globe className="h-5 w-5" />
              </div>
              Social Links
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">LinkedIn URL</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Linkedin className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="url"
                    name="linkedin_url"
                    value={formData.linkedin_url}
                    onChange={handleChange}
                    className="neu-input pl-10"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Portfolio URL</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Globe className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="url"
                    name="portfolio_url"
                    value={formData.portfolio_url}
                    onChange={handleChange}
                    className="neu-input pl-10"
                    placeholder="https://myportfolio.com"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Resume Section */}
        <div className="neu-card p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800">Resume & CV <span className="text-red-500">*</span></h2>
            <div className="flex gap-2">
              <div className="flex items-center bg-gray-100 rounded-lg p-1 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setStorageProvider('supabase')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    storageProvider === 'supabase' 
                      ? 'bg-white text-purple-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Supabase
                </button>
                <button
                  type="button"
                  onClick={() => setStorageProvider('appwrite')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    storageProvider === 'appwrite' 
                      ? 'bg-white text-pink-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Appwrite
                </button>
              </div>
              <button className="flex items-center gap-2 text-xs font-bold text-purple-600 hover:text-purple-600-hover bg-white/50 shadow-neu-button px-3 py-2 rounded-lg transition-all active:shadow-neu-button-active">
                  <Wand2 className="h-3 w-3" /> Build with AI
              </button>
            </div>
          </div>
          
          <div>
            {profile?.resume_url ? (
              <div className="flex items-center justify-between rounded-xl bg-white/50 shadow-neu-pressed p-4 border border-white/50">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-white/50 shadow-neu-flat p-3 text-red-500">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Current Resume</p>
                    <a 
                      href={profile.resume_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-purple-600 hover:underline font-medium"
                    >
                      View Resume
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="neu-btn-secondary text-xs py-2 px-3"
                    >
                      Replace
                    </button>
                    <button 
                      onClick={handleDeleteResume}
                      className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/50 shadow-neu-button text-red-500 hover:text-red-600 active:shadow-neu-button-active transition-all"
                      title="Delete Resume"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={clsx(
                  "cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-12 text-center transition-all hover:border-neu-accent hover:bg-white/50 hover:shadow-neu-pressed",
                  (isUploading || isParsing) && "pointer-events-none opacity-50"
                )}
              >
                {(isUploading || isParsing) ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
                    <p className="mt-4 text-sm font-medium text-gray-600">
                      {isParsing ? "Analyzing resume contents..." : "Uploading file..."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mx-auto h-16 w-16 rounded-full bg-white/50 shadow-neu-flat flex items-center justify-center text-gray-400 mb-4">
                        <Upload className="h-8 w-8" />
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-2 text-sm font-bold text-gray-700">
                       Click to upload resume
                       <span className="flex items-center gap-1 rounded-full bg-white/50 shadow-neu-flat px-2 py-0.5 text-xs text-purple-600">
                         <Sparkles className="h-3 w-3" /> Auto-fill
                       </span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">PDF, Word (DOC/DOCX) (max 5MB)</p>
                  </>
                )}
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx"
              className="hidden"
            />

            {uploadError && (
              <div className="mt-4 flex items-center gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700 shadow-neu-flat border border-red-100">
                <X className="h-5 w-5" />
                {uploadError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
