"use client";

import { useEffect, useState } from "react";

export default function Operator() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    totalLeads: 0,
  });

  useEffect(() => {
    const load = () => {
      fetch("/api/stats")
        .then((res) => res.json())
        .then((data) => setStats(data));
    };

    load();
    const interval = setInterval(load, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#1f1f1f] text-white flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">🎥 Septen 360</h1>

      <div className="text-2xl">💰 R$ {stats.totalRevenue}</div>

      <div className="text-xl">🎥 {stats.totalSales} videos vendidos</div>

      <div className="text-xl">👤 {stats.totalLeads} leads</div>
    </div>
  );
}
