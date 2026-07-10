"use client";

interface ValidationItemProps {
  passed: boolean;
  label: string;
}

const ValidationItem: React.FC<ValidationItemProps> = ({ passed, label }) => (
  <div className="flex items-center gap-2">
    {passed ? (
      <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
    ) : (
      <span className="text-red-600 dark:text-red-400 font-bold">✗</span>
    )}
    <span className={passed ? "text-zinc-700 dark:text-zinc-300" : "text-red-600 dark:text-red-400"}>
      {label}
    </span>
  </div>
);

interface FileValidationProps {
  fileName: string;
  fileSize: number;
  rowCount: number;
  columnCount: number;
  hasRequiredColumns: boolean;
  errors: string[];
}

export const FileValidation: React.FC<FileValidationProps> = ({
  fileName,
  fileSize,
  rowCount,
  columnCount,
  hasRequiredColumns,
  errors,
}) => {
  const isCSV = fileName.endsWith(".csv");
  const isUnderLimit = fileSize < 10 * 1024 * 1024; // 10MB
  const hasRows = rowCount > 0;
  const allValid = isCSV && isUnderLimit && hasRows && hasRequiredColumns && errors.length === 0;

  return (
    <div className={`rounded-lg p-6 border ${
      allValid
        ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
        : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
    }`}>
      <h4 className={`font-bold mb-4 ${
        allValid
          ? "text-green-900 dark:text-green-100"
          : "text-red-900 dark:text-red-100"
      }`}>
        {allValid ? "✓ File Validation Passed" : "⚠ Validation Issues"}
      </h4>

      <div className="space-y-2 mb-4">
        <ValidationItem passed={isCSV} label="CSV file format" />
        <ValidationItem passed={isUnderLimit} label={`File size under 10MB (${(fileSize / 1024 / 1024).toFixed(2)}MB)`} />
        <ValidationItem passed={hasRows} label={`Has data rows (${rowCount} rows)`} />
        <ValidationItem passed={columnCount > 0} label={`Has columns (${columnCount} columns)`} />
        <ValidationItem passed={hasRequiredColumns} label="Has required columns (name, email)" />
      </div>

      {errors.length > 0 && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded p-3">
          <p className="text-sm font-medium text-red-700 dark:text-red-200 mb-2">Errors found:</p>
          <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
