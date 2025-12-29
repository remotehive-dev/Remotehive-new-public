import type { ResumeDto, UpdateResumeDto } from "@reactive-resume/dto";
import { useMutation } from "@tanstack/react-query";
import debounce from "lodash.debounce";

import { queryClient } from "@/client/libs/query-client";
import { updateResumeInStorage } from "./local-storage";

export const updateResume = async (data: UpdateResumeDto) => {
  if (!data.id) {
    throw new Error("Resume ID is required for update");
  }

  const updatedResume = updateResumeInStorage(data as Partial<ResumeDto> & { id: string });

  queryClient.setQueryData<ResumeDto>(["resume", { id: updatedResume.id }], updatedResume);

  queryClient.setQueryData<ResumeDto[]>(["resumes"], (cache) => {
    if (!cache) return [updatedResume];
    return cache.map((resume) => {
      if (resume.id === updatedResume.id) return updatedResume;
      return resume;
    });
  });

  return updatedResume;
};

export const debouncedUpdateResume = debounce(updateResume, 500);

export const useUpdateResume = () => {
  const {
    error,
    isPending: loading,
    mutateAsync: updateResumeFn,
  } = useMutation({
    mutationFn: updateResume,
  });

  return { updateResume: updateResumeFn, loading, error };
};
