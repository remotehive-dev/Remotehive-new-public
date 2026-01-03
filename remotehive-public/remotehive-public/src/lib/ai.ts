import OpenAI from 'openai';

export const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "";
export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// Using the free tier model as requested
// Model ID: openai/gpt-oss-20b:free
export const DEFAULT_MODEL = "openai/gpt-oss-20b:free";

const httpReferer = typeof window !== "undefined" ? window.location.origin : undefined;
const openRouterHeaders = {
  ...(httpReferer ? { "HTTP-Referer": httpReferer } : {}),
  "X-Title": "RemoteHive",
};

export const aiClient = new OpenAI({
  baseURL: OPENROUTER_BASE_URL,
  apiKey: OPENROUTER_API_KEY,
  dangerouslyAllowBrowser: true,
  defaultHeaders: openRouterHeaders,
});

export interface AIResponse {
  content: string;
  raw: any;
}

/**
 * Generate text completion using the configured AI model
 */
export async function generateText(
  prompt: string, 
  systemPrompt: string = "You are a helpful AI assistant.",
  model: string = DEFAULT_MODEL
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("Missing OpenRouter API Key");
  }

  try {
    const completion = await aiClient.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
    });

    return completion.choices[0].message.content || "";
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error(String(error));
  }
}

/**
 * Generate structured JSON output using the configured AI model
 * Note: Not all models support strict JSON mode, so we may need to parse manually
 */
export async function generateJSON<T>(
  prompt: string,
  systemPrompt: string = "You are a helpful AI assistant that outputs JSON.",
  model: string = DEFAULT_MODEL
): Promise<T> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("Missing OpenRouter API Key");
  }

  const jsonSystemPrompt = `${systemPrompt}\n\nIMPORTANT: Return ONLY valid JSON. No markdown formatting, no code blocks, no explanations.`;

  try {
    const completion = await aiClient.chat.completions.create({
      model,
      messages: [
        { role: "system", content: jsonSystemPrompt },
        { role: "user", content: prompt }
      ],
      // We can try enabling response_format for models that support it
      // response_format: { type: "json_object" } 
    });

    const content = completion.choices[0].message.content || "{}";
    
    // Clean up potential markdown code blocks if the model ignores instructions
    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
    
    return JSON.parse(cleanContent) as T;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error(String(error));
  }
}
