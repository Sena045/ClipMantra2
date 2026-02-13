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
        body: JSON.stringify({ error: "API_KEY not found in environment. Please check Netlify settings." }) 
      };
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = `You are a professional viral strategist.
    Analyze the provided frames from "${filename}" and identify 6-10 unique, high-impact segments.
    
    CONSTRAINTS:
    - Return exactly between 6 and 10 segments.
    - Each segment duration must be 15-60 seconds.
    - Strategy should follow ${language} cultural trends.
    - Format: Strict JSON array.`;

    const contents = {
      parts: [
        { text: "Extract 6-10 viral segments (15-60s) from these visual sequences." },
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
              start: { type: Type.STRING, description: "Start (MM:SS)" },
              end: { type: Type.STRING, description: "End (MM:SS)" },
              hook: { type: Type.STRING, description: "Engagement Title" },
              caption: { type: Type.STRING, description: "Viral Caption & Tags" },
              score: { type: Type.NUMBER, description: "Potential 0-100" },
              reasoning: { type: Type.STRING, description: "Hook reasoning" },
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
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: response.text
    };

  } catch (error) {
    console.error("Gemini Lambda Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Failed to process video frames." })
    };
  }
};