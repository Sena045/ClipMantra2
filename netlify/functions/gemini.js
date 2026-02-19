import { GoogleGenAI } from "@google/genai";

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

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Analyze video "${filename}" in ${language}.
Extract 8 viral segments (30–45 seconds each).
Return ONLY a valid JSON array.`
            }
          ]
        }
      ]
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        payload: response.text
      })
    };

  } catch (error) {
    console.error("Gemini Error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};
