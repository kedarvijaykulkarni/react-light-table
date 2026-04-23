/** Pattern allowing only word chars, spaces, and hyphens (CSS injection guard) */
const SAFE_CLASS_PATTERN = /^[\w\s\-]*$/;

/**
 * Get the first class name from a space-separated class string.
 * Returns empty string if className is undefined/empty or contains unsafe characters
 * (prevents CSS-injection via column className props — CWE-79).
 */
export function getDefaultClassName(className: string | undefined): string {
  if (!className) return '';
  // Reject any className containing characters outside [\w\s\-]
  if (!SAFE_CLASS_PATTERN.test(className)) return '';
  return className.includes(' ') ? className.split(' ')[0] : className;
}

/** Maximum string length before truncation (prevents excessive memory — CWE-770) */
const MAX_COMPARABLE_LENGTH = 10_000;

/**
 * Safely convert a value to a comparable string.
 * Handles null, undefined, objects, numbers, and strings.
 * Truncates at 10,000 characters to prevent excessive memory allocation.
 */
export function toComparableString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return '';
  const str = String(value);
  return (str.length > MAX_COMPARABLE_LENGTH ? str.slice(0, MAX_COMPARABLE_LENGTH) : str).toUpperCase();
}

/**
 * Check if a value is numeric.
 */
export function isNumericValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false;
  return !isNaN(Number(value));
}

/**
 * Get a value from an item by key, returning undefined if not found.
 */
export function getItemValue<T extends Record<string, unknown>>(
  item: T,
  key: string
): unknown {
  return item[key];
}
