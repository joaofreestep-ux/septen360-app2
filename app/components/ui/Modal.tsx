"use client";

import React from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#2a2a2a] text-white p-6 rounded-2xl w-[90%] max-w-md shadow-xl relative border border-[#3f3f46]">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
          aria-label="Fechar modal"
        >
          x
        </button>

        {children}
      </div>
    </div>
  );
}
