"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Plus, MapPin, Building2, Globe, Loader2, Wand2, Check, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { createJob, getUserByClerkId, getJobRoles } from "../../../lib/api";
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { clsx } from "clsx";

const libraries: ("places")[] = ["places"];
const mapContainerStyle = {
  width: '100%',
  height: '250px',
  borderRadius: '0.5rem'
};

// --- Schema Definition ---
const jobSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  type: z.string(),
  salary_range: z.string().min(1, "Salary range is required"),
  application_url: z.string().url("Must be a valid URL").or(z.string().email("Must be a valid email")).or(z.literal("")),
  description: z.string().min(50, "Description must be detailed (at least 50 chars)"),
  requirements: z.string().min(10, "Please list at least one requirement"),
  benefits: z.string().optional(),
});

type JobFormData = z.infer<typeof jobSchema>;

// --- Components ---

const LocationSearch = ({ onLocationSelect, isLoaded, defaultValue }: { 
  onLocationSelect: (data: { address: string; lat: number; lng: number; placeId: string }) => void;
  isLoaded: boolean;
  defaultValue?: string;
}) => {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: { /* types: ['(cities)'] */ },
    debounce: 300,
    initOnMount: isLoaded,
    defaultValue: defaultValue
  });

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();
    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      onLocationSelect({ address, lat, lng, placeId: results[0].place_id });
    } catch (error) {
      console.error("Error: ", error);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!ready}
          className="block w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2.5 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-all"
          placeholder="Search location (City, Zip, Address)..."
        />
      </div>
      {status === "OK" && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {data.map(({ place_id, description }) => (
            <li
              key={place_id}
              onClick={() => handleSelect(description)}
              className="relative cursor-pointer select-none py-2.5 pl-3 pr-9 hover:bg-indigo-50 text-slate-900 transition-colors"
            >
              {description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const AIRewriteButton = ({ onRewrite, isLoading }: { onRewrite: () => void, isLoading: boolean }) => (
  <button
    type="button"
    onClick={onRewrite}
    disabled={isLoading}
    className="absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50"
  >
    {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
    AI Rewrite
  </button>
);

const JobTitleAutocomplete = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
        if (value && value.length >= 2) {
            setIsLoading(true);
            try {
                const roles = await getJobRoles(value);
                setSuggestions(roles || []);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        } else {
            setSuggestions([]);
        }
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="relative">
      <input
        value={value || ''}
        onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-all"
        placeholder="e.g. Senior Frontend Engineer"
      />
      {isLoading && showSuggestions && (
          <div className="absolute right-3 top-3">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          </div>
      )}
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm max-h-60">
          {suggestions.map((role) => (
            <li
              key={role.slug}
              className="cursor-pointer select-none py-2.5 pl-3 pr-9 hover:bg-indigo-50 text-slate-900"
              onClick={() => {
                  onChange(role.name);
                  setShowSuggestions(false);
              }}
            >
              {role.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default function PostJobPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  
  // Custom State
  const [workplaceType, setWorkplaceType] = useState<'remote' | 'hybrid' | 'onsite'>('remote');
  const [locationDetails, setLocationDetails] = useState<{
    address: string;
    lat: number | null;
    lng: number | null;
    placeId: string | null;
  }>({ address: '', lat: null, lng: null, placeId: null });

  // AI State
  const [isRewritingDesc, setIsRewritingDesc] = useState(false);
  const [isRewritingReqs, setIsRewritingReqs] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch, getValues, control } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      type: 'full-time',
      application_url: '', // optional but recommended
    }
  });

  // Load Company & Draft
  useEffect(() => {
    async function init() {
      if (user) {
        try {
          const dbUser = await getUserByClerkId(user.id);
          setCompanyId((dbUser as any).company_id);
          
          // Load draft from local storage
          const savedDraft = localStorage.getItem('job_post_draft');
          if (savedDraft) {
            const draft = JSON.parse(savedDraft);
            setValue('title', draft.title);
            setValue('description', draft.description);
            setValue('requirements', draft.requirements);
            setValue('benefits', draft.benefits);
            setValue('salary_range', draft.salary_range);
            if (draft.workplaceType) setWorkplaceType(draft.workplaceType);
            // Note: Location re-hydration is complex with autocomplete, skipping for simplicity or need custom logic
          }
        } catch (err) {
          console.error("Failed to fetch user company:", err);
        }
      }
    }
    init();
  }, [user, setValue]);

  // Auto-save Draft
  useEffect(() => {
    const subscription = watch((value) => {
      localStorage.setItem('job_post_draft', JSON.stringify({
        ...value,
        workplaceType
      }));
    });
    return () => subscription.unsubscribe();
  }, [watch, workplaceType]);

  const handleRewrite = async (field: 'description' | 'requirements') => {
    const currentText = getValues(field);
    if (!currentText || currentText.length < 10) return;

    const setLoading = field === 'description' ? setIsRewritingDesc : setIsRewritingReqs;
    setLoading(true);

    try {
      const res = await fetch('/api/ai/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentText, field }),
      });
      
      if (!res.ok) throw new Error('AI request failed');
      
      const data = await res.json();
      if (data.rewrittenText) {
        setValue(field, data.rewrittenText, { shouldValidate: true });
      }
    } catch (error) {
      console.error(error);
      // Optional: Show toast error
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: JobFormData) => {
    if (!companyId) {
      setSubmitError("Company profile not found. Please complete onboarding.");
      return;
    }

    if (!locationDetails.address && workplaceType !== 'remote') {
       setSubmitError("Please select a valid location from the search.");
       return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const slug = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

    const jobData = {
      ...data,
      requirements: data.requirements.split('\n').filter(Boolean),
      benefits: data.benefits ? data.benefits.split('\n').filter(Boolean) : [],
      location: locationDetails.address || 'Remote',
      workplace_type: workplaceType,
      location_lat: locationDetails.lat || undefined,
      location_lng: locationDetails.lng || undefined,
      location_place_id: locationDetails.placeId || undefined,
      company_id: companyId,
      slug,
      source: 'employer' as const,
    };

    try {
      await createJob(jobData);
      localStorage.removeItem('job_post_draft'); // Clear draft on success
      router.push('/jobs');
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Failed to post job");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocationSelect = (data: { address: string; lat: number; lng: number; placeId: string }) => {
    setLocationDetails({
      address: data.address,
      lat: data.lat,
      lng: data.lng,
      placeId: data.placeId
    });
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/jobs"
            className="rounded-full p-2 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Post a New Job</h1>
            <p className="text-slate-500 mt-1">Create a compelling job post to attract the best talent.</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
           <Save className="h-4 w-4" />
           Draft saved automatically
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Main Form */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: Basic Info */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-sm">1</span>
              Basic Details
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Job Title <span className="text-red-500">*</span></label>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <JobTitleAutocomplete
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Employment Type</label>
                  <select
                    {...register('type')}
                    className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-all"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="freelance">Freelance</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Salary Range <span className="text-red-500">*</span></label>
                  <input
                    {...register('salary_range')}
                    className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-all"
                    placeholder="e.g. $120k - $160k"
                  />
                  {errors.salary_range && <p className="mt-1 text-sm text-red-600">{errors.salary_range.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Workplace Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'remote', icon: Globe, label: 'Remote' },
                    { id: 'hybrid', icon: Building2, label: 'Hybrid' },
                    { id: 'onsite', icon: MapPin, label: 'On-site' },
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setWorkplaceType(type.id as any)}
                      className={clsx(
                        "flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all hover:bg-slate-50",
                        workplaceType === type.id 
                          ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 ring-1 ring-indigo-600 ring-offset-2" 
                          : "border-slate-100 text-slate-600 hover:border-slate-300"
                      )}
                    >
                      <type.icon className={clsx("h-6 w-6", workplaceType === type.id ? "text-indigo-600" : "text-slate-400")} />
                      <span className="font-medium text-sm">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Location {workplaceType !== 'remote' && <span className="text-red-500">*</span>}
                </label>
                {isLoaded ? (
                  <div className="space-y-4">
                    <LocationSearch onLocationSelect={handleLocationSelect} isLoaded={isLoaded} />
                    
                    {locationDetails.lat && locationDetails.lng && (
                      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                        <GoogleMap
                          mapContainerStyle={mapContainerStyle}
                          center={{ lat: locationDetails.lat, lng: locationDetails.lng }}
                          zoom={14}
                          options={{
                            disableDefaultUI: true,
                            zoomControl: true,
                            streetViewControl: false,
                            mapTypeControl: false,
                          }}
                        >
                          <Marker position={{ lat: locationDetails.lat, lng: locationDetails.lng }} />
                        </GoogleMap>
                      </div>
                    )}
                  </div>
                ) : (
                   <div className="h-12 w-full bg-slate-100 rounded-lg animate-pulse" />
                )}
                {workplaceType === 'remote' && !locationDetails.address && (
                  <p className="mt-2 text-xs text-slate-500">For remote jobs, you can leave this blank or set a specific region (e.g., "Remote (USA Only)").</p>
                )}
              </div>
            </div>
          </section>

          {/* Section 2: Job Details */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
             <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-sm">2</span>
              Job Description
            </h2>

            <div className="space-y-6">
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1">Description <span className="text-red-500">*</span></label>
                <div className="relative">
                  <textarea
                    {...register('description')}
                    rows={8}
                    className="block w-full rounded-lg border border-slate-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-all"
                    placeholder="Describe the role, responsibilities, and team culture..."
                  />
                  <AIRewriteButton onRewrite={() => handleRewrite('description')} isLoading={isRewritingDesc} />
                </div>
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1">Requirements <span className="text-red-500">*</span></label>
                <div className="relative">
                  <textarea
                    {...register('requirements')}
                    rows={6}
                    className="block w-full rounded-lg border border-slate-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-all"
                    placeholder="- 5+ years experience with React&#10;- Strong knowledge of TypeScript&#10;- Experience with Next.js"
                  />
                  <AIRewriteButton onRewrite={() => handleRewrite('requirements')} isLoading={isRewritingReqs} />
                </div>
                <p className="mt-1 text-xs text-slate-500">Enter each requirement on a new line.</p>
                {errors.requirements && <p className="mt-1 text-sm text-red-600">{errors.requirements.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Benefits</label>
                <textarea
                  {...register('benefits')}
                  rows={4}
                  className="block w-full rounded-lg border border-slate-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-all"
                  placeholder="- Competitive salary&#10;- Remote-first culture&#10;- Health insurance"
                />
                <p className="mt-1 text-xs text-slate-500">Enter each benefit on a new line.</p>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column - Sidebar / Review */}
        <div className="space-y-6">
          <div className="sticky top-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Application Method</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Apply Link / Email</label>
                  <input
                    {...register('application_url')}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    placeholder="https://... or mailto:..."
                  />
                  {errors.application_url && <p className="mt-1 text-sm text-red-600">{errors.application_url.message}</p>}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-indigo-50/50 p-6">
              <h3 className="font-semibold text-indigo-900 mb-2">Publishing</h3>
              <p className="text-sm text-indigo-700 mb-4">
                Your job post will be live immediately after publishing. You can edit or close it at any time.
              </p>
              
              {submitError && (
                <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-100">
                  {submitError}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Publish Job
                    </>
                  )}
                </button>
                <Link
                  href="/jobs"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
