import type { ResumeDto } from "@reactive-resume/dto";
import { useQuery } from "@tanstack/react-query";

import { RESUMES_KEY } from "@/client/constants/query-keys";
import { getResumesFromStorage } from "./local-storage";

export const fetchResumes = async () => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return getResumesFromStorage();
};

export const useResumes = () => {
  const {
    error,
    isPending: loading,
    data: resumes,
  } = useQuery({
    queryKey: RESUMES_KEY,
    queryFn: fetchResumes,
  });

  return { resumes, loading, error };
};
