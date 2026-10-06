"use client";

import { ReactNode } from "react";
import { Icon } from "@/components/Icon";

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal-panel ${wide ? "max-w-3xl" : "max-w-lg"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-black/10 sticky top-0 bg-white/95 backdrop-blur-sm rounded-t-2xl">
          <h2 className="font-semibold text-ink text-[15px]">{title}</h2>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 inline-flex items-center justify-center rounded-full text-ink/40 transition-colors hover:text-ink hover:bg-black/5"
            aria-label="Close"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
