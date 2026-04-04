// Chaves i18n para erros — spec 02.4
// O hook propaga estas chaves; os componentes traduzem via useTranslations('upload')

export const PRESIGN_ERROR_KEYS = {
  SESSION_EXPIRED: 'errors.session_expired',
  INVALID_FILE: 'errors.invalid_file',
  RATE_LIMITED: 'errors.rate_limited',
  BACKPRESSURE: 'errors.backpressure',
  SERVER_ERROR: 'errors.server_error',
  NETWORK: 'errors.network',
} as const;

export const CONFIRM_ERROR_KEYS = {
  NOT_FOUND: 'errors.batch_not_found',
  ALREADY_PROCESSED: 'errors.batch_conflict',
  SERVER_ERROR: 'errors.server_error',
  NETWORK: 'errors.network',
} as const;

export const STORAGE_ERROR_KEYS = {
  URL_EXPIRED: 'errors.upload_url_expired',
  PERMISSION_DENIED: 'errors.upload_permission_denied',
  INVALID_FILE: 'errors.upload_invalid_file',
  NETWORK_TIMEOUT: 'errors.upload_network_timeout',
} as const;

export const VALIDATION_ERROR_KEYS = {
  MIME: 'errors.validation_mime',
  SIZE: 'errors.validation_size',
} as const;
