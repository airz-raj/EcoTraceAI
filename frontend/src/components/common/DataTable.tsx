/**
 * EcoTrace AI — Accessible Data Table
 *
 * Sortable table with proper ARIA attributes.
 * Also serves as sr-only companion for chart visualizations.
 */

import { useState } from 'react';

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  caption: string;
  /** If true, renders as screen-reader-only (hidden visually) */
  srOnly?: boolean;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  caption,
  srOnly = false,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const sortedData = sortKey
    ? [...data].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortAsc ? aVal - bVal : bVal - aVal;
        }
        return sortAsc
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      })
    : data;

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return (
    <div className={srOnly ? 'sr-only' : 'overflow-x-auto'}>
      <table className="w-full text-sm" role="table">
        <caption className={srOnly ? '' : 'sr-only'}>{caption}</caption>
        <thead>
          <tr className={srOnly ? '' : 'border-b border-white/10'}>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                scope="col"
                className={`text-left py-3 px-4 text-slate-400 font-medium ${
                  col.sortable ? 'cursor-pointer hover:text-white select-none' : ''
                }`}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
                aria-sort={
                  sortKey === col.key
                    ? sortAsc
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                <span className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    <span aria-hidden="true">{sortAsc ? '↑' : '↓'}</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, idx) => (
            <tr
              key={idx}
              className={srOnly ? '' : 'border-b border-white/5 hover:bg-white/3 transition-colors'}
            >
              {columns.map((col) => (
                <td key={String(col.key)} className="py-3 px-4">
                  {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
