"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

function getProcessingMessage(progress: number) {
  if (progress < 35) return "Preparando seu vídeo...";
  if (progress < 75) return "Aplicando identidade visual...";
  return "Finalizando...";
}

function Processing({ uuid, onDone, onError }: { uuid: string; onDone: () => void; onError: () => void }) {
  const [progress, setProgress] = useState(0);
  const safeProgress = Math.max(0, Math.min(100, progress));

  useEffect(() => {
    fetch(`/api/video/${uuid}`, { method: "POST" }).catch(() => {
      onError();
    });

    const es = new EventSource(`/api/status/${uuid}`);

    es.onmessage = (event) => {
      const data = JSON.parse(event.data) as { progress?: number; done?: boolean };

      if (data.progress !== undefined) {
        setProgress(data.progress);
      }

      if (data.done) {
        es.close();
        onDone();
      }
    };

    es.onerror = () => {
      es.close();
      onError();
    };

    return () => es.close();
  }, [uuid, onDone, onError]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#1f1f1f] text-white">
      <div className="bg-[#2a2a2a] border border-zinc-700 rounded-2xl shadow-xl px-8 py-10 text-center max-w-md w-full">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-orange-500 transition-all duration-500"
            style={{ width: `${safeProgress}%` }}
          />
        </div>
        <p className="text-lg font-semibold">{getProcessingMessage(safeProgress)}</p>
        <p className="text-sm text-zinc-400 mt-2">Isso leva apenas alguns segundos</p>
        <p className="text-sm text-zinc-300 mt-1">{safeProgress}%</p>
      </div>
    </div>
  );
}

function FinalVideoPlayer({ src }: { src?: string | null }) {
  if (!src) {
    return null;
  }

  return <video src={src} controls autoPlay playsInline className="w-full max-w-sm rounded-xl" />;
}

