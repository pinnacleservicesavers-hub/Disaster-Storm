/**
 * Default baseUrl detection.
 * - On localhost: http://localhost:3001
 * - On Replit: uses current window.origin if it includes "repl.co"
 * - Fallback: http://localhost:3001
 */
export const defaultBaseUrl = (() => {
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    if (origin.includes("repl.co")) return origin;
  }
  return "http://localhost:3001";
})();
