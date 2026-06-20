"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getPaginationRowModel
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminTable({
  columns = [],
  data = [],
  rowSelection = {},
  setRowSelection = () => { },
  onRowClick,
  initialSorting = [],
  emptyMessage = "No records found matching criteria."
}) {
  const safeColumns = useMemo(() => {
    if (!Array.isArray(columns)) return [];
    return columns.filter(Boolean).map((col, i) => {
      const id = col.id || col.accessorKey || (typeof col.header === 'string' ? col.header.toLowerCase().replace(/\s+/g, '_') : `col_${i}`);
      return { ...col, id };
    });
  }, [columns]);

  const safeData = useMemo(() => {
    return Array.isArray(data) ? data.filter(Boolean) : [];
  }, [data]);

  const validColumnIds = useMemo(() => new Set(safeColumns.map(c => c.id)), [safeColumns]);

  const [sorting, setSorting] = useState([]);

  // Sync sorting with initialSorting and valid columns
  useEffect(() => {
    if (Array.isArray(initialSorting) && initialSorting.length > 0) {
      const valid = initialSorting.filter(s => s && s.id && validColumnIds.has(s.id));
      setSorting(valid);
    }
  }, [validColumnIds, initialSorting]);

  const table = useReactTable({
    data: safeData,
    columns: safeColumns,
    state: {
      sorting: sorting || [],
      rowSelection: rowSelection || {}
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  const headerGroups = table.getHeaderGroups() || [];
  const rows = table.getRowModel()?.rows || [];
  const tableState = table.getState();
  const pagination = tableState?.pagination || { pageIndex: 0, pageSize: 25 };

  const startRow = safeData.length === 0 ? 0 : (pagination.pageIndex || 0) * (pagination.pageSize || 25) + 1;
  const endRow = Math.min(((pagination.pageIndex || 0) + 1) * (pagination.pageSize || 25), safeData.length);

  if (safeColumns.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-12 text-center text-sm font-semibold text-[#64748B]">
        No table columns configured.
      </div>
    );
  }

  return (
    <div className="flex min-h-[240px] flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-left">
          <thead className="border-b border-[#E2E8F0] bg-[#F8FBFF]">
            {(headerGroups || []).map((headerGroup) => (
              <tr key={headerGroup?.id || Math.random()}>
                {(headerGroup?.headers || []).map((header) => {
                  if (!header || !header.column) return null;

                  const column = header.column;
                  const isSortable = typeof column.getCanSort === 'function' ? column.getCanSort() : false;
                  
                  // Extremely safe sorted state lookup
                  let sortedState = false;
                  try {
                    if (isSortable && validColumnIds.has(column.id)) {
                      sortedState = column.getIsSorted?.() || false;
                    }
                  } catch (e) {
                    console.error("Sorting lookup failed for column", column.id);
                  }

                  const sortingHandler = isSortable
                    ? column.getToggleSortingHandler?.()
                    : undefined;

                  return (
                    <th
                      key={header.id || Math.random()}
                      className="select-none whitespace-nowrap px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#64748B] group"
                    >
                      <div
                        className={`flex items-center gap-1 ${isSortable ? "cursor-pointer hover:text-[#1E8AF7]" : ""}`}
                        onClick={sortingHandler}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            column.columnDef?.header,
                            header.getContext?.()
                          )}

                        {isSortable && (
                          <div className="w-4">
                            {sortedState === "asc" && <ChevronUp size={14} className="text-[#1E8AF7]" />}
                            {sortedState === "desc" && <ChevronDown size={14} className="text-[#1E8AF7]" />}
                            {!sortedState && <ChevronUp size={14} className="text-transparent group-hover:text-neutral-300" />}
                          </div>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-[#E2E8F0]">
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => {
                    if (typeof onRowClick === "function") {
                      onRowClick(row.original);
                    }
                  }}
                  className={`transition-colors hover:bg-[#F8FBFF] group ${typeof onRowClick === "function" ? "cursor-pointer" : ""
                    } ${row.getIsSelected?.() ? "bg-[#EFF6FF]" : ""}`}
                >
                  {(row.getVisibleCells?.() || []).filter(Boolean).map((cell) => (
                    <td
                      key={cell.id}
                      className="whitespace-nowrap px-5 py-3.5"
                      onClick={(event) => {
                        if (
                          cell.column?.id === "select" ||
                          cell.column?.columnDef?.id === "select"
                        ) {
                          event.stopPropagation();
                        }
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={safeColumns.length || 1}
                  className="px-6 py-20 text-center font-semibold text-[#64748B]"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-start justify-between gap-4 border-t border-[#E2E8F0] bg-[#F8FBFF] px-5 py-3 text-xs font-bold text-[#64748B] sm:flex-row sm:items-center">
        <div>
          Showing {startRow} to {endRow} of {safeData.length} rows
        </div>

        <div className="flex items-center gap-4">
          <select
            value={pagination.pageSize}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
            className="cursor-pointer rounded-lg border border-[#E2E8F0] bg-white px-2 py-1.5 font-bold text-[#0F172A] outline-none"
          >
            {[10, 25, 50, 100, 250].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-lg border border-[#E2E8F0] bg-white p-2 shadow-sm hover:border-[#93C5FD] hover:text-[#1E8AF7] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-lg border border-[#E2E8F0] bg-white p-2 shadow-sm hover:border-[#93C5FD] hover:text-[#1E8AF7] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
