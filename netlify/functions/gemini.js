const { GoogleGenAI, Type } = require("@google/genai");

exports.handler = async function (event) {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      }
    };
  }

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
        body: JSON.stringify({ error: "API_KEY configuration missing in cloud environment. Please set it in Netlify settings." }) 
      };
    }

    // Initialize the AI client
    const ai = new GoogleGenAI({ apiKey });
    
    // Using gemini-3-flash-preview for high quality viral analysis.
    // We set thinkingBudget to 0 to minimize latency for the serverless function.
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
        systemInstruction: "You are a viral growth expert. Extract 6-10 viral clips. Return only a JSON array of objects with the specified schema. No markdown, no extra text.",
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              start: { type: Type.STRING, description: "Start time (MM:SS)" },
              end: { type: Type.STRING, description: "End time (MM:SS)" },
              hook: { type: Type.STRING, description: "Short viral title" },
              caption: { type: Type.STRING, description: "Engaging caption" },
              score: { type: Type.NUMBER, description: "Viral score 0-100" },
              reasoning: { type: Type.STRING, description: "Why it works" },
              duration: { type: Type.STRING, description: "Length in seconds" }
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
    console.error("Cloud Engine Error:", error);
    
    let message = error.message || "Unknown processing error.";
    if (message.includes("429") || message.toLowerCase().includes("quota")) {
      message = "Quota exceeded (429). Please wait a few seconds and try again.";
    } else if (message.includes("403")) {
      message = "Access denied (403). Check if your API key is valid and has permission for this model.";
    }

    return {
      statusCode: 500,
      headers: { 
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ error: message })
    };
  }
};