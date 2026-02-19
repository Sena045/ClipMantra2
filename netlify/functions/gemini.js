import { GoogleGenAI } from "@google/genai";

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  try {
    // Handle CORS preflight
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 204,
        headers
      };
    }

    // Allow only POST
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: "Method Not Allowed" })
      };
    }

    const body = JSON.parse(event.body || "{}");
    const { filename = "Unknown File", language = "English" } = body;

    // Get API key from Netlify environment variables
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Missing API Key in environment variables" })
      };
    }

    // Initialize Gemini client
    const ai = new GoogleGenAI({ apiKey });

    // Call Gemini (TEXT ONLY — no base64 images)
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
Analyze video "${filename}" in ${language}.
Extract 8 high-impact viral segments (30-45 seconds each).

Return ONLY a valid JSON array with:
[
  {
    "start": "00:00:00",
    "end": "00:00:30",
    "hook": "...",
    "caption": "...",
    "score": 0-100,
    "reasoning": "...",
    "duration": "30s"
  }
]
              `
            }
          ]
        }
      ]
    });

    // Safely parse response
    let parsed;

    try {
      parsed = JSON.parse(response.text);
    } catch (e) {
      parsed = response.text; // fallback if Gemini returns plain text
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        payload: parsed
      })
    };

  } catch (error) {
    console.error("Gemini Function Error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || "AI processing failed"
      })
    };
  }
};
