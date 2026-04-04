// Mapeamento de error_reason da API → chave i18n PT-BR — spec 03.4

const DOCUMENT_ERROR_MAP: Record<string, string> = {
  object_not_found:         'errors.doc.object_not_found',
  classifier_timeout:       'errors.doc.classifier_timeout',
  invalid_xml:              'errors.doc.invalid_xml',
  unsupported_format:       'errors.doc.unsupported_format',
  ocr_failed:               'errors.doc.ocr_failed',
  duplicate_key:            'errors.doc.duplicate_key',
  schema_validation_failed: 'errors.doc.schema_validation_failed',
};

/**
 * Mapeia error_reason da API para chave i18n do namespace batch-status.
 * Valores desconhecidos retornam chave de fallback genérico.
 * PRD §03.7 — nunca exibir error_reason raw ao usuário.
 */
export function mapDocumentError(reason: string | null): string {
  if (!reason) return 'errors.doc.unknown';
  return DOCUMENT_ERROR_MAP[reason] ?? 'errors.doc.unknown';
}
