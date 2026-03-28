/**
 * Input sanitization utilities.
 *
 * Purpose: enforce length limits and strip characters that could cause issues
 * when passed to LLMs (prompt injection via control chars) or stored in the DB.
 *
 * Note: SQL injection is handled by the ORM on the backend.
 * XSS is handled by React's JSX escaping for all text rendering.
 * These utilities add a defense-in-depth layer at the input boundary.
 */

/** Maximum allowed lengths per input context. */
export const INPUT_LIMITS = {
  /** Chat messages sent to LLM (RAG + EVA). */
  CHAT_MESSAGE: 2000,
  /** Names for simulations, scenarios, etc. */
  NAME: 200,
  /** Descriptions and free-text fields. */
  DESCRIPTION: 1000,
  /** Short classification fields (tipo, categoria). */
  TYPE_FIELD: 100,
} as const;

/** Maximum file size allowed for uploads (50 MB). */
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

/**
 * Strips null bytes and non-printable control characters.
 * Preserves tabs (\t), newlines (\n), and carriage returns (\r).
 */
function stripControlChars(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Sanitizes a free-text input and enforces a maximum character length.
 * Use this before sending any user-typed text to the API.
 */
export function sanitizeInput(input: string, maxLength: number): string {
  return stripControlChars(input).slice(0, maxLength);
}

/** Allowed MIME types for file uploads, keyed by extension. */
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  pdf:  ['application/pdf'],
  txt:  ['text/plain'],
  csv:  ['text/csv', 'application/csv', 'text/comma-separated-values'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  xls:  ['application/vnd.ms-excel', 'application/excel'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
};

/**
 * Returns true if the file passes MIME type and size checks.
 * Falls back to extension-only check when the browser reports an empty MIME type
 * (common for XLS files on some systems).
 */
export function validateFileMime(file: File, extension: string): boolean {
  if (file.size > MAX_FILE_SIZE_BYTES) return false;
  const allowed = ALLOWED_MIME_TYPES[extension];
  if (!allowed) return false;
  // If browser reports no type, skip MIME check (extension was already validated)
  if (!file.type) return true;
  return allowed.includes(file.type);
}
