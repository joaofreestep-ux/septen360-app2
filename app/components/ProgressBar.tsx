"use client";

import { useEffect, useState } from "react";

type ProgressBarProps = {
  jobId: string;
};

export default function ProgressBar({ jobId }: ProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/status/${jobId}`);
        const data = await res.json();

        if (typeof data.progress === "number") {
          setProgress(data.progress);
        }

        if (data.state === "completed") {
          setProgress(100);
          clearInterval(interval);
        }
      } catch {
        // Keep polling; transient failures can happen while dev server reloads.
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [jobId]);

  return (
    <div className="w-full max-w-md mx-auto mt-6">
      <div className="relative w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-orange-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
        <div className="absolute inset-0 animate-pulse bg-white/10" />
      </div>

      <p className="text-center text-sm text-zinc-400 mt-2">{progress}% processando...</p>
    </div>
  );
}
