import React from "react";

type TextProps = {
  children: React.ReactNode;
  variant?: "title" | "subtitle" | "muted";
  className?: string;
};

export function Text({ children, variant = "subtitle", className = "" }: TextProps) {
  const styles = {
    title: "text-xl font-bold text-white",
    subtitle: "text-sm text-gray-300",
    muted: "text-xs text-gray-400",
  };

  return <p className={`${styles[variant]} ${className}`.trim()}>{children}</p>;
}
