
import { GoogleGenAI, Type } from "@google/genai";

export const handler = async (event) => {
  // Ensure we only handle POST requests
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  }

  try {
    const { filename, language, frames } = JSON.parse(event.body);
    
    // Netlify backend reads directly from process.env
    // GEMINI_API_KEY is the preferred name as per user request
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

    if (!apiKey) {
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: "API Key Missing: Please add GEMINI_API_KEY to your Netlify environment variables." }) 
      };
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Increased quantity to 6-10 clips
    const systemInstruction = `Viral strategist. Analyze frames from "${filename}". Find at least 6 and up to 10 viral clips (15-60s each). Return JSON array. Language: ${language}.`;

    const parts = [
      { text: "Identify 6-10 unique viral segments." }
    ];

    // Add frame data
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
        thinkingConfig: { thinkingBudget: 0 }, 
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              start: { type: Type.STRING, description: "MM:SS" },
              end: { type: Type.STRING, description: "MM:SS" },
              hook: { type: Type.STRING, description: "Viral Title" },
              caption: { type: Type.STRING, description: "Caption" },
              score: { type: Type.NUMBER, description: "0-100" },
              reasoning: { type: Type.STRING, description: "Why it works" },
              duration: { type: Type.STRING, description: "Seconds" }
            },
            required: ["start", "end", "hook", "caption", "score", "reasoning", "duration"]
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
    console.error("Gemini Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "The AI engine timed out. Try a shorter video." })
    };
  }
};
