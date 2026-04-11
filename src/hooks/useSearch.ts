import { useState, useCallback, useMemo } from 'react';
import { toComparableString } from '../utils/helpers';

interface UseSearchResult<T> {
  searchText: string;
  filteredData: T[];
  handleSearch: (text: string) => void;
  clearSearch: () => void;
}

export function useSearch<T extends Record<string, unknown>>(
  data: T[],
  searchableFields?: string[]
): UseSearchResult<T> {
  const [searchText, setSearchText] = useState<string>('');

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchText('');
  }, []);

  const filteredData = useMemo(() => {
    if (!searchText.trim()) {
      return data;
    }

    const query = searchText.toUpperCase();

    return data.filter((item) => {
      const fieldsToSearch = searchableFields ?? Object.keys(item);

      return fieldsToSearch.some((field) => {
        const value = item[field];
        // Only search string and number values
        if (typeof value === 'string' || typeof value === 'number') {
          return toComparableString(value).includes(query);
        }
        return false;
      });
    });
  }, [data, searchText, searchableFields]);

  return { searchText, filteredData, handleSearch, clearSearch };
}
