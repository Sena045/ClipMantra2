
import { GoogleGenAI, Type } from "@google/genai";

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  try {
    if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers };
    if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };

    const body = JSON.parse(event.body || "{}");
    const { filename, language, frames = [] } = body;

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API Key missing in environment variables");
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Server Configuration Error: API Key missing" }) };
    }

    /* Create new instance right before call as per guidelines */
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are an expert Viral Video Strategist and Psychologist.
Your task is to analyze video frames from "${filename}" and identify high-engagement segments.
Segments MUST:
1. Have a strong "hook" (an attention-grabbing start).
2. Be 30-45 seconds in duration.
3. Target the ${language} speaking audience.
4. Be algorithmically optimized for TikTok, Reels, and YouTube Shorts.

Return ONLY a JSON array of 8 objects. Ensure timestamps (start/end) are realistic for a standard length video.`;

    /* Fixed typo generatceContent -> generateContent and upgraded to gemini-3-pro-preview for reasoning task */
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          { text: `Analyze the attached frames and generate viral clip segments. Language: ${language}.` },
          ...frames.slice(0, 8).map((f) => {
            const base64Data = f.includes(",") ? f.split(",")[1] : f;
            return {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Data
              }
            };
          })
        ]
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              start: { type: Type.STRING, description: "Start time in MM:SS format" },
              end: { type: Type.STRING, description: "End time in MM:SS format" },
              hook: { type: Type.STRING, description: "The attention-grabbing hook text" },
              caption: { type: Type.STRING, description: "A viral caption for the clip" },
              score: { type: Type.NUMBER, description: "Viral impact score from 0-100" },
              reasoning: { type: Type.STRING, description: "Brief psychological reasoning" },
              duration: { type: Type.STRING, description: "Duration string (e.g. '35s')" }
            },
            required: ["start", "end", "hook", "caption", "score", "reasoning", "duration"],
            propertyOrdering: ["start", "end", "hook", "caption", "score", "reasoning", "duration"]
          }
        }
      }
    });

    if (!response.candidates?.[0]) {
      throw new Error("AI Engine returned no candidates. Please try again.");
    }

    /* Accessing text property directly as per guidelines */
    const output = response.text;
    if (!output) {
      throw new Error("AI Engine returned an empty response.");
    }

    return { 
      statusCode: 200, 
      headers, 
      body: output 
    };
  } catch (error) {
    console.error("Gemini Function Error:", error);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ 
        error: error.message || "Viral Engine encountered a latency error.",
        type: "AI_PIPELINE_ERROR"
      }) 
    };
  }
};
