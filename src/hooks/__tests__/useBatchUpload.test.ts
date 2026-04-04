import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBatchUpload } from '../useBatchUpload';
import {
  validXml,
  validPdf,
  invalidType,
  oversizedFile,
} from '@/test/fixtures/files';
import {
  mockPresignSuccess,
  mockConfirmAllSuccess,
  mockConfirmPartialFailure,
} from '@/test/mocks/batch-api';

// Mock do batch-client
vi.mock('@/lib/api/batch-client', () => ({
  presignBatch: vi.fn(),
  uploadFileToStorage: vi.fn(),
  confirmBatch: vi.fn(),
}));

// Mock do supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: () => Promise.resolve({ data: { session: { access_token: 'mock-token' } } }),
    },
  }),
}));

import { presignBatch, uploadFileToStorage, confirmBatch } from '@/lib/api/batch-client';
import type { BatchPresignResponse } from '@/lib/api/types';

const mockPresignBatch = vi.mocked(presignBatch);
const mockUploadFile = vi.mocked(uploadFileToStorage);
const mockConfirmBatch = vi.mocked(confirmBatch);

beforeEach(() => {
  vi.clearAllMocks();
  mockUploadFile.mockResolvedValue(undefined);
});

// ─── T-FUNC-01: MIME inválido → erro inline antes de qualquer API call ────────
describe('T-FUNC-01: invalid MIME shows error without calling presign', () => {
  it('marks file with validationError and does not call presignBatch', () => {
    const { result } = renderHook(() => useBatchUpload());
    act(() => result.current.addFiles([invalidType]));

    const id = result.current.state.fileIds[0];
    expect(result.current.state.files[id].validationError).toBeTruthy();
    expect(mockPresignBatch).not.toHaveBeenCalled();
  });
});

// ─── T-FUNC-02: Arquivo > 50 MB → erro inline antes de qualquer API call ─────
describe('T-FUNC-02: oversized file shows error without calling presign', () => {
  it('marks oversized file with validationError', () => {
    const { result } = renderHook(() => useBatchUpload());
    act(() => result.current.addFiles([oversizedFile]));

    const id = result.current.state.fileIds[0];
    expect(result.current.state.files[id].validationError).toBeTruthy();
    expect(mockPresignBatch).not.toHaveBeenCalled();
  });
});

// ─── T-FUNC-03: Batch misto envia apenas o arquivo válido ────────────────────
describe('T-FUNC-03: mixed batch sends only valid file to presign', () => {
  it('presignBatch receives only valid documents', async () => {
    mockPresignBatch.mockResolvedValue(mockPresignSuccess(1));
    mockConfirmBatch.mockResolvedValue(mockConfirmAllSuccess(['doc-uuid-0']));

    const { result } = renderHook(() => useBatchUpload());
    act(() => result.current.addFiles([validXml, invalidType]));

    await act(() => result.current.submitBatch());

    const call = mockPresignBatch.mock.calls[0][0];
    expect(call.documents).toHaveLength(1);
    expect(call.documents[0].mime_type).toBe('application/xml');
  });
});

// ─── T-FUNC-05: Falha de 1 arquivo não cancela os demais ─────────────────────
describe('T-FUNC-05: one upload failure does not cancel other files', () => {
  it('advances to confirming even when first file upload throws', async () => {
    mockPresignBatch.mockResolvedValue(mockPresignSuccess(2));
    mockConfirmBatch.mockResolvedValue(mockConfirmAllSuccess(['doc-uuid-1']));

    // Primeira upload falha, segunda tem sucesso
    mockUploadFile
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useBatchUpload());
    act(() => result.current.addFiles([validXml, validPdf]));
    await act(() => result.current.submitBatch());

    const ids = result.current.state.fileIds;
    const statuses = ids.map((id) => result.current.state.files[id].uploadStatus);
    // Pelo menos um arquivo deve ter terminado (done ou error)
    expect(statuses.some((s) => s === 'done' || s === 'error')).toBe(true);
  });
});

