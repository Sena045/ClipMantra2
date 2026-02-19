import { GoogleGenerativeAI } from "@google/generative-ai";

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  try {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 204, headers };
    }

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: "Method Not Allowed" })
      };
    }

    const { filename = "Unknown Video", language = "English" } =
      JSON.parse(event.body || "{}");

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Missing API Key" })
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest"
    });

    const result = await model.generateContent(`
Analyze video "${filename}" in ${language}.
Extract 8 viral segments (30–45 seconds each).

Return ONLY valid JSON array.
`);

    const text = result.response.text();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        payload: text
      })
    };

  } catch (error) {
    console.error("Gemini Error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || "AI processing failed"
      })
    };
  }
};
