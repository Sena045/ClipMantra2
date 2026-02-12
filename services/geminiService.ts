
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Clip, LanguagePreference } from "../types.ts";

/**
 * Uses Gemini to analyze video data and suggest viral clips.
 * Using gemini-3-pro-preview for the best balance of reasoning depth and multimodal understanding.
 */
export const generateViralShorts = async (
  context: string, 
  language: LanguagePreference,
  frames?: string[]
): Promise<Clip[]> => {
  // Initialize the Gemini API client directly with the environment variable as per guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `You are a World-Class Short-Form Content Strategist specializing in YouTube Shorts, TikTok, and Instagram Reels. 
  Your goal is to extract the most psychologically compelling segments from a video.

  - Language Output: ${language}.
  - Target Audience: High-engagement viewers who value high-density information or high-emotion storytelling.

  CRITICAL GUIDELINES FOR WORDING:
  1. hook (Headline): 
     - Use "Pattern Interrupts". 
     - Create a "Curiosity Gap" (e.g., "The exact moment everything changed..." or "Why 99% of creators fail at this...").
     - Keep it under 10 words. Bold, punchy, and aggressive.
     - NO generic titles like "Tips for success".
  
  2. caption (Social Post):
     - Start with a "scroll-stopper" first line.
     - Use a "Problem-Agitate-Solution" (PAS) or "Curiosity Loop" structure.
     - Include 3-5 high-traffic, niche-relevant hashtags.
     - Use emojis sparingly but effectively to emphasize points.
  
  3. reasoning (Strategy):
     - Explain the "Retention Trigger" (e.g., "High-stakes revelation," "Conflict resolution," or "Unexpected visual change").
     - Why would someone watch this 3 times?

  - Identify 5-10 elite segments.
  - Output ONLY a valid JSON array of objects.`;

  const parts: any[] = [{ text: `YouTube Metadata & Visual Context: ${context}` }];
  
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
    // Calling generateContent with gemini-3-pro-preview for high-quality reasoning and multimodal analysis.
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              start: { type: Type.STRING, description: "MM:SS format" },
              end: { type: Type.STRING, description: "MM:SS format" },
              hook: { type: Type.STRING, description: "Ultra-punchy viral headline" },
              caption: { type: Type.STRING, description: "Engaging social post with retention hooks" },
              score: { type: Type.NUMBER, description: "0-100 virality probability" },
              reasoning: { type: Type.STRING, description: "Strategic explanation of retention" }
            },
            required: ["start", "end", "hook", "caption", "score", "reasoning"]
          }
        }
      }
    });

    // Extracting text as a property from GenerateContentResponse as per guidelines.
    return JSON.parse(response.text || "[]");
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to process content.");
  }
};
