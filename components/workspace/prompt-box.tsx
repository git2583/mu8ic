"use client";

import { motion } from "framer-motion";
import { Paperclip, Globe, Hexagon, Folder, Mic, Send, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";

export function PromptBox() {
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    if (!prompt.trim() || !user || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("musics").insert({
        title: prompt.slice(0, 50) + (prompt.length > 50 ? "..." : ""),
        user_id: user.id,
        prompt: prompt,
        status: "generating",
      });

      if (error) {
        console.error("Error creating music:", error.message);
        alert("Failed to create music track");
      } else {
        setPrompt("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
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
  );
}
