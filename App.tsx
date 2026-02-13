
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

// --- Types & Constants ---
export interface Clip {
  start: string;
  end: string;
  hook: string;
  caption: string;
  score: number;
  reasoning?: string;
}

export enum LanguagePreference {
  ENGLISH = 'English',
  HINDI = 'Hindi',
  HINGLISH = 'Hinglish'
}

// --- Services ---

const generateViralShorts = async (
  context: string, 
  language: LanguagePreference,
  frames?: string[]
): Promise<Clip[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `You are a World-Class Short-Form Content Strategist. Your goal is to identify segments from raw video footage that maximize "Watch Time" and "Engagement Rate".
  - Language: ${language}.
  - Target Platform: TikTok, Reels, YouTube Shorts.
  - Core Strategy: The "Golden Minute" (30-60 seconds of high-value narrative).
  - Output: Strict JSON array of objects.`;

  const parts: any[] = [{ text: `Context/Metadata: ${context}\nAnalyze these frames for visual rhythm and narrative beats.` }];
  
  if (frames && frames.length > 0) {
    frames.forEach((base64) => {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64.split(',')[1],
        },
      });
    });
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              start: { type: Type.STRING, description: "MM:SS format" },
              end: { type: Type.STRING, description: "MM:SS format" },
              hook: { type: Type.STRING, description: "Viral Headline" },
              caption: { type: Type.STRING, description: "Social Media Caption" },
              score: { type: Type.NUMBER, description: "Virality Score 0-100" },
              reasoning: { type: Type.STRING, description: "Retention logic" }
            },
            required: ["start", "end", "hook", "caption", "score", "reasoning"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No analysis returned.");
    return JSON.parse(text.trim());
  } catch (error: any) {
    console.error("Gemini AI Error:", error);
    if (error.message?.includes('401') || error.message?.includes('API key')) throw new Error("AUTH_ERROR");
    throw error;
  }
};

// --- Sub-Components ---

const Header: React.FC = () => (
  <header className="w-full py-6 px-10 flex justify-between items-center border-b border-white/5 bg-slate-950/50 backdrop-blur-xl fixed top-0 z-[100]">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 gradient-blue rounded-2xl shadow-xl flex items-center justify-center border border-white/10">
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M9.5 7.5L16.5 12L9.5 16.5V7.5Z" /></svg>
      </div>
      <span className="font-extrabold text-2xl tracking-tighter text-white">
        ClipMantra<span className="text-blue-500 opacity-80">.</span>
      </span>
    </div>
    <div className="flex items-center gap-8">
      <nav className="hidden md:flex items-center gap-8">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] hover:text-white cursor-pointer transition-colors mono">Engine</span>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] hover:text-white cursor-pointer transition-colors mono">Archive</span>
      </nav>
    </div>
  </header>
);

