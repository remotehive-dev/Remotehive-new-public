import type { ResumeDto } from "@reactive-resume/dto";

import { getResumeFromStorage } from "./local-storage";

export const findResumeById = async (data: { id: string }) => {
  const resume = getResumeFromStorage(data.id);
  if (!resume) throw new Error("Resume not found");
  return resume;
};

export const findResumeByUsernameSlug = async (data: { username: string; slug: string }) => {
  throw new Error("Public resumes not supported in local mode");
};
