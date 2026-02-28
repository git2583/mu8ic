"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayCircle, PauseCircle, Download, Trash2, Loader2, Music, CheckCircle2 } from "lucide-react";

export type MusicTrack = {
  id: string;
  title: string;
  artist?: string;
  duration: number | null;
  created_at: string;
  file_url?: string;
  prompt?: string;
};

interface MusicListProps {
  musics: MusicTrack[];
  onDelete: (id: string, file_url?: string) => void;
  onPlay: (track: MusicTrack) => void;
  playingTrackId: string | null;
}

export function MusicList({ musics, onDelete, onPlay, playingTrackId }: MusicListProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (e: React.MouseEvent, track: MusicTrack) => {
    e.stopPropagation();
    if (!track.file_url || track.file_url === "GENERATING" || track.file_url === "FAILED") return;

    setDownloadingId(track.id);
    try {
      const response = await fetch(track.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${track.title || 'generated-music'}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download:", error);
    } finally {
      setDownloadingId(null);
    }
  };

  if (musics.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-12 text-center p-8 rounded-2xl bg-white/[0.02] border border-white/5">
        <Music className="w-10 h-10 text-white/20 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white/60">No music generated yet</h3>
        <p className="text-sm text-white/30 mt-2">Create your first track using the form above.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-3 mt-12 pb-20">
      <h2 className="text-xl font-semibold mb-2 text-white/90 px-2 flex items-center gap-2">
        <Music className="w-5 h-5 text-indigo-400" />
        Your Library
      </h2>
      <AnimatePresence>
        {musics.map((track) => {
          const isPlaying = playingTrackId === track.id;
          const isGenerating = !track.file_url || track.file_url === "GENERATING";
          const isFailed = track.file_url === "FAILED";

          return (
            <motion.div
              key={track.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={`group flex items-center p-4 rounded-2xl border transition-all duration-300 shadow-lg cursor-pointer ${isPlaying
                  ? 'bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.1)]'
                  : 'bg-[#1c1c1c] border-white/5 hover:border-white/10 hover:bg-[#222222]'
                }`}
              onClick={() => {
                if (!isGenerating && !isFailed) onPlay(track);
              }}
            >
              {/* Play Button & Status Icon */}
              <div className="w-12 h-12 shrink-0 bg-[#111] rounded-xl flex items-center justify-center relative overflow-hidden mr-4">
                {isGenerating ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-indigo-500/10">
                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                  </div>
                ) : isFailed ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-500/10">
                    <div className="w-5 h-5 rounded-full border border-red-500 flex items-center justify-center text-red-500 text-[10px]">&times;</div>
                  </div>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {isPlaying ? (
                      <PauseCircle className="w-6 h-6 text-indigo-400 relative z-10" />
                    ) : (
                      <PlayCircle className="w-6 h-6 text-white/70 group-hover:text-white relative z-10" />
                    )}
                  </>
                )}
              </div>

              {/* Text Information */}
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-3">
                  <h4 className={`font-medium truncate ${isPlaying ? 'text-indigo-300' : 'text-white/90'} text-[15px]`}>
                    {track.title || "Untitled Audio"}
                  </h4>
                  {isPlaying && (
                    <div className="flex items-end gap-[3px] h-4">
                      {[1, 2, 3, 4].map(i => (
                        <motion.div
                          key={i}
                          className="w-1 bg-indigo-400 rounded-full"
                          animate={{ height: ["20%", "100%", "20%"] }}
                          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1, ease: "easeInOut" }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {/* Formatting Date */}
                <p className="text-[12px] text-white/40 mt-1 truncate">
                  {new Date(track.created_at).toLocaleString()} {track.duration ? `• ${track.duration}s` : ''}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                {isGenerating ? (
                  <span className="text-[11px] text-indigo-300 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                    Generating...
                  </span>
                ) : isFailed ? (
                  <span className="text-[11px] text-red-400 px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20">
                    Failed
                  </span>
                ) : (
                  <>
                    <button
                      onClick={(e) => handleDownload(e, track)}
                      disabled={downloadingId === track.id}
                      className="p-2 sm:px-3 sm:py-1.5 flex items-center gap-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                      title="Download MP3"
                    >
                      {downloadingId === track.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      <span className="hidden sm:block text-[12px] font-medium">Get</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(track.id, track.file_url);
                      }}
                      className="p-2 sm:px-3 sm:py-1.5 flex items-center gap-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete Track"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:block text-[12px] font-medium">Del</span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