const ClipCard: React.FC<{ clip: Clip; videoSrc: string | null }> = ({ clip, videoSrc }) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const getSeconds = (time: string) => {
    const p = time.split(':').map(Number);
    return p.length === 2 ? p[0] * 60 + p[1] : p[0] * 3600 + p[1] * 60 + p[2];
  };

  const startSec = getSeconds(clip.start);
  const endSec = getSeconds(clip.end);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;
    const update = () => { if (video.currentTime >= endSec) video.currentTime = startSec; };
    video.addEventListener('timeupdate', update);
    return () => video.removeEventListener('timeupdate', update);
  }, [startSec, endSec, videoSrc]);

  const exportClip = async () => {
    if (!videoSrc || isExporting) return;
    setIsExporting(true);
    setProgress(0);
    try {
      // Basic simulation for demo, since full muxing is heavy
      for(let i=0; i<=100; i+=10) {
        setProgress(i);
        await new Promise(r => setTimeout(r, 200));
      }
      alert("Export complete! In this replica, export is simulated. Use the 'Copy Post' button for social readiness.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="group glass-card rounded-[3.5rem] overflow-hidden border border-white/5 flex flex-col h-full hover:scale-[1.02] transition-transform duration-500">
      <div className="aspect-[9/16] bg-black relative">
        <video 
          ref={videoRef} 
          src={`${videoSrc}#t=${startSec}`} 
          className="w-full h-full object-cover opacity-80" 
          muted={isMuted} 
          autoPlay 
          loop 
        />
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
          <div className="bg-blue-600 px-4 py-2 rounded-xl text-[10px] font-black text-white uppercase tracking-widest">{clip.score}% Viral</div>
          <div className="bg-black/60 px-3 py-2 rounded-xl text-[10px] font-black text-white mono">{clip.start} - {clip.end}</div>
        </div>
        <button onClick={() => setIsMuted(!isMuted)} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white">
            {isMuted ? <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.41.33-.86.61-1.35.84l.01 2.06c1.03-.41 1.95-1.01 2.74-1.76L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg> : <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>}
          </div>
        </button>
        {isExporting && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-white">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <span className="mono text-xs">{progress}% Processing</span>
          </div>
        )}
      </div>
      <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">{clip.hook}</h3>
          <p className="text-slate-400 text-sm mt-4 line-clamp-3">{clip.reasoning}</p>
        </div>
        <div className="flex gap-4">
          <button onClick={exportClip} className="flex-1 py-4 gradient-blue text-white text-[10px] font-black uppercase tracking-widest rounded-2xl">Export</button>
          <button onClick={() => navigator.clipboard.writeText(clip.caption)} className="px-6 bg-white/5 text-slate-400 rounded-2xl hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [language, setLanguage] = useState<LanguagePreference>(LanguagePreference.ENGLISH);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      if (videoSrc) URL.revokeObjectURL(videoSrc);
      setVideoSrc(URL.createObjectURL(file));
      setClips([]);
      setError(null);
    }
  };

  const handleGenerate = async () => {
    if (!videoFile) return;
    setIsLoading(true);
    setError(null);
    setAuthRequired(false);
    try {
      setStatus('Scanning Frames...');
      const video = document.createElement('video');
      video.src = videoSrc!;
      await new Promise(r => video.onloadedmetadata = r);
      
      const frames: string[] = [];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 480;
      canvas.height = 854;

      for (let i = 1; i <= 6; i++) {
        video.currentTime = (video.duration / 7) * i;
        await new Promise(r => video.onseeked = r);
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL('image/jpeg', 0.5));
      }

      setStatus('AI Architecture analyzing retention...');
      const result = await generateViralShorts(`Name: ${videoFile.name}`, language, frames);
      setClips(result);
    } catch (err: any) {
      if (err.message === "AUTH_ERROR") setAuthRequired(true);
      setError(err.message || "Unknown Failure");
    } finally {
      setIsLoading(false);
      setStatus('');
    }
  };

  const reconnectKey = async () => {
    try {
      await (window as any).aistudio.openSelectKey();
      setAuthRequired(false);
      setError(null);
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-600/30">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-32 space-y-24">
        <section className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-3 px-5 py-2 glass-card rounded-full border border-white/10 shadow-lg">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mono">Gemini 3.0 Pro Live</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-[0.9]">
            FREE VIRAL <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-400">HIGHLIGHTS.</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Upload any video. Our neural engine identifies high-retention moments and prepares them for social explosion.
          </p>
        </section>

        <section className="max-w-2xl mx-auto space-y-10">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`group glass-card rounded-[3.5rem] p-24 border-2 border-dashed transition-all cursor-pointer flex flex-col items-center gap-8 text-center ${videoFile ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 hover:border-blue-500/40'}`}
          >
            <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">{videoFile ? videoFile.name : "Select Video"}</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-2 mono">MP4 • MOV • WEBM</p>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFile} accept="video/*" className="hidden" />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <select 
              className="flex-1 bg-slate-900 px-8 py-5 rounded-[2rem] border border-white/10 text-xs font-black uppercase tracking-widest text-white outline-none focus:ring-2 focus:ring-blue-500/50"
              value={language}
              onChange={e => setLanguage(e.target.value as LanguagePreference)}
            >
              {Object.values(LanguagePreference).map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <button 
              onClick={handleGenerate}
              disabled={isLoading || !videoFile}
              className="flex-[1.5] py-5 gradient-blue text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl disabled:opacity-20 transition-all hover:scale-[1.02] active:scale-95"
            >
              {isLoading ? <span className="flex items-center justify-center gap-3"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> {status}</span> : "Generate Viral Clips"}
            </button>
          </div>
        </section>

        {clips.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pt-10">
            {clips.map((c, i) => <ClipCard key={i} clip={c} videoSrc={videoSrc} />)}
          </div>
        )}

        {authRequired && (
          <div className="max-w-md mx-auto p-12 glass-card rounded-[3.5rem] text-center space-y-8 border-red-500/20 shadow-2xl shadow-red-500/10">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full mx-auto flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Key Required</h2>
            <p className="text-slate-400 text-sm leading-relaxed">The environment key is missing or invalid. Please select your own Google AI Studio key to continue.</p>
            <button onClick={reconnectKey} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20">Connect AI Key</button>
          </div>
        )}
      </main>

      <footer className="py-20 border-t border-white/5 text-center opacity-30">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] mono">© {new Date().getFullYear()} CLIPMANTRA FREE • NODAL AI ENGINE</p>
      </footer>
    </div>
  );
};

export default App;
