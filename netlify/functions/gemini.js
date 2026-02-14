
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
    if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: "Missing API Configuration" }) };

    /* Always create a new instance right before making an API call */
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      /* Using gemini-3-flash-preview to match the UI's 'Flash Engine' description */
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { text: `Scan: "${filename}" (${language}). Extract 8 high-impact segments (30-45s each). Return JSON.` },
          ...frames.slice(0, 8).map((f) => ({
            inlineData: {
              mimeType: "image/jpeg",
              data: f.split(",")[1]
            }
          }))
        ]
      },
      config: {
        systemInstruction: "Professional Video Psychologist. Return JSON array of 8 segments.",
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
      }
    });

    /* Use response.text directly as it is a getter */
    return { statusCode: 200, headers, body: response.text };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "AI Engine capacity reached." }) };
  }
};
