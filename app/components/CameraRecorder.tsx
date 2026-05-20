"use client";

import { useEffect, useRef, useState } from "react";

export default function CameraRecorder() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordedMimeTypeRef = useRef("video/webm");

  const [stage, setStage] = useState<"idle" | "countdown" | "recording" | "uploading" | "qr">("idle");
  const [countdown, setCountdown] = useState(5);
  const [timeLeft, setTimeLeft] = useState(30);
  const [qrUuid, setQrUuid] = useState<string | null>(null);
  const [qrTimeLeft, setQrTimeLeft] = useState(180);
  const [cameraStatus, setCameraStatus] = useState<"idle" | "loading" | "active">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function initCamera() {
    try {
      setErrorMessage(null);
      setCameraStatus("loading");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
        },
        audio: false,
      });

      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      setTimeout(async () => {
        try {
          await video.play();
          setCameraStatus("active");
        } catch {
          setTimeout(async () => {
            await video.play().catch(() => {});
            setCameraStatus("active");
          }, 500);
        }
      }, 300);

    } catch {
      setErrorMessage("Não foi possível acessar sua câmera. Por favor, permita o acesso e tente novamente.");

      setCameraStatus("idle");
    }
  }

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // ⏳ COUNTDOWN (5s)
  useEffect(() => {
    if (stage !== "countdown") return;

    if (countdown === 0) {
      startRecording();
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, countdown]);

  // ⏱️ TIMER DE GRAVAÇÃO (30s)
  useEffect(() => {
    if (stage !== "recording") return;

    if (timeLeft === 0) {
      stopRecording();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, timeLeft]);

  useEffect(() => {
    if (stage !== "qr") return;

    setQrTimeLeft(180);

    const interval = setInterval(() => {
      setQrTimeLeft((t) => Math.max(t - 1, 0));
    }, 1000);

    const resetTimer = setTimeout(() => {
      window.location.reload();
    }, 180000);

    return () => {
      clearInterval(interval);
      clearTimeout(resetTimer);
    };
  }, [stage]);

  // ▶️ iniciar countdown
  function startCountdown() {
    if (!videoRef.current?.srcObject) {
      setErrorMessage("Ative a câmera para iniciar a gravação.");
      return;
    }

    setCountdown(5);
    setStage("countdown");
  }

  // 🎥 parar câmera
  function stopCamera() {
    const stream = videoRef.current?.srcObject as MediaStream;

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current!.srcObject = null;
    }

    setCameraStatus("idle");
  }

  // 🎥 iniciar gravação
  function startRecording() {
    if (!videoRef.current?.srcObject) return;

    const stream = videoRef.current.srcObject as MediaStream;

    if (typeof MediaRecorder === "undefined") {
      alert("Este navegador não suporta gravação de vídeo.");
      setStage("idle");
      return;
    }

    const mediaRecorder = new MediaRecorder(stream);

    recordedMimeTypeRef.current = mediaRecorder.mimeType || "video/webm";

    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = handleUpload;

    mediaRecorder.start();

    setTimeLeft(30);
    setStage("recording");
  }

  // ⏹️ parar gravação
  function stopRecording() {
    mediaRecorderRef.current?.stop();
    stopCamera();
    setStage("uploading");
  }

  // ☁️ upload + redirect
  async function handleUpload() {
    try {
      setErrorMessage(null);
      if (chunksRef.current.length === 0) {
        throw new Error();
      }

      const blob = new Blob(chunksRef.current, {
        type: recordedMimeTypeRef.current || "video/webm",
      });

      const formData = new FormData();
      formData.append("file", blob, "video.webm");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error();
      }

      const data = await res.json();

      if (!data.uuid) {
        throw new Error();
      }

      setQrUuid(data.uuid);
      setStage("qr");
    } catch {
      setErrorMessage("Não foi possível enviar seu vídeo agora. Tente novamente.");
      setStage("idle");
    }
  }

  return (
    <div className="bg-[#2a2a2a] text-white rounded-3xl p-6 w-[350px] shadow-[0_10px_30px_rgba(0,0,0,0.6)] text-center relative">

      {stage !== "qr" && (
        <>
          {/* 🎥 VIDEO */}
          <div className="relative mb-6 h-48">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                background: "black",
              }}
            />

            {/* ⏳ COUNTDOWN OVERLAY */}
            {stage === "countdown" && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-xl">
                <span className="text-white text-6xl font-bold animate-pulse">
                  {countdown}
                </span>
              </div>
            )}

            {/* 🔴 REC + TIMER */}
            {stage === "recording" && (
              <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/70 px-3 py-1 rounded-full">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-white text-sm font-bold">{timeLeft}s</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* ⏱️ PROGRESS BAR */}
      {stage === "recording" && (
        <div className="w-full bg-zinc-700 rounded-full h-2 mb-4">
          <div
            className="bg-orange-500 h-2 rounded-full transition-all"
            style={{ width: `${(timeLeft / 30) * 100}%` }}
          />
        </div>
      )}

      {/* 🔘 BOTÃO */}
      {stage === "idle" && (
        <div className="space-y-3">
          <button
            onClick={() => {
              setCameraStatus("loading");
              void initCamera();
            }}
            disabled={cameraStatus === "loading"}
            className="bg-[#333333] text-white hover:bg-[#3f3f46] disabled:opacity-60 disabled:cursor-not-allowed w-full py-3 rounded-xl font-semibold"
          >
            {cameraStatus === "loading" ? "Abrindo câmera..." : "Ativar câmera"}
          </button>

          <button
            onClick={startCountdown}
            disabled={cameraStatus !== "active"}
            className="bg-orange-500 text-black hover:bg-orange-600 active:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed w-full py-3 rounded-xl font-semibold"
          >
            🎥 Começar
          </button>
        </div>
      )}

      {stage === "recording" && (
        <button
          onClick={stopRecording}
          className="bg-red-500 hover:bg-red-600 text-white w-full py-3 rounded-xl font-semibold"
        >
          ⏹️ Parar gravação
        </button>
      )}

      {/* ⏳ STATUS */}
      {stage === "uploading" && (
        <p className="text-gray-300 font-semibold">
          Enviando vídeo...
        </p>
      )}

      {errorMessage && (
        <div className="mt-4 rounded-xl border border-red-600/50 bg-red-500/10 p-3 text-sm text-red-200">
          {errorMessage}
        </div>
      )}

      {stage === "qr" && qrUuid && (
        <div className="text-center space-y-6 animate-fade-in">

          {/* 🔥 TÍTULO */}
          <div>
            <h2 className="text-xl font-bold text-white">
              📲 Escaneie o QR para continuar
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Abra no celular para preencher seus dados e finalizar.
            </p>
          </div>

          {/* 🔲 CARD DO QR */}
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-zinc-700">

            <img
              src={`/api/qrcode?uuid=${qrUuid}`}
              className="mx-auto w-56 h-56 rounded-xl"
              alt="QR Code do vídeo"
            />

            {/* 📱 INSTRUÇÃO */}
            <p className="text-sm text-gray-700 mt-4">
              Aponte a câmera do celular para o código
            </p>
          </div>

          {/* DIVISOR */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-[1px] bg-zinc-700"></div>
            <span className="text-xs text-zinc-400">ou</span>
            <div className="flex-1 h-[1px] bg-zinc-700"></div>
          </div>

          {/* 🔓 BOTÃO ALTERNATIVO */}
          <button
            onClick={() => {
              window.open(`/v?uuid=${qrUuid}`, "_blank");
            }}
            className="w-full py-3 rounded-xl font-semibold text-black bg-orange-500 hover:bg-orange-600 active:bg-orange-700 shadow-lg hover:scale-[1.02] transition"
          >
            🔓 Acessar neste dispositivo
          </button>

          {/* ⏳ AUTO RESET */}
          <p className="text-xs text-zinc-400 mt-2">
            Esta tela será reiniciada automaticamente em {qrTimeLeft}s
          </p>

        </div>
      )}
    </div>
  );
}
