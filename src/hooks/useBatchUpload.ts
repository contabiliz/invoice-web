"use client";

import { useCallback, useReducer, useRef, useEffect } from "react";
import {
  presignBatch,
  uploadFileToStorage,
  confirmBatch,
} from "@/lib/api/batch-client";
import type { BatchPresignResponse } from "@/lib/api/types";
import {
  ACCEPTED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_DOCUMENTS_PER_BATCH,
  type MimeType,
} from "@/lib/api/types";
import {
  PRESIGN_ERROR_KEYS,
  CONFIRM_ERROR_KEYS,
  STORAGE_ERROR_KEYS,
  VALIDATION_ERROR_KEYS,
} from "@/lib/api/error-keys";
import type { AxiosError } from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BatchPhase =
  | "idle"
  | "files_selected"
  | "presigning"
  | "uploading"
  | "confirming"
  | "success_full"
  | "success_partial"
  | "presign_error"
  | "confirm_error";

export type FileUploadStatus =
  | "idle"
  | "uploading"
  | "done"
  | "error"
  | "expired";

export interface FileItemState {
  internalId: string;
  file: File;
  validationError?: string;
  documentId?: string;
  uploadUrl?: string;
  uploadUrlExpiresAt?: string;
  objectKey?: string;
  uploadProgress: number;
  uploadStatus: FileUploadStatus;
  uploadError?: string;
  confirmStatus?: "confirmed" | "failed";
  confirmReason?: string;
}

export interface BatchUploadState {
  phase: BatchPhase;
  batchId?: string;
  files: Record<string, FileItemState>;
  fileIds: string[];
  presignErrorKey?: string;
  confirmErrorKey?: string;
  rateLimitCountdown?: number;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "ADD_FILES"; files: FileItemState[] }
  | { type: "REMOVE_FILE"; internalId: string }
  | { type: "SET_PHASE"; phase: BatchPhase }
  | {
      type: "SET_PRESIGN_RESULT";
      batchId: string;
      docs: Array<{
        internalId: string;
        documentId: string;
        uploadUrl: string;
        uploadUrlExpiresAt: string;
        objectKey: string;
      }>;
    }
  | { type: "SET_UPLOAD_PROGRESS"; internalId: string; progress: number }
  | {
      type: "SET_UPLOAD_STATUS";
      internalId: string;
      status: FileUploadStatus;
      error?: string;
    }
  | {
      type: "SET_UPLOAD_URL";
      internalId: string;
      uploadUrl: string;
      uploadUrlExpiresAt: string;
    }
  | {
      type: "SET_CONFIRM_RESULT";
      confirmed: string[];
      failed: Array<{ document_id: string; reason: string }>;
    }
  | { type: "SET_PRESIGN_ERROR"; errorKey: string; countdown?: number }
  | { type: "SET_CONFIRM_ERROR"; errorKey: string }
  | { type: "DECREMENT_COUNTDOWN" }
  | { type: "RESET_FOR_RETRY_PRESIGN" }
  | { type: "RESET_FOR_RETRY_CONFIRM" }
  | { type: "CLEAR_FILES" };

const initialState: BatchUploadState = {
  phase: "idle",
  files: {},
  fileIds: [],
};

