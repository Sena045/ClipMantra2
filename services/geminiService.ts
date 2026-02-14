import { Clip, LanguagePreference } from "../types";

export const generateViralShorts = async (
  filename: string,
  language: LanguagePreference,
  frames: string[]
): Promise<Clip[]> => {
  const response = await fetch("/.netlify/functions/gemini", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filename,
      language,
      frames,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Cloud pipeline failed.");
  }

  return await response.json();
};