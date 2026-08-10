"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usernameToEmail } from "@/lib/auth";
import { LoadingVideo } from "@/components/LoadingVideo";

type Stage = "form" | "playing" | "fading";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [stage, setStage] = useState<Stage>("form");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });

    if (error) {
      setError("Wrong username or password.");
      setStatus("error");
      return;
    }

    setStage("playing");
    setTimeout(() => setStage("fading"), 2000);
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 2300);
  }

  if (stage !== "form") {
    return (
      <main
        className={`flex flex-1 items-center justify-center transition-opacity duration-300 ${
          stage === "fading" ? "opacity-0" : "opacity-100"
        }`}
      >
        <LoadingVideo />
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <video
          src="/cat-loop.mp4"
          autoPlay
          loop
          muted
          playsInline
          width={64}
          height={64}
          className="mx-auto mb-4 h-16 w-16 rounded-xl"
        />
        <h1 className="mb-1 text-center text-2xl font-semibold text-foreground">Lenden</h1>
        <p className="mb-8 text-center text-sm text-muted">Sign in with the username and password Kean gave you.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            autoComplete="username"
            autoCapitalize="off"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
          >
            {status === "loading" ? "Signing in…" : "Sign in"}
          </button>
          {status === "error" && <p className="text-sm text-red-400">{error}</p>}
        </form>
      </div>
    </main>
  );
}
