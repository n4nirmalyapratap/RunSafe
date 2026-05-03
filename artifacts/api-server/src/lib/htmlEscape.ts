/**
 * Minimal HTML-escape for safely interpolating untrusted strings (workspace
 * names, item titles, etc.) into outbound email HTML. Replaces the five
 * canonical XSS-relevant characters; sufficient for text inserted into
 * element content or quoted attribute values.
 */
export function escapeHtml(input: unknown): string {
  if (input == null) return "";
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
