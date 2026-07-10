"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { formatNumber } from "@/utils/format";

interface HistorySectionProps {
  onSelectSession: (sessionId: string) => void;
  onResumeSession: (sessionId: string) => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({ onSelectSession, onResumeSession }) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getImports();
      setSessions(data);
    } catch (err: any) {
      setError(err.message || "Failed to load import history");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this import log?")) return;
    try {
      await api.deleteImport(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete log");
    }
  };

  useEffect(() => {
    void fetchHistory();
  }, []);

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch = session.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <section className="mb-8 animate-in fade-in duration-300">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            Import History
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            View and manage all your past import logs
          </p>
        </div>
        <button
          onClick={fetchHistory}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
        >
          Refresh Log
        </button>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by Session ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-zinc-250 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 transition-colors"
          />
        </div>
        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-zinc-250 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 transition-colors"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center">
          <p className="text-zinc-500 dark:text-zinc-400">No import sessions found. Upload a CSV to get started!</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center">
          <p className="text-zinc-500 dark:text-zinc-400">No matching history logs found for your search filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-6 py-4 text-left font-bold text-zinc-900 dark:text-zinc-50">Session ID</th>
                <th className="px-6 py-4 text-left font-bold text-zinc-900 dark:text-zinc-50">Date Created</th>
                <th className="px-6 py-4 text-left font-bold text-zinc-900 dark:text-zinc-50">Records</th>
                <th className="px-6 py-4 text-left font-bold text-zinc-900 dark:text-zinc-50">Success Rate</th>
                <th className="px-6 py-4 text-left font-bold text-zinc-900 dark:text-zinc-50">Status</th>
                <th className="px-6 py-4 text-right font-bold text-zinc-900 dark:text-zinc-50">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => {
                const total = session.rowCount || 0;
                const imported = session.importedCount || 0;
                const failed = session.failedCount || 0;
                const successRate = total > 0 ? Math.round((imported / total) * 100) : 0;
                const date = new Date(session.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <tr
                    key={session.id}
                    className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 font-mono font-medium text-zinc-700 dark:text-zinc-300">
                      {session.id.slice(0, 18)}...
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{date}</td>
                    <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">{formatNumber(total)} rows</td>
                    <td className="px-6 py-4">
                      {session.status === "completed" || session.status === "failed" ? (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{successRate}%</span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            ({imported} imported / {failed} failed)
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          session.status === "completed"
                            ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300"
                            : session.status === "processing"
                              ? "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                              : session.status === "failed"
                                ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300"
                                : "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300"
                        }`}
                      >
                        {session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {session.status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onResumeSession(session.id)}
                            className="rounded-lg bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-900/40 transition-colors"
                          >
                            Resume
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="rounded-lg bg-red-50 px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-900/40 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      ) : session.status === "processing" ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-zinc-400 dark:text-zinc-600 text-xs mr-2">Importing...</span>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="rounded-lg bg-red-50 px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-900/40 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onSelectSession(session.id)}
                            className="rounded-lg bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-900/40 transition-colors"
                          >
                            View Report
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="rounded-lg bg-red-50 px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-900/40 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
