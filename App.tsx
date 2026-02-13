
import React, { useState, useEffect, useRef } from 'react';

// --- Types ---
interface Clip {
  start: string;
  end: string;
  hook: string;
  caption: string;
  score: number;
  reasoning?: string;
}

enum LanguagePreference {
  ENGLISH = 'English',
  HINDI = 'Hindi',
  HINGLISH = 'Hinglish'
}

// --- Sub-Components ---

const Header: React.FC = () => (
  <header className="w-full py-6 px-10 flex justify-between items-center border-b border-white/5 bg-slate-950/80 backdrop-blur-2xl fixed top-0 z-[100]">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 gradient-blue rounded-2xl shadow-xl flex items-center justify-center border border-white/10">
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M9.5 7.5L16.5 12L9.5 16.5V7.5Z" /></svg>
      </div>
      <span className="font-extrabold text-2xl tracking-tighter text-white">
        ClipMantra<span className="text-blue-500 opacity-80">.</span>
      </span>
    </div>
    <div className="hidden md:flex items-center gap-6">
      <div className="px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5">
        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mono">Gemini 3.0 Flash • Cloud Engine Active</span>
      </div>
    </div>
  </header>
);

const Footer: React.FC = () => (
  <footer className="py-20 border-t border-white/5 text-center bg-slate-950">
    <div className="max-w-7xl mx-auto px-6 space-y-8 opacity-40">
      <p className="text-[10px] font-black uppercase tracking-[0.5em] mono text-white">© {new Date().getFullYear()} CLIPMANTRA FREE REPLICA • PROSECURE ENGINE</p>
      <div className="flex justify-center gap-6">
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">v3.1.0 Ready</span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Netlify Cloud Architecture</span>
      </div>
    </div>
  </footer>
);

