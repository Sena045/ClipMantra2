import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  try {
    if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers };
    if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };

    const body = JSON.parse(event.body || "{}");
    const { filename, language, frames = [] } = body;

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "API Key missing" }) };
    }

    // Use the official client
    const genAI = new GoogleGenerativeAI(apiKey);

    // Schema definition for forced JSON output
    const schema = {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          start: { type: SchemaType.STRING },
          end: { type: SchemaType.STRING },
          hook: { type: SchemaType.STRING },
          caption: { type: SchemaType.STRING },
          score: { type: SchemaType.NUMBER },
          reasoning: { type: SchemaType.STRING },
          duration: { type: SchemaType.STRING }
        },
        required: ["start", "end", "hook", "caption", "score", "reasoning", "duration"],
      },
    };

    // Switching to 1.5-flash to solve the Quota (429) and Timeout (504) issues
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: `You are an expert Viral Video Strategist. Analyze video frames from "${filename}" for ${language} audiences. Extract 8 segments (30-45s) with high viral potential.`,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const parts = [
      { text: "Analyze these frames and return the viral segments in the requested JSON format." },
      ...frames.slice(0, 8).map((f) => ({
        inlineData: {
          mimeType: "image/jpeg",
          data: f.includes(",") ? f.split(",")[1] : f
        }
      }))
    ];

    const result = await model.generateContent({ contents: [{ role: "user", parts }] });
    const response = await result.response;
    const output = response.text(); // This is a function in the official SDK

    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ success: true, payload: JSON.parse(output) }) 
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ 
        error: error.message,
        type: "AI_PIPELINE_ERROR" 
      }) 
    };
  }
};
