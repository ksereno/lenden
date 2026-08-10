"use client";

import { useEffect, useRef } from "react";

export function LoadingVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = false;
    video.play().catch(() => {
      // Browser blocked autoplay-with-sound (no recent user gesture) — fall
      // back to silent playback rather than showing a frozen video.
      video.muted = true;
      video.play().catch(() => {});
    });
  }, []);

  return (
    <video
      ref={videoRef}
      src="/loading.mp4"
      loop
      playsInline
      width={128}
      height={128}
      className="h-32 w-32"
    />
  );
}
