import { ResumesPage } from "@/client/pages/dashboard/resumes/page";
import { ResumeProviders } from "./ResumeProviders";

export const ResumeBuilder = () => {
  return (
    <ResumeProviders>
      <div className="p-6">
        <ResumesPage />
      </div>
    </ResumeProviders>
  );
};
