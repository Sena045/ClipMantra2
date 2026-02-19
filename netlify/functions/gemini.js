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

    const ai = new GoogleGenAI({ apiKey });
    const modelName = "gemini-3-flash-preview"; 

    const systemInstruction = `Analyze video frames for "${filename}". 
    Return a JSON array of 8 viral segments with keys: start, end, hook, caption, score, reasoning, duration.`;

    // TRANSFORM PARTS: Ensure snake_case and raw base64
    const contentParts = [
      { text: `Analyze segments for language: ${language}` },
      ...frames.slice(0, 8).map(f => {
        // Strip the Data URL prefix if it exists
        const base64Data = f.includes(",") ? f.split(",")[1] : f;
        
        return {
          inline_data: {
            mime_type: "image/jpeg",
            data: base64Data
          }
        };
      })
    ];

    const response = await ai.models.generateContent({
      model: modelName,
      system_instruction: systemInstruction,
      contents: [
        {
          role: "user",
          parts: contentParts
        }
      ],
      config: {
        response_mime_type: "application/json"
      }
    });

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
      body: JSON.stringify({ 
        error: error.message,
        suggestion: "Ensure frames are valid base64 strings without data:image/jpeg headers."
      })
    };
  }
};
