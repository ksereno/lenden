"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [spinning, setSpinning] = useState(false);

  function handleClick() {
    setSpinning(true);
    router.refresh();
    setTimeout(() => setSpinning(false), 500);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Refresh"
      className="shrink-0 text-muted hover:text-foreground"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className={spinning ? "animate-spin" : undefined}
      >
        <path
          d="M13.65 4.35a6 6 0 1 0 1.2 6.15"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path d="M14.5 2v3.5H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
