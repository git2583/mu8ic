"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Search, LogOut, User } from "lucide-react";
import Link from "next/link";

export function Navbar() {
  const { user, signOut } = useAuth();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  if (!user) return null;

  return (
    <nav className="fixed inset-x-0 top-0 z-40 h-16 bg-[#171717]/40 backdrop-blur-2xl shadow-[0_4px_32px_rgba(0,0,0,0.2)]"
      style={{
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1), inset 0 -1px 0 rgba(255, 255, 255, 0.05)"
      }}
    >
      <div id="navbar-inner-wrapper" className="flex h-full w-full items-center justify-between px-8 md:px-[10vw] xl:px-[15vw] 2xl:px-[20vw]">
        {/* Left: Logo */}
        <div className="flex flex-1 items-center gap-3">
          <Link href="/workspace" className="flex items-center transition-opacity hover:opacity-80">
            <span className="text-lg font-semibold tracking-widest uppercase text-white/90">mu8ic</span>
          </Link>
        </div>

        {/* Center: Search Input */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl px-4 pointer-events-none">
          <div className="relative w-full pointer-events-auto">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-6">
              <Search className="h-5 w-5 text-white/40" />
            </div>
            <input
              type="text"
              className="block w-full h-14 rounded-full border border-white/10 bg-white/5 py-4 pl-14 pr-6 text-base text-white placeholder-white/30 outline-none transition-all hover:bg-white-[0.07] focus:border-white/20 focus:bg-white/10 focus:ring-2 focus:ring-white/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
              placeholder="Search for tracks, moods, or genres..."
            />
          </div>
        </div>

        {/* Right: User Profile & Popover */}
        <div className="flex flex-1 justify-end relative h-full items-center">
          <div
            className="relative flex items-center h-full px-2 cursor-pointer"
            onMouseEnter={() => setIsPopoverOpen(true)}
            onMouseLeave={() => setIsPopoverOpen(false)}
          >
            <div className="flex items-center gap-2 p-1.5 rounded-full hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">

              {user.user_metadata.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Avatar"
                  className="h-9 w-9 rounded-full border border-white/20 object-cover shadow-[0_0_12px_rgba(255,255,255,0.1)] ring-2 ring-transparent transition-all group-hover:ring-white/20"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/80 to-purple-500/80 text-sm font-medium text-white border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.1)] overflow-hidden relative">
                  <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity" />
                  {user.email?.charAt(0).toUpperCase() || <User className="h-4 w-4 opacity-80" />}
                </div>
              )}
            </div>

            {/* Hover Popover */}
            <AnimatePresence>
              {isPopoverOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute right-0 top-[calc(100%-8px)] mt-2 w-56 rounded-2xl border border-white/10 bg-[#171717]/80 p-1.5 backdrop-blur-3xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-50 origin-top-right"
                  style={{
                    boxShadow: "0 10px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                  }}
                >
                  <div className="px-3 py-2.5 mb-1 flex flex-col gap-0.5 pointer-events-none">
                    <p className="text-sm text-white/90 font-medium truncate">{user.user_metadata.full_name || "Account"}</p>
                    <p className="text-xs text-white/50 truncate w-full">{user.email}</p>
                  </div>

                  <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-1" />

                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors group"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-400 group-hover:bg-red-500/20 group-hover:text-red-300 transition-colors">
                      <LogOut className="h-4 w-4" />
                    </div>
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
}
