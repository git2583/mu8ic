"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Repeat, Volume2, VolumeX, Download, Loader2, X } from "lucide-react";

interface TrackPlayerProps {
  track: {
    id: string;
    title: string;
    artist: string;
    duration: number | null;
    file_url?: string;
  };
  onDelete: () => void;
}

const WAVEFORM_BARS = 70;
const generateWaveform = () => {
  const bars = [];
  for (let i = 0; i < WAVEFORM_BARS; i++) {
    const val = Math.sin(i * 0.2) * Math.sin(i * 0.05);
    const height = Math.abs(val) * 0.8 + 0.2;
    bars.push(height);
  }
  return bars;
};
const waveformPattern = generateWaveform();

export function TrackPlayer({ track, onDelete }: TrackPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(track.duration || 30);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  const isGenerating = !track.file_url || track.file_url === "GENERATING";
  const isFailed = track.file_url === "FAILED";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      if (!isLooping) setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [isLooping]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || isGenerating || isFailed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = percent * duration;
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleDownload = async () => {
    if (!track.file_url) return;
    try {
      const response = await fetch(track.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${track.title || "generated-track"}.wav`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  if (isGenerating) {
    return (
      <div className="relative group w-full flex flex-col p-6 rounded-[24px] bg-[#1c1c1c] border border-white/5 shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-[17px] font-semibold text-white/95 truncate tracking-wide">{track.title}</h3>
            <p className="text-[13px] text-white/40 mt-1 font-medium">Generating AI Music...</p>
          </div>
          <button onClick={onDelete} className="text-white/20 hover:text-red-400 transition-colors p-2 -m-2">
            <X size={20} />
          </button>
        </div>
        <div className="h-28 bg-[#222] rounded-2xl flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (isFailed) {
    return (
      <div className="relative group w-full flex flex-col p-6 rounded-[24px] bg-[#1c1c1c] border border-red-500/10 shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-[17px] font-semibold text-white/95 truncate tracking-wide">{track.title}</h3>
            <p className="text-[13px] text-red-400/80 mt-1 font-medium">Generation Failed</p>
          </div>
          <button onClick={onDelete} className="text-white/20 hover:text-red-400 transition-colors p-2 -m-2">
            <X size={20} />
          </button>
        </div>
        <div className="h-28 bg-[#222] rounded-2xl flex items-center justify-center">
          <X className="w-8 h-8 text-red-500/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative group w-full flex flex-col p-6 rounded-[24px] bg-[#1c1c1c] shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/5 transition-all duration-300 hover:border-white/10">
      {track.file_url && (
        <audio
          ref={audioRef}
          src={track.file_url}
          loop={isLooping}
          className="hidden"
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div className="min-w-0 pr-4">
          <h3 className="text-[18px] font-semibold text-white/95 truncate tracking-wide">{track.title}</h3>
          <p className="text-[13px] text-white/40 mt-1 font-medium">{track.artist || "AI Generated"}</p>
        </div>
        <button onClick={onDelete} className="text-white/20 hover:text-red-400 transition-colors p-2 -m-2 opacity-0 group-hover:opacity-100">
          <X size={20} />
        </button>
      </div>

      {/* Waveform Area */}
      <div
        className="h-24 bg-[#262626] rounded-xl relative overflow-hidden cursor-pointer flex flex-col justify-end px-3 select-none"
        onClick={handleSeek}
      >
        <div className="flex items-center justify-between w-full h-[70%] gap-[2px] mb-2 pointer-events-none">
          {waveformPattern.map((height, i) => {
            const isPlayed = (i / WAVEFORM_BARS) * 100 <= progress;
            return (
              <div
                key={i}
                className="w-full rounded-full transition-all duration-150"
                style={{
                  height: `${height * 100}%`,
                  backgroundColor: isPlayed ? 'rgba(99, 102, 241, 0.9)' : 'rgba(255, 255, 255, 0.15)'
                }}
              />
            );
          })}
        </div>

        {/* Progress Overlay bar (thin line with dot) */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5 pointer-events-none">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,1)]" />
          </div>
        </div>
      </div>

      {/* Time indicators */}
      <div className="flex justify-between items-center mt-3 text-[12px] font-medium text-white/40 px-1 select-none">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between mt-4 px-1">
        <div className="flex items-center gap-5">
          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`transition-colors flex items-center justify-center p-2 -ml-2 rounded-full hover:bg-white/5 ${isLooping ? 'text-indigo-400' : 'text-white/40 hover:text-white/80'}`}
          >
            <Repeat size={18} />
          </button>

          <button
            onClick={togglePlay}
            className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_4px_14px_rgba(255,255,255,0.2)]"
          >
            {isPlaying ? (
              <Pause size={22} className="fill-black" />
            ) : (
              <Play size={22} className="fill-black ml-1" />
            )}
          </button>

          <div className="flex items-center gap-3 ml-2 group/vol">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-white/40 hover:text-white/80 transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (parseFloat(e.target.value) > 0) setIsMuted(false);
              }}
              className="w-20 h-1 bg-white/10 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer opacity-70 group-hover/vol:opacity-100 transition-opacity"
            />
          </div>
        </div>

        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Download size={16} />
          Download
        </button>
      </div>
    </div>
  );
}
