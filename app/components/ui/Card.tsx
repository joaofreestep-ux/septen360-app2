import React from "react";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-[#2a2a2a] text-white p-6 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] border border-[#3f3f46] ${className}`.trim()}
    >
      {children}
    </div>
  );
}
