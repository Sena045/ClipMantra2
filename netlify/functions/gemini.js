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

    if (!apiKey) throw new Error("API_KEY is missing in Netlify environment variables.");

    const client = new GoogleGenAI({ apiKey });
    
    // Using gemini-2.0-flash-exp (or gemini-2.0-flash) is highly recommended for 
    // multimodal tasks like "seeing" frames. It is faster and follows instructions better.
    const model = "gemini-2.0-flash";

    const systemInstruction = `You are a professional Viral Video Editor. 
    You are being provided with a sequence of IMAGE FRAMES extracted from the video file: "${filename}".
    
    TASK:
    1. Study these visual frames carefully. 
    2. Based ON THE VISUALS, identify 8 high-impact segments (30-45s) suitable for TikTok/Reels.
    3. Ensure the "hook" and "reasoning" reflect the visual content shown in the frames.
    
    OUTPUT FORMAT:
    Return ONLY a valid JSON array of objects.
    Structure: [{ "start": "MM:SS", "end": "MM:SS", "hook": "...", "caption": "...", "score": 0-100, "reasoning": "...", "duration": "..." }]`;

    const response = await client.models.generateContent({
      model: model,
      system_instruction: systemInstruction,
      contents: [
        {
          role: "user",
          parts: [
            { text: `The audience speaks ${language}. Use the attached frames to find the best viral moments from ${filename}.` },
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

    // Handle potential empty responses
    const outputText = response.text || "[]";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        payload: JSON.parse(outputText)
      })
    };

  } catch (error) {
    console.error("Viral Engine Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        details: "If the AI says it 'cannot see', ensure frames are not black images or too low resolution." 
      })
    };
  }
};
