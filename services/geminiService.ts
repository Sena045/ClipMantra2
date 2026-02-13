
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Clip, LanguagePreference } from "../types.ts";

/**
 * Uses Gemini to analyze video data and suggest viral clips.
 * Using gemini-flash-lite-latest for maximum free-tier quota and reliability.
 */
export const generateViralShorts = async (
  context: string, 
  language: LanguagePreference,
  frames?: string[]
): Promise<Clip[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `You are an elite Short-Form Content Architect. Your mission is to extract high-value, longer-form segments from raw footage that maximize watch time and user attraction.

  - Language Output: ${language}.
  - Core Strategy: Narrative Retention (Story Arcs, Deep Value Dives, Emotional Payoffs).

  CRITICAL ENGAGEMENT DIRECTIVES:
  1. DURATION TARGET: Aim for clips between 30 to 60 seconds. Longer clips are preferred if they contain a complete thought, a full tutorial step, or a dramatic build-up.
  2. hook (The Bait): 
     - Must be a "Mental Loop" or "High-Stakes Question".
     - Examples: "The reason 99% of people fail at...", "I spent 100 hours learning this so you don't have to...", "This one shift changed everything."
     - Max 7 words. Use aggressive, high-contrast wording.
  
  3. caption (The Retention Post):
     - Focus on the "Transformation" or "The Secret".
     - Line 1: The "Punch".
     - Line 2-4: Deep dive bullet points or a compelling "Why".
     - Include 3-5 trending hashtags.
  
  4. reasoning (The Viral Logic):
     - Identify "Long-Form Triggers": (e.g., "Educational Depth", "Slow-Burn Suspense", "In-Depth Tutorial", "Complex Storytelling").
     - Explain why a longer duration is necessary for this specific moment to land with impact.

  - Target: 4-6 high-retention, longer-form highlights.
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
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
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
              reasoning: { type: Type.STRING, description: "Strategic explanation of why this longer segment attracts users" }
            },
            required: ["start", "end", "hook", "caption", "score", "reasoning"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    if (error.message?.includes('429') || error.status === 'RESOURCE_EXHAUSTED') {
      throw new Error("Free Tier Quota Exceeded. Please wait 60 seconds and try again.");
    }
    throw new Error(error instanceof Error ? error.message : "Failed to process content.");
  }
};
