"use client";

interface ConfirmSectionProps {
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmSection: React.FC<ConfirmSectionProps> = ({
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  return (
    <section className="mb-8 flex gap-3 justify-center animate-in fade-in duration-300">
      <button
        onClick={onConfirm}
        disabled={isLoading}
        className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-green-500/30 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2" strokeOpacity="0.25" />
              <path d="M4 12a8 8 0 0116 0" strokeWidth="2" />
            </svg>
            Starting...
          </>
        ) : (
          <>
            <span>✓</span>
            Start Import
          </>
        )}
      </button>
      <button
        onClick={onCancel}
        disabled={isLoading}
        className="px-8 py-3 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 rounded-lg font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Cancel
      </button>
    </section>
  );
};
