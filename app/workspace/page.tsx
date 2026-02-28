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

  const [step, setStep] = useState<'setup' | 'generating'>('setup');
  const [caption, setCaption] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [duration, setDuration] = useState(30);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
          setMusics(prev => [payload.new as MusicTrack, ...prev]);
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
    // Delete from DB (cascade rules etc)
    const { error } = await supabase.from("musics").delete().eq("id", id);
    if (!error && file_url && file_url.includes('supabase.co')) {
      // Optional: Delete from storage
      try {
        const urlObj = new URL(file_url);
        const pathParts = urlObj.pathname.split('/');
        // Typical structure: /storage/v1/object/public/musics/userId/filename
        const bucketIndex = pathParts.indexOf('musics');
        if (bucketIndex !== -1 && pathParts.length > bucketIndex + 1) {
          const objectPath = pathParts.slice(bucketIndex + 1).join('/');
          await supabase.storage.from('musics').remove([decodeURI(objectPath)]);
        }
      } catch (e) { console.error("Could not delete from storage", e); }
    }
    if (playingTrack?.id === id) {
      setPlayingTrack(null);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption && !lyrics) {
      setErrorMessage("Please enter at least a caption or lyrics.");
      return;
    }

    setErrorMessage(null);
    setStep('generating');

    try {
      // First, save the placeholder to DB 
      const { data: newMusic, error: insertError } = await supabase.from("musics").insert({
        title: caption || "Generated AI Music",
        user_id: user?.id,
        prompt: `Caption: ${caption} / Lyrics: ${lyrics}`,
        duration: duration,
        file_url: "GENERATING"
      }).select().single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Call API with userId for robust storage handling
      const response = await fetch('/api/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, lyrics, duration, musicId: newMusic.id, userId: user.id }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Generation failed");
      }

      // Update DB with URL
      await supabase.from("musics").update({
        file_url: data.url,
      }).eq("id", newMusic.id);

      // Setting step to setup so they see their library, which now updates via realtime
      setCaption('');
      setLyrics('');
      setStep('setup');
      setShowResult(true);

      // Auto-play the new track
      setPlayingTrack({ ...newMusic, file_url: data.url } as MusicTrack);

    } catch (err: any) {
      console.error("Generate error:", err);
      setErrorMessage(err.message || "An unexpected error occurred.");
      setStep('setup');

      // Update DB to failed if we have an ID
      setStep('setup'); // Fall back to setup
    }
  };

  const resetGenerator = () => {
    setCaption('');
    setLyrics('');
    setDuration(30);
    setErrorMessage(null);
    setStep('setup');
    setShowResult(false);
  };

  return (
    <main className="h-screen w-full bg-[#111] text-white flex flex-col items-center overflow-hidden relative selection:bg-indigo-500/30">
      <Navbar />

      <div className="flex flex-col flex-1 relative z-10 w-full items-center h-full">

        <AnimatePresence mode="wait">
          {/* SETUP STEP & LIBRARY */}
          {step === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col w-full h-full items-center"
            >

              <div className="flex-1 overflow-y-auto w-full px-4 pt-4 pb-6 custom-scrollbar flex flex-col items-center pt-16">
                {errorMessage && (
                  <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-3 w-full max-w-2xl mx-auto text-red-400 shrink-0">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{errorMessage}</p>
                  </div>
                )}

                {showResult ? (
                  <div className="w-full max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center mt-24 sm:mt-40">

                    {playingTrack && (
                      <div className="w-full max-w-2xl mx-auto mb-10 flex flex-col items-center">
                        <AudioPlayer track={playingTrack} onDelete={() => handleDelete(playingTrack.id, playingTrack.file_url)} />
                        {musics.length > 0 && (
                          <button
                            onClick={() => setPlayingTrack(null)}
                            className="mt-8 text-sm text-white/40 hover:text-white transition-colors tracking-wide"
                          >
                            Back to list
                          </button>
                        )}
                      </div>
                    )}

                    {(!playingTrack || musics.length > 0) && (
                      <div className="w-full flex justify-center mb-6 mt-4">
                        <p className="text-[15px] font-medium text-white/50 tracking-wide">Your Music Library</p>
                      </div>
                    )}

                    <div className="w-full">
                      <MusicList
                        musics={musics.slice(0, 2)}
                        onDelete={handleDelete}
                        onPlay={(track) => setPlayingTrack(track)}
                        playingTrackId={playingTrack?.id || null}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 w-full text-center pb-20">
                    <div className="inline-flex w-20 h-20 bg-white/5 items-center justify-center rounded-3xl mb-8 border border-white/5 shadow-inner">
                      <Music className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-4">What do you want to hear?</h1>
                    <p className="text-[16px] text-white/50 mb-8 max-w-md mx-auto">Enter lyrics or describe the mood of your next track, and let AI do the rest.</p>
                  </div>
                )}
              </div>

              <div className="shrink-0 w-full flex flex-col items-center p-4 pb-16 sm:pb-28 bg-gradient-to-t from-[#111] via-[#111] to-transparent">
                <form onSubmit={handleGenerate} className="w-full max-w-2xl bg-[#222222] border border-white/5 rounded-xl overflow-hidden flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-all focus-within:border-white/10 focus-within:ring-1 focus-within:ring-white/10 relative z-20">
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
                      <button type="button" className="flex items-center gap-1.5 text-[13px] font-medium text-white/40 hover:text-white/80 transition-colors">
                        <Music className="w-4 h-4" />
                        <span>Lyrics</span>
                      </button>

                      <div className="w-[1px] h-3.5 bg-white/10"></div>

                      <button type="button" className="flex items-center gap-1.5 text-[13px] font-medium text-white/40 hover:text-white/80 transition-colors">
                        <Clock className="w-4 h-4" />
                        <span>1 min</span>
                      </button>

                      <div className="w-[1px] h-3.5 bg-white/10"></div>

                      <button type="button" className="flex items-center gap-1.5 text-[13px] font-medium text-white/40 hover:text-white/80 transition-colors">
                        <Layers className="w-4 h-4" />
                        <span>1x</span>
                      </button>
                    </div>

                    {/* Right Submit */}
                    <button
                      type="submit"
                      disabled={!caption.trim() && !lyrics.trim()}
                      className="w-9 h-9 flex items-center justify-center rounded-full bg-white/80 text-black hover:bg-white transition-colors disabled:opacity-30 disabled:hover:bg-white/80 shadow-md"
                    >
                      <ArrowUp className="w-5 h-5 flex-shrink-0" />
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* GENERATING STEP */}
          {step === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="flex-1 flex flex-col items-center justify-center text-center max-w-md w-full mx-auto"
            >
              <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full animate-ping"></div>
                <div className="absolute inset-2 border-4 border-purple-500/30 rounded-full animate-spin direction-reverse"></div>
                <div className="bg-[#1c1c1c] w-24 h-24 rounded-full flex items-center justify-center border border-white/10 relative z-10 shadow-[0_0_50px_rgba(99,102,241,0.3)]">
                  <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold mb-3 tracking-wide text-white/95">Synthesizing Audio</h2>
              <p className="text-white/40 text-[15px] leading-relaxed max-w-sm mx-auto">
                Our AI models are processing your prompt and generating a high-quality music track. This usually takes 1-2 minutes.
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </main>
  );
}
