import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { findResumeById } from "@/client/services/resume";
import { useResumeStore } from "@/client/stores/resume";
import { BuilderPage } from "@/client/pages/builder/page";

export const ResumeLoader = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchResume = async () => {
      try {
        const resume = await findResumeById({ id });
        useResumeStore.setState({ resume });
        useResumeStore.temporal.getState().clear();
        setLoading(false);
      } catch (e) {
        navigate("/dashboard/resume-builder");
      }
    };

    fetchResume();
  }, [id, navigate]);

  if (loading) return <div className="flex h-screen items-center justify-center">Loading resume...</div>;

  return <BuilderPage />;
};
