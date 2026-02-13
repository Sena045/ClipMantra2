
import React, { useState, useEffect, useRef } from 'react';

// --- Types ---
interface Clip {
  start: string;
  end: string;
  hook: string;
  caption: string;
  score: number;
  reasoning: string;
  duration?: string;
}

enum LanguagePreference {
  ENGLISH = 'English',
  HINDI = 'Hindi',
  HINGLISH = 'Hinglish'
}

// --- Sub-Components ---

const Header: React.FC = () => (
  <header className="w-full py-6 px-8 flex justify-between items-center border-b border-white/5 bg-slate-950/80 backdrop-blur-xl fixed top-0 z-[100]">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 gradient-blue rounded-xl shadow-lg flex items-center justify-center border border-white/10">
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M9.5 7.5L16.5 12L9.5 16.5V7.5Z" /></svg>
      </div>
      <span className="font-extrabold text-2xl tracking-tighter text-white">
        ClipMantra<span className="text-blue-500">.</span>
      </span>
    </div>
    <div className="hidden md:flex items-center gap-4">
      <div className="px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5">
        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mono">Engine v5.0 Secure</span>
      </div>
    </div>
  </header>
);

const Footer: React.FC = () => (
  <footer className="py-16 border-t border-white/5 text-center bg-slate-950">
    <div className="max-w-7xl mx-auto px-6 opacity-40">
      <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500">
        © {new Date().getFullYear()} CLIPMANTRA REPLICA • SECURE CLOUD PIPELINE
      </p>
    </div>
  </footer>
);

