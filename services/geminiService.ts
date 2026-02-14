
import { GoogleGenAI, Type } from "@google/genai";
import { Clip, LanguagePreference } from "../types";

export const generateViralShorts = async (
  filename: string, 
  language: LanguagePreference, 
  frames: string[]
): Promise<Clip[]> => {
  /* Create instance right before use to ensure latest API key is picked up */
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Act as a Viral Content Psychologist.
  Analyze these ${frames.length} frames from "${filename}" to identify the top 8 viral peaks.
  Target Language: ${language}
  Constraint: Each segment must be 30-45 seconds long.
  Identify: Timestamps (MM:SS), Hook, Caption, Impact Score (0-100), Reasoning.`;

  const makeRequest = async () => {
    return await ai.models.generateContent({
      /* Using gemini-3-flash-preview to match the UI's 'Flash Engine' description and for efficiency */
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: prompt },
          ...frames.map(frame => ({
            inlineData: {
              mimeType: "image/jpeg",
              data: frame.split(',')[1]
            }
          }))
        ]
      },
      config: {
        systemInstruction: "You are a professional video analyst. You output strictly JSON array. Identify exactly 8 segments that are 30-45s long based on the visual flow provided.",
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
              reasoning: { type: Type.STRING },
              duration: { type: Type.STRING }
            },
            required: ["start", "end", "hook", "caption", "score", "reasoning", "duration"]
          }
        }
      },
    });
  };

  try {
    const response = await makeRequest();
    /* response.text is a getter property, not a function */
    const jsonStr = response.text || "[]";
    return JSON.parse(jsonStr.trim());
  } catch (error: any) {
    console.error("Gemini Engine Error:", error);
    
    // Reset key selection if the project entity is missing/invalid
    if (error.message?.includes('Requested entity was not found')) {
       throw new Error("The selected API project was not found. Please re-select your key.");
    }
    
    if (error.message?.includes('429') || error.message?.includes('capacity')) {
       throw new Error("AI Engine is currently at peak capacity. Wait 15 seconds and try again.");
    }
    
    throw new Error(error.message || "Viral Engine encountered a latency error. Please retry.");
  }
};
