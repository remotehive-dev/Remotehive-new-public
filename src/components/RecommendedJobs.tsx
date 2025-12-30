import { useEffect, useState } from 'react';
import { useAuthStore } from '../components/resume/client/stores/auth'; // Or wherever auth store is
import { getUserByClerkId, getJobs } from '../lib/api';
import { Job, UserProfile } from '../types'; // Ensure UserProfile is imported/available
import { JobCard } from './JobCard';
import { Sparkles, Loader2, CheckCircle2, MapPin, Briefcase } from 'lucide-react';
import { useUser } from "@clerk/clerk-react";

interface RecommendedJobsProps {
    userProfile?: any; // Avoiding deep type deps for now, but should be UserProfile
}

export function RecommendedJobs({ userProfile }: RecommendedJobsProps) {
    const [recommendations, setRecommendations] = useState<{ job: Job; score: number; reasons: string[] }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchAndScore() {
            if (!userProfile) {
                setIsLoading(false);
                return;
            }

            try {
                // Fetch all jobs to score them client-side (for now, simpler than complex DB query)
                // In production, this should be done via an edge function or specific API endpoint
                const jobs = await getJobs();

                const scored = jobs.map(job => {
                    let score = 0;
                    const reasons: string[] = [];

                    // 1. Skill Match (High Weight)
                    if (userProfile.skills && Array.isArray(userProfile.skills)) {
                        const userSkills = userProfile.skills.map((s: string) => s.toLowerCase());
                        const jobTags = (job.tags || []).map(t => t.toLowerCase());
                        // Also check title keywords against skills
                        const titleWords = job.title.toLowerCase().split(' ');

                        // Check tags
                        const matchingTags = jobTags.filter(tag => userSkills.some((skill: string) => tag.includes(skill) || skill.includes(tag)));
                        if (matchingTags.length > 0) {
                            score += matchingTags.length * 15;
                            reasons.push(`Matches skills: ${matchingTags.slice(0, 2).join(', ')}`);
                        }
                    }

                    // 2. Role Match
                    if (userProfile.headline) {
                        const headlineWords = userProfile.headline.toLowerCase().split(' ');
                        const jobTitle = job.title.toLowerCase();

                        const matches = headlineWords.filter((w: string) => w.length > 3 && jobTitle.includes(w));
                        if (matches.length > 0) {
                            score += 25;
                            reasons.push(`Matches your headline role`);
                        }
                    }

                    // 3. Location Match
                    if (userProfile.city || userProfile.country) {
                        const userLoc = (userProfile.city + ' ' + userProfile.country).toLowerCase();
                        const jobLoc = job.location.toLowerCase();

                        if (jobLoc.includes('remote') || jobLoc.includes('worldwide')) {
                            score += 10;
                            reasons.push('Remote opportunity');
                        } else if (userLoc.includes(jobLoc) || jobLoc.includes(userProfile.city?.toLowerCase() || 'xxxxx')) {
                            score += 20;
                            reasons.push('In your location');
                        }
                    }

                    return { job, score, reasons };
                });

                // Sort by score
                const topMatches = scored
                    .filter(item => item.score > 0) // Only show if there's *some* match
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 3); // Top 3 recommendations

                setRecommendations(topMatches);

            } catch (err) {
                console.error("Failed to generate recommendations", err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchAndScore();
    }, [userProfile]);

    if (!userProfile) return null; // Don't show if not logged in

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (recommendations.length === 0) return null;

    return (
        <div className="mb-10">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Recommended for You</h2>
                    <p className="text-sm text-gray-500 font-medium">Based on your profile and skills</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {recommendations.map(({ job, score, reasons }) => (
                    <div key={job.id} className="relative group">
                        {/* Match Badge */}
                        <div className="absolute -top-3 left-4 z-10 bg-green-100/90 backdrop-blur-sm border border-green-200 text-green-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" />
                            {(Math.min(score, 100))}% Match
                        </div>

                        <div className="h-full transform transition-all duration-300 hover:-translate-y-1">
                            <JobCard job={job} />

                            {/* Match Reasons Footer */}
                            <div className="mt-[-8px] mx-2 bg-slate-50 border-x border-b border-slate-200 rounded-b-xl p-3 text-xs text-slate-600 space-y-1 relative z-0">
                                <p className="font-semibold text-slate-700 mb-1">Why this job matches:</p>
                                {reasons.slice(0, 2).map((reason, i) => (
                                    <div key={i} className="flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                                        <span className="truncate">{reason}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