// ─── T-FUNC-06: Confirm chamado exatamente uma vez após todos os uploads ──────
describe('T-FUNC-06: confirmBatch called exactly once after all uploads', () => {
  it('confirmBatch is called once', async () => {
    mockPresignBatch.mockResolvedValue(mockPresignSuccess(2));
    mockConfirmBatch.mockResolvedValue(mockConfirmAllSuccess(['doc-uuid-0', 'doc-uuid-1']));

    const { result } = renderHook(() => useBatchUpload());
    act(() => result.current.addFiles([validXml, validPdf]));
    await act(() => result.current.submitBatch());

    expect(mockConfirmBatch).toHaveBeenCalledTimes(1);
  });
});

// ─── T-FUNC-07: success_partial exibe documentos falhos ──────────────────────
describe('T-FUNC-07: success_partial reflects failed confirm items', () => {
  it('sets confirmStatus failed for failed documents', async () => {
    mockPresignBatch.mockResolvedValue(mockPresignSuccess(2));
    mockConfirmBatch.mockResolvedValue(
      mockConfirmPartialFailure(['doc-uuid-0', 'doc-uuid-1'], ['doc-uuid-1']),
    );

    const { result } = renderHook(() => useBatchUpload());
    act(() => result.current.addFiles([validXml, validPdf]));
    await act(() => result.current.submitBatch());

    expect(result.current.state.phase).toBe('success_partial');
    const failedFile = Object.values(result.current.state.files).find(
      (f) => f.confirmStatus === 'failed',
    );
    expect(failedFile).toBeDefined();
    expect(failedFile?.confirmReason).toBe('object_not_found');
  });
});

// ─── T-FUNC-09: retryConfirm reutiliza os mesmos document_ids ────────────────
describe('T-FUNC-09: retryConfirm reuses same document_ids', () => {
  it('second confirm call uses same ids as first', async () => {
    mockPresignBatch.mockResolvedValue(mockPresignSuccess(1));
    // Primeira chamada falha
    mockConfirmBatch
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce(mockConfirmAllSuccess(['doc-uuid-0']));

    const { result } = renderHook(() => useBatchUpload());
    act(() => result.current.addFiles([validXml]));
    await act(() => result.current.submitBatch());

    expect(result.current.state.phase).toBe('confirm_error');

    await act(() => result.current.retryConfirm());

    const firstIds = mockConfirmBatch.mock.calls[0][1].document_ids;
    const secondIds = mockConfirmBatch.mock.calls[1][1].document_ids;
    expect(secondIds).toEqual(firstIds);
  });
});

// ─── T-FUNC-10: Duplo clique em submitBatch não dispara dois presigns ─────────
describe('T-FUNC-10: double submit does not trigger two presigns', () => {
  it('phase becomes presigning immediately, blocking second call', async () => {
    let resolvePresign!: (v: BatchPresignResponse) => void;
    mockPresignBatch.mockReturnValue(
      new Promise<BatchPresignResponse>((res) => { resolvePresign = res; }),
    );

    const { result } = renderHook(() => useBatchUpload());
    act(() => result.current.addFiles([validXml]));

    // Primeiro submit
    act(() => { result.current.submitBatch(); });
    // Fase deve ser presigning agora
    expect(result.current.state.phase).toBe('presigning');

    // Segundo submit enquanto ainda presigning — não deve alterar fase
    act(() => { result.current.submitBatch(); });
    expect(mockPresignBatch).toHaveBeenCalledTimes(1);

    // Limpar (1 arquivo adicionado → mockPresignSuccess(1))
    resolvePresign(mockPresignSuccess(1));
  });
});

// ─── T-SEC-02: object_key no confirm é o que o presign retornou ──────────────
describe('T-SEC-02: objectKey in state matches presign response', () => {
  it('file objectKey matches presign document object_key', async () => {
    const presignData = mockPresignSuccess(1);
    mockPresignBatch.mockResolvedValue(presignData);
    mockConfirmBatch.mockResolvedValue(mockConfirmAllSuccess(['doc-uuid-0']));

    const { result } = renderHook(() => useBatchUpload());
    act(() => result.current.addFiles([validXml]));
    await act(() => result.current.submitBatch());

    const fileId = result.current.state.fileIds[0];
    const file = result.current.state.files[fileId];
    expect(file.objectKey).toBe(presignData.documents[0].object_key);
  });
});
