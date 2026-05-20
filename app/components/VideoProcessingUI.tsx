"use client";

import { useEffect, useState } from "react";

type VideoProcessingUIProps = {
  jobId: string;
  uuid: string;
};

export default function VideoProcessingUI({ jobId, uuid }: VideoProcessingUIProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Preparando...");
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource(`/api/status/${jobId}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (typeof data.progress === "number") {
        setProgress(data.progress);
      }

      if (data.state === "completed" || data.done) {
        setProgress(100);
        setStatus("Pronto!");
        setVideoReady(true);
        eventSource.close();
        return;
      }

      if (data.error) {
        setStatus("Erro no processamento");
        eventSource.close();
        return;
      }

      const currentProgress = typeof data.progress === "number" ? data.progress : progress;
      if (currentProgress < 20) setStatus("Preparando...");
      else if (currentProgress < 60) setStatus("Processando...");
      else if (currentProgress < 90) setStatus("Renderizando...");
      else setStatus("Finalizando...");
    };

    eventSource.onerror = () => {
      setStatus("Erro de conexão");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [jobId]);

  const videoUrl = `/output_final/${uuid}_final.mp4?t=${Date.now()}`;

  return (
    <div className="min-h-screen bg-[#1f1f1f] text-white flex flex-col items-center justify-center px-6">
      <div className="w-[280px] h-[500px] bg-black rounded-2xl overflow-hidden mb-6 flex items-center justify-center border border-zinc-700">
        {!videoReady ? (
          <span className="text-zinc-500 text-sm">Gerando preview...</span>
        ) : (
          <video src={videoUrl} controls className="w-full h-full object-cover" />
        )}
      </div>

      <h2 className="text-lg font-semibold mb-2">{status}</h2>

      {!videoReady && (
        <div className="w-full max-w-md">
          <div className="relative w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
            <div className="absolute inset-0 animate-pulse bg-white/10" />
          </div>

          <p className="text-center text-sm text-zinc-400 mt-2">{progress}% processando</p>
        </div>
      )}

      {videoReady && (
        <div className="flex flex-col gap-3 mt-6 w-full max-w-xs">
          <a
            href={videoUrl}
            download
            className="bg-orange-500 text-black hover:bg-orange-600 active:bg-orange-700 font-semibold py-3 rounded-lg text-center"
          >
            Baixar vídeo
          </a>

          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="bg-[#333333] text-white hover:bg-[#3f3f46] py-3 rounded-lg"
          >
            Enviar outro vídeo
          </button>
        </div>
      )}

      <p className="text-xs text-zinc-500 mt-4 text-center">
        Não feche esta tela enquanto processa.
      </p>
    </div>
  );
}
