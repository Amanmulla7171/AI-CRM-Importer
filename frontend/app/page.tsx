"use client";

import { useState } from "react";
import { Layout } from "@/components/layout";
import { PreviewSection } from "@/components/preview/PreviewSection";
import { ConfirmSection } from "@/components/processing/ConfirmSection";
import { ProcessingSection } from "@/components/processing/ProcessingSection";
import { ResultSection } from "@/components/result/ResultSection";
import { FileInfo } from "@/components/upload/FileInfo";
import { UploadSection } from "@/components/upload/UploadSection";
import { FileValidation } from "@/components/upload/FileValidation";
import { HistorySection } from "@/components/history/HistorySection";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useImport } from "@/hooks/useImport";
import { api } from "@/services/api";
import { AppState } from "@/types";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("IDLE");
  const [activeTab, setActiveTab] = useState<"import" | "history">("import");

  const {
    selectedFile,
    csvData,
    sessionId,
    mappings,
    setMappings,
    error: uploadError,
    isLoading: isUploading,
    validation,
    handleFileSelect,
    resetFile,
  } = useFileUpload();
  const {
    records,
    stats,
    progress,
    isImporting,
    error: importError,
    sessionId: importSessionId,
    batchMessage,
    startImport,
    cancelImport,
    retryImport,
    resetImport,
    loadPastSession,
  } = useImport();

  const hasRequiredColumns = validation.errors.every(
    (error) => error.toLowerCase().includes("missing required columns") === false
  );

  let renderedAppState = appState;
  if (appState === "IMPORTING" && importError) {
    renderedAppState = "ERROR";
  } else if (appState === "IMPORTING" && isImporting === false && stats) {
    renderedAppState = "COMPLETED";
  }

  const handleFileUpload = (file: File) => {
    void handleFileSelect(file);
    setAppState("FILE_SELECTED");
  };

  const handleStartImport = async () => {
    if (sessionId && mappings) {
      setAppState("IMPORTING");
      try {
        await api.updateMappings(sessionId, mappings);
        void startImport(sessionId);
      } catch (err: any) {
        setAppState("ERROR");
      }
    }
  };

  const handleReset = () => {
    resetFile();
    resetImport();
    setAppState("IDLE");
    setActiveTab("import");
  };

  const handleRemoveFile = () => {
    resetFile();
    setAppState("IDLE");
  };

  const handleRetry = () => {
    setAppState("IDLE");
    resetFile();
    resetImport();
  };

  const handleRetryImport = () => {
    setAppState("IMPORTING");
    void retryImport();
  };

  const handleMappingChange = (crmField: string, csvHeader: string | null) => {
    if (mappings) {
      setMappings({
        ...mappings,
        [crmField]: csvHeader,
      });
    }
  };

  const handleLoadHistorySession = async (id: string) => {
    setAppState("IMPORTING");
    await loadPastSession(id);
    setAppState("COMPLETED");
  };

  const handleResumeSession = (id: string) => {
    setAppState("IMPORTING");
    void startImport(id);
  };

  return (
    <Layout>
      {renderedAppState === "IDLE" && (
        <>
          <div className="mb-8 border-b border-zinc-200 dark:border-zinc-800 flex gap-6">
            <button
              onClick={() => setActiveTab("import")}
              className={`pb-3 font-semibold text-sm transition-all duration-200 border-b-2 ${
                activeTab === "import"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              }`}
            >
              🚀 New Import
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-3 font-semibold text-sm transition-all duration-200 border-b-2 ${
                activeTab === "history"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              }`}
            >
              📋 Import History
            </button>
          </div>

          {activeTab === "import" ? (
            <UploadSection
              onFileSelect={handleFileUpload}
              isLoading={isUploading}
              error={uploadError}
            />
          ) : (
            <HistorySection
              onSelectSession={handleLoadHistorySession}
              onResumeSession={handleResumeSession}
            />
          )}
        </>
      )}

      {renderedAppState === "FILE_SELECTED" && selectedFile && (
        <>
          {(!csvData || isUploading) ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm animate-pulse">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-4" />
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">Analyzing CSV Data...</p>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">🤖 Gemini AI is mapping columns and validating formats</p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <FileInfo file={selectedFile} onRemove={handleRemoveFile} />
              </div>

              <div className="mb-8">
                <FileValidation
                  fileName={selectedFile.name}
                  fileSize={selectedFile.size}
                  rowCount={csvData.rowCount}
                  columnCount={csvData.headers.length}
                  hasRequiredColumns={hasRequiredColumns}
                  errors={validation.errors}
                />
              </div>

              {validation.isValid ? (
                <>
                  <PreviewSection csvData={csvData} mappings={mappings} onMappingChange={handleMappingChange} />
                  <ConfirmSection
                    onConfirm={handleStartImport}
                    onCancel={handleReset}
                    isLoading={false}
                  />
                </>
              ) : (
                <div className="flex justify-center gap-3">
                  <button
                    onClick={handleRemoveFile}
                    className="rounded-lg bg-zinc-200 px-8 py-3 font-semibold text-zinc-900 transition-all duration-300 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-600"
                  >
                    Try Different File
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {renderedAppState === "IMPORTING" && csvData && (
        <>
          <PreviewSection csvData={csvData} mappings={mappings} onMappingChange={handleMappingChange} />
          <ProcessingSection progress={progress} isImporting={isImporting} onCancel={cancelImport} batchMessage={batchMessage} />
        </>
      )}

      {renderedAppState === "COMPLETED" && stats && (
        <ResultSection stats={stats} records={records} sessionId={importSessionId} onReset={handleReset} onRetry={handleRetryImport} />
      )}

      {renderedAppState === "ERROR" && (
        <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-6 animate-in fade-in duration-300 dark:border-red-800 dark:bg-red-900/20">
          <h3 className="mb-2 text-lg font-semibold text-red-900 dark:text-red-100">
            Import Failed
          </h3>
          <p className="mb-4 text-red-700 dark:text-red-200">
            {importError || "An error occurred during import."}
          </p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center rounded-lg bg-red-600 px-8 py-3 font-semibold text-white transition-all duration-300 hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/30 active:scale-95"
          >
            Try Again
          </button>
        </div>
      )}
    </Layout>
  );
}
