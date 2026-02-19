import { GoogleGenAI } from "@google/genai";

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers };

  try {
    const { filename, language, frames = [] } = JSON.parse(event.body || "{}");
    const apiKey = process.env.API_KEY;

    // 1. Initialize the new Client
    const ai = new GoogleGenAI({ apiKey });

    // 2. Use the modern model name
    const modelName = "gemini-3-flash-preview"; 

    const systemInstruction = `Analyze video frames for "${filename}". 
    Return a JSON array of 8 viral segments with keys: start, end, hook, caption, score, reasoning, duration.`;

    // 3. New generateContent syntax
    const response = await ai.models.generateContent({
      model: modelName,
      system_instruction: systemInstruction,
      contents: [
        {
          role: "user",
          parts: [
            { text: `Analyze segments for language: ${language}` },
            ...frames.slice(0, 8).map(f => ({
              inline_data: {
                mime_type: "image/jpeg",
                data: f.includes(",") ? f.split(",")[1] : f
              }
            }))
          ]
        }
      ],
      config: {
        response_mime_type: "application/json"
      }
    });

    // 4. Access text using the new property
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        payload: JSON.parse(response.text)
      })
    };

  } catch (error) {
    console.error("Gemini 3 Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
