import { useState, useCallback, useMemo } from 'react';
import { toComparableString } from '../utils/helpers';

/** Maximum search input length before the cap kicks in (ReDoS guard — CWE-1333) */
const MAX_SEARCH_LENGTH = 200;

/** Maximum cell value length to search against (prevents pathological comparison — CWE-770) */
const MAX_CELL_VALUE_LENGTH = 10_000;

interface UseSearchResult<T> {
  searchText: string;
  filteredData: T[];
  handleSearch: (text: string) => void;
  clearSearch: () => void;
  /** True when filtering was skipped because searchText exceeded MAX_SEARCH_LENGTH */
  searchTruncated: boolean;
}

export function useSearch<T extends Record<string, unknown>>(
  data: T[],
  searchableFields?: string[],
  /** Controlled search value. When provided the hook is search-controlled. */
  controlledValue?: string,
  /** Called whenever the search text should change (controlled and uncontrolled). */
  onSearchChange?: (text: string) => void,
): UseSearchResult<T> {
  const isControlled = controlledValue !== undefined;
  const [internalText, setInternalText] = useState<string>('');

  // Effective search text: controlled value takes precedence over internal state
  const searchText = isControlled ? controlledValue : internalText;

  const handleSearch = useCallback((text: string) => {
    if (!isControlled) setInternalText(text);
    if (onSearchChange) onSearchChange(text);
  }, [isControlled, onSearchChange]);

  const clearSearch = useCallback(() => {
    if (!isControlled) setInternalText('');
    if (onSearchChange) onSearchChange('');
  }, [isControlled, onSearchChange]);

  const searchTruncated = searchText.trim().length > MAX_SEARCH_LENGTH;

  const filteredData = useMemo(() => {
    if (!searchText.trim()) {
      return data;
    }

    // Input length cap — return full dataset when query is suspiciously long (ReDoS guard)
    if (searchText.trim().length > MAX_SEARCH_LENGTH) {
      return data;
    }

    const query = searchText.toUpperCase();

    return data.filter((item) => {
      const fieldsToSearch = searchableFields ?? Object.keys(item);

      return fieldsToSearch.some((field) => {
        const value = item[field];
        // Only search string and number values
        if (typeof value === 'string' || typeof value === 'number') {
          // Skip individual cell values that are excessively long (CWE-770)
          if (String(value).length > MAX_CELL_VALUE_LENGTH) return false;
          return toComparableString(value).includes(query);
        }
        return false;
      });
    });
  }, [data, searchText, searchableFields]);

  return { searchText, filteredData, handleSearch, clearSearch, searchTruncated };
}
