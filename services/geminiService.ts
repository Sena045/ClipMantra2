import { GoogleGenAI } from "@google/genai";

/**
 * Service to handle Gemini AI video analysis
 * @param {string} apiKey - Your Google AI Studio API Key
 */
export class GeminiService {
  constructor(apiKey) {
    if (!apiKey) throw new Error("API Key is required");
    this.client = new GoogleGenAI({ apiKey });
  }

  /**
   * Generates viral short ideas from a video file
   * @param {File|Blob} file - The video file
   * @param {string} language - Target language (default: English)
   */
  async generateViralShorts(file, language = "English") {
    try {
      // Use the stable flash model for video tasks
      const modelName = "gemini-2.0-flash"; 

      const base64Data = await this._fileToBase64(file);

      const prompt = `Analyze this video "${file.name || 'video'}" for a ${language} audience.
      Identify 8 high-impact segments (30-45s each) that would go viral on TikTok or Reels.
      Return ONLY a JSON array of objects with keys: start, end, hook, caption, score, reasoning.`;

      const response = await this.client.models.generateContent({
        model: modelName,
        contents: [
          {
            role: "user",
            parts: [
              {
                inline_data: {
                  mime_type: file.type || "video/mp4",
                  data: base64Data
                }
              },
              { text: prompt }
            ]
          }
        ],
        config: {
          response_mime_type: "application/json"
        }
      });

      // The new SDK returns text directly on the response object
      return {
        success: true,
        payload: JSON.parse(response.text)
      };

    } catch (error) {
      console.error("Gemini Error:", error);
      return {
        success: false,
        error: error.message || "Failed to analyze video."
      };
    }
  }

  /**
   * Helper to convert File to raw Base64 string
   */
  _fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        // Strip the "data:video/mp4;base64," prefix
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
