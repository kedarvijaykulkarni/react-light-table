import { useState, useCallback, useMemo } from 'react';
import type { SortState } from '../Table/Table.types';
import { toComparableString, isNumericValue } from '../utils/helpers';

interface UseSortResult<T> {
  sortState: SortState;
  sortedData: T[];
  handleSort: (key: string) => void;
  resetSort: () => void;
}

const INITIAL_SORT_STATE: SortState = { key: '', direction: 'none' };

export function useSort<T extends Record<string, unknown>>(
  data: T[],
  onSort?: (column: string, direction: 'asc' | 'desc') => void
): UseSortResult<T> {
  const [sortState, setSortState] = useState<SortState>(INITIAL_SORT_STATE);

  const handleSort = useCallback(
    (key: string) => {
      setSortState((prev) => {
        let newDirection: 'asc' | 'desc';
        if (prev.key === key && prev.direction === 'asc') {
          newDirection = 'desc';
        } else {
          newDirection = 'asc';
        }
        if (onSort) {
          onSort(key, newDirection);
        }
        return { key, direction: newDirection };
      });
    },
    [onSort]
  );

  const resetSort = useCallback(() => {
    setSortState(INITIAL_SORT_STATE);
  }, []);

  const sortedData = useMemo(() => {
    if (sortState.direction === 'none' || !sortState.key) {
      return data;
    }

    const key = sortState.key;
    const direction = sortState.direction;

    return [...data].sort((a, b) => {
      const valA = a[key];
      const valB = b[key];

      // Handle null/undefined — push them to the end
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      // Numeric comparison
      if (isNumericValue(valA) && isNumericValue(valB)) {
        const diff = Number(valA) - Number(valB);
        return direction === 'asc' ? diff : -diff;
      }

      // String comparison
      const strA = toComparableString(valA);
      const strB = toComparableString(valB);
      const comparison = strA.localeCompare(strB);
      return direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortState]);

  return { sortState, sortedData, handleSort, resetSort };
}
