import { GoogleGenAI, Type } from "@google/genai";

export const handler = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "POST, OPTIONS"
        }
      };
    }

    if (event.httpMethod !== "POST") {
      return { 
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" })
      };
    }

    const body = JSON.parse(event.body || "{}");
    const { filename, language, frames = [] } = body;

    // Limit to 3 frames to avoid Netlify payload (6MB) and timeout (10s) limits
    const limitedFrames = Array.isArray(frames) ? frames.slice(0, 3) : [];

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Missing API_KEY in environment" })
      };
    }

    // Initialize the AI client using ESM-compatible GoogleGenAI
    const ai = new GoogleGenAI({ apiKey });

    // Use gemini-3-flash-preview for high quality viral analysis
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { text: `Analyze these frames from "${filename}" and identify 3 high-impact viral segments optimized for ${language}. Return exactly 3 segments.` },
          ...limitedFrames.map((f) => ({
            inlineData: {
              mimeType: "image/jpeg",
              data: f.split(",")[1]
            }
          }))
        ]
      },
      config: {
        systemInstruction: "You are a world-class viral content strategist. Pinpoint high-retention moments and provide actionable metadata for TikTok/Reels.",
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              start: { type: Type.STRING, description: "Start (MM:SS)" },
              end: { type: Type.STRING, description: "End (MM:SS)" },
              hook: { type: Type.STRING, description: "Viral Headline" },
              caption: { type: Type.STRING, description: "High-retention caption" },
              score: { type: Type.NUMBER, description: "Viral Score (0-100)" },
              reasoning: { type: Type.STRING, description: "Psychological hook reasoning" },
              duration: { type: Type.STRING, description: "Duration in seconds" }
            },
            required: ["start", "end", "hook", "caption", "score", "reasoning", "duration"]
          }
        }
      }
    });

    return {
      statusCode: 200,
      headers: { 
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: response.text
    };
  } catch (error) {
    console.error("Function Crash:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message || "Unknown error during AI processing." })
    };
  }
};