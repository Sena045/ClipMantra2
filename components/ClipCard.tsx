
import React, { useRef, useState, useEffect } from 'react';
import { Clip } from '../types';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

interface ClipCardProps {
  clip: Clip;
  videoSrc: string;
}

const ClipCard: React.FC<ClipCardProps> = ({ clip, videoSrc }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);

  const parseTime = (timeStr: string) => {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  };

  const start = parseTime(clip.start);
  const end = parseTime(clip.end);
  const durationInSeconds = Math.max(end - start, 1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isHovered || isExtracting) return;

    video.currentTime = start;
    const playPromise = video.play();
    if (playPromise !== undefined) playPromise.catch(() => {});

    const handleTimeUpdate = () => {
      if (video.currentTime >= end) video.currentTime = start;
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.pause();
    };
  }, [isHovered, start, end, isExtracting]);

  const handleMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.videoWidth && video.videoHeight) {
      setVideoDimensions({ width: video.videoWidth, height: video.videoHeight });
    }
  };

  const handleDownload = async () => {
    if (isExtracting) return;
    setIsExtracting(true);
    setExtractProgress(0);

    let muxer: Muxer<ArrayBufferTarget> | null = null;
    let videoEncoder: VideoEncoder | null = null;
    let audioEncoder: any | null = null;
    let extractionVideo: HTMLVideoElement | null = null;

    try {
      extractionVideo = document.createElement('video');
      extractionVideo.src = videoSrc;
      extractionVideo.crossOrigin = "anonymous";
      extractionVideo.muted = true;
      extractionVideo.playsInline = true;
      document.body.appendChild(extractionVideo);

      await new Promise((r) => {
        extractionVideo!.onloadedmetadata = r;
      });

      const width = extractionVideo.videoWidth;
      const height = extractionVideo.videoHeight;

      muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video: { codec: 'avc', width, height },
        audio: { codec: 'aac', sampleRate: 44100, numberOfChannels: 2 },
        fastStart: 'in-memory' // Ensures the file is streamable and uploadable immediately
      });

      videoEncoder = new VideoEncoder({
        output: (chunk, metadata) => muxer?.addVideoChunk(chunk, metadata),
        error: (e) => console.error(e)
      });
      videoEncoder.configure({
        codec: 'avc1.42E01E', 
        width,
        height,
        bitrate: 5_000_000,
        framerate: 30
      });

      audioEncoder = new (window as any).AudioEncoder({
        output: (chunk: any, metadata: any) => muxer?.addAudioChunk(chunk, metadata),
        error: (e: any) => console.error(e)
      });
      audioEncoder.configure({
        codec: 'mp4a.40.2',
        numberOfChannels: 2,
        sampleRate: 44100,
        bitrate: 128_000
      });

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100 });
      const audioResponse = await fetch(videoSrc);
      const audioArrayBuffer = await audioResponse.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(audioArrayBuffer);
      
      const startSample = Math.floor(start * audioBuffer.sampleRate);
      const endSample = Math.floor(end * audioBuffer.sampleRate);
      const clipSamples = endSample - startSample;

      const planarData = new Float32Array(clipSamples * 2);
      const leftChannel = audioBuffer.getChannelData(0);
      const rightChannel = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : leftChannel;

      planarData.set(leftChannel.subarray(startSample, endSample), 0);
      planarData.set(rightChannel.subarray(startSample, endSample), clipSamples);

      const audioDataObj = new (window as any).AudioData({
        format: 'f32-planar',
        sampleRate: 44100,
        numberOfFrames: clipSamples,
        numberOfChannels: 2,
        timestamp: 0,
        data: planarData
      });
      audioEncoder.encode(audioDataObj);
      audioDataObj.close();

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });

      let currentTime = start;
      const fps = 30;
      const step = 1 / fps;
      let frameCount = 0;

      while (currentTime < end) {
        extractionVideo.currentTime = currentTime;
        await new Promise(r => {
           const onSeeked = () => {
             extractionVideo!.removeEventListener('seeked', onSeeked);
             r(null);
           };
           extractionVideo!.addEventListener('seeked', onSeeked);
        });
        
        if (ctx) {
          ctx.drawImage(extractionVideo, 0, 0, width, height);
          const frame = new (window as any).VideoFrame(canvas, {
            timestamp: (frameCount * 1_000_000) / fps,
            duration: 1_000_000 / fps
          });
          videoEncoder.encode(frame, { keyFrame: frameCount % 60 === 0 });
          frame.close();
        }

        frameCount++;
        currentTime += step;
        setExtractProgress(Math.min(Math.round(((currentTime - start) / durationInSeconds) * 100), 99));
      }

      await videoEncoder.flush();
      await audioEncoder.flush();
      muxer.finalize();
      setExtractProgress(100);

      const { buffer } = muxer.target as ArrayBufferTarget;
      const blob = new Blob([buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeHook = clip.hook.replace(/[^a-z0-9]/gi, '_').slice(0, 15);
      a.download = `Clip_${safeHook}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err: any) {
      console.error("Master Export Error:", err);
      alert("Mastering Failed: Source video might be too heavy or restricted. Try a standard MP4 file.");
    } finally {
      if (extractionVideo && extractionVideo.parentNode) document.body.removeChild(extractionVideo);
      setIsExtracting(false);
      setExtractProgress(0);
    }
  };

  const isVertical = videoDimensions && videoDimensions.height > videoDimensions.width;
  const aspectRatioClass = isVertical ? 'aspect-[9/16]' : 'aspect-video';

  return (
    <div className="group relative bg-slate-900/60 border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-blue-500/50 transition-all duration-500 hover:shadow-[0_0_80px_-20px_rgba(59,130,246,0.4)] hover:-translate-y-2 flex flex-col">
      <div className={`relative w-full overflow-hidden bg-black ${aspectRatioClass} flex items-center justify-center`}>
        <video 
          ref={videoRef}
          src={`${videoSrc}#t=${start}`}
          onLoadedMetadata={handleMetadata}
          className={`relative z-10 w-full h-full transition-all duration-700 ${isHovered ? 'scale-105 opacity-100' : 'opacity-80'}`}
          style={{ objectFit: isVertical ? 'cover' : 'contain' }}
          muted playsInline
        />
        
        {isExtracting && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-3xl px-8 text-center">
            <div className="w-16 h-16 rounded-full border-[5px] border-blue-500/10 border-t-blue-500 animate-spin mb-6"></div>
            <div className="space-y-2">
              <span className="text-white font-black text-3xl tracking-tighter mono">{extractProgress}%</span>
              <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Mastering MP4 (H.264/AAC)</p>
            </div>
          </div>
        )}

        <div className="absolute top-6 left-6 right-6 z-30 flex justify-between items-start pointer-events-none">
          <div className={`px-3 py-1.5 rounded-xl border backdrop-blur-xl text-[10px] font-black mono flex items-center gap-2 ${
            clip.score >= 90 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-blue-400 bg-blue-500/10 border-blue-500/20'
          }`}>
            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>
            {clip.score}% IMPACT
          </div>
          <div className="px-3 py-1 bg-blue-600/90 backdrop-blur-xl border border-white/10 rounded-lg text-[10px] font-black text-white mono shadow-2xl">
            {clip.duration}
          </div>
        </div>
      </div>
      
      <div className="p-8 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <h4 className="text-white font-black text-2xl leading-tight uppercase italic tracking-tighter group-hover:text-blue-400 transition-colors">
            "{clip.hook}"
          </h4>
          <p className="text-slate-400 text-[13px] leading-relaxed font-medium line-clamp-3">
            {clip.reasoning}
          </p>
        </div>
        
        <div className="flex items-center justify-between pt-6 border-t border-white/5">
          <div className="flex flex-col gap-1">
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Timing Segment</span>
            <div className="px-2 py-0.5 rounded-md bg-black/40 border border-white/5 text-[9px] font-bold text-slate-300 mono">
              {clip.start} <span className="text-blue-500">→</span> {clip.end}
            </div>
          </div>
          <button 
            onClick={handleDownload}
            disabled={isExtracting}
            className={`group/btn relative overflow-hidden px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              isExtracting 
              ? 'bg-slate-800 text-slate-600' 
              : 'bg-white text-slate-950 hover:bg-blue-600 hover:text-white shadow-xl active:scale-95'
            }`}
          >
            <span className="relative z-10 flex items-center gap-2">
              {isExtracting ? 'Mastering...' : 'Export MP4'}
              {!isExtracting && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClipCard;
