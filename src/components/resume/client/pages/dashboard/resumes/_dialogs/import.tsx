import { zodResolver } from "@hookform/resolvers/zod";
import { t } from "@lingui/macro";
import { createId } from "@paralleldrive/cuid2";
import { CheckIcon, DownloadSimpleIcon, FileDocIcon, FilePdfIcon, FileTextIcon } from "@phosphor-icons/react";
import type { JsonResume, LinkedIn, ReactiveResumeV3 } from "@reactive-resume/parser";
import {
  JsonResumeParser,
  LinkedInParser,
  ReactiveResumeParser,
  ReactiveResumeV3Parser,
} from "@reactive-resume/parser";
import type { ResumeData } from "@reactive-resume/schema";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Label,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@reactive-resume/ui";
import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z, ZodError } from "zod";

import { useToast } from "@/client/hooks/use-toast";
import { useImportResume } from "@/client/services/resume/import";
import { useDialog } from "@/client/stores/dialog";
import { extractTextFromDocx, extractTextFromPDF, parseResumeWithAI } from "@/lib/resumeParser";
import { Resume } from "@/types/resume";

const formSchema = z.object({
  file: z.instanceof(File),
  type: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

type ValidationResult =
  | {
      isValid: false;
      errors: string;
    }
  | {
      isValid: true;
      result: ResumeData | ReactiveResumeV3 | LinkedIn | JsonResume;
    };

const mapAIResumeToResumeData = (ai: Resume): ResumeData => {
  const basics = {
    name: ai.profile.name,
    email: ai.profile.email,
    phone: ai.profile.phone,
    url: { label: "Portfolio", href: ai.profile.url },
    summary: ai.profile.summary,
    location: ai.profile.location,
    headline: "",
    image: { url: "", size: 0, aspectRatio: 0, borderRadius: 0, effects: { hidden: false, border: false, grayscale: false } },
    customFields: [],
  };

  return {
    basics,
    sections: {
      summary: { name: "Summary", columns: 1, visible: true, id: "summary", content: ai.profile.summary },
      experience: {
        name: "Experience",
        columns: 1,
        visible: true,
        id: "experience",
        items: ai.workExperiences.map((w) => ({
          id: createId(),
          visible: true,
          company: w.company,
          position: w.jobTitle,
          location: "",
          date: w.date,
          summary: w.descriptions.join("\n"),
          url: { label: "", href: "" },
        })),
      },
      education: {
        name: "Education",
        columns: 1,
        visible: true,
        id: "education",
        items: ai.educations.map((e) => ({
          id: createId(),
          visible: true,
          institution: e.school,
          studyType: e.degree,
          area: "",
          score: e.gpa,
          date: e.date,
          summary: e.descriptions.join("\n"),
          url: { label: "", href: "" },
        })),
      },
      projects: {
        name: "Projects",
        columns: 1,
        visible: true,
        id: "projects",
        items: ai.projects.map((p) => ({
          id: createId(),
          visible: true,
          name: p.project,
          description: "",
          date: p.date,
          summary: p.descriptions.join("\n"),
          keywords: [],
          url: { label: "", href: "" },
        })),
      },
      skills: {
        name: "Skills",
        columns: 1,
        visible: true,
        id: "skills",
        items: ai.skills.featuredSkills.map((s) => ({
          id: createId(),
          visible: true,
          name: s.skill,
          description: "",
          level: s.rating,
          keywords: [],
        })),
      },
      awards: { name: "Awards", columns: 1, visible: true, id: "awards", items: [] },
      certifications: { name: "Certifications", columns: 1, visible: true, id: "certifications", items: [] },
      interests: { name: "Interests", columns: 1, visible: true, id: "interests", items: [] },
      languages: { name: "Languages", columns: 1, visible: true, id: "languages", items: [] },
      volunteer: { name: "Volunteering", columns: 1, visible: true, id: "volunteer", items: [] },
      publications: { name: "Publications", columns: 1, visible: true, id: "publications", items: [] },
      references: { name: "References", columns: 1, visible: true, id: "references", items: [] },
      custom: {},
      profiles: { name: "Profiles", columns: 1, visible: true, id: "profiles", items: [] },
    },
    metadata: {
      template: "rhyhorn",
      layout: [[["summary", "experience", "education", "projects", "skills"], []]],
      css: { value: "", visible: false },
      page: { margin: 18, format: "a4", options: { breakLine: true, pageNumbers: true } },
      theme: { background: "#ffffff", text: "#000000", primary: "#f43f5e" },
      typography: { font: { family: "IBM Plex Sans", subset: "latin", variants: ["regular"], size: 14 }, lineHeight: 1.5, hideIcons: false, underlineLinks: true },
      notes: "",
    },
  } as unknown as ResumeData;
};

export const ImportDialog = () => {
  const { toast } = useToast();
  const { isOpen, close } = useDialog("import");
  const { importResume, loading } = useImportResume();

  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "pdf",
    },
  });

  useEffect(() => {
    if (isOpen) onReset();
  }, [isOpen]);

  const onValidate = async () => {
    try {
      setIsParsing(true);
      const { file, type } = formSchema.parse(form.getValues());
      const fileType = type.toLowerCase();

      if (fileType === "pdf") {
        const text = await extractTextFromPDF(file);
        const aiResult = await parseResumeWithAI(text);
        const result = mapAIResumeToResumeData(aiResult);
        setValidationResult({ isValid: true, result });
      } else if (fileType === "docx" || fileType === "doc") {
        const text = await extractTextFromDocx(file);
        const aiResult = await parseResumeWithAI(text);
        const result = mapAIResumeToResumeData(aiResult);
        setValidationResult({ isValid: true, result });
      } else if (fileType === "other") {
        // Fallback to text parsing if possible or error
        // For now, let's treat it as PDF or just fail
        throw new Error("Other formats not yet supported for direct parsing. Please convert to PDF or Word.");
      } else {
        throw new Error("Unsupported file type");
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        errors: error instanceof Error ? error.message : String(error),
      });

      toast({
        variant: "error",
        title: t`An error occurred while parsing the file.`,
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsParsing(false);
    }
  };

  const onImport = async () => {
    if (!validationResult?.isValid) return;

    try {
      const { result } = validationResult;
      
      let data: ResumeData;

      if ("basics" in result && "sections" in result) {
         data = result as ResumeData;
      } else {
         // Fallback
         data = result as ResumeData;
      }

      await importResume({ data });
      close();
    } catch (error: unknown) {
      toast({
        variant: "error",
        title: t`Oops, the server returned an error.`,
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const onReset = () => {
    form.reset();
    setValidationResult(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent>
        <Form {...form}>
          <form className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                <div className="flex items-center space-x-2.5">
                  <DownloadSimpleIcon />
                  <h2>{t`Import an existing resume`}</h2>
                </div>
              </DialogTitle>
              <DialogDescription>
                {t`Select file type and upload to import.`}
              </DialogDescription>
            </DialogHeader>

            <FormField
              name="type"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t`Import Format`}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="docx">Word (DOCX)</SelectItem>
                      <SelectItem value="doc">Word (DOC)</SelectItem>
                      <SelectItem value="other">Other Format</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="file"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t`File`}</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept={
                        form.watch("type") === "pdf"
                          ? ".pdf"
                          : form.watch("type") === "docx"
                          ? ".docx"
                          : form.watch("type") === "doc"
                          ? ".doc"
                          : undefined
                      }
                      onChange={(event) => {
                        if (!event.target.files?.length) return;
                        field.onChange(event.target.files[0]);
                        setValidationResult(null); // Reset on new file
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {validationResult?.isValid === false && (
              <div className="space-y-2">
                <Label className="text-error">{t`Errors`}</Label>
                <ScrollArea orientation="vertical" className="h-[180px]">
                  <div className="whitespace-pre-wrap rounded bg-secondary-accent p-4 font-mono text-xs leading-relaxed">
                    {validationResult.errors}
                  </div>
                </ScrollArea>
              </div>
            )}

            <DialogFooter>
              <AnimatePresence presenceAffectsLayout>
                {!validationResult && (
                  <Button type="button" onClick={onValidate} disabled={isParsing}>
                    {isParsing ? t`Parsing...` : t`Validate`}
                  </Button>
                )}

                {validationResult !== null && !validationResult.isValid && (
                  <Button type="button" variant="secondary" onClick={onReset}>
                    {t`Discard`}
                  </Button>
                )}

                {validationResult !== null && validationResult.isValid && (
                  <>
                    <Button type="button" disabled={loading} onClick={onImport}>
                      {t`Import`}
                    </Button>

                    <Button disabled type="button" variant="success">
                      <CheckIcon size={16} weight="bold" className="mr-2" />
                      {t`Validated`}
                    </Button>
                  </>
                )}
              </AnimatePresence>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
