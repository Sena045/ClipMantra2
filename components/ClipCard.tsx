
import React, { useState, useRef, useEffect } from 'react';
import { Clip, MusicTrack } from '../types.ts';

interface ClipCardProps {
  clip: Clip;
  videoSrc: string | null;
  youtubeId: null;
  index: number;
  selectedMusic: MusicTrack | null;
}

const ClipCard: React.FC<ClipCardProps> = ({ clip, videoSrc, index, selectedMusic }) => {
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [useMusic, setUseMusic] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const getSeconds = (timeStr: string) => {
    const parts = timeStr.trim().split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  };

  const startSec = getSeconds(clip.start);
  const endSec = getSeconds(clip.end);
  const duration = endSec - startSec;

  // Preview Looping Logic for the UI player
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    const handleTimeUpdate = () => {
      // Ensure it stays within bounds during preview
      if (video.currentTime >= endSec || video.currentTime < startSec) {
        video.currentTime = startSec;
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [startSec, endSec, videoSrc]);

  // Sync music with the preview player
  useEffect(() => {
    if (useMusic && selectedMusic && audioRef.current) {
      audioRef.current.volume = 0.4;
      audioRef.current.play().catch(() => {});
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [useMusic, selectedMusic]);

  const handleDownload = async () => {
    if (!videoSrc || isProcessing) return;

    setIsProcessing(true);
    setProgress(0);

    // Stop preview music if it's playing to avoid overlapping sounds
    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      // 1. Create Processor Elements
      const processorVideo = document.createElement('video');
      processorVideo.src = videoSrc;
      processorVideo.muted = false; 
      processorVideo.crossOrigin = "anonymous";
      processorVideo.playsInline = true;
      
      // Load metadata to get dimensions
      await new Promise((resolve) => {
        processorVideo.onloadedmetadata = resolve;
      });

      const canvas = document.createElement('canvas');
      canvas.width = processorVideo.videoWidth;
      canvas.height = processorVideo.videoHeight;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error("Canvas context failed");

      // 2. Setup Audio Routing - SILENT EXTRACTION
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      
      // Video audio routing
      const videoSourceNode = audioCtx.createMediaElementSource(processorVideo);
      videoSourceNode.connect(dest);
      // NOTE: We do NOT connect to audioCtx.destination here to keep it silent during processing

      let musicAudio: HTMLAudioElement | null = null;
      if (useMusic && selectedMusic) {
        musicAudio = new Audio(selectedMusic.url);
        musicAudio.crossOrigin = "anonymous";
        musicAudio.loop = true;
        const musicSourceNode = audioCtx.createMediaElementSource(musicAudio);
        const musicGain = audioCtx.createGain();
        musicGain.gain.value = 0.5; 
        musicSourceNode.connect(musicGain);
        musicGain.connect(dest);
        // NOTE: Again, we do NOT connect musicGain to audioCtx.destination
      }

      // 3. Prepare Recording Stream
      const canvasStream = canvas.captureStream(30); 
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
      ]);

      // Detect best codec
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=h264') 
        ? 'video/webm;codecs=h264' 
        : 'video/webm;codecs=vp9,opus';

      const recorder = new MediaRecorder(combinedStream, { mimeType });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clip-${clip.start.replace(/:/g, '-')}-to-${clip.end.replace(/:/g, '-')}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsProcessing(false);
        if (musicAudio) musicAudio.pause();
        audioCtx.close();
        
        // Resume preview music if it was enabled
        if (useMusic && audioRef.current) audioRef.current.play().catch(() => {});
      };

      // 4. THE CRITICAL PART: Gated Seek & Start
      processorVideo.currentTime = startSec;
      
      await new Promise((resolve) => {
        processorVideo.onseeked = resolve;
      });

      // Give browser a tiny moment to settle frames
      await new Promise(r => setTimeout(r, 150));

      await audioCtx.resume();
      recorder.start();
      if (musicAudio) {
        // Start music at the exact same moment
        musicAudio.play();
      }
      processorVideo.play();

      const renderFrame = () => {
        // Strict boundary check
        if (processorVideo.currentTime >= endSec || processorVideo.ended) {
          if (recorder.state === 'recording') {
            recorder.stop();
          }
          processorVideo.pause();
          return;
        }

        // Draw current video frame to canvas for the recorder
        ctx.drawImage(processorVideo, 0, 0, canvas.width, canvas.height);
        
        // Update Progress
        const elapsed = processorVideo.currentTime - startSec;
        const p = Math.max(0, Math.min(Math.round((elapsed / duration) * 100), 100));
        setProgress(p);

        if (recorder.state === 'recording') {
          requestAnimationFrame(renderFrame);
        }
      };

      renderFrame();

    } catch (err) {
      console.error("Clipping Error:", err);
      setIsProcessing(false);
      alert("Extraction failed. Please try a different video or check your browser permissions.");
    }
  };

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl border border-slate-100 dark:border-slate-800/50 hover:shadow-blue-500/10 transition-all duration-700 flex flex-col h-full overflow-hidden">
      
      <div className="aspect-[9/16] bg-slate-950 relative overflow-hidden">
        {videoSrc ? (
          <video
            ref={videoRef}
            src={`${videoSrc}#t=${startSec},${endSec}`}
            className="w-full h-full object-cover"
            muted={!useMusic}
            playsInline
            autoPlay
            loop
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        <div className="absolute top-8 left-8 z-20 flex flex-col gap-3">
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-2xl backdrop-blur-xl bg-blue-600 text-white border border-blue-400/30">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            {clip.score}% Viral Rank
          </div>
          <div className="px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-2xl backdrop-blur-md bg-black/60 text-white border border-white/10">
            {clip.start} — {clip.end}
          </div>
        </div>

        {selectedMusic && (
          <button 
            onClick={() => setUseMusic(!useMusic)}
            className={`absolute top-8 right-8 z-20 w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-2xl border-2 ${
              useMusic ? 'bg-blue-600 border-blue-400 text-white animate-pulse' : 'bg-black/40 border-white/10 text-white hover:bg-black/60'
            }`}
          >
             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
          </button>
        )}
      </div>

      {selectedMusic && <audio ref={audioRef} src={selectedMusic.url} loop crossOrigin="anonymous" />}

      <div className="p-10 flex flex-col flex-grow bg-white dark:bg-slate-900 border-t border-slate-50 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-blue-600"></div>
             <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Selected Segment</span>
           </div>
           <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-tighter">CLIP #{index + 1}</span>
        </div>
        
        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 leading-[1.15] uppercase tracking-tighter line-clamp-2">
          {clip.hook}
        </h3>

        <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-10 leading-relaxed font-medium line-clamp-3 italic">
          "{clip.caption}"
        </p>

        <div className="mt-auto space-y-4">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(clip.caption);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className={`w-full py-4 rounded-[1.25rem] text-[9px] font-black uppercase tracking-[0.25em] transition-all border ${
              copied ? 'bg-emerald-500 border-emerald-400 text-white' : 'text-slate-400 dark:text-slate-500 hover:text-blue-600 border-slate-100 dark:border-slate-800'
            }`}
          >
            {copied ? '✓ Caption Ready' : 'Copy Viral Caption'}
          </button>
          
          <button 
            onClick={handleDownload}
            disabled={isProcessing}
            className="group relative w-full py-6 rounded-3xl text-[11px] font-black uppercase tracking-[0.3em] transition-all bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-2xl hover:translate-y-[-2px] active:scale-95 flex items-center justify-center gap-3 overflow-hidden disabled:opacity-95"
          >
            {isProcessing && (
              <div 
                className="absolute left-0 top-0 h-full bg-blue-600/40 transition-all duration-100 ease-out" 
                style={{ width: `${progress}%` }}
              />
            )}
            <span className="relative z-10 flex items-center gap-3">
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  Extracting... {progress}%
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  Get Viral Segment
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClipCard;
