import { ResumeDto } from "@reactive-resume/dto";
import { defaultResumeData } from "@reactive-resume/schema";
import { createId } from "@paralleldrive/cuid2";

const RESUMES_KEY = "reactive-resume-v4-resumes";

export const getResumesFromStorage = (): ResumeDto[] => {
  try {
    const data = localStorage.getItem(RESUMES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveResumesToStorage = (resumes: ResumeDto[]) => {
  localStorage.setItem(RESUMES_KEY, JSON.stringify(resumes));
};

export const createResumeInStorage = (title: string, slug?: string): ResumeDto => {
  const resumes = getResumesFromStorage();
  const id = createId();
  const now = new Date().toISOString();
  
  const newResume: ResumeDto = {
    id,
    title,
    slug: slug || title.toLowerCase().replace(/ /g, "-"),
    data: defaultResumeData,
    visibility: "private",
    locked: false,
    userId: "local-user",
    createdAt: now as any,
    updatedAt: now as any,
    user: {
      id: "local-user",
      name: "Local User",
      email: "local@user.com",
      username: "localuser",
      picture: "",
      provider: "email",
      locale: "en-US",
      emailVerified: true,
      twoFactorEnabled: false,
      createdAt: now as any,
      updatedAt: now as any,
    }
  };

  resumes.push(newResume);
  saveResumesToStorage(resumes);
  return newResume;
};

export const updateResumeInStorage = (data: Partial<ResumeDto> & { id: string }): ResumeDto => {
  const resumes = getResumesFromStorage();
  const index = resumes.findIndex((r) => r.id === data.id);
  
  if (index === -1) {
    throw new Error("Resume not found");
  }

  const updatedResume = {
    ...resumes[index],
    ...data,
    updatedAt: new Date().toISOString() as any,
  };

  resumes[index] = updatedResume;
  saveResumesToStorage(resumes);
  return updatedResume;
};

export const deleteResumeInStorage = (id: string) => {
  const resumes = getResumesFromStorage();
  const filtered = resumes.filter((r) => r.id !== id);
  saveResumesToStorage(filtered);
};

export const getResumeFromStorage = (id: string): ResumeDto | null => {
  const resumes = getResumesFromStorage();
  return resumes.find((r) => r.id === id) || null;
};
