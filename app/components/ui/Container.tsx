import React from "react";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function Container({ children, className = "" }: ContainerProps) {
  return (
    <div
      className={`bg-[#1f1f1f] min-h-screen flex items-center justify-center px-4 ${className}`.trim()}
    >
      {children}
    </div>
  );
}
