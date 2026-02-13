
import { GoogleGenAI, Type } from "@google/genai";

export const handler = async (event) => {
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
        body: JSON.stringify({ error: "API Key Not Found. Please configure process.env.API_KEY in Netlify settings." }) 
      };
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = `You are an expert viral content strategist. 
    Analyze visual frames from "${filename}" to identify between 6 and 10 high-impact segments for social media.
    
    RULES:
    1. Quantity: Return 6-10 clips.
    2. Duration: Each clip must be 15-60 seconds.
    3. Language: Respond using ${language} strategy.
    4. Format: Return ONLY valid JSON.`;

    const contents = {
      parts: [
        { text: "Extract 6-10 viral segments (15-60s) from these frames." },
        ...frames.map((f) => ({
          inlineData: {
            mimeType: "image/jpeg",
            data: f.split(',')[1] 
          }
        }))
      ]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              start: { type: Type.STRING, description: "Start time (MM:SS)" },
              end: { type: Type.STRING, description: "End time (MM:SS)" },
              hook: { type: Type.STRING, description: "Viral Title" },
              caption: { type: Type.STRING, description: "Engagement caption with hashtags" },
              score: { type: Type.NUMBER, description: "Viral Potential 0-100" },
              reasoning: { type: Type.STRING, description: "Psychological reason for choosing this clip" },
              duration: { type: Type.STRING, description: "Estimated duration in seconds" }
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
    console.error("Gemini Cloud Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "The cloud AI pipeline timed out or failed." })
    };
  }
};
