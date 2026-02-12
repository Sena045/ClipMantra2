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
  const [isMuted, setIsMuted] = useState(true);
  
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

    // Stop current previews
    if (audioRef.current) audioRef.current.pause();
    if (videoRef.current) videoRef.current.pause();

    let animationFrameId: number;
    let musicAudio: HTMLAudioElement | null = null;
    let audioCtx: AudioContext | null = null;
    let processorVideo: HTMLVideoElement | null = null;
    let lastTime = 0;
    let stuckCounter = 0;

    try {
      processorVideo = document.createElement('video');
      // Some browsers require the element to be in the DOM to play audio
      processorVideo.style.position = 'fixed';
      processorVideo.style.left = '-9999px';
      processorVideo.muted = false; 
      processorVideo.crossOrigin = "anonymous";
      processorVideo.playsInline = true;
      processorVideo.volume = 1.0;
      processorVideo.src = videoSrc;
      document.body.appendChild(processorVideo);
      
      await new Promise((resolve, reject) => {
        if (!processorVideo) return reject();
        processorVideo.oncanplaythrough = resolve;
        processorVideo.onerror = () => reject(new Error("Video source could not be loaded."));
        // Force resolve if it takes too long but readyState is high enough
        setTimeout(() => processorVideo!.readyState >= 3 ? resolve(null) : reject(new Error("Timeout loading video.")), 8000);
      });

      const canvas = document.createElement('canvas');
      canvas.width = processorVideo.videoWidth;
      canvas.height = processorVideo.videoHeight;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error("Canvas rendering context unavailable.");

      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.state === 'suspended') await audioCtx.resume();

      const dest = audioCtx.createMediaStreamDestination();
      
      // Connect Video Sound
      const videoSourceNode = audioCtx.createMediaElementSource(processorVideo);
      const videoGain = audioCtx.createGain();
      videoGain.gain.value = 1.0;
      videoSourceNode.connect(videoGain);
      videoGain.connect(dest);
      
      // Silent destination to keep context active
      const silentGain = audioCtx.createGain();
      silentGain.gain.value = 0.0001; 
      videoGain.connect(silentGain);
      silentGain.connect(audioCtx.destination);

      // Background Music Sound
      if (useMusic && selectedMusic) {
        musicAudio = new Audio(selectedMusic.url);
        musicAudio.crossOrigin = "anonymous";
        musicAudio.loop = true;
        const musicSourceNode = audioCtx.createMediaElementSource(musicAudio);
        const musicGain = audioCtx.createGain();
        musicGain.gain.value = 0.35; 
        musicSourceNode.connect(musicGain);
        musicGain.connect(dest);
      }

      // Build Combined Stream
      const canvasStream = canvas.captureStream(30);
      const combinedStream = new MediaStream();
      canvasStream.getVideoTracks().forEach(t => combinedStream.addTrack(t));
      dest.stream.getAudioTracks().forEach(t => combinedStream.addTrack(t));

      // MimeType Selection (Priority for MP4)
      const mimeTypes = [
        'video/mp4;codecs=h264,aac',
        'video/mp4;codecs=avc1,aac',
        'video/mp4',
        'video/webm;codecs=h264,opus',
        'video/webm'
      ];
      const selectedMime = mimeTypes.find(t => MediaRecorder.isTypeSupported(t)) || 'video/webm';
      const isMp4 = selectedMime.includes('mp4');

      const recorder = new MediaRecorder(combinedStream, { 
        mimeType: selectedMime,
        videoBitsPerSecond: 8000000, // 8 Mbps for high quality
        audioBitsPerSecond: 128000
      });
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const cleanup = () => {
        if (recorder.state !== 'inactive') recorder.stop();
        if (processorVideo) {
          processorVideo.pause();
          if (processorVideo.parentElement) document.body.removeChild(processorVideo);
        }
        if (musicAudio) musicAudio.pause();
        if (audioCtx) audioCtx.close();
        cancelAnimationFrame(animationFrameId);
        setIsProcessing(false);
        
        // Resume UI Previews
        if (videoRef.current) videoRef.current.play().catch(() => {});
        if (useMusic && audioRef.current) audioRef.current.play().catch(() => {});
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: selectedMime });
        const url = URL.createObjectURL(finalBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clip-${clip.hook.toLowerCase().replace(/\s+/g, '-')}.${isMp4 ? 'mp4' : 'webm'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        cleanup();
      };

      // Set start time and wait for seek
      processorVideo.currentTime = startSec;
      await new Promise(r => {
        processorVideo!.onseeked = r;
        setTimeout(r, 2000); // Safety timeout
      });

      // Buffer time for stability
      await new Promise(r => setTimeout(r, 500));

      // Start
      recorder.start();
      if (musicAudio) await musicAudio.play();
      await processorVideo.play();

      const renderLoop = () => {
        if (!processorVideo || !ctx) return;

        // Stuck Detection Heartbeat
        if (processorVideo.currentTime === lastTime && !processorVideo.paused) {
          stuckCounter++;
        } else {
          stuckCounter = 0;
          lastTime = processorVideo.currentTime;
        }

        if (stuckCounter > 120) { // Approx 2 seconds of frozen playback
          console.error("Recording stuck detected.");
          cleanup();
          alert("Recording stalled. This happens with very large files. Try refreshing.");
          return;
        }

        // Completion check
        if (processorVideo.currentTime >= endSec || processorVideo.ended) {
          recorder.stop();
          return;
        }

        // Frame Rendering
        ctx.drawImage(processorVideo, 0, 0, canvas.width, canvas.height);
        
        // Progress Calc
        const p = Math.max(0, Math.min(Math.round(((processorVideo.currentTime - startSec) / duration) * 100), 100));
        setProgress(p);

        animationFrameId = requestAnimationFrame(renderLoop);
      };

      renderLoop();

    } catch (err) {
      console.error("Download Error:", err);
      setIsProcessing(false);
      if (processorVideo && processorVideo.parentElement) document.body.removeChild(processorVideo);
      alert("Failed to render video. Check if the video has an audio track and your browser supports Media Recording.");
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
                  Extracting MP4... {progress}%
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  Download Viral MP4
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