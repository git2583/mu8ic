"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/workspace/navbar";
import { PromptBox } from "@/components/workspace/prompt-box";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Music, Clock, PlayCircle, PauseCircle, X } from "lucide-react";

type MusicTrack = {
  id: string;
  title: string;
  artist: string;
  duration: number | null;
  status: string;
  created_at: string;
  file_url?: string;
};

export default function WorkspacePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [musics, setMusics] = useState<MusicTrack[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/auth");
    }
  }, [user, isAuthLoading, router]);

  // Fetch initial tracks and subscribe to changes
  useEffect(() => {
    if (!user) return;

    const fetchMusics = async () => {
      setIsDataLoading(true);
      const { data, error } = await supabase
        .from("musics")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching musics:", error.message);
      } else if (data) {
        setMusics(data as MusicTrack[]);
      }
      setIsDataLoading(false);
    };

    fetchMusics();

    // Subscribe to realtime updates for this user's musics
    const subscription = supabase
      .channel("musics_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "musics",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMusics((prev) => [payload.new as MusicTrack, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setMusics((prev) =>
              prev.map((item) => (item.id === payload.new.id ? (payload.new as MusicTrack) : item))
            );
          } else if (payload.eventType === "DELETE") {
            setMusics((prev) => prev.filter((item) => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, supabase]);

  if (isAuthLoading || (!user && isDataLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#171717]">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#171717] text-white">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <div id="workspace-main-content" className="w-full px-8 pb-32 pt-32 md:px-[10vw] xl:px-[15vw] 2xl:px-[20vw] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h1 className="text-3xl font-semibold tracking-tight">Your Workspace</h1>
          <p className="mt-2 text-white/50">
            Create and manage your AI-generated music tracks here.
          </p>
        </motion.div>

        {/* Tracks Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12"
        >
          {isDataLoading ? (
            <div className="flex justify-center items-center py-20 text-white/40">
              <Loader2 className="animate-spin w-8 h-8" />
            </div>
          ) : musics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
              <Music className="w-12 h-12 text-white/20 mb-4" />
              <h3 className="text-lg font-medium text-white/80">No tracks yet</h3>
              <p className="text-sm text-white/40 mt-1 max-w-sm">
                Type a prompt below to generate your first AI music track.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {musics.map((track) => (
                  <motion.div
                    key={track.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="relative group flex flex-col p-4 rounded-2xl bg-[#212121] border border-white/5 hover:border-white/20 transition-all shadow-lg"
                  >
                    <div className="aspect-square bg-[#1A1A1A] rounded-xl mb-4 flex items-center justify-center overflow-hidden relative group">
                      {track.status === "generating" ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
                          <span className="text-xs text-white/50 font-medium tracking-wide">GENERATING</span>
                        </div>
                      ) : (
                        <>
                          <Music className="w-10 h-10 text-white/20" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              onClick={() => {
                                if (track.file_url) {
                                  setPlayingTrackId(playingTrackId === track.id ? null : track.id);
                                } else {
                                  setToastMessage("Audio URL is not available yet.");
                                  setTimeout(() => setToastMessage(null), 3000);
                                }
                              }}
                              className="h-12 w-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                            >
                              {playingTrackId === track.id ? (
                                <PauseCircle className="w-6 h-6" />
                              ) : (
                                <PlayCircle className="w-6 h-6 ml-1" />
                              )}
                            </button>
                            {playingTrackId === track.id && track.file_url && (
                              <audio
                                src={track.file_url}
                                autoPlay
                                onEnded={() => setPlayingTrackId(null)}
                                className="hidden"
                              />
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex-1">
                      <h4 className="font-medium text-base truncate pr-8" title={track.title}>
                        {track.title}
                      </h4>
                      <p className="text-sm text-white/40 mt-1 truncate">
                        {track.artist}
                      </p>
                    </div>

                    <div className="absolute top-6 right-6 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 text-xs font-medium text-white/60 backdrop-blur-md">
                      {track.status === "generating" ? (
                        <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>{track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '--:--'}</span>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* Fixed Prompt Input at the bottom */}
      <PromptBox />

      {/* Floating Centered Toast Message */}
      <AnimatePresence>
        {toastMessage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#2a2a2a] text-white/90 border border-white/10 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-4 pointer-events-auto"
            >
              <span className="text-sm font-medium">{toastMessage}</span>
              <button
                onClick={() => setToastMessage(null)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
