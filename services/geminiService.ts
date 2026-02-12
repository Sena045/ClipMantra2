
import { GoogleGenAI, Type } from "@google/genai";
import { Clip, LanguagePreference } from "../types.ts";

/**
 * Uses Gemini to analyze video data and suggest viral clips.
 * Using gemini-3-flash-preview for the best balance of speed and zero-cost limits.
 */
export const generateViralShorts = async (
  context: string, 
  language: LanguagePreference,
  frames?: string[]
): Promise<Clip[]> => {
  // process.env.API_KEY is replaced by Vite during build
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error(
      "API Key Missing: Please set the 'API_KEY' environment variable in your Netlify/Vercel dashboard."
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `You are the ClipMantra AI Specialist. Your goal is to find viral segments.
  - I will provide you with YouTube metadata (title, tags, description) and visual frames.
  - Identify 10-15 segments with high "Retention Potential".
  - For each segment, provide:
    1. start: (MM:SS)
    2. end: (MM:SS)
    3. hook: A punchy headline for the clip.
    4. caption: Engaging social media caption with hashtags.
    5. score: 0-100 virality probability.
    6. reasoning: Briefly why this specific part is viral.
  - Output ONLY valid JSON array of objects.
  - Language: ${language}.`;

  const parts: any[] = [{ text: `YouTube Metadata & Transcript Info: ${context}` }];
  
  if (frames && frames.length > 0) {
    frames.forEach((base64) => {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64.split(',')[1],
        },
      });
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              start: { type: Type.STRING },
              end: { type: Type.STRING },
              hook: { type: Type.STRING },
              caption: { type: Type.STRING },
              score: { type: Type.NUMBER },
              reasoning: { type: Type.STRING }
            },
            required: ["start", "end", "hook", "caption", "score", "reasoning"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    // Handle the specific "Key not found" error that some environments throw
    if (error?.message?.includes('API_KEY')) {
       throw new Error("Configuration Error: The API Key set in Netlify is not being passed correctly to the build. Check your vite.config.ts mapping.");
    }
    throw new Error(error instanceof Error ? error.message : "Failed to process content. Ensure your API Key is valid.");
  }
};
