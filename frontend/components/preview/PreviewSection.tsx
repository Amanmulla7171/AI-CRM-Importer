"use client";

import { CSVData } from "@/types";
import { PreviewTable } from "./PreviewTable";

interface PreviewSectionProps {
  csvData: CSVData;
  mappings: Record<string, string | null> | null;
  onMappingChange?: (crmField: string, csvHeader: string | null) => void;
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({ csvData, mappings, onMappingChange }) => {
  return (
    <section className="mb-8 animate-in fade-in duration-300">
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            Preview & Manage Data
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            {csvData.rowCount} rows • {csvData.headers.length} columns
          </p>
        </div>

        {mappings && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm dark:border-blue-900/50 dark:bg-blue-950/20 max-w-2xl shadow-sm">
            <p className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-1.5">
              <span>✨</span> AI Column Field Mapping
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-zinc-700 dark:text-zinc-300">
              {Object.entries(mappings).map(([crmField, csvHeader]) => (
                <div key={crmField} className="flex items-center gap-1.5">
                  <span className="font-medium capitalize text-zinc-600 dark:text-zinc-400">
                    {crmField}:
                  </span>
                  {onMappingChange ? (
                    <select
                      value={csvHeader || ""}
                      onChange={(e) => onMappingChange(crmField, e.target.value || null)}
                      className="rounded border border-blue-200 bg-white/90 px-2 py-1 text-xs font-semibold text-blue-950 shadow-sm focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-150 transition-colors"
                    >
                      <option value="">not mapped</option>
                      {csvData.headers.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="rounded bg-blue-100/70 px-1.5 py-0.5 text-xs font-semibold text-blue-900 dark:bg-blue-900/40 dark:text-blue-200">
                      {csvHeader || "not mapped"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <PreviewTable csvData={csvData} />
      </div>
    </section>
  );
};