export default function VideoPage() {
  const isDev = process.env.NODE_ENV === "development";
  const isTestMode = isDev || process.env.NEXT_PUBLIC_ENABLE_TEST_MODE === "true";

  const [uuid, setUuid] = useState<string | null>(null);
  const [cacheBust] = useState(() => Date.now());
  const videoSrc = uuid ? `/output_final/${uuid}_final.mp4?cb=${cacheBust}` : null;
  const [finalVideoSrc, setFinalVideoSrc] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "payment" | "processing" | "video">("form");
  const [fatalError, setFatalError] = useState(false);

  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [acceptedLGPD, setAcceptedLGPD] = useState(false);
  const [acceptedImage, setAcceptedImage] = useState(false);
  const [sent, setSent] = useState(false);
  const [showLGPD, setShowLGPD] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [qr, setQr] = useState("");

  const isFormValid =
    name.trim().length >= 1 &&
    email.trim().length >= 1 &&
    whatsapp.length >= 11 &&
    whatsapp.length <= 12;

  const whatsappShareUrl = useMemo(() => {
    const shareSrc = step === "video" && finalVideoSrc ? finalVideoSrc : videoSrc;
    if (!shareSrc || typeof window === "undefined") return "https://wa.me/";
    const absoluteUrl = new URL(shareSrc, window.location.origin).toString();
    return `https://wa.me/?text=${encodeURIComponent(`Seu vídeo 360 está pronto: ${absoluteUrl}`)}`;
  }, [videoSrc, finalVideoSrc, step]);

  const onPaymentSuccess = () => {
    setStep("processing");
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paid = params.get("paid");
    const uuidParam = params.get("uuid");

    setUuid(uuidParam);

    if (paid === "true") {
      setStep("processing");
    }
  }, []);

  useEffect(() => {
    if (step === "video" && uuid) {
      setFinalVideoSrc(`/output_final/${uuid}_final.mp4?t=${Date.now()}`);
    }
  }, [step, uuid]);

  if (!uuid || fatalError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[#1f1f1f] text-white">
        <div className="bg-[#2a2a2a] border border-zinc-700 rounded-2xl shadow-xl px-8 py-10 text-center max-w-md w-full">
          <h1 className="text-2xl font-bold">Algo deu errado. Tente novamente.</h1>
          <button
            onClick={() => window.location.assign("/")}
            className="mt-6 w-full rounded-xl bg-orange-500 px-5 py-3 font-bold text-black transition hover:bg-orange-600 active:bg-orange-700"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  let content: React.ReactNode;

  if (step === "form") {
    content = (
      <div className="min-h-screen flex items-center justify-center bg-[#1f1f1f]">
        <div className="bg-[#2a2a2a] border border-zinc-700 rounded-2xl shadow-xl p-8 w-full max-w-md space-y-4 text-white">
          <div className="flex flex-col items-center gap-2">
            <img src="/septen-logo.png" alt="Septen 360" className="w-72 h-auto" />
            <p className="text-center text-zinc-400">📝 Preencha seus dados para receber seu vídeo</p>
          </div>

          <input
            value={name}
            className="w-full border border-zinc-700 bg-[#1f1f1f] text-white rounded-lg p-3 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Nome"
            onChange={(e) => setName(e.target.value)}
          />

          <input
            value={whatsapp}
            className={`w-full border bg-[#1f1f1f] text-white rounded-lg p-3 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              whatsapp.length > 0 && (whatsapp.length < 11 || whatsapp.length > 12)
                ? "border-red-500"
                : "border-zinc-700"
            }`}
            placeholder="WhatsApp"
            inputMode="numeric"
            maxLength={12}
            onChange={(e) => {
              const onlyNumbers = e.target.value.replace(/\D/g, "");
              setWhatsapp(onlyNumbers);
            }}
          />

          <input
            type="email"
            value={email}
            className="w-full border border-zinc-700 bg-[#1f1f1f] text-white rounded-lg p-3 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="space-y-3 text-sm mt-4">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={acceptedLGPD}
                onChange={(e) => setAcceptedLGPD(e.target.checked)}
                className="mt-1"
              />
              <p>
                Autorizo o tratamento dos meus dados conforme a{" "}
                <button
                  type="button"
                  onClick={() => {
                    setShowLGPD(true);
                    if (navigator.vibrate) navigator.vibrate(50);
                  }}
                  className="underline font-medium"
                >
                  Política de Privacidade (LGPD)
                </button>
                .
              </p>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={acceptedImage}
                onChange={(e) => setAcceptedImage(e.target.checked)}
                className="mt-1"
              />
              <p>
                Autorizo o uso da minha imagem conforme os{" "}
                <button
                  type="button"
                  onClick={() => {
                    setShowImage(true);
                    if (navigator.vibrate) navigator.vibrate(50);
                  }}
                  className="underline font-medium"
                >
                  Termos de Uso de Imagem
                </button>
                .
              </p>
            </div>
          </div>

          <button
            disabled={!acceptedLGPD || !acceptedImage || !isFormValid || sent}
            className={`w-full py-3 rounded-lg font-semibold transition ${
              acceptedLGPD && acceptedImage && isFormValid && !sent
                ? "bg-orange-500 text-black hover:bg-orange-600 active:bg-orange-700"
                : "bg-[#333333] text-gray-400 cursor-not-allowed"
            }`}
            onClick={async () => {
              if (sent || !isFormValid) return;

              setSent(true);

              try {
                const res = await fetch("/api/leads", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name,
                    phone: whatsapp,
                    whatsapp,
                    email,
                    uuid,
                    acceptedLGPD,
                    acceptedImage,
                  }),
                });

                if (!res.ok) {
                  setFatalError(true);
                  return;
                }

                setStep("payment");
              } catch {
                setFatalError(true);
              } finally {
                setSent(false);
              }
            }}
          >
            {sent ? "Enviando..." : "Continuar"}
          </button>

          {(!acceptedLGPD || !acceptedImage) && (
            <p className="text-xs text-zinc-400 text-center mt-2">
              É necessário aceitar os termos para liberar seu vídeo.
            </p>
          )}
        </div>
      </div>
    );
  } else if (step === "processing") {
    content = <Processing uuid={uuid} onDone={() => setStep("video")} onError={() => setFatalError(true)} />;
  } else if (step === "payment") {
    content = (
      <div className="min-h-screen flex items-center justify-center bg-[#1f1f1f]">
        <div className="bg-[#2a2a2a] border border-zinc-700 rounded-2xl shadow-xl p-8 w-full max-w-md text-center space-y-4 text-white">
          <h1 className="text-xl font-bold">🎥 Seu vídeo 360 está pronto!</h1>

          {isTestMode && (
            <p className="text-xs font-semibold text-yellow-300">⚠️ Modo teste ativado</p>
          )}

          <p className="text-zinc-400">Desbloqueie agora por apenas <strong>R$20</strong></p>

          <button
            className="w-full bg-orange-500 text-black hover:bg-orange-600 active:bg-orange-700 py-3 rounded-lg font-semibold"
            onClick={async () => {
              try {
                const res = await fetch("/api/create-payment", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ uuid }),
                });

                if (!res.ok) {
                  setFatalError(true);
                  return;
                }

                let data: { qr_code_base64?: string } = {};
                const rawBody = await res.text();

                try {
                  data = JSON.parse(rawBody);
                } catch {
                  setFatalError(true);
                  return;
                }

                if (!data.qr_code_base64) {
                  setFatalError(true);
                  return;
                }

                setQr(data.qr_code_base64);
              } catch {
                setFatalError(true);
              }
            }}
          >
            💳 Gerar PIX R$20
          </button>

          {isTestMode && (
            <button
              onClick={onPaymentSuccess}
              className="mt-4 w-full bg-yellow-500 text-black font-semibold py-3 rounded-xl"
            >
              ⚠️ Prosseguir sem pagamento (teste)
            </button>
          )}

          {qr && (
            <div className="bg-white p-5 rounded-2xl shadow-lg border border-zinc-300">
              <img
                src={`data:image/png;base64,${qr}`}
                alt="QR Code PIX"
                className="w-56 h-56 mx-auto rounded-lg"
              />
            </div>
          )}

          <p className="text-xs text-zinc-400">
            ✔ Vídeo editado automaticamente
            <br />
            ✔ Pronto para Instagram
            <br />
            ✔ Entrega imediata
          </p>

          <button onClick={() => setStep("form")} className="text-sm text-zinc-400">
            Voltar
          </button>
        </div>
      </div>
    );
  } else {
    content = (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 animate-fade-in bg-[#1f1f1f] text-white">
        <h1 className="text-3xl font-bold text-orange-500 mb-4 text-center">✅ Seu vídeo está pronto!</h1>

        <FinalVideoPlayer src={finalVideoSrc} />

        <div className="mt-6 w-full max-w-sm space-y-3">
          <a
            href={finalVideoSrc || undefined}
            className="block w-full rounded-xl bg-[#333333] py-3 text-center font-semibold text-white transition hover:bg-[#3f3f46]"
          >
            Assistir
          </a>

          <a
            href={finalVideoSrc || undefined}
            download
            className="block w-full rounded-xl bg-orange-500 py-3 text-center font-semibold text-black transition hover:bg-orange-600 active:bg-orange-700"
          >
            Baixar
          </a>

          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noreferrer"
            className="block w-full rounded-xl bg-[#25D366] py-3 text-center font-semibold text-black transition hover:brightness-110"
          >
            Compartilhar no WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {content}

      <AnimatePresence>
        {(showLGPD || showImage) && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowLGPD(false);
                setShowImage(false);
              }}
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 25 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              onDragEnd={(_event, info) => {
                if (info.offset.y > 100) {
                  setShowLGPD(false);
                  setShowImage(false);
                }
              }}
              className="relative bg-[#2a2a2a]/80 backdrop-blur-md text-white rounded-t-3xl w-full max-w-md h-[80vh] shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-zinc-500 rounded-full mx-auto mt-3" />

              <div className="flex justify-center mt-4">
                <img src="/logo.png" alt="Logo" className="h-10" />
              </div>

              <h2 className="text-center font-semibold text-lg mt-3">
                {showLGPD ? "Política de Privacidade" : "Uso de Imagem"}
              </h2>

              <div className="p-5 overflow-y-auto h-[60%] text-sm text-zinc-300 space-y-3">
                {showLGPD && (
                  <>
                    <p><strong>LGPD</strong></p>
                    <p>Seus dados serão usados para entrega do vídeo e contato comercial.</p>
                    <p>Podem ser compartilhados com o patrocinador do evento.</p>
                    <p>Você pode solicitar exclusão a qualquer momento.</p>
                  </>
                )}

                {showImage && (
                  <>
                    <p><strong>Uso de Imagem</strong></p>
                    <p>Sua imagem pode ser usada em redes sociais e materiais promocionais.</p>
                    <p>Sem uso pejorativo.</p>
                    <p>Pode ser revogado a qualquer momento.</p>
                  </>
                )}
              </div>

              <div className="p-4">
                <button
                  onClick={() => {
                    setShowLGPD(false);
                    setShowImage(false);
                  }}
                  className="w-full bg-orange-500 text-black hover:bg-orange-600 active:bg-orange-700 py-3 rounded-xl"
                >
                  Entendi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
