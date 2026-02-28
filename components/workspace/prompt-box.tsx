"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Paperclip, Globe, Hexagon, Folder, Mic, Send, Loader2, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";

export function PromptBox() {
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const supabase = createClient();

  // Auto-resize textarea based on content
  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  };

  useEffect(() => {
    handleInput();
  }, [prompt]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const currentPrompt = prompt;
    if (!currentPrompt.trim() || !user || isSubmitting) return;

    setIsSubmitting(true);
    setPrompt("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const { data: newMusic, error: insertError } = await supabase.from("musics").insert({
        title: currentPrompt.slice(0, 50) + (currentPrompt.length > 50 ? "..." : ""),
        user_id: user.id,
        prompt: currentPrompt,
      }).select().single();

      if (insertError || !newMusic) {
        console.error("Error creating music:", insertError?.message);
        setToastMessage("Failed to create music track: " + (insertError?.message || "Unknown error"));
        setTimeout(() => setToastMessage(null), 3000);
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);

      generateMusic(newMusic.id, currentPrompt);
    } catch (err) {
      console.error("Unexpected error:", err);
      setIsSubmitting(false);
    }
  };

  const generateMusic = async (musicId: string, promptText: string) => {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, musicId }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        await supabase.from("musics").update({
          file_url: data.url,
        }).eq("id", musicId);
      } else {
        console.error("Generation failed:", data.error || data);
        await supabase.from("musics").update({
          file_url: "FAILED",
        }).eq("id", musicId);
      }

    } catch (error) {
      console.error("Generation error:", error);
      await supabase.from("musics").update({
        file_url: "FAILED",
      }).eq("id", musicId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      <div className="fixed bottom-8 left-1/2 w-full max-w-3xl -translate-x-1/2 px-4 z-50 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="pointer-events-auto flex w-full flex-col gap-3 rounded-2xl bg-[#121212]/80 backdrop-blur-3xl px-12 py-8 shadow-[0_30px_100px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.15)] border border-white/10 relative overflow-hidden group"
        >
          {/* Ambient background glow inside the box */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <form onSubmit={handleSubmit} className="relative z-10 flex flex-col w-full">
            {/* Title / Helper Text */}
            <div className="mb-2 px-2 flex items-center justify-between">
              <span className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                Music Generation AI
              </span>
              <span className="text-xs text-white/30 font-medium">visoar/ace-step-1.5</span>
            </div>

            {/* Text Input */}
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              placeholder={isSubmitting ? "Generating your masterpiece..." : "Describe the music you want to create (e.g. Upbeat electronic dance music) ..."}
              className="max-h-[300px] min-h-[60px] w-full resize-none bg-transparent py-3 px-2 text-[18px] leading-relaxed text-white/95 placeholder:text-white/30 focus:outline-none disabled:opacity-50"
              rows={1}
            />

            {/* Bottom Bar: Action Icons & Submit */}
            <div className="flex items-center justify-between mt-4 px-2">
              {/* Left Actions */}
              <div className="flex items-center text-white/40">
                <button type="button" className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-white/10 hover:text-white transition-colors duration-200">
                  <Paperclip size={20} />
                </button>

                <button type="button" className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-white/10 hover:text-white transition-colors duration-200">
                  <Globe size={20} />
                </button>

                <div className="mx-3 h-5 w-[1px] bg-white/20" />

                <button type="button" className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-white/10 hover:text-white transition-colors duration-200">
                  <Hexagon size={20} />
                </button>

                <div className="mx-3 h-5 w-[1px] bg-white/20" />

                <button type="button" className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-white/10 hover:text-white transition-colors duration-200">
                  <Folder size={20} />
                </button>
              </div>

              {/* Right Action (Voice/Mic or Submit) */}
              <button
                type={prompt.trim() ? "submit" : "button"}
                disabled={isSubmitting}
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 active:scale-95 disabled:opacity-70 disabled:scale-100 ${prompt.trim()
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                  : "bg-white hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                  }`}
              >
                {isSubmitting ? (
                  <Loader2 size={22} className="text-white animate-spin" />
                ) : prompt.trim() ? (
                  <Send size={20} className="text-white ml-0.5" />
                ) : (
                  <Mic size={22} className="text-black" />
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

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
    </>
  );
}
