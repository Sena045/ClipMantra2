
import React, { useState, useRef } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ClipCard from './components/ClipCard';
import { Clip, LanguagePreference } from './types';
import { generateViralShorts } from './services/geminiService';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [clips, setClips] = useState<Clip[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [language, setLanguage] = useState<LanguagePreference>(LanguagePreference.ENGLISH);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const name = file.name.toLowerCase();
      const isValidVideo = file.type.startsWith('video/') || 
                          name.endsWith('.mp4') || 
                          name.endsWith('.webm') ||
                          name.endsWith('.mov');

      if (!isValidVideo) {
        setError("Please upload a standard video file (MP4, WebM, or MOV).");
        return;
      }
      
      if (videoSrc) URL.revokeObjectURL(videoSrc);

      setVideoFile(file);
      setVideoSrc(URL.createObjectURL(file));
      setClips([]);
      setError(null);
    }
  };

  const captureFrames = async (videoFile: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const tempSrc = URL.createObjectURL(videoFile);
      video.src = tempSrc;
      video.preload = 'auto';
      
      const timeout = setTimeout(() => {
        URL.revokeObjectURL(tempSrc);
        reject(new Error("Analysis timed out. Try a shorter video or check your connection."));
      }, 45000);

      video.onloadedmetadata = async () => {
        const frames: string[] = [];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { alpha: false });
        
        canvas.width = 384; 
        canvas.height = 682; 

        let duration = video.duration;
        const numFrames = 8; 
        const interval = duration / (numFrames + 1);

        for (let i = 1; i <= numFrames; i++) {
          video.currentTime = interval * i;
          await new Promise(r => {
             const onSeeked = () => {
               video.removeEventListener('seeked', onSeeked);
               r(null);
             };
             video.addEventListener('seeked', onSeeked);
          });
          
          if (ctx) {
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const scale = Math.min(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
            const x = (canvas.width / 2) - (video.videoWidth / 2) * scale;
            const y = (canvas.height / 2) - (video.videoHeight / 2) * scale;
            ctx.drawImage(video, x, y, video.videoWidth * scale, video.videoHeight * scale);
            frames.push(canvas.toDataURL('image/jpeg', 0.4));
          }
          
          setStatus(`Scanning Engagement Peaks: ${Math.round((i / numFrames) * 100)}%`);
        }
        
        clearTimeout(timeout);
        URL.revokeObjectURL(tempSrc);
        resolve(frames);
      };
      
      video.onerror = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(tempSrc);
        reject(new Error("Unable to read video file. Is it corrupted?"));
      };
    });
  };

  const handleProcess = async () => {
    if (!videoFile) return;
    
    setLoading(true);
    setError(null);
    setClips([]);
    
    try {
      setStatus('Warming Neural Engine...');
      const frames = await captureFrames(videoFile);
      
      setStatus('AI Psychometric Analysis...');
      const results = await generateViralShorts(videoFile.name, language, frames);
      
      setClips(results);
    } catch (err: any) {
      setError(err.message || "Viral Engine encountered a latency error. Please retry.");
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30 font-sans flex flex-col">
      <Header />
      <main className="flex-1 pt-32 pb-40 px-4 md:px-8 max-w-7xl mx-auto space-y-32 w-full">
        <section className="text-center space-y-10 py-10 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-blue-600/5 blur-[120px] pointer-events-none"></div>
          
          <div className="space-y-6 relative z-10">
            <div className="inline-block px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 mb-4">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mono italic">Gemini Flash Free Tier Active</span>
            </div>
            <h1 className="text-7xl md:text-9xl font-black text-white tracking-tighter uppercase italic leading-[0.85] animate-in fade-in slide-in-from-top-4 duration-1000">
              Content <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">Decoded.</span>
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg md:text-xl font-medium leading-relaxed">
              Upload footage. Our AI psychologist identifies the high-retention segments mathematically destined to trend. No subscription required.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-8 relative z-10">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`group relative p-16 bg-white/5 rounded-[4rem] border-2 border-dashed transition-all duration-700 cursor-pointer hover:bg-blue-500/5 hover:border-blue-500/50 hover:shadow-[0_0_80px_-20px_rgba(59,130,246,0.3)] flex flex-col items-center justify-center gap-8 ${videoFile ? 'border-blue-500 bg-blue-500/5 shadow-2xl shadow-blue-500/10' : 'border-white/10'}`}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" />
              <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{videoFile ? videoFile.name : 'Ingest Media Source'}</h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{videoFile ? 'Source Ready for Multi-Point Scan' : 'Drag video file or browse local storage'}</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-center justify-center max-w-xl mx-auto">
              <select 
                className="w-full md:w-auto bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-300 focus:ring-2 focus:ring-blue-500/50 outline-none cursor-pointer hover:bg-slate-800 transition-all"
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguagePreference)}
              >
                {Object.values(LanguagePreference).map(lang => (
                  <option key={lang} value={lang}>{lang} Analysis</option>
                ))}
              </select>
              <button 
                onClick={handleProcess} 
                disabled={loading || !videoFile}
                className="w-full md:flex-1 bg-white text-slate-950 px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:bg-blue-600 hover:text-white hover:scale-[1.03] active:scale-95 transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed group"
              >
                <span className="flex items-center justify-center gap-3">
                   {loading ? 'Processing...' : 'Unlock Viral Impacts'}
                   {!loading && <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>}
                </span>
              </button>
            </div>
            
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
              100% Free • No API Key Required • Browser-Based Extraction
            </p>
          </div>
        </section>

        {error && (
          <div className="max-w-2xl mx-auto p-6 bg-red-500/5 border border-red-500/20 rounded-3xl text-red-400 text-sm font-black text-center uppercase tracking-widest animate-in fade-in zoom-in">
             ⚠️ {error}
          </div>
        )}

        {clips.length > 0 && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-20 duration-1000">
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-8 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] italic">Impact Scan Result</p>
                </div>
                <h2 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter italic leading-none">High-Retention <span className="text-blue-500">Segments</span></h2>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
              {clips.map((clip, idx) => (
                <ClipCard key={idx} clip={clip} videoSrc={videoSrc!} />
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-40 space-y-12">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-t-2 border-blue-500 animate-spin"></div>
              <div className="absolute inset-0 w-32 h-32 rounded-full border-2 border-white/5"></div>
            </div>
            <div className="text-center space-y-4">
              <p className="text-white font-black uppercase tracking-[0.4em] text-sm animate-pulse">{status}</p>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;
