import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { generateJSON } from './ai';
import { Resume, initialResumeState } from '../types/resume';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export async function extractTextFromDocx(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error("Docx Extraction Error:", error);
    throw new Error("Could not read Word document text.");
  }
}

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`
    });
    
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Improved text extraction logic based on OpenResume concepts
      // We group items by Y coordinate to respect line structure better
      const items = textContent.items as any[];
      
      // Sort items by Y (descending) then X (ascending)
      items.sort((a, b) => {
        if (Math.abs(a.transform[5] - b.transform[5]) > 5) {
          return b.transform[5] - a.transform[5]; // Top to bottom
        }
        return a.transform[4] - b.transform[4]; // Left to right
      });

      let lastY = -1;
      let pageText = '';
      
      for (const item of items) {
        const y = item.transform[5];
        if (lastY !== -1 && Math.abs(y - lastY) > 5) {
          pageText += '\n';
        } else if (pageText.length > 0 && !pageText.endsWith('\n')) {
          pageText += ' ';
        }
        pageText += item.str;
        lastY = y;
      }
      
      fullText += pageText + '\n\n';
    }

    return fullText;
  } catch (error) {
    console.error("PDF Extraction Error:", error);
    throw new Error("Could not read PDF text. Please ensure the file is a valid text-based PDF.");
  }
}

export async function parseResumeWithAI(text: string): Promise<Resume> {
  const prompt = `
    You are an expert resume parser. Extract the following details from the resume text below and return them in a strict JSON format matching the structure provided.
    
    Structure to match (TypeScript interface):
    interface Resume {
      profile: {
        name: string;
        email: string;
        phone: string;
        url: string; // LinkedIn or Portfolio
        summary: string;
        location: string;
      };
      workExperiences: {
        company: string;
        jobTitle: string;
        date: string;
        descriptions: string[]; // Bullet points
      }[];
      educations: {
        school: string;
        degree: string;
        date: string;
        gpa: string;
        descriptions: string[];
      }[];
      projects: {
        project: string; // Project Name
        date: string;
        descriptions: string[];
      }[];
      skills: {
        featuredSkills: { skill: string; rating: number }[]; // Extract top 6 skills, default rating to 4
        descriptions: string[]; // Other skills categories as strings
      };
    }

    Resume Text:
    ${text.slice(0, 15000)} 
    
    Return ONLY valid JSON. No markdown, no explanations. Ensure all fields are present, use empty strings or arrays if data is missing.
  `;

  try {
    const parsedData = await generateJSON<any>(
      prompt,
      "You are a helpful assistant that extracts structured data from resumes."
    );

    // Merge with initial state to ensure structure
    return {
      ...initialResumeState,
      ...parsedData,
      profile: { ...initialResumeState.profile, ...parsedData.profile },
      skills: { ...initialResumeState.skills, ...parsedData.skills },
    };
  } catch (error) {
    console.error("AI Parsing Error:", error);
    throw error;
  }
}