function reducer(state: BatchUploadState, action: Action): BatchUploadState {
  switch (action.type) {
    case "ADD_FILES": {
      const newFiles = { ...state.files };
      const newIds = [...state.fileIds];
      for (const f of action.files) {
        newFiles[f.internalId] = f;
        newIds.push(f.internalId);
      }
      const phase = newIds.some((id) => !newFiles[id].validationError)
        ? "files_selected"
        : state.phase === "idle"
          ? "files_selected"
          : state.phase;
      return { ...state, files: newFiles, fileIds: newIds, phase };
    }
    case "REMOVE_FILE": {
      const files = { ...state.files };
      delete files[action.internalId];
      const fileIds = state.fileIds.filter((id) => id !== action.internalId);
      const hasValid = fileIds.some((id) => !files[id]?.validationError);
      return {
        ...state,
        files,
        fileIds,
        phase: fileIds.length === 0 || !hasValid ? "idle" : "files_selected",
      };
    }
    case "SET_PHASE":
      return { ...state, phase: action.phase };
    case "SET_PRESIGN_RESULT": {
      const files = { ...state.files };
      for (const doc of action.docs) {
        if (files[doc.internalId]) {
          files[doc.internalId] = {
            ...files[doc.internalId],
            documentId: doc.documentId,
            uploadUrl: doc.uploadUrl,
            uploadUrlExpiresAt: doc.uploadUrlExpiresAt,
            objectKey: doc.objectKey,
          };
        }
      }
      return { ...state, files, batchId: action.batchId, phase: "uploading" };
    }
    case "SET_UPLOAD_PROGRESS": {
      const files = { ...state.files };
      if (files[action.internalId]) {
        files[action.internalId] = {
          ...files[action.internalId],
          uploadProgress: action.progress,
          uploadStatus: "uploading",
        };
      }
      return { ...state, files };
    }
    case "SET_UPLOAD_STATUS": {
      const files = { ...state.files };
      if (files[action.internalId]) {
        files[action.internalId] = {
          ...files[action.internalId],
          uploadStatus: action.status,
          uploadError: action.error,
          uploadProgress:
            action.status === "done"
              ? 100
              : files[action.internalId].uploadProgress,
        };
      }
      return { ...state, files };
    }
    case "SET_UPLOAD_URL": {
      const files = { ...state.files };
      if (files[action.internalId]) {
        files[action.internalId] = {
          ...files[action.internalId],
          uploadUrl: action.uploadUrl,
          uploadUrlExpiresAt: action.uploadUrlExpiresAt,
          uploadStatus: "idle",
        };
      }
      return { ...state, files };
    }
    case "SET_CONFIRM_RESULT": {
      const files = { ...state.files };
      for (const id of action.confirmed) {
        const entry = Object.values(files).find((f) => f.documentId === id);
        if (entry) {
          files[entry.internalId] = { ...entry, confirmStatus: "confirmed" };
        }
      }
      for (const f of action.failed) {
        const entry = Object.values(files).find(
          (e) => e.documentId === f.document_id,
        );
        if (entry) {
          files[entry.internalId] = {
            ...entry,
            confirmStatus: "failed",
            confirmReason: f.reason,
          };
        }
      }
      const phase =
        action.failed.length === 0 ? "success_full" : "success_partial";
      return { ...state, files, phase };
    }
    case "SET_PRESIGN_ERROR":
      return {
        ...state,
        phase: "presign_error",
        presignErrorKey: action.errorKey,
        rateLimitCountdown: action.countdown,
      };
    case "SET_CONFIRM_ERROR":
      return {
        ...state,
        phase: "confirm_error",
        confirmErrorKey: action.errorKey,
      };
    case "DECREMENT_COUNTDOWN":
      return {
        ...state,
        rateLimitCountdown:
          state.rateLimitCountdown != null && state.rateLimitCountdown > 0
            ? state.rateLimitCountdown - 1
            : 0,
      };
    case "RESET_FOR_RETRY_PRESIGN":
      return {
        ...state,
        phase: "presigning",
        presignErrorKey: undefined,
        rateLimitCountdown: undefined,
      };
    case "RESET_FOR_RETRY_CONFIRM":
      return { ...state, phase: "confirming", confirmErrorKey: undefined };
    case "CLEAR_FILES":
      return {
        ...state,
        files: {},
        fileIds: [],
        phase: "idle",
        presignErrorKey: undefined,
        confirmErrorKey: undefined,
        batchId: undefined,
      };
    default:
      return state;
  }
}

// ─── Concorrência inline (PRD §02.6.3) ───────────────────────────────────────

