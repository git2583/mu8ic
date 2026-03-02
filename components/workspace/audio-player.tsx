"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Repeat, Volume2, VolumeX, Download, SkipBack, SkipForward, Music } from "lucide-react";

interface AudioPlayerProps {
  track: {
    id: string;
    title: string;
    lyrics?: string;
    duration: number | null;
    file_url?: string;
  };
  onDelete?: () => void;
}

const WAVEFORM_BARS = 60;
const generateWaveform = () => {
  const bars = [];
  for (let i = 0; i < WAVEFORM_BARS; i++) {
    // Symmetrical shape that looks like the reference
    const val = Math.sin(i * 0.15) * Math.sin(i * 0.04);
    const height = Math.abs(val) * 0.8 + 0.2;
    bars.push(height);
  }
  return bars;
};
const waveformPattern = generateWaveform();

export function AudioPlayer({ track }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(track.duration || 30);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

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
    if (!audioRef.current) return;
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
      a.download = `mu8ic-generated.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#171717]/80 backdrop-blur-2xl border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transform translate-y-0 transition-transform duration-300">
      {track.file_url && (
        <audio
          ref={audioRef}
          src={track.file_url}
          loop={isLooping}
          autoPlay
          className="hidden"
        />
      )}

      {/* Optional: YouTube Music style top-edge progress bar (uncomment if preferred over center bar)
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/5 cursor-pointer group/progress" onClick={handleSeek}>
          <div className="h-full bg-indigo-500 relative" style={{ width: `${progress}%` }}></div>
      </div>
      */}

      <div className="flex items-center justify-between px-4 md:px-8 h-[88px] max-w-screen-2xl mx-auto">

        {/* Left: Track Info & Art */}
        <div className="flex items-center gap-4 w-[30%] min-w-[200px]">
          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] flex items-center justify-center border border-white/5 shrink-0 shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Music className="w-6 h-6 text-white/60" />
          </div>
          <div className="flex flex-col min-w-0 pr-2">
            <h4 className="text-[14px] font-medium text-white/95 truncate tracking-wide">
              {track.title || "Untitled AI Music"}
            </h4>
            <p className="text-[12px] text-white/40 truncate font-medium mt-0.5" title="AI Generated">
              AI Generated
            </p>
          </div>
        </div>

        {/* Center: Controls & Timers */}
        <div className="flex flex-col items-center justify-center max-w-[40%] flex-1 gap-1.5">
          <div className="flex items-center gap-6 sm:gap-8">
            <button className="text-white/30 hover:text-white transition-colors cursor-not-allowed">
              <SkipBack size={20} className="fill-current" />
            </button>
            <button
              onClick={togglePlay}
              className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_4px_12px_rgba(255,255,255,0.1)]"
            >
              {isPlaying ? (
                <Pause size={18} className="fill-black" />
              ) : (
                <Play size={18} className="fill-black ml-0.5" />
              )}
            </button>
            <button className="text-white/30 hover:text-white transition-colors cursor-not-allowed">
              <SkipForward size={20} className="fill-current" />
            </button>
            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`transition-colors flex items-center justify-center p-2 rounded-full hover:bg-white/5 ${isLooping ? 'text-indigo-400' : 'text-white/40 hover:text-white/80'}`}
              title="Toggle Loop"
            >
              <Repeat size={16} />
            </button>
          </div>
          <div className="flex items-center gap-3 w-full max-w-[500px] text-[11px] font-medium text-white/40 justify-center">
            <span className="w-8 text-right tabular-nums">{formatTime(currentTime)}</span>
            <div className="w-full h-1 bg-white/10 rounded-full cursor-pointer relative group/progress" onClick={handleSeek}>
              {/* Visual playback line */}
              <div
                className="h-full bg-white group-hover/progress:bg-indigo-400 rounded-full relative transition-colors"
                style={{ width: `${progress}%` }}
              >
                {/* Handle Knob */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 shadow-[0_0_10px_rgba(255,255,255,0.5)] translate-x-1/2 transition-opacity" />
              </div>
            </div>
            <span className="w-8 text-left tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Volume & Actions */}
        <div className="flex items-center justify-end gap-2 w-[30%] min-w-[150px]">

          <button
            onClick={handleDownload}
            className="flex items-center justify-center p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors mr-2"
            title="Download MP3"
          >
            <Download size={18} />
          </button>

          <div className="hidden sm:flex items-center gap-2 group/vol justify-end">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-white/40 hover:text-white/90 transition-colors p-1"
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
              className="w-20 lg:w-24 h-1 bg-white/20 hover:bg-white/30 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer transition-colors"
            />
          </div>

        </div>
      </div>
    </div>
  );
}
