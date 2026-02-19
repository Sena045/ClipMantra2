import { GoogleGenerativeAI } from "@google/generative-ai";

// Use the Vite-specific way to access environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("Gemini API key is missing in environment variables");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");

export interface GeminiResponse {
  success: boolean;
  payload: string;
  error?: string;
}

/**
 * Renamed from analyzeVideo to generateViralShorts to fix the Netlify Build Error
 */
export async function generateViralShorts(
  file: File,
  language: string = "English"
): Promise<GeminiResponse> {
  try {
    // 1.5 Flash is the most reliable for mixed-media free tier
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Safety check for file size
    if (file.size > 20 * 1024 * 1024) { 
      return { 
        success: false, 
        payload: "", 
        error: "File is too large. Please use a video under 20MB." 
      };
    }

    const base64 = await fileToBase64(file);

    const prompt = `You are an expert Viral Video Strategist. 
    Analyze this video file "${file.name}" for a ${language} speaking audience.
    Identify 8 high-impact segments (30-45s each).
    
    Return ONLY a valid JSON array of objects with these keys: 
    "start", "end", "hook", "caption", "score", "reasoning", "duration".`;

    const contents = [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: file.type || "video/mp4",
              data: base64,
            },
          },
          { text: prompt },
        ],
      },
    ];

    const result = await model.generateContent(contents);
    const response = await result.response;
    const text = response.text();

    return { success: true, payload: text };

  } catch (err: any) {
    console.error("Gemini analysis failed:", err);
    
    // Check for common "I can't watch videos" refusal or Safety filters
    if (err.message?.toLowerCase().includes("safety") || err.message?.toLowerCase().includes("blocked")) {
        return { success: false, payload: "", error: "Content was flagged by AI safety filters." };
    }

    return { 
      success: false, 
      payload: "", 
      error: err.message || "Failed to process video. Ensure it's a valid MP4/MOV." 
    };
  }
}

/**
 * Helper to convert file to base64 and strip the prefix
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1]; // remove data:video/mp4;base64,
      resolve(base64);
    };
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}
