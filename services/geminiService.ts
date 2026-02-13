
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Clip, LanguagePreference } from "../types.ts";

/**
 * Uses Gemini to analyze video data and suggest viral clips.
 * Optimized for high-retention, narrative-driven segments (30-60s).
 */
export const generateViralShorts = async (
  context: string, 
  language: LanguagePreference,
  frames?: string[]
): Promise<Clip[]> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("API_KEY_REQUIRED");
  }

  // Create instance right before call to use the most up-to-date runtime injected key
  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `You are a World-Class Short-Form Content Strategist. Your goal is to identify segments from raw video footage that maximize "Watch Time" and "Engagement Rate".

  - Language: ${language}.
  - Target Platform: TikTok, Reels, YouTube Shorts.
  - Core Strategy: The "Golden Minute" (30-60 seconds of high-value narrative).

  CLIP EXTRACTION GUIDELINES:
  1. DURATION: Prioritize segments between 30 and 60 seconds. We want complete "Value Loops" or "Story Beats".
  2. HOOK: Must be an aggressive pattern interrupt. Use curiosity gaps (e.g., "The mistake costing you...", "This is why you're not..."). Max 7 words.
  3. CAPTION: Write a high-converting post copy. Use bullet points for value and a "Loop Hook" at the end.
  4. SCORE: Estimate the probability of going viral (0-100) based on emotional intensity and clarity.
  5. REASONING: Explain the "Retention Strategy" (e.g., "Value Bomb at 0:20", "Controversial Take").

  - Target: 4 to 6 premium clips.
  - Output: Strict JSON array of objects only.`;

  const parts: any[] = [{ text: `Context/Metadata: ${context}\nAnalyze these frames to understand the visual rhythm and subject matter.` }];
  
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
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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
              hook: { type: Type.STRING, description: "Viral Headline" },
              caption: { type: Type.STRING, description: "Social Media Caption" },
              score: { type: Type.NUMBER, description: "Virality Score 0-100" },
              reasoning: { type: Type.STRING, description: "Retention logic explanation" }
            },
            required: ["start", "end", "hook", "caption", "score", "reasoning"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No analysis returned from AI.");
    return JSON.parse(text.trim());
  } catch (error: any) {
    console.error("Gemini AI Error:", error);
    
    // Handle specific API reset errors
    if (error.message?.includes('entity was not found') || error.message?.includes('API key')) {
       throw new Error("API_RESET");
    }
    
    if (error.message?.includes('429')) {
      throw new Error("Free Tier Busy. Please retry in 60s.");
    }
    throw new Error(error instanceof Error ? error.message : "Analysis failed.");
  }
};
