// services/geminiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("Gemini API key is missing in environment variables");
}

const genAI = new GoogleGenerativeAI(API_KEY || "dummy-key-for-type-safety");

export interface GeminiResponse {
  success: boolean;
  payload: string;
  error?: string;
}

export async function analyzeVideo(
  file: File,
  userPrompt: string = "Analyze this video and suggest 5-8 viral clip ideas (30-60 seconds each) with timestamps and reasons. Format as JSON array."
): Promise<GeminiResponse> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Safety: limit file size client-side before calling this
    if (file.size > 10 * 1024 * 1024) { // 10MB rough limit
      return { success: false, payload: "", error: "Video too large for direct analysis (try smaller file or describe it)" };
    }

    const base64 = await fileToBase64(file);

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
          {
            text: userPrompt,
          },
        ],
      },
    ];

    console.log("Sending Gemini request with parts count:", contents[0].parts.length);

    const result = await model.generateContent(contents);

    const text = await result.response.text();

    return { success: true, payload: text };
  } catch (err: any) {
    console.error("Gemini analysis failed:", err);
    const message = err.message || "Unknown error";

    if (message.includes("data") || message.includes("oneof")) {
      return { success: false, payload: "", error: "Invalid request format (empty or malformed parts)" };
    }

    if (message.includes("cannot process video")) {
      return {
        success: true,
        payload: "Gemini cannot directly process this video file. Please describe the content (theme, key moments, timestamps) and I'll suggest viral clips based on that.",
      };
    }

    return { success: false, payload: "", error: message };
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1]; // remove data: prefix
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
