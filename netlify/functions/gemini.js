
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
        body: JSON.stringify({ error: "Server-side API_KEY is missing in Netlify environment variables." }) 
      };
    }

    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `You are a viral content strategist. Analyze the provided frames from a video to identify 3-5 high-impact clips for social media. Focus on high-retention "hooks". Output MUST be a valid JSON array. Language preference: ${language}.`;

    const parts = [
      { text: `Analyze these frames from "${filename}" and identify viral segments.` }
    ];

    // Add frame data to parts
    frames.forEach((f) => {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: f.split(',')[1] 
        }
      });
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        // Disable thinking to prevent Netlify 10s function timeout (502 errors)
        thinkingConfig: { thinkingBudget: 0 }, 
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              start: { type: Type.STRING, description: "Start time (MM:SS)" },
              end: { type: Type.STRING, description: "End time (MM:SS)" },
              hook: { type: Type.STRING, description: "Viral Headline" },
              caption: { type: Type.STRING, description: "Social Caption" },
              score: { type: Type.NUMBER, description: "Viral Score 0-100" },
              reasoning: { type: Type.STRING, description: "Logic for retention" }
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
