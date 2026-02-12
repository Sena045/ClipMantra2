
import { GoogleGenAI, Type } from "@google/genai";
import { Clip, LanguagePreference } from "../types.ts";

/**
 * Uses Gemini to analyze video data and suggest viral clips.
 */
export const generateViralShorts = async (
  context: string, 
  language: LanguagePreference,
  frames?: string[]
): Promise<Clip[]> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined") {
    throw new Error(
      "API_KEY is missing. Please go to your Hosting Dashboard (Netlify/Vercel) -> Site Settings -> Environment Variables and add 'API_KEY' with your Google AI Studio key."
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
    6. reasoning: Briefly why this specific part is viral (e.g., "emotional peak", "key advice", "visual transition").
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
    parts.push({ text: "The images above are sequential frames. Use them to verify visual engagement peaks." });
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
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to process content. Ensure your API Key is valid.");
  }
};
