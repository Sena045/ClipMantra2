
import React, { useState, useRef, useEffect } from 'react';
import { Clip, MusicTrack } from '../types.ts';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

interface ClipCardProps {
  clip: Clip;
  videoSrc: string | null;
  selectedMusic: MusicTrack | null;
}

const ClipCard: React.FC<ClipCardProps> = ({ clip, videoSrc }) => {
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const getSeconds = (timeStr: string) => {
    const parts = timeStr.trim().split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  };

  const startSec = getSeconds(clip.start);
  const endSec = getSeconds(clip.end);
  const clipDuration = Math.max(0.1, endSec - startSec);

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

  const handleDownload = async () => {
    if (!videoSrc || isProcessing) return;
    
    if (!(window as any).VideoEncoder || !(window as any).AudioEncoder) {
      alert("Browser does not support WebCodecs. Please use Chrome/Edge.");
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    let processorVideo: HTMLVideoElement | null = null;
    let audioCtx: AudioContext | null = null;

    try {
      const response = await fetch(videoSrc);
      const arrayBuffer = await response.arrayBuffer();
      audioCtx = new AudioContext({ sampleRate: 44100 });
      const fullAudioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      
      processorVideo = document.createElement('video');
      processorVideo.crossOrigin = "anonymous";
      processorVideo.src = videoSrc;
      processorVideo.muted = true;
      
      await new Promise((resolve, reject) => {
        if (processorVideo!.readyState >= 1) resolve(null);
        processorVideo!.onloadedmetadata = () => resolve(null);
        processorVideo!.onerror = () => reject(new Error("Video load failed"));
      });

      const width = (processorVideo.videoWidth || 720) & ~1;
      const height = (processorVideo.videoHeight || 1280) & ~1;

      const muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video: { 
          codec: 'avc', 
          width, 
          height,
          displayAspectWidth: width,
          displayAspectHeight: height
        },
        audio: { 
          codec: 'aac', 
          numberOfChannels: 2, 
          sampleRate: 44100 
        },
        fastStart: 'in-memory'
      });

      const videoEncoder = new (window as any).VideoEncoder({
        output: (chunk: any, metadata: any) => muxer.addVideoChunk(chunk, metadata),
        error: (e: any) => console.error("VideoEncoder:", e)
      });
      videoEncoder.configure({ 
        codec: 'avc1.42E01E', 
        width, 
        height, 
        bitrate: 6_000_000, 
        framerate: 30,
        latencyMode: 'quality' 
      });

      const audioEncoder = new (window as any).AudioEncoder({
        output: (chunk: any, metadata: any) => muxer.addAudioChunk(chunk, metadata),
        error: (e: any) => console.error("AudioEncoder:", e)
      });
      audioEncoder.configure({ 
        codec: 'mp4a.40.2', 
        numberOfChannels: 2, 
        sampleRate: 44100, 
        bitrate: 128_000 
      });

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });

      // Audio Pass
      const sampleRate = 44100;
      const startFrame = Math.floor(startSec * sampleRate);
      const endFrame = Math.min(Math.floor(endSec * sampleRate), fullAudioBuffer.length);
      const totalAudioFrames = endFrame - startFrame;
      
      const audioChunkSize = 2048;
      for (let i = 0; i < totalAudioFrames; i += audioChunkSize) {
        const size = Math.min(audioChunkSize, totalAudioFrames - i);
        const combinedData = new Float32Array(size * 2);
        const ch0 = fullAudioBuffer.getChannelData(0);
        const ch1 = fullAudioBuffer.numberOfChannels > 1 ? fullAudioBuffer.getChannelData(1) : ch0;
        
        combinedData.set(ch0.subarray(startFrame + i, startFrame + i + size), 0);
        combinedData.set(ch1.subarray(startFrame + i, startFrame + i + size), size);

        const audioData = new (window as any).AudioData({
          format: 'f32-planar',
          sampleRate: 44100,
          numberOfFrames: size,
          numberOfChannels: 2,
          timestamp: Math.floor((i / sampleRate) * 1_000_000),
          data: combinedData,
        });
        
        audioEncoder.encode(audioData);
        audioData.close();
      }

      // Video Pass
      let currentTime = startSec;
      const fps = 30;
      const frameStep = 1 / fps;
      let frameCount = 0;

      while (currentTime <= endSec) {
        const seekTime = Math.min(currentTime, endSec);
        processorVideo.currentTime = seekTime;
        
        await new Promise(r => {
          const onSeeked = () => {
            processorVideo!.removeEventListener('seeked', onSeeked);
            r(null);
          };
          processorVideo!.addEventListener('seeked', onSeeked);
        });
        
        if (ctx) {
          ctx.drawImage(processorVideo, 0, 0, width, height);
        }

        const timestamp = Math.floor((currentTime - startSec) * 1_000_000);
        const frame = new (window as any).VideoFrame(canvas, { timestamp });
        
        videoEncoder.encode(frame, { keyFrame: frameCount % 60 === 0 });
        frame.close();
        
        frameCount++;
        setProgress(Math.min(99, Math.round(((currentTime - startSec) / clipDuration) * 100)));
        
        if (currentTime >= endSec) break;
        currentTime += frameStep;
        if (frameCount % 15 === 0) await new Promise(r => setTimeout(r, 0));
      }

      await videoEncoder.flush();
      await audioEncoder.flush();
      muxer.finalize();

      const buffer = (muxer.target as ArrayBufferTarget).buffer;
      const blob = new Blob([buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `viral-clip-${clip.hook.toLowerCase().replace(/\s+/g, '-')}.mp4`;
      a.click();
      URL.revokeObjectURL(url);

    } catch (err: any) {
      console.error("Export Error:", err);
      alert("Export Error: " + err.message);
    } finally {
      setIsProcessing(false);
      if (audioCtx) await audioCtx.close();
      if (processorVideo) processorVideo.remove();
    }
  };

  return (
    <div className="group relative glass-card rounded-[3.5rem] overflow-hidden shadow-2xl transition-all duration-700 hover:scale-[1.02] hover:shadow-blue-500/20 flex flex-col h-full border border-white/5">
      <div className="aspect-[9/16] bg-slate-950 relative overflow-hidden">
        <video
          ref={videoRef}
          src={`${videoSrc}#t=${startSec},${endSec}`}
          className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-700"
          muted={isMuted}
          playsInline
          autoPlay
          loop
        />
        
        {/* Retention Visualizer */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/5 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 transition-all duration-1000" 
            style={{ width: `${clip.score}%`, boxShadow: '0 0 15px rgba(37, 99, 235, 0.5)' }}
          ></div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/20 pointer-events-none"></div>

        {/* Metadata Badges */}
        <div className="absolute top-8 left-8 right-8 flex justify-between items-start pointer-events-none">
          <div className="bg-blue-600/90 backdrop-blur-2xl px-5 py-2.5 rounded-[1.2rem] shadow-2xl flex items-center gap-2.5 border border-white/20">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span className="text-[10px] font-black text-white uppercase tracking-[0.25em] mono">{clip.score}% Viral Potency</span>
          </div>
          <div className="bg-black/80 backdrop-blur-2xl px-4 py-2.5 rounded-[1.2rem] text-[10px] font-black text-slate-100 border border-white/10 mono tracking-widest flex items-center gap-2">
            <span>{clip.start}</span>
            <span className="opacity-30">/</span>
            <span>{clip.end}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 opacity-0 group-hover:opacity-100 transition-all duration-500">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="w-20 h-20 bg-blue-600/80 backdrop-blur-3xl rounded-full text-white flex items-center justify-center border border-white/30 hover:scale-110 transition-all pointer-events-auto shadow-blue-500/20 shadow-2xl active:scale-90"
          >
            {isMuted ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.41.33-.86.61-1.35.84l.01 2.06c1.03-.41 1.95-1.01 2.74-1.76L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
            ) : (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            )}
          </button>
        </div>
        
        {isProcessing && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-[40px] flex flex-col items-center justify-center text-white p-12 text-center z-50 animate-in fade-in duration-700">
            <div className="w-28 h-28 relative mb-10">
               <div className="absolute inset-0 border-[8px] border-white/5 rounded-full"></div>
               <div 
                 className="absolute inset-0 border-[8px] border-blue-500 border-t-transparent rounded-full animate-spin"
                 style={{ animationDuration: '1.5s' }}
               ></div>
               <span className="absolute inset-0 flex items-center justify-center text-[12px] font-black mono">{progress}%</span>
            </div>
            <p className="text-[13px] font-black uppercase tracking-[0.5em] text-blue-400 mono">Generating Master</p>
            <p className="text-[10px] text-slate-500 mt-4 uppercase tracking-[0.2em] leading-relaxed">Processing 30FPS • HEVC High</p>
          </div>
        )}
      </div>

      <div className="p-10 space-y-8 flex-1 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2.5">
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-widest rounded-lg">High Retention ({Math.round(clipDuration)}s)</span>
            <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-400 uppercase tracking-widest rounded-lg">Narrative Logic</span>
          </div>
          
          <h3 className="text-3xl font-black text-white leading-[1.1] tracking-tighter uppercase group-hover:text-blue-400 transition-colors duration-500">
            {clip.hook}
          </h3>
          
          <p className="text-[13px] text-slate-400 font-medium leading-relaxed line-clamp-3">
            {clip.reasoning}
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleDownload}
            disabled={isProcessing}
            className="flex-1 py-6 gradient-blue text-white text-[12px] font-black uppercase tracking-[0.35em] rounded-[2rem] hover:brightness-110 hover:shadow-blue-500/30 shadow-xl transition-all active:scale-[0.98] disabled:opacity-30 border border-white/10"
          >
            Export Clip
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(clip.caption);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="w-20 flex items-center justify-center bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-[2rem] transition-all border border-white/5 active:scale-90"
            title="Copy Social Post"
          >
            {copied ? (
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClipCard;
