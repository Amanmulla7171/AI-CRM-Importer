export const APP_CONSTANTS = {
  MAX_FILE_SIZE_MB: 10,
  BATCH_SIZE: 100,
  POLLING_INTERVAL: 1000,
  REQUEST_TIMEOUT: 30000,
};

export const UI_STATES = {
  IDLE: "IDLE",
  FILE_SELECTED: "FILE_SELECTED",
  PREVIEW_READY: "PREVIEW_READY",
  IMPORTING: "IMPORTING",
  COMPLETED: "COMPLETED",
  ERROR: "ERROR",
} as const;

export const API_ENDPOINTS = {
  IMPORT: "/api/import",
  VALIDATE: "/api/validate",
  PROGRESS: "/api/import/:id/progress",
} as const;
