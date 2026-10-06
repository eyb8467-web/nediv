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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className={`bg-white rounded-xl shadow-xl w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[90vh] overflow-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/10 sticky top-0 bg-white">
          <h2 className="font-semibold text-ink">{title}</h2>
          <button onClick={onClose} className="text-ink/40 hover:text-ink">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
