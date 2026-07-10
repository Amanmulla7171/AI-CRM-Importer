"use client";

import { useState } from "react";
import { ImportStats, CRMRecord } from "@/types";
import { formatNumber } from "@/utils/format";
import { api } from "@/services/api";

interface ResultSectionProps {
  stats: ImportStats;
  records: CRMRecord[];
  sessionId: string | null;
  onReset: () => void;
  onRetry?: () => void;
}

export const ResultSection: React.FC<ResultSectionProps> = ({
  stats,
  records,
  sessionId,
  onReset,
  onRetry,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ count: number; message: string } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSyncToCRM = async () => {
    if (!sessionId) return;
    setIsSyncing(true);
    setSyncError(null);
    setSyncResult(null);
    try {
      const data = await api.syncToCRM(sessionId);
      setSyncResult({ count: data.syncedCount, message: data.message });
    } catch (err: any) {
      setSyncError(err.message || "Failed to sync to CRM");
    } finally {
      setIsSyncing(false);
    }
  };
  const handleDownloadCSV = () => {
    if (!records || records.length === 0) return;
    const headers = ["Name", "Email", "Phone", "Company", "Status", "Error Message"];
    const rows = records.map((record) => [
      record.name || "",
      record.email || "",
      record.phone || "",
      record.company || "",
      record.status || "",
      record.error || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `import_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="mb-8 animate-in fade-in duration-300">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
          Import Results
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Summary of your import operation
        </p>
      </div>

      {/* Distribution Bar */}
      {stats.total > 0 && (
        <div className="mb-8 animate-in slide-in-from-top duration-500">
          <div className="flex justify-between items-center text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2">
            <span>IMPORT RATIO DISTRIBUTION</span>
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Imported ({Math.round(((stats.imported || 0) / stats.total) * 100)}%)
              </span>
              {stats.failed > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  Failed ({Math.round(((stats.failed || 0) / stats.total) * 100)}%)
                </span>
              )}
              {stats.skipped > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                  Skipped ({Math.round(((stats.skipped || 0) / stats.total) * 100)}%)
                </span>
              )}
            </div>
          </div>
          <div className="overflow-hidden rounded-full bg-zinc-100 h-4 flex dark:bg-zinc-800 shadow-inner border border-zinc-200/50 dark:border-zinc-700/30">
            {stats.imported > 0 && (
              <div
                style={{ width: `${((stats.imported || 0) / stats.total) * 100}%` }}
                className="bg-emerald-500 h-full transition-all duration-500 hover:opacity-90 cursor-help"
                title={`Imported: ${stats.imported}`}
              />
            )}
            {stats.failed > 0 && (
              <div
                style={{ width: `${((stats.failed || 0) / stats.total) * 100}%` }}
                className="bg-red-500 h-full transition-all duration-500 hover:opacity-90 cursor-help"
                title={`Failed: ${stats.failed}`}
              />
            )}
            {stats.skipped > 0 && (
              <div
                style={{ width: `${((stats.skipped || 0) / stats.total) * 100}%` }}
                className="bg-yellow-500 h-full transition-all duration-500 hover:opacity-90 cursor-help"
                title={`Skipped: ${stats.skipped}`}
              />
            )}
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
            Total Records
          </p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {formatNumber(stats.total)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 rounded-xl border border-green-200 dark:border-green-800 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
            Imported ✓
          </p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {formatNumber(stats.imported)}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
            {stats.total > 0 ? Math.round((stats.imported / stats.total) * 100) : 0}%
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 rounded-xl border border-red-200 dark:border-red-800 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
            Failed ✗
          </p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
            {formatNumber(stats.failed)}
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-2">
            {stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0}%
          </p>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/30 rounded-xl border border-yellow-200 dark:border-yellow-800 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-2">
            Skipped ⊝
          </p>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
            {formatNumber(stats.skipped)}
          </p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
            {stats.total > 0 ? Math.round((stats.skipped / stats.total) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncResult && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300 animate-in slide-in-from-top duration-300">
          <p className="font-semibold flex items-center gap-2">
            <span className="text-lg">✓</span> {syncResult.message}
          </p>
        </div>
      )}

      {syncError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300 animate-in slide-in-from-top duration-300">
          <p className="font-semibold flex items-center gap-2">
            <span className="text-lg">✗</span> {syncError}
          </p>
        </div>
      )}

      {/* Results Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-6 py-4 text-left font-bold text-zinc-900 dark:text-zinc-50">
                Name
              </th>
              <th className="px-6 py-4 text-left font-bold text-zinc-900 dark:text-zinc-50">
                Email
              </th>
              <th className="px-6 py-4 text-left font-bold text-zinc-900 dark:text-zinc-50">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {records.slice(0, 10).map((record) => (
              <tr
                key={record.id}
                className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors duration-200"
              >
                <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300 font-medium">
                  {record.name}
                </td>
                <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                  {record.email}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors duration-200 ${
                      record.status === "imported"
                        ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300"
                        : record.status === "failed"
                          ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300"
                          : record.status === "skipped"
                            ? "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {record.status === "imported" && "✓"}
                    {record.status === "failed" && "✗"}
                    {record.status === "skipped" && "⊝"}
                    {record.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {records.length > 10 && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
          Showing 10 of {records.length} records
        </p>
      )}

      <div className="flex flex-wrap gap-4 items-center">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-8 py-3 bg-zinc-200 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-50 rounded-lg font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-800 active:scale-95 transition-all duration-300"
        >
          <span>⟲</span>
          Import Another File
        </button>

        <button
          onClick={handleDownloadCSV}
          className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 transition-all duration-300"
        >
          <span>📥</span>
          Download CSV Report
        </button>

        {stats.failed > 0 && onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-red-500/30 active:scale-95 transition-all duration-300"
          >
            <span>⟳</span>
            Retry Failed Rows ({stats.failed})
          </button>
        )}

        {stats.imported > 0 && sessionId && (
          <button
            onClick={handleSyncToCRM}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-emerald-500/30 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSyncing ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="3" strokeOpacity="0.25" />
                  <path d="M4 12a8 8 0 0116 0" strokeWidth="3" fill="currentColor" />
                </svg>
                Syncing to CRM...
              </>
            ) : (
              <>
                <span>🔗</span>
                Sync to CRM ({stats.imported})
              </>
            )}
          </button>
        )}
      </div>
    </section>
  );
};
