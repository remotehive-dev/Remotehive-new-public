import { UserProfile } from "./api";

/**
 * Calculates the profile completion score based on filled fields.
 * 
 * Weights:
 * - Basic Info (Name, Email, Phone, Location): 25%
 * - Professional Info (Headline, Bio, LinkedIn/Portfolio): 25%
 * - Skills & Experience: 25%
 * - Preferences & Resume: 25%
 */
export function calculateProfileScore(profile: UserProfile): number {
  let score = 0;

  // 1. Basic Info (25%)
  if (profile.full_name) score += 10;
  if (profile.email) score += 5;
  if (profile.phone) score += 5;
  if (profile.city || profile.country) score += 5;

  // 2. Professional Info (25%)
  if (profile.headline) score += 10;
  if (profile.bio && profile.bio.length > 50) score += 10;
  if (profile.linkedin_url || profile.portfolio_url) score += 5;

  // 3. Skills & Experience (25%)
  if (profile.skills && profile.skills.length > 0) score += 10;
  if (profile.work_experience && profile.work_experience.length > 0) score += 10;
  if (profile.education && profile.education.length > 0) score += 5;

  // 4. Preferences & Resume (25%)
  if (profile.resume_url) score += 15;
  if (profile.job_preferences) score += 5;
  if (profile.interests && profile.interests.length > 0) score += 5;

  return Math.min(score, 100);
}

export function getMissingMandatoryFields(profile: UserProfile): string[] {
  const missing: string[] = [];
  
  if (!profile.full_name) missing.push("Full Name");
  if (!profile.phone) missing.push("Phone Number");
  if (!profile.city || !profile.country) missing.push("Location");
  if (!profile.headline) missing.push("Professional Headline");
  if (!profile.skills || profile.skills.length === 0) missing.push("Skills");
  if (!profile.resume_url) missing.push("Resume");

  return missing;
}
