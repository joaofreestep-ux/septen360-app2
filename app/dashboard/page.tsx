"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      setJobs(data);
    } catch {
      setJobs([]);
    }
  }

  async function clearQueue() {
    setLoading(true);
    try {
      await fetch("/api/jobs/clear", { method: "POST" });
      await load();
    } catch {
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }

  async function retryJob(id: string) {
    try {
      await fetch(`/api/jobs/retry/${id}`, { method: "POST" });
      await load();
    } catch {
      return;
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, []);

  const stats = {
    waiting: jobs.filter((j) => j.state === "waiting").length,
    active: jobs.filter((j) => j.state === "active").length,
    completed: jobs.filter((j) => j.state === "completed").length,
    failed: jobs.filter((j) => j.state === "failed").length,
  };

  return (
    <div className="min-h-screen bg-[#1f1f1f] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">🎬 Jobs Dashboard</h1>
        <p className="text-zinc-400 mb-8">Monitore vídeos em processamento</p>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-[#2a2a2a] border border-[#3f3f46] rounded-lg p-4">
            <p className="text-zinc-400 text-sm">Waiting</p>
            <p className="text-2xl font-bold text-blue-400">{stats.waiting}</p>
          </div>
          <div className="bg-[#2a2a2a] border border-[#3f3f46] rounded-lg p-4">
            <p className="text-zinc-400 text-sm">Active</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.active}</p>
          </div>
          <div className="bg-[#2a2a2a] border border-[#3f3f46] rounded-lg p-4">
            <p className="text-zinc-400 text-sm">Completed</p>
            <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
          </div>
          <div className="bg-[#2a2a2a] border border-[#3f3f46] rounded-lg p-4">
            <p className="text-zinc-400 text-sm">Failed</p>
            <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
          </div>
        </div>

        {/* Clear Button */}
        <button
          onClick={clearQueue}
          disabled={loading}
          className="mb-8 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-black font-bold px-6 py-3 rounded-lg transition disabled:opacity-50"
        >
          {loading ? "Limpando..." : "🗑️ Limpar Fila"}
        </button>

        {/* Jobs Grid */}
        <div className="grid gap-4">
          {jobs.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <p>Nenhum job no momento</p>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className="bg-[#2a2a2a] border border-[#3f3f46] rounded-lg p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{job.name}</h3>
                    <p className="text-zinc-400 text-sm">ID: {job.id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded text-sm font-semibold ${
                        job.state === "active"
                          ? "bg-blue-500/20 text-blue-300"
                          : job.state === "waiting"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : job.state === "completed"
                          ? "bg-green-500/20 text-green-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {job.state}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                {job.state === "active" && (
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-zinc-400">Progresso</span>
                      <span className="text-sm font-bold text-orange-400">
                        {Math.round(job.progress)}%
                      </span>
                    </div>
                    <div className="h-3 bg-[#333333] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Data */}
                <div className="bg-[#1f1f1f] rounded p-3 mb-4">
                  <pre className="text-xs text-zinc-400 overflow-auto max-h-32">
                    {JSON.stringify(job.data, null, 2)}
                  </pre>
                </div>

                {/* Retry Button */}
                {job.state === "failed" && (
                  <button
                    onClick={() => retryJob(job.id)}
                    className="w-full bg-[#333333] hover:bg-[#3f3f46] text-white py-2 rounded transition"
                  >
                    🔄 Retry
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
