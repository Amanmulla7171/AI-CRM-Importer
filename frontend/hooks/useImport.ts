"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/services/api";
import { CRMRecord, CSVData, ImportStats } from "@/types";

export const useImport = () => {
  const [records, setRecords] = useState<CRMRecord[]>([]);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [progress, setProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [batchMessage, setBatchMessage] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const closeStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      closeStream();
    };
  }, []);

  const connectStream = (sessionId: string) => {
    closeStream();

    const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const es = new EventSource(`${baseURL}/api/progress/${sessionId}/stream`);
    eventSourceRef.current = es;

    es.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          setError(data.error);
          setIsImporting(false);
          closeStream();
          return;
        }

        setProgress(data.progress);

        if (data.status === "processing" && data.batchCount > 0) {
          const currentBatchIdx = Math.min(data.batchCount, Math.floor(data.processed / 20) + 1);
          setBatchMessage(`Processing Batch ${currentBatchIdx} / ${data.batchCount}... Mapping CRM Fields...`);
        } else if (data.status === "completed") {
          setBatchMessage("Import complete!");
        } else {
          setBatchMessage(null);
        }

        if (data.status === "completed") {
          closeStream();
          const finalResults = await api.getImportResults(sessionId);
          setRecords(finalResults.records);
          setStats(finalResults.stats);
          setProgress(100);
          setIsImporting(false);
        } else if (data.status === "failed") {
          closeStream();
          setError(data.error || "Import failed");
          setIsImporting(false);
          try {
            const partialResults = await api.getImportResults(sessionId);
            setRecords(partialResults.records);
            setStats(partialResults.stats);
          } catch {
            // Ignore
          }
        }
      } catch (err) {
        console.error("Error parsing progress event:", err);
      }
    };

    es.onerror = () => {
      console.warn("SSE connection closed/errored");
      closeStream();
      setIsImporting(false);
      setError("Progress connection interrupted");
    };
  };

  const startImport = async (sessionId: string) => {
    setError(null);
    setIsImporting(true);
    setProgress(0);
    setRecords([]);
    setStats(null);
    setSessionId(sessionId);
    setBatchMessage("Starting import queue...");

    try {
      const { sessionId: returnedSessionId } = await api.importCSV(sessionId);
      sessionIdRef.current = returnedSessionId;
      setSessionId(returnedSessionId);

      setProgress(5);
      connectStream(returnedSessionId);
    } catch (error) {
      closeStream();
      const message = error instanceof Error ? error.message : "Import failed";
      setError(message);
      setIsImporting(false);
    }
  };

  const resetImport = () => {
    closeStream();
    setRecords([]);
    setStats(null);
    setProgress(0);
    setError(null);
    sessionIdRef.current = null;
    setSessionId(null);
    setBatchMessage(null);
  };

  const cancelImport = async () => {
    if (!sessionIdRef.current) return;
    try {
      await api.cancelImport(sessionIdRef.current);
      closeStream();
      setError("Import cancelled by user");
      setIsImporting(false);
    } catch (err: any) {
      console.error("Cancel import error:", err);
    }
  };

  const retryImport = async () => {
    if (!sessionIdRef.current) return;
    setError(null);
    setIsImporting(true);
    setProgress(0);
    setSessionId(sessionIdRef.current);
    try {
      await api.retryImport(sessionIdRef.current);
      setProgress(5);
      connectStream(sessionIdRef.current);
    } catch (err: any) {
      closeStream();
      const message = err.message || "Retry failed";
      setError(message);
      setIsImporting(false);
    }
  };

  const loadPastSession = async (sessionId: string) => {
    setError(null);
    setIsImporting(false);
    setProgress(100);
    sessionIdRef.current = sessionId;
    setSessionId(sessionId);
    setBatchMessage(null);
    try {
      const results = await api.getImportResults(sessionId);
      setRecords(results.records);
      setStats(results.stats);
    } catch (err: any) {
      setError(err.message || "Failed to load past session");
    }
  };

  return {
    records,
    stats,
    progress,
    isImporting,
    error,
    sessionId,
    batchMessage,
    startImport,
    cancelImport,
    retryImport,
    resetImport,
    loadPastSession,
  };
};
