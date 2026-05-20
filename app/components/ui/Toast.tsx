"use client";

import { useEffect } from "react";

type ToastProps = {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
};

export function Toast({ message, type = "success", onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
  };

  return (
    <div className={`fixed bottom-5 right-5 px-4 py-3 rounded-xl text-white shadow-lg z-50 ${colors[type]}`}>
      {message}
    </div>
  );
}
