import { t } from "@lingui/macro";
import { SparkleIcon } from "@phosphor-icons/react";
import { cn } from "@reactive-resume/utils";
import { useNavigate } from "react-router";

import { useCreateResume } from "@/client/services/resume";

import { BaseCard } from "./base-card";

export const BuildWithAICard = () => {
  const navigate = useNavigate();
  const { createResume, loading } = useCreateResume();

  const onBuildWithAI = async () => {
    const resume = await createResume({
      title: "AI Generated Resume",
      slug: "ai-generated-resume-" + Math.random().toString(36).substring(7),
      visibility: "private",
    });

    navigate(`/builder/${resume.id}?view=ai`);
  };

  return (
    <BaseCard onClick={onBuildWithAI} className={cn(loading && "opacity-50 pointer-events-none")}>
      <SparkleIcon size={64} weight="thin" />

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end space-y-0.5 p-4 pt-12",
          "bg-gradient-to-t from-background/80 to-transparent",
        )}
      >
        <h4 className="font-medium">{t`Build with AI`}</h4>
        <p className="text-xs opacity-75">{t`Create a resume using AI chat`}</p>
      </div>
    </BaseCard>
  );
};
