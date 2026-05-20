"use client"

import { useState } from "react";
import CameraRecorder from "@/app/components/CameraRecorder";

export default function Home() {
  const [started, setStarted] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1f1f1f] px-4 text-white">
      <img src="/septen-logo.png" alt="Septen 360" className="w-48 mb-6" />

      {!started ? (
        <div className="w-full max-w-sm rounded-3xl border border-zinc-700 bg-[#2a2a2a] p-8 text-center shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
          <h1 className="text-2xl font-bold">Sua experiência 360 começa aqui</h1>
          <p className="mt-2 text-sm text-zinc-400">Grave, escaneie e receba seu vídeo em segundos.</p>

          <button
            onClick={() => setStarted(true)}
            className="mt-6 w-full rounded-xl bg-orange-500 px-5 py-4 text-lg font-bold text-black transition hover:bg-orange-600 active:bg-orange-700"
          >
            Começar
          </button>
        </div>
      ) : (
        <CameraRecorder />
      )}
    </div>
  );
}