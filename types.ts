
export interface Clip {
  start: string;
  end: string;
  hook: string;
  caption: string;
  score: number;
  reasoning?: string;
}

export interface MusicTrack {
  id: string;
  name: string;
  url: string;
  category: string;
}

export enum LanguagePreference {
  ENGLISH = 'English',
  HINDI = 'Hindi',
  HINGLISH = 'Hinglish'
}

export interface VideoMetadata {
  title: string;
  author: string;
  thumbnail: string;
}
