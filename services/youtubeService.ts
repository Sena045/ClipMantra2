
export interface YoutubeDetails {
  id: string;
  title: string;
  description: string;
  tags: string[];
  duration: string;
  thumbnail: string;
  author: string;
}

/**
 * Fetches basic metadata for a YouTube video using the public oEmbed API.
 * This does not require an API key and is more reliable for a "Free" replica.
 */
export const fetchYoutubeDetails = async (videoId: string): Promise<YoutubeDetails> => {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;

  try {
    const response = await fetch(oembedUrl);
    if (!response.ok) throw new Error("YouTube oEmbed request failed");
    
    const data = await response.json();

    return {
      id: videoId,
      title: data.title || "Unknown Title",
      description: "Basic metadata fetched via oEmbed",
      tags: [],
      duration: "Unknown",
      thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      author: data.author_name || "Unknown Channel",
    };
  } catch (error) {
    console.error("YouTube Metadata Error:", error);
    // Fallback to basic thumbnail if oembed fails
    return {
      id: videoId,
      title: "YouTube Video",
      description: "",
      tags: [],
      duration: "",
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      author: "YouTube User",
    };
  }
};
