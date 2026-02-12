import React, { useState, useRef, useEffect } from 'react';
import { Clip, MusicTrack } from '../types.ts';
import * as mp4Muxer from 'mp4-muxer';

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
  const duration = Math.max(0.1, endSec - startSec);

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
      alert("Your browser does not support WebCodecs. Please use a modern version of Chrome or Edge.");
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    let processorVideo: HTMLVideoElement | null = null;
    let audioCtx: AudioContext | null = null;

    try {
      // 1. Prepare Audio Data
      // Fetch the video file and decode its audio to a buffer for precise clipping
      const response = await fetch(videoSrc);
      const arrayBuffer = await response.arrayBuffer();
      
      audioCtx = new AudioContext({ sampleRate: 44100 });
      const fullAudioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      
      // 2. Setup Video Processor
      processorVideo = document.createElement('video');
      processorVideo.src = videoSrc;
      processorVideo.muted = true;
      processorVideo.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        processorVideo!.onloadedmetadata = resolve;
        processorVideo!.onerror = () => reject(new Error("Failed to load video metadata"));
      });

      const width = (processorVideo.videoWidth || 720) & ~1;
      const height = (processorVideo.videoHeight || 1280) & ~1;

      // 3. Setup Muxer and Encoders
      const muxer = new mp4Muxer.Muxer({
        target: new mp4Muxer.ArrayBufferTarget(),
        video: { codec: 'avc', width, height },
        audio: { codec: 'aac', numberOfChannels: 2, sampleRate: 44100 },
        fastStart: 'in-memory'
      });

      const videoEncoder = new (window as any).VideoEncoder({
        output: (chunk: any, metadata: any) => muxer.addVideoChunk(chunk, metadata),
        error: (e: any) => console.error("Video Encoder Error:", e)
      });
      videoEncoder.configure({ 
        codec: 'avc1.42E01E', 
        width, 
        height, 
        bitrate: 4_000_000, 
        framerate: 30,
        latencyMode: 'quality' 
      });

      const audioEncoder = new (window as any).AudioEncoder({
        output: (chunk: any, metadata: any) => muxer.addAudioChunk(chunk, metadata),
        error: (e: any) => console.error("Audio Encoder Error:", e)
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

      // 4. Encode Audio (Precise Slice)
      const sampleRate = 44100;
      const startFrame = Math.floor(startSec * sampleRate);
      const endFrame = Math.floor(endSec * sampleRate);
      const totalAudioFrames = endFrame - startFrame;
      
      const audioChunkSize = 2048;
      for (let i = 0; i < totalAudioFrames; i += audioChunkSize) {
        const size = Math.min(audioChunkSize, totalAudioFrames - i);
        
        // Prepare planar data: Channel 0 data followed by Channel 1 data for 'f32-planar'
        const combinedData = new Float32Array(size * 2);
        const ch0 = fullAudioBuffer.getChannelData(0);
        // Fallback to mono if needed
        const ch1 = fullAudioBuffer.numberOfChannels > 1 ? fullAudioBuffer.getChannelData(1) : ch0;
        
        combinedData.set(ch0.subarray(startFrame + i, startFrame + i + size), 0);
        combinedData.set(ch1.subarray(startFrame + i, startFrame + i + size), size);

        const audioData = new (window as any).AudioData({
          format: 'f32-planar',
          sampleRate: 44100,
          numberOfFrames: size,
          numberOfChannels: 2,
          timestamp: (i / sampleRate) * 1_000_000,
          data: combinedData,
        });
        
        audioEncoder.encode(audioData);
        audioData.close();
      }

      // 5. Encode Video Frames
      let currentTime = startSec;
      const frameStep = 1 / 30; // Aim for 30fps output
      let frameCount = 0;

      while (currentTime < endSec) {
        processorVideo.currentTime = currentTime;
        await new Promise(r => {
          const onSeeked = () => {
            processorVideo!.removeEventListener('seeked', onSeeked);
            r(null);
          };
          processorVideo!.addEventListener('seeked', onSeeked);
        });
        
        ctx?.drawImage(processorVideo, 0, 0, width, height);
        const timestamp = (currentTime - startSec) * 1_000_000;
        const frame = new (window as any).VideoFrame(canvas, { timestamp });
        
        // Force keyframes periodically to ensure smooth playback
        videoEncoder.encode(frame, { keyFrame: frameCount % 60 === 0 });
        frame.close();
        
        frameCount++;
        currentTime += frameStep;
        setProgress(Math.min(99, Math.round(((currentTime - startSec) / duration) * 100)));
        
        // Yield to prevent UI freeze and keep memory usage in check
        if (frameCount % 15 === 0) await new Promise(r => setTimeout(r, 0));
      }

      // 6. Finalize
      await videoEncoder.flush();
      await audioEncoder.flush();
      muxer.finalize();

      const buffer = (muxer.target as mp4Muxer.ArrayBufferTarget).buffer;
      const blob = new Blob([buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clip-${clip.hook.toLowerCase().replace(/\s+/g, '-')}.mp4`;
      a.click();
      URL.revokeObjectURL(url);

    } catch (err: any) {
      console.error("Export failed:", err);
      alert("Export failed: " + err.message);
    } finally {
      setIsProcessing(false);
      if (audioCtx) await audioCtx.close();
      if (processorVideo) processorVideo.remove();
    }
  };

  return (
    <div className="group relative glass-card rounded-[3rem] overflow-hidden shadow-2xl transition-all duration-700 hover:scale-[1.03] hover:shadow-blue-500/20">
      <div className="aspect-[9/16] bg-slate-950 relative overflow-hidden">
        <video
          ref={videoRef}
          src={`${videoSrc}#t=${startSec},${endSec}`}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700"
          muted={isMuted}
          playsInline
          autoPlay
          loop
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/20 pointer-events-none"></div>

        <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
          <div className="bg-blue-600/90 backdrop-blur-xl px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 border border-white/20">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_#fff]"></span>
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] mono">{clip.score}% Viral Potential</span>
          </div>
          <div className="bg-black/80 backdrop-blur-xl px-3 py-1.5 rounded-xl text-[10px] font-black text-slate-300 border border-white/10 mono tracking-widest">
            {clip.start} - {clip.end}
          </div>
        </div>

        <div className="absolute inset-0 flex flex-col justify-end p-8">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="w-14 h-14 bg-white/10 backdrop-blur-3xl rounded-full text-white self-center mb-auto flex items-center justify-center border border-white/20 hover:scale-110 transition-transform pointer-events-auto shadow-2xl"
          >
            {isMuted ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.41.33-.86.61-1.35.84l.01 2.06c1.03-.41 1.95-1.01 2.74-1.76L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            )}
          </button>
        </div>
        
        {isProcessing && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-3xl flex flex-col items-center justify-center text-white p-10 text-center animate-in fade-in duration-500 z-50">
            <div className="w-20 h-20 relative mb-8">
               <div className="absolute inset-0 border-[5px] border-white/5 rounded-full"></div>
               <div className="absolute inset-0 border-[5px] border-blue-500 border-t-transparent rounded-full animate-spin"></div>
               <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black mono tracking-tighter">{progress}%</span>
            </div>
            <p className="text-sm font-black uppercase tracking-[0.4em] text-blue-400 mono">Encoding Highlight</p>
            <p className="text-[10px] text-slate-500 mt-3 uppercase tracking-widest leading-loose">H.264 Buffer Stream<br/>Muxing Audio/Video</p>
          </div>
        )}
      </div>

      <div className="p-8 space-y-6">
        <div className="space-y-3">
          <h3 className="text-2xl font-black text-white leading-tight tracking-tighter uppercase line-clamp-2">
            {clip.hook}
          </h3>
          <p className="text-[12px] text-slate-400 font-medium leading-relaxed line-clamp-3">
            {clip.reasoning}
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleDownload}
            disabled={isProcessing}
            className="flex-1 py-5 gradient-blue text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-[1.8rem] hover:brightness-125 transition-all active:scale-95 disabled:opacity-50 shadow-xl border border-white/10"
          >
            Export Highlight
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(clip.caption);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="w-16 flex items-center justify-center bg-white/5 text-slate-400 hover:text-white rounded-[1.8rem] transition-all border border-white/10 hover:bg-white/10"
            title="Copy Social Post"
          >
            {copied ? (
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClipCard;