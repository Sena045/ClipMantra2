import { GoogleGenerativeAI } from "@google/generative-ai";

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers };
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  try {
    const { filename = "Unknown File", language = "English" } = JSON.parse(event.body || "{}");
    const apiKey = process.env.API_KEY;

    if (!apiKey) throw new Error("Missing API Key");

    // 1. Initialize with correct package name
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 2. Use Gemini 1.5 Flash (much faster for 10s Netlify limits)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json", // Forces JSON output
      }
    });

    const prompt = `Analyze video "${filename}" in ${language}. 
    Extract 8 high-impact viral segments (30-45s each). 
    Return a JSON array of objects with keys: start, end, hook, caption, score, reasoning, duration.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text(); // Note: .text() is a function call

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        payload: JSON.parse(text)
      })
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || "AI Timeout or Error" })
    };
  }
};
