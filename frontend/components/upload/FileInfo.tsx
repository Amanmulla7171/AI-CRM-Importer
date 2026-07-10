"use client";

import { FileUpload } from "@/types";
import { formatFileSize } from "@/utils/format";

interface FileInfoProps {
  file: FileUpload;
  onRemove?: () => void;
}

export const FileInfo: React.FC<FileInfoProps> = ({ file, onRemove }) => {
  const getFileIcon = (fileName: string): string => {
    if (fileName.endsWith(".csv")) return "📄";
    return "📋";
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{getFileIcon(file.name)}</span>
          <div>
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">
              {file.name}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {formatFileSize(file.size)} • CSV File
            </p>
          </div>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
            title="Remove file"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
