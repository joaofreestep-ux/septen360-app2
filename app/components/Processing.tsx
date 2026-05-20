"use client";

import { useEffect } from "react";

export default function Processing({ uuid }: { uuid: string }) {
  useEffect(() => {
    const t = setTimeout(() => {
      window.location.href = `/v?uuid=${uuid}`;
    }, 1200);

    return () => clearTimeout(t);
  }, [uuid]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1f1f1f]">
      <div className="bg-[#2a2a2a] border border-zinc-700 p-6 rounded-2xl shadow text-center text-white">
        <h2 className="text-xl font-bold">Criando seu video...</h2>
        <p className="text-gray-300 mt-2">Finalizando...</p>
      </div>
    </div>
  );
}
