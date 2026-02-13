import { GoogleGenAI, Type } from "@google/genai";

export const handler = async (event) => {
  // CORS Headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  try {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 204, headers };
    }

    if (event.httpMethod !== "POST") {
      return { 
        statusCode: 405, 
        headers,
        body: JSON.stringify({ error: "Method Not Allowed" }) 
      };
    }

    const body = JSON.parse(event.body || "{}");
    const { filename, language, frames = [] } = body;

    // Use up to 3 frames to stay within Netlify's 6MB payload limit and processing time
    const limitedFrames = Array.isArray(frames) ? frames.slice(0, 3) : [];

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "API_KEY is missing. Check Netlify Environment Variables." })
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    // Using gemini-3-flash-preview for the best balance of speed and logic
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { text: `Analyze these frames from "${filename}" and identify 3 high-impact viral segments for ${language}. Output strictly a JSON array.` },
          ...limitedFrames.map((f) => ({
            inlineData: {
              mimeType: "image/jpeg",
              data: f.split(",")[1]
            }
          }))
        ]
      },
      config: {
        systemInstruction: "You are a viral strategy expert. Detect high-energy moments. Return ONLY a JSON array of 3 objects.",
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

    return {
      statusCode: 200,
      headers,
      body: response.text
    };
  } catch (error) {
    console.error("Cloud Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || "AI Analysis Failed" })
    };
  }
};