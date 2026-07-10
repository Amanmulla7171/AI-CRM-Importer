"use client";

import { useMemo, useState } from "react";
import { CSVData } from "@/types";

interface SortConfig {
  column: string | null;
  direction: "asc" | "desc";
}

interface FilterConfig {
  [key: string]: string;
}

interface PreviewTableProps {
  csvData: CSVData;
}

export const PreviewTable: React.FC<PreviewTableProps> = ({ csvData }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: null,
    direction: "asc",
  });
  const [filters, setFilters] = useState<FilterConfig>({});
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const rowsPerPage = 10;

  const visibleColumns = useMemo(
    () => csvData.headers.filter((header) => hiddenColumns.has(header) === false),
    [csvData.headers, hiddenColumns]
  );

  const filteredRows = useMemo(
    () =>
      csvData.rows.filter((row) =>
        Object.entries(filters).every(([column, value]) => {
          if (value === "") return true;
          const cellValue = String(row[column] || "").toLowerCase();
          return cellValue.includes(value.toLowerCase());
        })
      ),
    [csvData.rows, filters]
  );

  const sortedRows = useMemo(() => {
    const sortColumn = sortConfig.column;
    if (sortColumn === null) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      const aValue = String(a[sortColumn] || "");
      const bValue = String(b[sortColumn] || "");

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedRows = sortedRows.slice(startIndex, startIndex + rowsPerPage);

  const handleSort = (column: string) => {
    if (sortConfig.column === column) {
      setSortConfig({
        column,
        direction: sortConfig.direction === "asc" ? "desc" : "asc",
      });
      return;
    }

    setSortConfig({ column, direction: "asc" });
  };

  const handleFilter = (column: string, value: string) => {
    setFilters((previous) => ({ ...previous, [column]: value }));
    setCurrentPage(1);
  };

  const toggleColumnVisibility = (column: string) => {
    setHiddenColumns((previous) => {
      const next = new Set(previous);
      if (next.has(column)) {
        next.delete(column);
      } else {
        next.add(column);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
        <p className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Show/Hide Columns
        </p>
        <div className="flex flex-wrap gap-2">
          {csvData.headers.map((column) => (
            <button
              key={column}
              onClick={() => toggleColumnVisibility(column)}
              className={`rounded px-3 py-1 text-sm font-medium transition-all ${
                hiddenColumns.has(column)
                  ? "bg-zinc-300 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                  : "bg-blue-500 text-white dark:bg-blue-600"
              }`}
            >
              {hiddenColumns.has(column) ? "Hidden " : "Shown "}
              {column}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
        <p className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Filter Data
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {visibleColumns.map((column) => (
            <input
              key={column}
              type="text"
              placeholder={`Filter ${column}...`}
              value={filters[column] || ""}
              onChange={(event) => handleFilter(column, event.target.value)}
              className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50 dark:placeholder-zinc-400"
            />
          ))}
        </div>
      </div>

      <div className="text-sm text-zinc-600 dark:text-zinc-400">
        Showing {paginatedRows.length} of {sortedRows.length} rows
        {sortedRows.length !== csvData.rows.length &&
          ` (filtered from ${csvData.rows.length})`}
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="inline-block min-w-full">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                <th className="w-12 bg-zinc-100 px-4 py-3 text-left text-xs font-bold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                  #
                </th>
                {visibleColumns.map((column) => (
                  <th
                    key={column}
                    onClick={() => handleSort(column)}
                    className="cursor-pointer whitespace-nowrap bg-zinc-50 px-6 py-3 text-left text-xs font-bold text-zinc-600 transition-colors hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  >
                    <div className="flex items-center gap-2">
                      <span>{column}</span>
                      {sortConfig.column === column && (
                        <span className="text-blue-600 dark:text-blue-400">
                          {sortConfig.direction === "asc" ? "^" : "v"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginatedRows.map((row, rowIndex) => (
                <tr
                  key={startIndex + rowIndex}
                  className="border-b border-zinc-200 transition-colors duration-200 hover:bg-blue-50 dark:border-zinc-800 dark:hover:bg-blue-950/20"
                >
                  <td className="w-12 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-500">
                    {startIndex + rowIndex + 1}
                  </td>
                  {visibleColumns.map((column) => (
                    <td
                      key={`${startIndex + rowIndex}-${column}`}
                      className="overflow-hidden px-6 py-3 text-sm text-ellipsis whitespace-nowrap text-zinc-900 dark:text-zinc-50"
                    >
                      {String(row[column] || "").slice(0, 50)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-600"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-600"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
