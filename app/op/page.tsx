"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Lead = {
  name?: string;
  nome?: string;
  phone?: string;
  whatsapp?: string;
};

type StatusPayload = {
  totalVideos?: number;
  totalLeads?: number;
  leads?: Lead[];
  isProcessing?: boolean;
  processingQueue?: number;
  lastUpdate?: number;
  isAlive?: boolean;
  queueSize?: number;
  lastProcessedAt?: number;
  now?: number;
  waiting?: number;
  active?: number;
  completed?: number;
  failed?: number;
};

type TechnicalLog = {
  message: string;
  time: string;
};

type EventItem = {
  id: string;
  message: string;
  time: number;
};

export default function Operacional() {
  const [mounted, setMounted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [alertShown, setAlertShown] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [techLogs, setTechLogs] = useState<TechnicalLog[]>([]);
  const [logs, setLogs] = useState<EventItem[]>([]);
  const lastVideoCount = useRef(0);
  const lastLeadCount = useRef(0);
  const [data, setData] = useState<Required<StatusPayload>>({
    totalVideos: 0,
    totalLeads: 0,
    leads: [],
    isProcessing: false,
    processingQueue: 0,
    lastUpdate: 0,
    isAlive: true,
    queueSize: 0,
    lastProcessedAt: 0,
    now: 0,
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
  });

  const playSound = () => {
    if (!soundEnabled) return;

    const audio = new Audio("/notify.mp3");
    audio.play().catch(() => {});
  };

  useEffect(() => {
    const unlockAudio = () => {
      setSoundEnabled(true);
      const audio = new Audio("/notify.mp3");
      void audio.play().catch(() => {
        // Unlock attempt can fail silently; future manual interactions still work.
      });
    };

    document.addEventListener("click", unlockAudio, { once: true });
    return () => document.removeEventListener("click", unlockAudio);
  }, []);

  useEffect(() => {
    setMounted(true);
    lastVideoCount.current = 0;
    lastLeadCount.current = 0;

    const fetchStatus = async () => {
      try {
        const [statsRes, leadsRes] = await Promise.all([
          fetch("/api/stats", { cache: "no-store" }),
          fetch("/api/leads", { cache: "no-store" }),
        ]);

        const statsJson = statsRes.ok ? await statsRes.json() : {};
        const leadsJson = leadsRes.ok ? await leadsRes.json() : [];
        const totalVideos = Number(statsJson?.totalVideos ?? 0);
        const totalLeads = Number(statsJson?.totalLeads ?? 0);
        const leads = Array.isArray(leadsJson) ? leadsJson.slice(-10).reverse() : [];

        setData({
          totalVideos,
          totalLeads,
          leads,
          isProcessing: false,
          processingQueue: 0,
          lastUpdate: Date.now(),
          isAlive: statsRes.ok || leadsRes.ok,
          queueSize: 0,
          lastProcessedAt: 0,
          now: Date.now(),
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
        });

        setLogs((prevLogs) => {
          const nextLogs = [...prevLogs];
          const now = Date.now();

          if (totalVideos > lastVideoCount.current) {
            playSound();
            nextLogs.unshift({
              id: `video-${totalVideos}-${now}`,
              message: `🎬 Video pronto (${totalVideos})`,
              time: now,
            });
            lastVideoCount.current = totalVideos;
          }

          if (totalLeads > lastLeadCount.current) {
            playSound();
            nextLogs.unshift({
              id: `lead-${totalLeads}-${now}`,
              message: `👥 Novo lead #${totalLeads}`,
              time: now,
            });
            lastLeadCount.current = totalLeads;
          }

          return nextLogs.slice(0, 10);
        });
      } catch {
        setData((prev) => ({
          ...prev,
          isAlive: false,
          isProcessing: false,
          processingQueue: 0,
        }));
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchTechnicalLogs = async () => {
      try {
        const res = await fetch("/api/logs", { cache: "no-store" });
        const payload = await res.json();
        setTechLogs(Array.isArray(payload?.logs) ? payload.logs : []);
      } catch {
        setTechLogs([]);
      }
    };

    fetchTechnicalLogs();
    const interval = setInterval(fetchTechnicalLogs, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!data.lastUpdate) return;

    const now = Date.now();

    if (now - data.lastUpdate > 10000 && !alertShown) {
      setLogs((prev) => [
        {
          id: `stall-${data.lastUpdate}`,
          message: "🚨 Sistema pode estar travado",
          time: now,
        },
        ...prev,
      ].slice(0, 10));

      setAlertShown(true);
    }

    if (now - data.lastUpdate < 5000) {
      setAlertShown(false);
    }
  }, [data, alertShown]);

  useEffect(() => {
    const isStalled = data.queueSize > 0 && data.now - data.lastProcessedAt > 15000;
    if (!isStalled || restarting) return;

    const restart = async () => {
      setRestarting(true);
      try {
        await fetch("/api/restart", { method: "POST" });
        const now = Date.now();
        setLogs((prev) => [
          {
            id: `restart-${now}`,
            message: "♻️ Sistema reiniciado automaticamente",
            time: now,
          },
          ...prev,
        ].slice(0, 10));
      } finally {
        setTimeout(() => setRestarting(false), 5000);
      }
    };

    void restart();
  }, [data.queueSize, data.now, data.lastProcessedAt, restarting]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#1f1f1f] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-3 mb-6">
          <Link href="/admin" className="px-4 py-2 bg-[#333333] text-white hover:bg-[#3f3f46] rounded-lg font-semibold border border-zinc-700">
            Dashboard
          </Link>

          <Link href="/op" className="px-4 py-2 bg-orange-500 text-black hover:bg-orange-600 active:bg-orange-700 rounded-lg font-semibold">
            Operacional
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-3">Modo Operacional</h1>

        <div className="flex items-center gap-4 mb-6">
          <span className="bg-green-900/30 text-green-400 border border-green-700 px-3 py-1 rounded-full text-sm font-bold">
            ● AO VIVO
          </span>
          <p>🎥 {data.totalVideos} videos</p>
          <p>👥 {data.totalLeads} leads</p>
          <button
            onClick={() => {
              const audio = new Audio("/notify.mp3");
              audio.play().catch(() => {});
              setSoundEnabled(true);
            }}
            className="px-3 py-1 rounded-lg bg-orange-500 text-black hover:bg-orange-600 active:bg-orange-700 text-sm font-semibold"
          >
            Testar som
          </button>
        </div>

        <div className="bg-[#2a2a2a] border border-zinc-700 p-4 rounded-xl mb-6">
          <h2 className="mb-3 font-semibold">Eventos em tempo real</h2>
          <div className="space-y-2 text-sm font-mono">
            {logs.length === 0 ? (
              <p className="text-zinc-400">Aguardando eventos...</p>
            ) : (
              logs.map((event, index) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between"
                >
                  <span
                    className={
                      event.message.includes("🚨")
                        ? "text-red-400"
                        : event.message.includes("🎬")
                        ? "text-blue-400"
                        : event.message.includes("👥")
                        ? `${index === 0 ? "text-green-300" : "text-green-400"}`
                        : "text-zinc-300"
                    }
                  >
                    {event.message}
                  </span>
                  <span className="text-zinc-500 text-xs">{new Date(event.time).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-[#2a2a2a] border border-zinc-700 p-4 rounded-xl mb-6">
          <h2 className="mb-3 font-semibold">Leads recentes</h2>
          <div className="space-y-2 text-sm font-mono">
            {data.leads.length === 0 ? (
              <p className="text-zinc-400">Nenhum lead recente.</p>
            ) : (
              data.leads.map((lead, i) => (
                <div key={`${lead.name || lead.nome || "lead"}-${i}`} className="flex justify-between text-sm">
                  <span>👤 {lead.name || lead.nome || "Sem nome"}</span>
                  <span className="text-zinc-400">{lead.phone || lead.whatsapp || "Sem telefone"}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-[#2a2a2a] border border-zinc-700 p-4 rounded-xl">
          <h2 className="mb-3 font-semibold">Sistema</h2>
          <p className={data.isAlive ? "text-green-400" : "text-red-500"}>
            {data.isAlive ? "🟢 Sistema ativo" : "🔴 Sistema travado"}
          </p>
          <p>📦 Fila: {data.waiting}</p>
          <p>⚙️ Processando: {data.active}</p>
          <p>✅ Concluidos: {data.completed}</p>
          <p>❌ Falhas: {data.failed}</p>
          <p>🕒 Ultimo processamento: {data.lastProcessedAt ? new Date(data.lastProcessedAt).toLocaleTimeString() : "-"}</p>
        </div>

        <div className="bg-[#2a2a2a] border border-zinc-700 p-4 rounded-xl mt-6">
          <h2 className="text-red-400 mb-2">Logs tecnicos</h2>

          {techLogs.length === 0 ? (
            <p className="text-xs text-zinc-500">Sem logs tecnicos.</p>
          ) : (
            techLogs.map((log, index) => (
              <p key={`${log.time}-${index}`} className="text-xs text-red-300">
                {log.time} - {log.message}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
