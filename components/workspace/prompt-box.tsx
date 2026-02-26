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
        status: "generating",
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
        body: JSON.stringify({ prompt: promptText }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        await supabase.from("musics").update({
          status: "completed",
          file_url: data.url
        }).eq("id", musicId);
      } else {
        console.error("Generation failed:", data.error);
        await supabase.from("musics").update({
          status: "failed",
        }).eq("id", musicId);
      }
    } catch (error) {
      console.error("Generation error:", error);
      await supabase.from("musics").update({
        status: "failed",
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
      <div className="fixed bottom-8 left-1/2 w-full max-w-3xl -translate-x-1/2 px-4 z-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex w-full flex-col gap-2 rounded-[2rem] bg-[#212121] px-5 py-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/5"
        >
          <form onSubmit={handleSubmit} className="flex flex-col w-full">
            {/* Text Input */}
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              placeholder={isSubmitting ? "Generating music..." : "Type your message here..."}
              className="max-h-[200px] min-h-[44px] w-full resize-none bg-transparent py-2 text-[15px] leading-relaxed text-white/90 placeholder:text-white/40 focus:outline-none disabled:opacity-50"
              rows={1}
            />

            {/* Bottom Bar: Action Icons & Submit */}
            <div className="flex items-center justify-between mt-1">
              {/* Left Actions */}
              <div className="flex items-center text-white/40">
                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/5 hover:text-white transition-colors duration-200">
                  <Paperclip size={18} />
                </button>

                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/5 hover:text-white transition-colors duration-200">
                  <Globe size={18} />
                </button>

                <div className="mx-2 h-4 w-[1px] bg-white/20" />

                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/5 hover:text-white transition-colors duration-200">
                  <Hexagon size={18} />
                </button>

                <div className="mx-2 h-4 w-[1px] bg-white/20" />

                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/5 hover:text-white transition-colors duration-200">
                  <Folder size={18} />
                </button>
              </div>

              {/* Right Action (Voice/Mic or Submit) */}
              <button
                type={prompt.trim() ? "submit" : "button"}
                disabled={isSubmitting}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.2)] disabled:opacity-70 disabled:scale-100 ${prompt.trim() ? "bg-[#333333] hover:bg-[#444444]" : "bg-white hover:scale-105"
                  }`}
              >
                {isSubmitting ? (
                  <Loader2 size={18} className="text-white animate-spin" />
                ) : prompt.trim() ? (
                  <Send size={18} className="text-white ml-0.5" />
                ) : (
                  <Mic size={20} className="text-black" />
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
