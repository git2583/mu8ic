"use client";

import { MinimalistHero } from "@/components/ui/minimalist-hero";

const navLinks = [
  { label: "FEATURES", href: "#" },
  { label: "PRICING", href: "#" },
  { label: "CONTACT", href: "#" },
];

export function Hero() {
  return (
    <main>
      <MinimalistHero
        logoText="mu8ic"
        navLinks={navLinks}
        mainText="Generate royalty-free, AI-powered music tracks perfectly tailored for your YouTube videos — in seconds, not hours."
        ctaLink="#"
        imageSrc="https://ik.imagekit.io/fpxbgsota/image%2013.png?updatedAt=1753531863793"
        imageAlt="A creative artist composing music with AI."
        overlayText={{
          part1: "create",
          part2: "music.",
        }}
      />
    </main>
  );
}
