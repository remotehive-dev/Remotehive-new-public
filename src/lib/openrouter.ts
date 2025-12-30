import OpenAI from "openai";

const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const BASE_URL = "https://openrouter.ai/api/v1";

if (!API_KEY) {
  console.warn("OpenRouter API Key is missing!");
}

export const openai = new OpenAI({
  apiKey: API_KEY,
  baseURL: BASE_URL,
  dangerouslyAllowBrowser: true, // Required for client-side usage
});

export async function generateResumeContent(
  section: "summary" | "experience" | "skills",
  data: any
) {
  let prompt = "";

  switch (section) {
    case "summary":
      prompt = `
        Create a professional resume summary for a ${data.role || "professional"} 
        with the following background: ${JSON.stringify(data)}. 
        Keep it concise, impactful, and under 50 words.
      `;
      break;
    case "experience":
      prompt = `
        Enhance the following job description for a resume bullet point. 
        Make it action-oriented, quantifiable, and professional:
        "${data.description}"
      `;
      break;
    case "skills":
      prompt = `
        Suggest 5 key technical skills for a ${data.role} based on this background:
        ${JSON.stringify(data)}. Return only the skills as a comma-separated list.
      `;
      break;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "mistralai/mistral-7b-instruct", // Free/Cheap OSS model
      messages: [
        { role: "system", content: "You are an expert resume writer." },
        { role: "user", content: prompt },
      ],
    });

    return completion.choices[0]?.message?.content?.trim() || "";
  } catch (error) {
    console.error("AI Generation Error:", error);
    return null;
  }
}