const ClipCard: React.FC<{ clip: Clip; videoSrc: string | null }> = ({ clip, videoSrc }) => {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const parseTime = (timeStr: string) => {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  };

  const start = parseTime(clip.start);
  const end = parseTime(clip.end);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;
    const handleLoop = () => { if (video.currentTime >= end) video.currentTime = start; };
    video.addEventListener('timeupdate', handleLoop);
    return () => video.removeEventListener('timeupdate', handleLoop);
  }, [start, end, videoSrc]);

  return (
    <div className="group glass-card rounded-[3.5rem] overflow-hidden border border-white/5 flex flex-col h-full hover:scale-[1.02] transition-all duration-500 shadow-2xl hover:shadow-blue-500/20">
      <div className="aspect-[9/16] bg-black relative">
        <video 
          ref={videoRef}
          src={`${videoSrc}#t=${start}`}
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
          muted={isMuted}
          autoPlay
          loop
          playsInline
        />
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
          <div className="bg-blue-600 px-4 py-2 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-lg">{clip.score}% Viral</div>
          <div className="bg-black/80 backdrop-blur-md px-3 py-2 rounded-xl text-[10px] font-black text-white mono border border-white/10">{clip.start} - {clip.end}</div>
        </div>
        <button onClick={() => setIsMuted(!isMuted)} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
          <div className="w-16 h-16 bg-blue-600/90 rounded-full flex items-center justify-center text-white backdrop-blur-md shadow-2xl">
            {isMuted ? <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.41.33-.86.61-1.35.84l.01 2.06c1.03-.41 1.95-1.01 2.74-1.76L19.73 21 21 19.73 4.27 3z"/></svg> : <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>}
          </div>
        </button>
      </div>
      <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">{clip.hook}</h3>
          <p className="text-slate-400 text-sm leading-relaxed line-clamp-3 italic opacity-80">"{clip.reasoning}"</p>
        </div>
        <div className="flex gap-4 pt-4 border-t border-white/5">
          <button onClick={() => alert("Ready: Segment identified for your shorts.")} className="flex-1 py-4 gradient-blue text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:brightness-110 active:scale-95 transition-all">Download</button>
          <button onClick={() => { navigator.clipboard.writeText(clip.caption); alert("Viral Caption Copied!"); }} className="px-6 bg-white/5 text-slate-400 rounded-2xl hover:text-white transition-all border border-white/5">
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

  const generate = async () => {
    if (!videoFile || !videoSrc) return;
    setIsLoading(true);
    setError(null);
    try {
      setStatus('Processing Local Video...');
      const video = document.createElement('video');
      video.src = videoSrc;
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve;
        video.onerror = () => reject(new Error("Video format not supported."));
      });
      
      const frames: string[] = [];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      // Low resolution for faster cloud transmission
      canvas.width = 480;
      canvas.height = 854;

      const captureCount = 6;
      const interval = video.duration / (captureCount + 1);
      
      for (let i = 1; i <= captureCount; i++) {
        setStatus(`Analyzing Frame ${i} of ${captureCount}...`);
        video.currentTime = interval * i;
        await new Promise(r => video.onseeked = r);
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL('image/jpeg', 0.5));
      }

      setStatus('Connecting to Cloud Engine...');
      const response = await fetch('/.netlify/functions/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: videoFile.name,
          language,
          frames
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Connection to AI Cloud failed." }));
        throw new Error(errorData.error || `Server Error: ${response.status}`);
      }

      const results = await response.json();
      setClips(results);
    } catch (err: any) {
      console.error("Pipeline Error:", err);
      setError(err.message || "Failed to analyze video. Try a shorter file or different format.");
    } finally {
      setIsLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[150px] rounded-full"></div>
      
      <Header />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-40 space-y-24 relative z-10">
        <section className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-3 px-5 py-2 glass-card rounded-full border border-white/10 shadow-lg">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mono">Cloud Engine Active</span>
          </div>
          <h1 className="text-7xl md:text-9xl font-black tracking-[-0.07em] leading-[0.85] text-white">CLIPS THAT<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-400">EXPLODE.</span></h1>
          <p className="text-xl md:text-2xl text-slate-400 font-medium max-w-2xl mx-auto">Enterprise-grade viral analysis, zero cost. Powered by secure cloud-side Gemini AI.</p>
        </section>

        <section className="max-w-2xl mx-auto space-y-10">
          <div onClick={() => fileInputRef.current?.click()} className={`group relative w-full glass-card rounded-[4rem] p-24 border-2 border-dashed transition-all flex flex-col items-center gap-10 text-center cursor-pointer ${videoFile ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/10 hover:border-blue-500/40 shadow-2xl'}`}>
            <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xl">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            </div>
            <div>
              <h3 className="font-black text-3xl text-white">{videoFile ? videoFile.name : "Start Upload"}</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 mono">MP4 • WEBM • MOV</p>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFile} accept="video/*" className="hidden" />
          </div>

          <div className="flex flex-col md:flex-row gap-5">
            <select className="flex-1 bg-slate-900 px-10 py-6 rounded-[2.5rem] border border-white/10 font-black text-xs uppercase tracking-[0.2em] text-white outline-none focus:ring-2 focus:ring-blue-500/50" value={language} onChange={e => setLanguage(e.target.value as LanguagePreference)}>
              {Object.values(LanguagePreference).map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <button onClick={generate} disabled={isLoading || !videoFile} className="flex-[1.5] gradient-blue text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.35em] text-[13px] shadow-[0_20px_50px_rgba(37,99,235,0.3)] disabled:opacity-20 active:scale-95 transition-all">
              {isLoading ? <span className="flex items-center justify-center gap-4"><span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></span> {status}</span> : "Scan For Viral Highlights"}
            </button>
          </div>
        </section>

        {clips.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 pt-10 animate-in slide-in-from-bottom-10 duration-1000">
            {clips.map((c, idx) => <ClipCard key={idx} clip={c} videoSrc={videoSrc} />)}
          </div>
        )}

        {error && (
          <div className="max-w-lg mx-auto p-12 glass-card rounded-[3rem] border border-red-500/30 text-red-400 text-sm font-black uppercase tracking-[0.3em] text-center shadow-2xl">
             <div className="mb-4">⚠️ SYSTEM ALERT</div>
             <p className="mb-6 opacity-80 leading-relaxed">{error}</p>
             <button onClick={generate} className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest border border-red-500/20">Retry Pipeline</button>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default App;
