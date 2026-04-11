/**
 * Get the first class name from a space-separated class string.
 * Returns empty string if className is undefined/empty.
 */
export function getDefaultClassName(className: string | undefined): string {
  if (!className) return '';
  return className.includes(' ') ? className.split(' ')[0] : className;
}

/**
 * Safely convert a value to a comparable string.
 * Handles null, undefined, objects, numbers, and strings.
 */
export function toComparableString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return '';
  return String(value).toUpperCase();
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
