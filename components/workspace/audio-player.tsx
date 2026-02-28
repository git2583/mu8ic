"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Repeat, Volume2, VolumeX, Download } from "lucide-react";

interface AudioPlayerProps {
  track: {
    id: string;
    caption: string;
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
    <div className="w-full max-w-2xl mx-auto flex flex-col p-6 rounded-3xl bg-[#1b1b1b] shadow-2xl border border-white/5">
      {track.file_url && (
        <audio
          ref={audioRef}
          src={track.file_url}
          loop={isLooping}
          className="hidden"
        // We assume autoPlay is off by default so the user presses play
        />
      )}

      {/* Header Info */}
      <div className="mb-6 pl-2">
        <h3 className="text-[18px] font-medium text-white/90 tracking-wide mb-1 select-none">
          {track.caption || "Untitled AI Music"}
        </h3>
        <p className="text-[14px] text-white/40 font-medium select-none">AI Generated</p>
      </div>

      {/* Waveform Visualization Box */}
      <div
        className="h-[80px] bg-[#222222] rounded-2xl relative overflow-hidden cursor-pointer flex flex-col justify-center px-6 mx-2"
        onClick={handleSeek}
      >
        <div className="flex items-center justify-between w-full h-[60%] gap-[2px] pointer-events-none">
          {waveformPattern.map((height, i) => {
            const isPlayed = (i / WAVEFORM_BARS) * 100 <= progress;
            return (
              <div
                key={i}
                className="w-full rounded-full transition-all duration-150"
                style={{
                  height: `${height * 100}%`,
                  backgroundColor: isPlayed ? 'rgba(168, 85, 247, 0.9)' : 'rgba(255, 255, 255, 0.15)', // Purple gradient color
                  boxShadow: isPlayed ? '0 0 10px rgba(168, 85, 247, 0.3)' : 'none'
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Progress Line */}
      <div className="mx-2 mt-6 cursor-pointer relative" onClick={handleSeek}>
        <div className="w-full h-1 bg-white/10 rounded-full relative">
          <div
            className="h-full bg-white rounded-full absolute top-0 left-0"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"
            style={{ left: `calc(${progress}% - 7px)` }}
          />
        </div>
      </div>

      {/* Times */}
      <div className="flex justify-between items-center mt-3 px-2 text-[12px] font-medium text-white/40 select-none">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Controls Container */}
      <div className="flex items-center justify-between mt-6 px-2">

        {/* Left Controls */}
        <div className="flex items-center gap-5">
          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`transition-colors flex items-center justify-center p-2 rounded-full hover:bg-white/5 ${isLooping ? 'text-white' : 'text-white/40 hover:text-white/80'}`}
          >
            <Repeat size={18} />
          </button>

          <button
            onClick={togglePlay}
            className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
          >
            {isPlaying ? (
              <Pause size={24} className="fill-black" />
            ) : (
              <Play size={24} className="fill-black ml-1" />
            )}
          </button>

          <div className="flex items-center gap-2 group/vol">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-white/50 hover:text-white/90 transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
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
              className="w-16 h-1 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer ml-1"
            />
          </div>
        </div>

        {/* Right Controls */}
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 text-[14px] font-medium text-white/70 hover:text-white transition-colors"
        >
          <Download size={18} />
          Download
        </button>
      </div>
    </div>
  );
}
