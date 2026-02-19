import { GoogleGenerativeAI } from "@google/generative-ai";

// Standard way to access keys (works in most environments)
const API_KEY = process.env.API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(API_KEY);

export interface GeminiResponse {
  success: boolean;
  payload: any;
  error?: string;
}

/**
 * EXPORTED FUNCTION: This name MUST match the import in App.tsx
 */
export async function generateViralShorts(
  file: File,
  language: string = "English"
): Promise<GeminiResponse> {
  try {
    if (!API_KEY) throw new Error("API Key is missing.");

    // Using 1.5-flash for speed and reliability with video/multimodal data
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const base64 = await fileToBase64(file);

    const prompt = `You are a viral video expert. Analyze this video for a ${language} audience. 
    Identify 8 high-impact viral segments (30-45s each). 
    Return ONLY a JSON array of objects with keys: start, end, hook, caption, score, reasoning, duration.`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: file.type || "video/mp4",
          data: base64,
        },
      },
      { text: prompt },
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Attempt to parse JSON to ensure payload is clean
    const cleanedJson = JSON.parse(text.replace(/```json|```/g, "").trim());

    return { 
      success: true, 
      payload: cleanedJson 
    };

  } catch (err: any) {
    console.error("Gemini Service Error:", err);
    return { 
      success: false, 
      payload: null, 
      error: err.message || "Failed to analyze video." 
    };
  }
}

/**
 * Helper to convert file to base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
