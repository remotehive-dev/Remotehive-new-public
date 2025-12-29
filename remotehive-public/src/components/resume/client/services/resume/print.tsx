import { t } from "@lingui/macro";
import type { UrlDto } from "@reactive-resume/dto";
import { useMutation } from "@tanstack/react-query";

import { toast } from "@/client/hooks/use-toast";

export const printResume = async (data: { id: string }) => {
  // Return the local URL to the artboard
  // We use window.location.origin to ensure absolute URL if needed, or relative.
  // The ExportSection uses window.open(url, "_blank"), so relative works if base is same.
  // But usually it expects a full URL or relative.
  // Let's use relative.
  return { url: `/resume/artboard?resumeId=${data.id}&print=true` } as UrlDto;
};

export const usePrintResume = () => {
  const {
    error,
    isPending: loading,
    mutateAsync: printResumeFn,
  } = useMutation({
    mutationFn: printResume,
    onError: (error) => {
      const message = error.message;

      toast({
        variant: "error",
        title: t`Oops, the server returned an error.`,
        description: message,
      });
    },
  });

  return { printResume: printResumeFn, loading, error };
};
