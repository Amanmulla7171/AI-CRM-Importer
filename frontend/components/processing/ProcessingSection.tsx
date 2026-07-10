"use client";

interface ProcessingSectionProps {
  progress: number;
  isImporting: boolean;
  onCancel?: () => void;
  batchMessage?: string | null;
}

export const ProcessingSection: React.FC<ProcessingSectionProps> = ({
  progress,
  isImporting,
  onCancel,
  batchMessage,
}) => {
  if (isImporting === false) return null;

  return (
    <section className="mb-8 animate-in fade-in duration-300">
      <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 dark:border-blue-800 dark:from-blue-950/20 dark:to-indigo-950/20">
        <div className="mb-8">
          <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Processing Import
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Your CSV file is being processed and imported.
          </p>
        </div>

        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Progress
            </p>
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {progress}%
            </p>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/50 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 flex-shrink-0">
              <svg
                className="absolute inset-0 h-full w-full animate-spin text-blue-600"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeOpacity="0.25"
                />
                <path d="M4 12a8 8 0 0116 0" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                {batchMessage || "Processing data..."}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                This may take a few moments.
              </p>
            </div>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="rounded-lg border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition-all duration-300 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/20"
            >
              Cancel Import
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
