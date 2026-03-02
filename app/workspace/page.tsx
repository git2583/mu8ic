"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/workspace/navbar";
import { AudioPlayer } from "@/components/workspace/audio-player";
import { MusicList, MusicTrack } from "@/components/workspace/music-list";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Music, AlertCircle, Plus, ArrowUp, Clock, Layers, PlayCircle, X } from "lucide-react";

export default function WorkspacePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'uploading' | 'success' | 'error'>('idle');
  const [caption, setCaption] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [duration, setDuration] = useState(60);
  const [batchSize, setBatchSize] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showLyricsModal, setShowLyricsModal] = useState(false);
  const [showDurationMenu, setShowDurationMenu] = useState(false);
  const [showBatchMenu, setShowBatchMenu] = useState(false);

  // Library and Player state
  const [musics, setMusics] = useState<MusicTrack[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
  const [playingTrack, setPlayingTrack] = useState<MusicTrack | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Fetch initial tracks and setup realtime
  useEffect(() => {
    if (!user) return;

    const fetchMusics = async () => {
      setIsLoadingLibrary(true);
      const { data, error } = await supabase
        .from("musics")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) setMusics(data as MusicTrack[]);
      setIsLoadingLibrary(false);
    };

    fetchMusics();

    const subscription = supabase
      .channel("musics_channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "musics", filter: `user_id=eq.${user.id}` }, (payload) => {
        if (payload.eventType === "INSERT") {
          setMusics(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [payload.new as MusicTrack, ...prev];
          });
        } else if (payload.eventType === "UPDATE") {
          setMusics(prev => prev.map(item => item.id === payload.new.id ? payload.new as MusicTrack : item));
        } else if (payload.eventType === "DELETE") {
          setMusics(prev => prev.filter(item => item.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [user, supabase]);

  // Redirect to auth if not logged in
  if (!isAuthLoading && !user) {
    router.push("/auth");
    return null;
  }

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#171717]">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
      </div>
    );
  }

  const handleDelete = async (id: string, file_url?: string) => {
    // 1. Optimistically hide from UI
    const previousMusics = [...musics];
    setMusics((prev) => prev.filter((m) => m.id !== id));

    if (playingTrack?.id === id) {
      setPlayingTrack(null);
    }

    try {
      // 2. Delete from Storage first
      if (file_url && file_url.includes('supabase.co')) {
        try {
          const urlObj = new URL(file_url);
          const pathParts = urlObj.pathname.split('/');
          const bucketIndex = pathParts.indexOf('musics');
          if (bucketIndex !== -1 && pathParts.length > bucketIndex + 1) {
            const objectPath = pathParts.slice(bucketIndex + 1).join('/');
            const { error: storageError } = await supabase.storage.from('musics').remove([decodeURI(objectPath)]);
            if (storageError) console.error("Storage Error:", storageError);
          }
        } catch (e) {
          console.error("URL Parsing error:", e);
        }
      }

      // 3. Delete from Database
      const { error: dbError } = await supabase.from("musics").delete().eq("id", id);
      if (dbError) throw new Error(dbError.message);

    } catch (err: any) {
      console.error("[Delete] Error:", err);
      setMusics(previousMusics); // Rollback optimistic update
      alert(`삭제 중 오류가 발생했습니다: ${err.message}`);
    }
  };

  const handleRename = async (id: string, newTitle: string) => {
    await supabase.from("musics").update({ title: newTitle }).eq("id", id);
    if (playingTrack?.id === id) {
      setPlayingTrack((prev) => prev ? { ...prev, title: newTitle } : null);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption && !lyrics) {
      setErrorMessage("Please enter at least a caption or lyrics.");
      return;
    }

    setErrorMessage(null);
    setGenerationStatus('generating');
    setShowResult(true);

    try {
      // Create multiple placeholders if it's a batch
      const newItems = Array.from({ length: batchSize }).map((_, index) => ({
        title: batchSize > 1 ? `${caption || "Generated AI Music"} (Var ${index + 1})` : (caption || "Generated AI Music"),
        user_id: user?.id,
        prompt: `Caption: ${caption} / Lyrics: ${lyrics}`,
        duration: duration,
        file_url: "GENERATING"
      }));

      const { data: insertedMusics, error: insertError } = await supabase.from("musics").insert(newItems).select();

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Optimistically add to UI immediately instead of waiting for realtime subscription
      setMusics(prev => {
        const newIds = new Set(insertedMusics.map(m => m.id));
        const filteredPrev = prev.filter(m => !newIds.has(m.id));
        return [...insertedMusics, ...filteredPrev];
      });

      // Step 1: Generate Replicate URL
      console.log("[Generate] Starting Replicate API call");
      const generateResponse = await fetch('/api/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, lyrics, duration, batch_size: batchSize, userId: user.id }),
      });

      const generateData = await generateResponse.json();

      if (!generateResponse.ok || !generateData.urls || generateData.urls.length === 0) {
        throw new Error(`Generation failed: ${generateData.error || "Unknown error"}`);
      }

      console.log(`[Generate] Success. Audio URLs:`, generateData.urls);
      setGenerationStatus('uploading');

      // Step 2: Download & Upload to Supabase Storage
      console.log("[Generate] Starting Upload to Supabase Storage");
      let firstFinalUrl = "";

      const uploadPromises = generateData.urls.map(async (url: string, index: number) => {
        // Find corresponding placeholder
        let currentMusicId = insertedMusics[index]?.id;

        // If for some reason we generated more URLs than placeholders, skip or handle (rare)
        if (!currentMusicId) return null;

        try {
          const uploadResponse = await fetch('/api/upload-music', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioUrl: url, musicId: currentMusicId, userId: user.id })
          });
          const uploadData = await uploadResponse.json();

          if (!uploadResponse.ok || !uploadData.url) {
            console.error(`Upload failed for url ${index}:`, uploadData.error);
            await supabase.from("musics").update({ file_url: "FAILED" }).eq("id", currentMusicId);
            return null;
          }

          const finalUrl = uploadData.url;
          if (index === 0) firstFinalUrl = finalUrl;

          await supabase.from("musics").update({ file_url: finalUrl }).eq("id", currentMusicId);
          return { id: currentMusicId, finalUrl };
        } catch (e) {
          console.error("Upload error per audio:", e);
          await supabase.from("musics").update({ file_url: "FAILED" }).eq("id", currentMusicId);
          return null;
        }
      });

      await Promise.all(uploadPromises);

      setCaption('');
      setLyrics('');
      setGenerationStatus('success');

      // Hide success message after 3 seconds
      setTimeout(() => setGenerationStatus('idle'), 3000);

      // Auto-play the first new track
      if (firstFinalUrl && insertedMusics[0]) {
        setPlayingTrack({ ...insertedMusics[0], file_url: firstFinalUrl } as MusicTrack);
      }

    } catch (err: any) {
      console.error("[Generate] Flow error:", err);
      setErrorMessage(`생성 중 오류가 발생했습니다. 다시 시도해 주세요. (${err.message})`);
      setGenerationStatus('error');
    }
  };

  const resetGenerator = () => {
    setCaption('');
    setLyrics('');
    setDuration(30);
    setErrorMessage(null);
    setGenerationStatus('idle');
    setShowResult(false);
  };

  return (
    <main className="h-screen w-full bg-[#111] text-white flex flex-col items-center overflow-hidden relative selection:bg-indigo-500/30">
      <Navbar />

      <div className="flex flex-col flex-1 relative z-10 w-full items-center h-full">

        <AnimatePresence mode="wait">
          {/* MAIN WORKSPACE VIEW */}
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col w-full h-full items-center"
          >

            <div className="flex-1 overflow-y-auto w-full px-4 flex flex-col items-center justify-center custom-scrollbar pb-10">
              {errorMessage && generationStatus !== 'error' && (
                <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-3 w-full max-w-4xl mx-auto text-red-400 shrink-0">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{errorMessage}</p>
                </div>
              )}

              <div className="w-full max-w-4xl flex flex-col justify-center items-center my-auto animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[40vh] py-8">
                <div className="w-full px-2 pb-32">
                  <MusicList
                    musics={musics}
                    onDelete={handleDelete}
                    onPlay={(track) => setPlayingTrack(track)}
                    onRename={handleRename}
                    playingTrackId={playingTrack?.id || null}
                    generationStatus={generationStatus}
                    errorMessage={errorMessage}
                  />
                </div>
              </div>
            </div>

            {/* Prompt Input Form */}
            <div
              className="relative z-40 shrink-0 w-full flex flex-col items-center px-4 pt-16 bg-gradient-to-t from-[#111] from-30% via-[#111] to-transparent transition-all duration-300"
              style={{ paddingBottom: playingTrack ? '140px' : '40px' }}
            >
              <form
                onSubmit={handleGenerate}
                className="w-full max-w-2xl bg-[#1c1c1c]/90 backdrop-blur-xl border border-white/5 rounded-[22px] flex flex-col p-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] focus-within:ring-2 focus-within:ring-white/10 transition-all duration-300"
              >
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Enter lyrics or describe the music you want to create..."
                  rows={2}
                  className="w-full bg-transparent px-8 pt-8 pb-4 text-[14px] sm:text-[15px] leading-relaxed text-white/90 placeholder:text-white/40 focus:outline-none resize-none min-h-[80px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate(e as any);
                    }
                  }}
                />

                <div className="flex items-center justify-between px-6 pb-5 pt-2">
                  {/* Left Controls */}
                  <div className="flex items-center gap-4 pl-2">
                    <button type="button" onClick={() => setShowLyricsModal(true)} className="flex items-center gap-1.5 text-[13px] font-medium text-white/40 hover:text-white/80 transition-colors">
                      <Music className="w-4 h-4" />
                      <span>Lyrics</span>
                      {lyrics && <span className="w-2 h-2 rounded-full bg-indigo-500 ml-1"></span>}
                    </button>

                    <div className="w-[1px] h-3.5 bg-white/10"></div>

                    <div className="relative">
                      <button type="button" onClick={() => { setShowDurationMenu(!showDurationMenu); setShowBatchMenu(false); }} className="flex items-center gap-1.5 text-[13px] font-medium text-white/40 hover:text-white/80 transition-colors">
                        <Clock className="w-4 h-4" />
                        <span>{duration < 60 ? duration + 's' : (duration / 60) + ' min'}</span>
                      </button>
                      {showDurationMenu && (
                        <div className="absolute top-full mt-2 left-0 bg-[#222] border border-white/5 rounded-lg py-1 shadow-xl z-50 min-w-[100px]">
                          {[60, 120, 180].map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => { setDuration(s); setShowDurationMenu(false); }}
                              className="w-full text-left px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                            >
                              {s / 60} min
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="w-[1px] h-3.5 bg-white/10"></div>

                    <div className="relative">
                      <button type="button" onClick={() => { setShowBatchMenu(!showBatchMenu); setShowDurationMenu(false); }} className="flex items-center gap-1.5 text-[13px] font-medium text-white/40 hover:text-white/80 transition-colors">
                        <Layers className="w-4 h-4" />
                        <span>{batchSize}x</span>
                      </button>
                      {showBatchMenu && (
                        <div className="absolute top-full mt-2 left-0 bg-[#222] border border-white/5 rounded-lg py-1 shadow-xl z-50 min-w-[100px]">
                          {[1, 2, 3, 4].map(b => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => { setBatchSize(b); setShowBatchMenu(false); }}
                              className="w-full text-left px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                            >
                              {b}x
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Submit */}
                  <button
                    type="submit"
                    disabled={!caption.trim() && !lyrics.trim() || generationStatus === 'generating' || generationStatus === 'uploading'}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-white/80 text-black hover:bg-white transition-colors disabled:opacity-30 disabled:hover:bg-white/80 shadow-md"
                  >
                    <ArrowUp className="w-5 h-5 flex-shrink-0" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>


        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showLyricsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowLyricsModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-[#1c1c1c] border border-white/10 shadow-2xl rounded-2xl w-full max-w-2xl flex flex-col p-6 z-10"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2 text-white">
                  <Music className="w-5 h-5 text-indigo-400" />
                  Lyrics & Tags
                </h3>
                <button onClick={() => setShowLyricsModal(false)} className="text-white/40 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-white/50 mb-4">
                Tip: Use structure tags like [Verse], [Chorus], or [Inst] to guide the AI. Chinese and English lyrics are well supported!
              </p>
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                placeholder="[Verse]&#10;In the quiet of the morning...&#10;&#10;[Chorus]&#10;Rise up...!"
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-[14px] leading-relaxed text-white/90 focus:outline-none focus:border-indigo-400/50 resize-none h-[40vh] custom-scrollbar"
              />
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowLyricsModal(false)}
                  className="px-6 py-2 bg-white text-black font-medium rounded-full hover:bg-white/90 transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {playingTrack && (
        <AudioPlayer track={playingTrack} onDelete={() => handleDelete(playingTrack.id, playingTrack.file_url)} />
      )}

    </main>
  );
}
