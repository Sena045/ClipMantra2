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
        body: JSON.stringify({ error: "API_KEY configuration missing in cloud environment." }) 
      };
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Using gemini-3-flash-preview as it is faster and more capable than 1.5-flash.
    // Setting thinkingBudget: 0 to ensure the function completes within the Netlify 10s timeout limit.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: {
        parts: [
          { text: `Viral Content Analysis for: ${filename}. Identify 6-10 highly engaging clips (15-60s each) using ${language} strategy. Return strictly as a JSON array.` },
          ...frames.map((f) => ({
            inlineData: {
              mimeType: "image/jpeg",
              data: f.split(',')[1] 
            }
          }))
        ]
      },
      config: {
        systemInstruction: "You are a world-class social media viral growth expert. Your task is to analyze video frames and pinpoint the exact moments that will perform best on TikTok, Reels, and Shorts. Focus on high-emotion hooks, controversial statements, or visually stunning transitions.",
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
              reasoning: { type: Type.STRING, description: "The psychological 'why' behind this clip" },
              duration: { type: Type.STRING, description: "Clip length in seconds" }
            },
            required: ["start", "end", "hook", "caption", "score", "reasoning", "duration"]
          }
        }
      }
    });

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json"
      },
      body: response.text
    };

  } catch (error) {
    console.error("Cloud Engine Error:", error);
    
    // Check for common errors
    let status = 500;
    let message = error.message || "The AI engine encountered a processing error.";
    
    if (message.includes("quota")) {
      message = "API Quota exceeded. Please try again in a minute.";
    }

    return {
      statusCode: status,
      body: JSON.stringify({ error: message })
    };
  }
};