const ClipCard: React.FC<{ clip: Clip; videoSrc: string | null }> = ({ clip, videoSrc }) => {
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const parseTime = (timeStr: string) => {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  };

  const start = parseTime(clip.start);
  const end = parseTime(clip.end);
  const totalDuration = Math.max(end - start, 1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;
    
    const handleTimeUpdate = () => {
      if (video.currentTime >= end || video.currentTime < start) {
        video.currentTime = start;
      }
      const currentPos = video.currentTime - start;
      setProgress((currentPos / totalDuration) * 100);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [start, end, videoSrc, totalDuration]);

  return (
    <div className="group glass-card rounded-[2.5rem] overflow-hidden border border-white/10 flex flex-col h-full hover:scale-[1.02] transition-all duration-500 shadow-2xl hover:shadow-blue-500/20">
      <div className="aspect-[9/16] bg-black relative cursor-pointer" onClick={() => setIsMuted(!isMuted)}>
        <video 
          ref={videoRef}
          src={`${videoSrc}#t=${start}`}
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
          muted={isMuted}
          autoPlay
          loop
          playsInline
        />
        
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
          <div 
            className="h-full bg-blue-500 transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(59,130,246,0.8)]" 
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="absolute top-5 left-5 right-5 flex justify-between items-start pointer-events-none">
          <div className="bg-blue-600 px-3 py-1.5 rounded-lg text-[9px] font-black text-white uppercase tracking-widest shadow-xl flex items-center gap-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            {clip.score}% Viral
          </div>
          <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-black text-white mono border border-white/10">
            {clip.start} - {clip.end}
          </div>
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
          <div className="w-14 h-14 bg-blue-600/90 rounded-full flex items-center justify-center text-white backdrop-blur-md shadow-2xl">
            {isMuted ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.41.33-.86.61-1.35.84l.01 2.06c1.03-.41 1.95-1.01 2.74-1.76L19.73 21 21 19.73 4.27 3z"/></svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-8 space-y-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-xl font-black text-white tracking-tight leading-tight uppercase italic flex-1">{clip.hook}</h3>
          {clip.duration && <span className="text-[10px] font-bold text-slate-500 mono pt-1">{clip.duration}s</span>}
        </div>
        <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 opacity-80">{clip.reasoning}</p>
        
        <div className="pt-4 mt-auto border-t border-white/5 flex gap-3">
          <button className="flex-1 py-3 gradient-blue text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all">
            Download HD
          </button>
          <button 
            onClick={() => { navigator.clipboard.writeText(clip.caption); alert("Viral Caption Copied!"); }}
            className="px-4 bg-white/5 text-slate-400 rounded-xl hover:text-white hover:bg-white/10 transition-all border border-white/5"
            title="Copy Caption"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
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

  const generate = async () => {
    if (!videoFile || !videoSrc) return;
    setIsLoading(true);
    setError(null);
    setClips([]);
    
    try {
      setStatus('Deep Scanning Timeline...');
      const video = document.createElement('video');
      video.src = videoSrc;
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });
      
      const frames: string[] = [];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 270;
      canvas.height = 480;

      const captureCount = 15; 
      const interval = video.duration / (captureCount + 1);
      
      for (let i = 1; i <= captureCount; i++) {
        setStatus(`Indexing Frames ${i}/${captureCount}...`);
        video.currentTime = interval * i;
        await new Promise(r => video.onseeked = r);
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL('image/jpeg', 0.4));
      }

      setStatus('Secure AI Processing...');
      
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'The server pipeline encountered an issue.');
      }

      const parsedClips = await response.json();
      setClips(parsedClips);
    } catch (err: any) {
      console.error("Pipeline Failure:", err);
      setError(err.message || "The secure AI engine encountered a momentary glitch.");
    } finally {
      setIsLoading(false);
      setStatus('');
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      if (videoSrc) URL.revokeObjectURL(videoSrc);
      setVideoSrc(URL.createObjectURL(file));
      setClips([]);
      setError(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-600/30">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[180px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-600/5 blur-[180px] rounded-full"></div>
      </div>

      <Header />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-40 space-y-24 relative z-10">
        <section className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 glass-card rounded-full border border-white/10 shadow-xl">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mono">Secure Server Pipeline</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-white">
            CLIPS DONE<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-600 to-emerald-400">THE RIGHT WAY.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            Extract up to 10 viral segments securely. All AI logic is now handled in the cloud, keeping your application fast and private.
          </p>
        </section>

        <section className="max-w-xl mx-auto space-y-8">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`group relative w-full glass-card rounded-[3rem] p-16 border-2 border-dashed transition-all cursor-pointer flex flex-col items-center gap-8 text-center ${videoFile ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 hover:border-blue-500/40 hover:bg-white/5 shadow-2xl'}`}
          >
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:scale-110 group-hover:text-blue-500 transition-all">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
            </div>
            <div>
              <h3 className="font-bold text-xl text-white line-clamp-1">{videoFile ? videoFile.name : "Select Video Source"}</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 mono">AI EXTRACTS UP TO 10 CLIPS</p>
            </div>
            <input type="file" ref={fileInputRef} onChange={onFileChange} accept="video/*" className="hidden" />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <select 
              className="flex-1 bg-slate-900 px-6 py-5 rounded-2xl border border-white/10 font-black text-[10px] uppercase tracking-widest text-white outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
              value={language}
              onChange={e => setLanguage(e.target.value as LanguagePreference)}
            >
              {Object.values(LanguagePreference).map(l => <option key={l} value={l}>{l} Strategy</option>)}
            </select>
            <button 
              onClick={generate}
              disabled={isLoading || !videoFile}
              className="flex-[1.5] gradient-blue text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl disabled:opacity-20 active:scale-95 transition-all"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  {status}
                </span>
              ) : "Extract Viral Clips"}
            </button>
          </div>
        </section>

        {clips.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pt-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            {clips.map((c, idx) => <ClipCard key={idx} clip={c} videoSrc={videoSrc} />)}
          </div>
        )}

        {error && (
          <div className="max-w-lg mx-auto p-10 glass-card rounded-[2.5rem] border border-red-500/20 text-center space-y-6">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-400 mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <p className="text-red-400 font-bold tracking-tight">{error}</p>
            <button onClick={generate} className="px-6 py-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400 transition-colors">
              Retry Secure Scan
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default App;
