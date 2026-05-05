"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayCircle, PauseCircle, Download, Trash2, Loader2, Music, CheckCircle2, MoreVertical, Edit3, SearchX } from "lucide-react";

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
  onRename?: (id: string, newTitle: string) => void;
  playingTrackId: string | null;
  generationStatus?: 'idle' | 'generating' | 'uploading' | 'success' | 'error';
  errorMessage?: string | null;
  searchQuery?: string;
  isSearching?: boolean;
}

export function MusicList({ musics, onDelete, onPlay, onRename, playingTrackId, generationStatus = 'idle', errorMessage, searchQuery = "", isSearching = false }: MusicListProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const generatingCount = musics.filter(m => !m.file_url || m.file_url === "GENERATING").length;

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

  const banner = (
    <AnimatePresence>
      {generationStatus && generationStatus !== 'idle' && (
        <motion.div
          key="status-banner"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-4 w-full"
        >
          <div className={`
            flex items-center gap-3 px-4 py-3 rounded-xl border text-[14px] font-medium shadow-sm transition-colors duration-300
            ${generationStatus === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-200' : ''}
            ${generationStatus === 'generating' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-200' : ''}
            ${generationStatus === 'uploading' ? 'bg-purple-500/10 border-purple-500/20 text-purple-200' : ''}
            ${generationStatus === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' : ''}
          `}>
            {generationStatus === 'generating' && (
              <>
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
                <span className="animate-pulse">
                  🎵 {generatingCount > 1 ? `${generatingCount}개의 음악을 생성하고 있습니다` : '음악을 생성하고 있습니다'}... 잠시만 기다려 주세요.
                </span>
              </>
            )}
            {generationStatus === 'uploading' && (
              <>
                <Loader2 className="w-5 h-5 text-purple-400 animate-spin shrink-0" />
                <span className="animate-pulse">
                  ☁️ {generatingCount > 1 ? `${generatingCount}개의 생성된 파일을 보관함에 안전하게 저장 중입니다` : '생성된 파일을 보관함에 안전하게 저장 중입니다'}...
                </span>
              </>
            )}
            {generationStatus === 'error' && (
              <>
                <span className="shrink-0 text-red-500 text-lg">❌</span>
                <span>{errorMessage || "생성 중 오류가 발생했습니다. 다시 시도해 주세요."}</span>
              </>
            )}
            {generationStatus === 'success' && (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>✅ 음악 생성이 완료되었습니다!</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!isSearching && musics.length === 0 && !searchQuery.trim()) {
    return (
      <div className="w-full max-w-3xl mx-auto flex flex-col mt-12 px-4 sm:px-0">
        {banner}
        <div className="w-full max-w-2xl mx-auto text-center p-8 rounded-2xl bg-white/[0.02] border border-white/5">
          <Music className="w-10 h-10 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white/60">No music generated yet</h3>
          <p className="text-sm text-white/30 mt-2">Create your first track using the form above.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-3 mt-12 pb-20">
      {banner}
      <div className="flex items-center justify-between mb-2 px-2">
        <h2 className="text-xl font-semibold text-white/90 flex items-center gap-2">
          <Music className="w-5 h-5 text-indigo-400" />
          Your Library
        </h2>
        {searchQuery && !isSearching && (
          <span className="text-sm text-white/40">
            Found {musics.length} result{musics.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {isSearching ? (
        <div className="w-full text-center p-8 rounded-2xl bg-white/[0.02] border border-white/5 mt-4 flex flex-col items-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
          <h3 className="text-lg font-medium text-white/60">검색 중...</h3>
        </div>
      ) : musics.length === 0 ? (
        <div className="w-full text-center p-8 rounded-2xl bg-white/[0.02] border border-white/5 mt-4">
          <SearchX className="w-10 h-10 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white/60">DB에 일치하는 음악이 없습니다</h3>
          <p className="text-sm text-white/30 mt-2">다른 검색어로 다시 시도해보세요.</p>
        </div>
      ) : (
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
                  {editingId === track.id ? (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (onRename && editTitle.trim() && editTitle !== track.title) {
                        onRename(track.id, editTitle);
                      }
                      setEditingId(null);
                    }} className="flex-1 mb-1">
                      <input
                        autoFocus
                        className="bg-[#111] border border-white/20 rounded-md px-2 py-0.5 text-[14px] text-white w-full max-w-sm focus:outline-none focus:border-indigo-400"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onKeyDown={(e) => { e.stopPropagation(); }}
                        onClick={(e) => { e.stopPropagation(); }}
                        onBlur={() => {
                          if (onRename && editTitle.trim() && editTitle !== track.title) {
                            onRename(track.id, editTitle);
                          }
                          setEditingId(null);
                        }}
                      />
                    </form>
                  ) : (
                    <div className="flex items-center gap-3">
                      <h4 className={`font-medium truncate ${isPlaying ? 'text-indigo-300' : isFailed ? 'text-white/30' : 'text-white/90'} text-[15px]`}>
                        {track.title || "Untitled Audio"}
                      </h4>
                      {(isPlaying || isGenerating || isFailed) && (
                        <div className="flex items-end gap-[3px] h-4">
                          {[1, 2, 3, 4].map(i => {
                            const isAnimating = isPlaying || isGenerating;
                            return (
                              <motion.div
                                key={i}
                                className={`w-1 rounded-full ${isFailed ? 'bg-white/20' : 'bg-indigo-400'}`}
                                animate={isAnimating ? { height: ["20%", "100%", "20%"] } : { height: "30%" }}
                                transition={isAnimating ? { repeat: Infinity, duration: 0.8, delay: i * 0.1, ease: "easeInOut" } : { duration: 0.3 }}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Formatting Date */}
                  <p className="text-[12px] text-white/40 mt-1 truncate">
                    {new Date(track.created_at).toLocaleString()} {track.duration ? `• ${track.duration}s` : ''}
                  </p>
                </div>

                {/* Actions */}
                <div className={`flex items-center gap-2 transition-opacity duration-200 ${openDropdownId === track.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} onClick={e => e.stopPropagation()}>
                  {isGenerating ? (
                    <span className="text-[11px] text-indigo-300 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                      Generating...
                    </span>
                  ) : isFailed ? (
                    <>
                      <span className="text-[11px] text-red-500/80 px-2 py-0.5 bg-red-500/10 rounded-full border border-red-500/20 mr-1">
                        Failed
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // 데이터는 DB에 안전하게 보관되어 있습니다. 언제든 복구 가능한 상태입니다.
                          if (window.confirm("이 레코드를 목록에서 숨기시겠습니까? (서버에 데이터는 안전하게 보관됩니다)")) {
                            onDelete(track.id, track.file_url);
                          }
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Hide failed record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(openDropdownId === track.id ? null : track.id);
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                        title="More options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      <AnimatePresence>
                        {openDropdownId === track.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-36 bg-[#2a2a2a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col py-1"
                          >
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditTitle(track.title); setEditingId(track.id); setOpenDropdownId(null); }}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors text-left"
                            >
                              <Edit3 className="w-4 h-4" /> Rename
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); handleDownload(e, track); }}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors text-left"
                            >
                              {downloadingId === track.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download
                            </button>
                            <div className="h-[1px] bg-white/10 my-1" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(null);
                                // 데이터는 DB에 안전하게 보관되어 있습니다. 언제든 복구 가능한 상태입니다.
                                if (window.confirm("이 음악을 목록에서 숨기시겠습니까? (서버에 파일 및 데이터는 안전하게 보관됩니다)")) {
                                  onDelete(track.id, track.file_url);
                                }
                              }}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {openDropdownId === track.id && (
                        <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); }} />
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
    </div>
  );
}