async function uploadWithConcurrency(
  tasks: (() => Promise<void>)[],
  concurrency = 4,
): Promise<void> {
  const queue = [...tasks];
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      const task = queue.shift();
      if (task) await task().catch(() => {});
    }
  });
  await Promise.all(workers);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBatchUpload() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const isPausedRef = useRef(false);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  // ── Offline handling ────────────────────────────────────────────────────────
  useEffect(() => {
    const handleOffline = () => {
      isPausedRef.current = true;
    };
    const handleOnline = () => {
      isPausedRef.current = false;
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // ── Rate-limit countdown ────────────────────────────────────────────────────
  useEffect(() => {
    if (state.rateLimitCountdown != null && state.rateLimitCountdown > 0) {
      countdownIntervalRef.current = setInterval(() => {
        dispatch({ type: "DECREMENT_COUNTDOWN" });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }
    return () => {
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
    };
  }, [state.rateLimitCountdown]);

  // ── addFiles ────────────────────────────────────────────────────────────────
  const addFiles = useCallback((rawFiles: File[]) => {
    const entries: FileItemState[] = rawFiles.map((file) => {
      let validationError: string | undefined;
      if (!ACCEPTED_MIME_TYPES.includes(file.type as MimeType)) {
        validationError = VALIDATION_ERROR_KEYS.MIME;
      } else if (file.size > MAX_FILE_SIZE_BYTES) {
        validationError = VALIDATION_ERROR_KEYS.SIZE;
      }
      return {
        internalId: crypto.randomUUID(),
        file,
        validationError,
        uploadProgress: 0,
        uploadStatus: "idle",
      };
    });
    dispatch({ type: "ADD_FILES", files: entries });
  }, []);

  // ── removeFile ──────────────────────────────────────────────────────────────
  const removeFile = useCallback((internalId: string) => {
    dispatch({ type: "REMOVE_FILE", internalId });
  }, []);

  // ── uploadSingleFile ────────────────────────────────────────────────────────
  const uploadSingleFile = useCallback(
    async (entry: FileItemState): Promise<boolean> => {
      if (!entry.uploadUrl) return false;

      dispatch({
        type: "SET_UPLOAD_STATUS",
        internalId: entry.internalId,
        status: "uploading",
      });

      try {
        // Aguarda se offline
        while (isPausedRef.current) {
          await new Promise((r) => setTimeout(r, 500));
        }

        await uploadFileToStorage(entry.uploadUrl, entry.file, (percent) => {
          dispatch({
            type: "SET_UPLOAD_PROGRESS",
            internalId: entry.internalId,
            progress: percent,
          });
        });

        dispatch({
          type: "SET_UPLOAD_STATUS",
          internalId: entry.internalId,
          status: "done",
        });
        return true;
      } catch (err) {
        const axiosErr = err as AxiosError;
        const status = axiosErr.response?.status;

        // 403 + URL expirada → tenta renovar uma vez (PRD ADR-007)
        if (status === 403 && entry.uploadUrlExpiresAt) {
          const expired = new Date(entry.uploadUrlExpiresAt) < new Date();
          if (expired) {
            dispatch({
              type: "SET_UPLOAD_STATUS",
              internalId: entry.internalId,
              status: "expired",
            });
            try {
              const renewed = await presignBatch({
                documents: [
                  {
                    filename: entry.file.name,
                    mime_type: entry.file.type as MimeType,
                    file_size: entry.file.size,
                  },
                ],
              });
              const doc = renewed.documents[0];
              dispatch({
                type: "SET_UPLOAD_URL",
                internalId: entry.internalId,
                uploadUrl: doc.upload_url,
                uploadUrlExpiresAt: doc.upload_url_expires_at,
              });
              // Retry com nova URL
              await uploadFileToStorage(
                doc.upload_url,
                entry.file,
                (percent) => {
                  dispatch({
                    type: "SET_UPLOAD_PROGRESS",
                    internalId: entry.internalId,
                    progress: percent,
                  });
                },
              );
              dispatch({
                type: "SET_UPLOAD_STATUS",
                internalId: entry.internalId,
                status: "done",
              });
              return true;
            } catch {
              dispatch({
                type: "SET_UPLOAD_STATUS",
                internalId: entry.internalId,
                status: "error",
                error: STORAGE_ERROR_KEYS.URL_EXPIRED,
              });
              return false;
            }
          }
          // 403 sem URL expirada = permissão negada
          dispatch({
            type: "SET_UPLOAD_STATUS",
            internalId: entry.internalId,
            status: "error",
            error: STORAGE_ERROR_KEYS.PERMISSION_DENIED,
          });
          return false;
        }

        if (status === 400) {
          dispatch({
            type: "SET_UPLOAD_STATUS",
            internalId: entry.internalId,
            status: "error",
            error: STORAGE_ERROR_KEYS.INVALID_FILE,
          });
        } else {
          dispatch({
            type: "SET_UPLOAD_STATUS",
            internalId: entry.internalId,
            status: "error",
            error: STORAGE_ERROR_KEYS.NETWORK_TIMEOUT,
          });
        }
        return false;
      }
    },
    [],
  );

  // ── resolvePresignError ─────────────────────────────────────────────────────
  function resolvePresignError(err: unknown): {
    key: string;
    countdown?: number;
  } {
    const axiosErr = err as AxiosError<{ detail?: string }>;
    const status = axiosErr.response?.status;
    const detail = axiosErr.response?.data?.detail ?? "";

    if (status === 401) return { key: PRESIGN_ERROR_KEYS.SESSION_EXPIRED };
    if (status === 422) return { key: PRESIGN_ERROR_KEYS.INVALID_FILE };
    if (status === 429) {
      if (detail.includes("rate limit"))
        return { key: PRESIGN_ERROR_KEYS.RATE_LIMITED, countdown: 60 };
      return { key: PRESIGN_ERROR_KEYS.BACKPRESSURE };
    }
    if (!axiosErr.response) return { key: PRESIGN_ERROR_KEYS.NETWORK };
    return { key: PRESIGN_ERROR_KEYS.SERVER_ERROR };
  }

  // ── runPresignAndUpload (core) ──────────────────────────────────────────────
  const runPresignAndUpload = useCallback(
    async (filesToSend: FileItemState[]) => {
      dispatch({ type: "SET_PHASE", phase: "presigning" });

      let presignResponse: BatchPresignResponse;
      try {
        presignResponse = await presignBatch({
          documents: filesToSend.map((f) => ({
            filename: f.file.name,
            mime_type: f.file.type as MimeType,
            file_size: f.file.size,
          })),
        });
      } catch (err) {
        const { key, countdown } = resolvePresignError(err);
        // 401 → redirect to login (sessionStorage fallback)
        if (key === PRESIGN_ERROR_KEYS.SESSION_EXPIRED) {
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("upload_batch_id"); // cleanup
          }
          window.location.href = "/login";
          return;
        }
        dispatch({ type: "SET_PRESIGN_ERROR", errorKey: key, countdown });
        return;
      }

      // Mapeia internalId → presign doc
      const docs = filesToSend.map((f, i) => ({
        internalId: f.internalId,
        documentId: presignResponse.documents[i].document_id,
        uploadUrl: presignResponse.documents[i].upload_url,
        uploadUrlExpiresAt: presignResponse.documents[i].upload_url_expires_at,
        objectKey: presignResponse.documents[i].object_key,
      }));
      dispatch({
        type: "SET_PRESIGN_RESULT",
        batchId: presignResponse.batch_id,
        docs,
      });

      // Upload paralelo com pool de 4
      const updatedEntries = filesToSend.map((f, i) => ({
        ...f,
        uploadUrl: presignResponse.documents[i].upload_url,
        uploadUrlExpiresAt: presignResponse.documents[i].upload_url_expires_at,
        objectKey: presignResponse.documents[i].object_key,
        documentId: presignResponse.documents[i].document_id,
      }));

      const successIds: string[] = [];
      const tasks = updatedEntries.map(
        (entry) => async () => {
          const ok = await uploadSingleFile(entry);
          if (ok && entry.documentId) successIds.push(entry.documentId);
        },
      );
      await uploadWithConcurrency(tasks, 4);

      // Confirm com apenas os uploads bem-sucedidos
      dispatch({ type: "SET_PHASE", phase: "confirming" });

      // Chama confirm
      await runConfirm(presignResponse.batch_id, successIds);
    },
    [uploadSingleFile],
  );

  // ── runConfirm ──────────────────────────────────────────────────────────────
  const runConfirm = useCallback(
    async (batchId: string, documentIds: string[]) => {
      try {
        const result = await confirmBatch(batchId, {
          document_ids: documentIds,
        });
        dispatch({
          type: "SET_CONFIRM_RESULT",
          confirmed: result.confirmed,
          failed: result.failed,
        });
        // success_full → salva batchId para redirect
        if (typeof window !== "undefined") {
          sessionStorage.setItem("last_batch_id", batchId);
        }
      } catch (err) {
        const axiosErr = err as AxiosError;
        const status = axiosErr.response?.status;
        if (status === 409) {
          // Batch já processado → redirect
          window.location.href = `/batches/${batchId}`;
          return;
        }
        const key =
          status === 404
            ? CONFIRM_ERROR_KEYS.NOT_FOUND
            : !axiosErr.response
              ? CONFIRM_ERROR_KEYS.NETWORK
              : CONFIRM_ERROR_KEYS.SERVER_ERROR;
        dispatch({ type: "SET_CONFIRM_ERROR", errorKey: key });
      }
    },
    [],
  );

  // ── submitBatch ─────────────────────────────────────────────────────────────
  const submitBatch = useCallback(async () => {
    // Guard contra duplo envio
    if (["presigning", "uploading", "confirming"].includes(state.phase)) return;

    const validFiles = state.fileIds
      .map((id) => state.files[id])
      .filter((f) => !f.validationError);

    if (validFiles.length === 0 || validFiles.length > MAX_DOCUMENTS_PER_BATCH)
      return;

    await runPresignAndUpload(validFiles);
  }, [state.phase, state.files, state.fileIds, runPresignAndUpload]);

  // ── retryPresign ────────────────────────────────────────────────────────────
  const retryPresign = useCallback(async () => {
    dispatch({ type: "RESET_FOR_RETRY_PRESIGN" });
    const validFiles = state.fileIds
      .map((id) => state.files[id])
      .filter((f) => !f.validationError);
    await runPresignAndUpload(validFiles);
  }, [state.files, state.fileIds, runPresignAndUpload]);

  // ── retryConfirm ────────────────────────────────────────────────────────────
  const retryConfirm = useCallback(async () => {
    if (!state.batchId) return;
    dispatch({ type: "RESET_FOR_RETRY_CONFIRM" });
    const doneIds = state.fileIds
      .map((id) => state.files[id])
      .filter((f) => f.uploadStatus === "done" && f.documentId)
      .map((f) => f.documentId!);
    await runConfirm(state.batchId, doneIds);
  }, [state.batchId, state.files, state.fileIds, runConfirm]);

  const clearFiles = useCallback(() => {
    dispatch({ type: "CLEAR_FILES" });
  }, []);

  return {
    state,
    addFiles,
    removeFile,
    clearFiles,
    submitBatch,
    retryPresign,
    retryConfirm,
  };
}
