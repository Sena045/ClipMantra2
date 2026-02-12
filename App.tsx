import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import ClipCard from './components/ClipCard.tsx';
import { generateViralShorts } from './services/geminiService.ts';
import { Clip, LanguagePreference } from './types.ts';

const App: React.FC = () => {
  const [language, setLanguage] = useState<LanguagePreference>(LanguagePreference.ENGLISH);
  const [clips, setClips] = useState<Clip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      if (videoSrc) URL.revokeObjectURL(videoSrc);
      setVideoSrc(URL.createObjectURL(file));
      setClips([]);
      setError(null);
    }
  };

  const extractFrames = async (file: File, count: number = 8): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.muted = true;
      const frames: string[] = [];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadedmetadata = async () => {
        canvas.width = video.videoWidth / 2;
        canvas.height = video.videoHeight / 2;
        const interval = video.duration / (count + 1);
        try {
          for (let i = 1; i <= count; i++) {
            setStatus(`Visual Extraction ${i}/${count}...`);
            video.currentTime = interval * i;
            await new Promise(r => video.onseeked = r);
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              frames.push(canvas.toDataURL('image/jpeg', 0.6));
            }
          }
          URL.revokeObjectURL(video.src);
          resolve(frames);
        } catch (err) { reject(err); }
      };
      video.onerror = () => reject(new Error("Video Decoding Failed"));
    });
  };

  const handleGenerate = async () => {
    if (!videoFile) return;
    setIsLoading(true);
    setError(null);
    setClips([]);
    try {
      const frames = await extractFrames(videoFile);
      setStatus('Analyzing Retention Patterns...');
      const results = await generateViralShorts(`Video Name: ${videoFile.name}`, language, frames);
      setClips(results);
    } catch (err: any) {
      setError(err.message || "AI Analysis Aborted.");
    } finally {
      setIsLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
      
      <Header darkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} />

      <main className="max-w-7xl mx-auto px-6 pt-24 pb-32 space-y-32 relative z-10">
        {/* Dynamic Hero Section */}
        <section className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-3 px-5 py-2 glass-card rounded-full border border-white/10 shadow-lg animate-fade-in">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mono">Engine v2.4 Live</span>
          </div>
          
          <h1 className="text-7xl md:text-9xl font-black tracking-[-0.07em] leading-[0.85] text-white">
            CLIPS THAT <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-600">CONVERT.</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            Engineered for creators. Our AI dissects your footage to find high-impact 
            moments with professional precision.
          </p>
        </section>

        {/* Studio Upload Section */}
        <section className="max-w-2xl mx-auto space-y-10">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`group relative w-full glass-card rounded-[3.5rem] p-24 border-2 border-dashed transition-all duration-700 flex flex-col items-center gap-10 text-center cursor-pointer ${
              videoFile ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 hover:border-blue-500/40 shadow-2xl hover:shadow-blue-500/10'
            }`}
          >
            <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-700 group-hover:scale-110 shadow-xl border border-white/5">
              {videoFile ? (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              ) : (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
              )}
            </div>
            <div className="space-y-3">
              <h3 className="font-black text-3xl text-white tracking-tighter">
                {videoFile ? videoFile.name : "Start Analyzing"}
              </h3>
              <p className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.3em] mono">
                PRO RES • H.264 • WEBM
              </p>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" />
          </div>

          <div className="flex flex-col md:flex-row gap-5">
            <div className="relative flex-1 group">
              <select 
                className="w-full appearance-none bg-slate-900/80 px-10 py-6 rounded-[2.5rem] border border-white/10 font-black text-xs uppercase tracking-[0.2em] text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer backdrop-blur-xl"
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguagePreference)}
              >
                {Object.values(LanguagePreference).map(lang => <option key={lang} value={lang}>{lang}</option>)}
              </select>
              <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5H7z"/></svg>
              </div>
            </div>
            
            <button 
              onClick={handleGenerate}
              disabled={isLoading || !videoFile}
              className="flex-[1.5] gradient-blue hover:brightness-125 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.35em] text-[13px] transition-all active:scale-95 disabled:opacity-20 shadow-[0_20px_50px_rgba(37,99,235,0.3)] border border-white/20"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-4">
                  <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
                  {status}
                </span>
              ) : "Extract Highlights"}
            </button>
          </div>
        </section>

        {/* Results Showcase */}
        {clips.length > 0 && (
          <div className="space-y-16 animate-in slide-in-from-bottom-10 duration-1000">
            <div className="flex flex-col md:flex-row md:items-center gap-6 text-center md:text-left">
              <h2 className="text-5xl font-black text-white uppercase tracking-tighter">Curated Clips</h2>
              <div className="hidden md:block flex-1 h-px bg-white/10"></div>
              <span className="text-[11px] font-black text-blue-400 uppercase tracking-[0.4em] mono">{clips.length} Nodes Found</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {clips.map((clip, idx) => (
                <ClipCard key={idx} clip={clip} videoSrc={videoSrc} selectedMusic={null} />
              ))}
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="max-w-lg mx-auto p-12 glass-card rounded-[3rem] border border-red-500/30 text-red-400 text-sm font-black uppercase tracking-[0.3em] text-center shadow-2xl shadow-red-500/10">
             Critical Failure: {error}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default App;