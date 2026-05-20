"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type RankingEntry = {
  name: string;
  count: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalRevenue: 0,
    totalLeads: 0,
    ranking: [] as RankingEntry[],
  });
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        const data = await res.json();

        setStats({
          totalVideos: Number(data?.totalVideos ?? 0),
          totalRevenue: Number(data?.totalRevenue ?? 0),
          totalLeads: Number(data?.totalLeads ?? 0),
          ranking: Array.isArray(data?.ranking) ? data.ranking : [],
        });

        setRecent((prev) => [`Novo video #${Number(data?.totalVideos ?? 0)}`, ...prev.slice(0, 4)]);
      } catch {
        return;
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#1f1f1f] text-white p-6">
      <div className="flex gap-3 mb-6">
        <Link href="/admin" className="px-4 py-2 bg-orange-500 text-black hover:bg-orange-600 active:bg-orange-700 rounded-lg font-semibold">
          Dashboard
        </Link>

        <Link href="/op" className="px-4 py-2 bg-[#333333] text-white hover:bg-[#3f3f46] rounded-lg font-semibold border border-zinc-700">
          Operacional
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          <span className="text-white">SEPTEN</span>
          <span className="text-orange-500"> 360</span>
        </h1>
        <p className="text-zinc-400">Dashboard do Evento</p>
        <a
          href="/api/leads/export"
          className="inline-block mt-4 px-4 py-2 bg-orange-500 text-black hover:bg-orange-600 active:bg-orange-700 rounded-xl font-semibold"
        >
          📥 Exportar Leads
        </a>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#2a2a2a] border border-zinc-700 p-5 rounded-2xl shadow-lg">
          <p className="text-zinc-400 text-sm">Faturamento</p>
          <p className="text-3xl font-bold text-orange-500">R$ {stats.totalRevenue}</p>
        </div>

        <div className="bg-[#2a2a2a] border border-zinc-700 p-5 rounded-2xl shadow-lg">
          <p className="text-zinc-400 text-sm">Videos</p>
          <p className="text-3xl font-bold text-white">{stats.totalVideos}</p>
        </div>

        <div className="bg-[#2a2a2a] border border-zinc-700 p-5 rounded-2xl shadow-lg">
          <p className="text-zinc-400 text-sm">Leads</p>
          <p className="text-3xl font-bold text-white">{stats.totalLeads}</p>
        </div>
      </div>

      <div className="mb-6">
        <span className="bg-green-900/30 text-green-400 border border-green-700 px-3 py-1 rounded-full text-sm font-semibold">
          ● AO VIVO
        </span>
      </div>

      <div className="bg-[#2a2a2a] border border-zinc-700 rounded-2xl p-5 shadow-lg">
        <h2 className="text-lg font-bold mb-3 text-white">Atividade em tempo real</h2>

        <div className="space-y-2 text-sm text-zinc-300">
          {recent.map((item, i) => (
            <p key={i}>🎬 {item}</p>
          ))}
        </div>
      </div>

      <div className="bg-[#2a2a2a] border border-zinc-700 p-5 rounded-2xl shadow-lg mt-6">
        <h2 className="font-bold mb-3">🏆 Top Participantes</h2>

        {stats.ranking.length === 0 ? (
          <p className="text-sm text-zinc-400">Sem dados de ranking ainda.</p>
        ) : (
          stats.ranking.map((item, index) => (
            <p key={`${item.name}-${index}`} className="text-sm text-zinc-200">
              #{index + 1} {item.name} ({item.count})
            </p>
          ))
        )}
      </div>
    </div>
  );
}
