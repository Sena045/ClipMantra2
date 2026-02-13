
import { GoogleGenAI, Type } from "@google/genai";

export const handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  }

  try {
    const { filename, language, frames } = JSON.parse(event.body);
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: "Server-side API_KEY is missing in environment variables." }) 
      };
    }

    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `You are a viral content strategist. Analyze the visual frames of a video to identify 3-5 high-impact clips suitable for TikTok, Reels, or Shorts. Focus on high-retention "hooks" and emotional peaks. Output MUST be a valid JSON array. Language preference: ${language}.`;

    const parts = [
      { text: `Analyze the following frames from the video "${filename}" and identify segments that have high viral potential.` }
    ];

    // Add frame data to parts
    frames.forEach((f) => {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: f.split(',')[1] // Strip data:image/jpeg;base64,
        }
      });
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              start: { type: Type.STRING, description: "Start time in MM:SS" },
              end: { type: Type.STRING, description: "End time in MM:SS" },
              hook: { type: Type.STRING, description: "A catchy viral headline for the clip" },
              caption: { type: Type.STRING, description: "Optimized social media caption with hashtags" },
              score: { type: Type.NUMBER, description: "Viral potential score from 0-100" },
              reasoning: { type: Type.STRING, description: "Why this clip will perform well (retention logic)" }
            },
            required: ["start", "end", "hook", "caption", "score", "reasoning"]
          }
        }
      }
    });

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: response.text
    };

  } catch (error) {
    console.error("Gemini Function Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "An unexpected error occurred during AI analysis." })
    };
  }
};
