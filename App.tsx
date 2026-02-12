
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import ClipCard from './components/ClipCard.tsx';
import { generateViralShorts } from './services/geminiService.ts';
import { Clip, LanguagePreference, MusicTrack } from './types.ts';

const MUSIC_CATALOG: MusicTrack[] = [
  { id: '1', name: 'Lofi Chill', category: 'Lo-fi', url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808f3030e.mp3' },
  { id: '2', name: 'Aggressive Trap', category: 'Energy', url: 'https://cdn.pixabay.com/audio/2023/10/24/audio_3d1a8e2507.mp3' },
  { id: '3', name: 'Corporate Tech', category: 'Clean', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_7306783d7a.mp3' },
  { id: '4', name: 'Uplifting Pop', category: 'Viral', url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3' },
];

const App: React.FC = () => {
  const [language, setLanguage] = useState<LanguagePreference>(LanguagePreference.ENGLISH);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);

  // Check if API key is configured
  // Note: Vite replaces process.env.API_KEY during build
  const isKeyConfigured = process.env.API_KEY && process.env.API_KEY !== "" && process.env.API_KEY !== "undefined";

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      if (videoSrc) URL.revokeObjectURL(videoSrc);
      setVideoSrc(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const track: MusicTrack = {
        id: `custom-${Date.now()}`,
        name: file.name,
        url: url,
        category: 'Custom'
      };
      setSelectedMusic(track);
    }
  };

  const handleGenerate = async () => {
    if (!videoFile) return;

    const contextStr = `File: ${videoFile.name} | Size: ${videoFile.size} bytes | Type: ${videoFile.type}`;

    setIsLoading(true);
    setError(null);
    setClips([]);

    try {
      const results = await generateViralShorts(contextStr, language);
      setClips(results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      <Header darkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} />

      <main className="max-w-6xl mx-auto px-6 pb-32">
        <section className="pt-24 pb-16 text-center space-y-8">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none">
            CLIP<span className="text-blue-600">MANTRA</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px]">
            AI Viral Highlight Engine
          </p>

          {!isKeyConfigured ? (
            <div className="max-w-xl mx-auto mt-12 p-10 bg-white dark:bg-slate-900 rounded-[3rem] border border-blue-100 dark:border-blue-900/30 shadow-2xl text-left space-y-6">
              <div className="flex items-center gap-4 text-blue-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h3 className="font-black uppercase tracking-tight text-xl">Netlify Setup Guide</h3>
              </div>
              
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">⚠️ Important Naming Rule</p>
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Netlify only allows letters, numbers, and underscores. Use <code className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/50">API_KEY</code> exactly. Do not use hyphens like <del>GEMINI-KEY</del>.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                  <div className="space-y-1">
                    <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-wider">Get Key</p>
                    <p className="text-[11px] font-bold text-slate-500">Visit <a href="https://aistudio.google.com/" target="_blank" className="text-blue-600 underline">Google AI Studio</a> and copy your free key.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                  <div className="space-y-1">
                    <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-wider">Open Netlify</p>
                    <p className="text-[11px] font-bold text-slate-500">Go to <span className="text-slate-900 dark:text-slate-100 italic">Site Settings &gt; Environment Variables</span>.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">3</span>
                  <div className="space-y-1">
                    <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-wider">Add Variable</p>
                    <p className="text-[11px] font-bold text-slate-500">Click <span className="text-blue-600">"Add a variable"</span>. Key: <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1">API_KEY</code> | Value: <span className="italic">Your Key</span>.</p>
                  </div>
                </div>
              </div>

              <a 
                href="https://aistudio.google.com/" 
                target="_blank"
                className="block w-full text-center bg-blue-600 py-5 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-colors shadow-xl shadow-blue-500/20"
              >
                Copy My Free Gemini Key
              </a>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto pt-10">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-white dark:bg-slate-900 rounded-[3rem] p-12 border-4 border-dashed border-slate-100 dark:border-slate-800 hover:border-blue-500 cursor-pointer shadow-2xl transition-all group flex flex-col items-center gap-6"
              >
                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
                    {videoFile ? videoFile.name : "Upload Video File"}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                    Drag & drop or click to select MP4 video
                  </p>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/mp4" className="hidden" />
              </div>
              
              <div className="mt-8">
                 <button 
                    onClick={handleGenerate}
                    disabled={isLoading || !videoFile}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-8 rounded-full font-black uppercase tracking-[0.3em] text-sm transition-all active:scale-95 disabled:opacity-20 shadow-2xl shadow-blue-600/20"
                  >
                    {isLoading ? "Analyzing..." : "Analyze for Viral Clips"}
                  </button>
              </div>
            </div>
          )}
        </section>

        {isKeyConfigured && (
          <section className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-20 animate-in fade-in slide-in-from-top-4 duration-700">
             <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-6">Output Language</label>
                <select 
                  className="w-full bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 font-black text-[10px] uppercase tracking-widest dark:text-white outline-none appearance-none cursor-pointer shadow-xl"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as LanguagePreference)}
                >
                  {Object.values(LanguagePreference).map(lang => (
                    <option key={lang} value={lang}>{lang} Hooks</option>
                  ))}
                </select>
             </div>

             <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-6">Background Music</label>
                <div className="flex gap-3">
                  <div className="flex-1 relative group">
                    <select 
                      className="w-full bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 font-black text-[10px] uppercase tracking-widest dark:text-white outline-none appearance-none cursor-pointer shadow-xl"
                      onChange={(e) => {
                        if (e.target.value === "custom-placeholder") return;
                        const track = MUSIC_CATALOG.find(m => m.id === e.target.value);
                        if (track) setSelectedMusic(track);
                        else if (e.target.value === "") setSelectedMusic(null);
                      }}
                      value={selectedMusic?.category === 'Custom' ? 'custom-placeholder' : selectedMusic?.id || ""}
                    >
                      <option value="">No Background Music</option>
                      {selectedMusic?.category === 'Custom' && (
                        <option value="custom-placeholder">♪ {selectedMusic.name}</option>
                      )}
                      {MUSIC_CATALOG.map(track => (
                        <option key={track.id} value={track.id}>{track.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                      <svg className="w-4 h-4 dark:text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => musicInputRef.current?.click()}
                    className={`px-6 rounded-[2.5rem] border transition-all shadow-xl group flex items-center justify-center ${
                      selectedMusic?.category === 'Custom' 
                        ? 'bg-blue-600 border-blue-500 text-white' 
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                    }`}
                    title="Upload Custom Music"
                  >
                    <svg className={`w-5 h-5 ${selectedMusic?.category === 'Custom' ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
                    <input type="file" ref={musicInputRef} onChange={handleMusicUpload} accept="audio/*" className="hidden" />
                  </button>
                </div>
             </div>
          </section>
        )}

        {isLoading && (
          <div className="py-20 text-center space-y-8">
            <div className="w-24 h-24 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto shadow-2xl shadow-blue-500/20"></div>
            <div className="space-y-2">
              <p className="font-black uppercase tracking-[0.4em] text-[12px] text-blue-600">Analyzing Viral Retention</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Scanning video data & detecting high-energy clips...</p>
            </div>
          </div>
        )}

        {clips.length > 0 && (
          <div className="space-y-20 animate-in fade-in duration-1000">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {clips.map((clip, index) => (
                <ClipCard 
                  key={index} 
                  clip={clip} 
                  index={index} 
                  youtubeId={null}
                  videoSrc={videoSrc}
                  selectedMusic={selectedMusic}
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-md mx-auto p-8 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-[2.5rem] text-rose-600 dark:text-rose-400 text-[11px] font-black uppercase text-center tracking-widest shadow-xl">
             <div className="mb-2">⚠️ Process Failed</div>
             <div className="opacity-70">{error}</div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default App;
