"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type EmoteModalProps = {
  imageUrl?: string;
  storageKey?: string;
  dismissForMs?: number; // how long to keep it dismissed after close
};

export default function EmoteModal({
  imageUrl = "https://cdn.7tv.app/emote/01JNVDMP2QKWXD739PSHD8WR81/4x.avif",
  storageKey = "emoteModalDismissed",
  dismissForMs = 24 * 60 * 60 * 1000, // default: one day
}: EmoteModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === "undefined") {
        setIsOpen(false);
        return;
      }

      const untilRaw = window.localStorage.getItem(storageKey);
      const now = Date.now();
      const until = untilRaw ? Number(untilRaw) : 0;
      if (!until || now >= until) {
        setIsOpen(true);
      }
    } catch (_) {
      setIsOpen(true);
    }
  }, [storageKey]);

  function close() {
    try {
      if (typeof window !== "undefined") {
        const nextTime = Date.now() + dismissForMs;
        window.localStorage.setItem(storageKey, String(nextTime));
      }
    } catch (_) {}
    setIsOpen(false);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000]">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

      {/* Centered content */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative text-center">
          <Image
            src={imageUrl}
            alt="Emote modal"
            width={320}
            height={320}
            priority
            className="h-auto w-56 sm:w-64 md:w-72 lg:w-80 drop-shadow-2xl"
          />

          {/* Caption */}
          <div className="mt-3 text-xl sm:text-2xl font-extrabold tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
          Løftebryteren
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={close}
            aria-label="Lukk"
            className="absolute -right-3 -top-3 rounded-full bg-white/90 p-2 text-black shadow-md hover:bg-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 11-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}


