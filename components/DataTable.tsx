"use client";

import { ReactNode } from "react";
import { Icon } from "@/components/Icon";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
};

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
  emptyLabel = "No records found.",
}: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  emptyLabel?: string;
}) {
  return (
    <div className="card overflow-auto max-h-[65vh]">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.className}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="p-0 border-b-0">
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <Icon name="inbox" className="w-5 h-5" />
                  </div>
                  <p className="text-sm text-ink/45">{emptyLabel}</p>
                </div>
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? "cursor-pointer" : ""}
            >
              {columns.map((c) => (
                <td key={c.key} className={c.className}>
                  {c.render ? c.render(row) : (row as any)[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
