
export interface Clip {
  start: string;
  end: string;
  hook: string;
  caption: string;
  score: number;
  reasoning: string;
  duration: string;
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

export const SUPPORTED_MUSIC: MusicTrack[] = [
  { id: 'none', name: 'No Music', url: '', category: 'None' },
  { id: 'aggro', name: 'Aggressive Phonk', url: 'https://cdn.pixabay.com/audio/2023/04/26/audio_9856d0d7e3.mp3', category: 'Energy' },
  { id: 'cinematic', name: 'Dark Cinematic', url: 'https://cdn.pixabay.com/audio/2022/03/24/audio_9961726a8a.mp3', category: 'Mood' },
  { id: 'lofi', name: 'Deep Focus Lo-Fi', url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808d7430c.mp3', category: 'Chill' },
  { id: 'tech', name: 'Modern Tech', url: 'https://cdn.pixabay.com/audio/2023/09/22/audio_1f237f378a.mp3', category: 'Corporate' }
];
