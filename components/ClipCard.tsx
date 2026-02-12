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
  const [isMuted, setIsMuted] = useState(false);
  
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    const handleTimeUpdate = () => {
      if (video.currentTime >= endSec || video.currentTime < startSec) {
        video.currentTime = startSec;
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [startSec, endSec, videoSrc]);

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

    // Stop preview audio
    if (audioRef.current) audioRef.current.pause();
    if (videoRef.current) videoRef.current.pause();

    try {
      const processorVideo = document.createElement('video');
      processorVideo.src = videoSrc;
      processorVideo.muted = false; 
      processorVideo.crossOrigin = "anonymous";
      processorVideo.playsInline = true;
      processorVideo.volume = 1.0;
      
      await new Promise((resolve) => {
        processorVideo.onloadedmetadata = resolve;
      });

      const canvas = document.createElement('canvas');
      canvas.width = processorVideo.videoWidth;
      canvas.height = processorVideo.videoHeight;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error("Canvas context failed");

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      
      // Video Audio Node
      const videoSourceNode = audioCtx.createMediaElementSource(processorVideo);
      const videoGain = audioCtx.createGain();
      videoGain.gain.value = 1.0;
      videoSourceNode.connect(videoGain);
      videoGain.connect(dest);

      // Music Audio Node (Optional)
      let musicAudio: HTMLAudioElement | null = null;
      if (useMusic && selectedMusic) {
        musicAudio = new Audio(selectedMusic.url);
        musicAudio.crossOrigin = "anonymous";
        musicAudio.loop = true;
        const musicSourceNode = audioCtx.createMediaElementSource(musicAudio);
        const musicGain = audioCtx.createGain();
        musicGain.gain.value = 0.35; // Slightly lower background music
        musicSourceNode.connect(musicGain);
        musicGain.connect(dest);
      }

      const canvasStream = canvas.captureStream(30); 
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
      ]);

      // MimeType detection
      let mimeType = 'video/mp4';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/mp4;codecs=h264';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=h264';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';

      const recorder = new MediaRecorder(combinedStream, { 
        mimeType,
        videoBitsPerSecond: 5000000 // 5Mbps for quality
      });
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const isMp4 = mimeType.includes('mp4');
        const blob = new Blob(chunks, { type: isMp4 ? 'video/mp4' : 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const extension = isMp4 ? 'mp4' : 'webm';
        a.download = `clip-${clip.hook.toLowerCase().replace(/\s+/g, '-')}.${extension}`;
        a.click();
        URL.revokeObjectURL(url);
        
        setIsProcessing(false);
        if (musicAudio) musicAudio.pause();
        audioCtx.close();
        
        // Resume preview
        if (videoRef.current) videoRef.current.play().catch(() => {});
        if (useMusic && audioRef.current) audioRef.current.play().catch(() => {});
      };

      processorVideo.currentTime = startSec;
      
      await new Promise((resolve) => {
        processorVideo.onseeked = resolve;
      });

      // Wait for audio to be ready
      await audioCtx.resume();
      recorder.start();
      
      if (musicAudio) {
        await musicAudio.play();
      }
      await processorVideo.play();

      const renderFrame = () => {
        if (processorVideo.currentTime >= endSec || processorVideo.ended) {
          if (recorder.state === 'recording') recorder.stop();
          processorVideo.pause();
          return;
        }

        ctx.drawImage(processorVideo, 0, 0, canvas.width, canvas.height);
        
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
      alert("Sound extraction failed. Ensure your browser allows auto-playing audio.");
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
            muted={isMuted}
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

        <div className="absolute top-8 right-8 z-20 flex flex-col gap-3">
          {selectedMusic && (
            <button 
              onClick={() => setUseMusic(!useMusic)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-2xl border-2 ${
                useMusic ? 'bg-blue-600 border-blue-400 text-white animate-pulse' : 'bg-black/40 border-white/10 text-white hover:bg-black/60'
              }`}
              title="Toggle Background Music"
            >
               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
            </button>
          )}
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="w-12 h-12 rounded-full bg-black/40 border-2 border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-all shadow-2xl"
          >
            {isMuted ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            )}
          </button>
        </div>
      </div>

      {selectedMusic && <audio ref={audioRef} src={selectedMusic.url} loop crossOrigin="anonymous" />}

      <div className="p-10 flex flex-col flex-grow bg-white dark:bg-slate-900 border-t border-slate-50 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-blue-600"></div>
             <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Viral Highlight</span>
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
                  Extracting Sound... {progress}%
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  Download Viral Clip
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