"use client";

import { useState } from "react";

interface UploadSectionProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  error?: string | null;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onFileSelect,
  isLoading = false,
  error = null,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.currentTarget.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  return (
    <section className="mb-8">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`rounded-xl border-2 border-dashed p-12 text-center transition-all duration-300 ${
          isDragging
            ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/20 dark:bg-blue-950/20"
            : error
              ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
              : "border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
        }`}
      >
        <div className="mb-6 flex justify-center">
          <div
            className={`rounded-full p-4 transition-colors duration-300 ${
              isDragging
                ? "bg-blue-100 dark:bg-blue-900"
                : error
                  ? "bg-red-100 dark:bg-red-900"
                  : "bg-zinc-100 dark:bg-zinc-800"
            }`}
          >
            <svg
              className={`h-12 w-12 transition-colors duration-300 ${
                isDragging
                  ? "text-blue-600"
                  : error
                    ? "text-red-600"
                    : "text-zinc-400"
              }`}
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20m-4-8l-6-6m0 0l-6 6m6-6v12"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">
          {isDragging ? "Drop your CSV file here" : "Upload CSV File"}
        </h3>
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          {isDragging
            ? "Release to upload"
            : "Drag and drop your CSV file here, or click to browse"}
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={handleChange}
          disabled={isLoading}
          className="hidden"
          id="file-input"
        />
        <label
          htmlFor="file-input"
          className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-8 py-3 font-semibold transition-all duration-300 ${
            isLoading
              ? "cursor-not-allowed bg-zinc-300 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
              : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95"
          }`}
        >
          {isLoading ? (
            <>
              <svg
                className="h-5 w-5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <circle cx="12" cy="12" r="10" strokeWidth="2" strokeOpacity="0.25" />
                <path d="M4 12a8 8 0 0116 0" strokeWidth="2" />
              </svg>
              Processing...
            </>
          ) : (
            <>Browse Files</>
          )}
        </label>
        {error && (
          <div className="mt-6 rounded-lg border border-red-300 bg-red-100 p-4 dark:border-red-800 dark:bg-red-900/30">
            <p className="text-sm font-medium text-red-700 dark:text-red-200">
              {error}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
