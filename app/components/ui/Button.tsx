"use client";

import React from "react";

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
};

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  className = "",
  type = "button",
}: ButtonProps) {
  const base = "w-full py-3 rounded-xl font-semibold transition shadow-md";

  const styles = {
    primary: "bg-orange-500 text-black hover:bg-orange-600 active:bg-orange-700",
    secondary: "bg-[#333333] text-white hover:bg-[#3f3f46]",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[variant]} ${disabled ? "bg-[#2a2a2a] text-gray-500 cursor-not-allowed" : ""} ${className}`.trim()}
    >
      {children}
    </button>
  );
}
