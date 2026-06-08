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

/** Only allow word-character sort keys; also rejects double-underscore names like __proto__ (CWE-1321) */
const SAFE_SORT_KEY_PATTERN = /^\w+$/;

/** Denylist of dangerous prototype-access key prefixes (CWE-1321) */
const SORT_KEY_DENYLIST = /^(__|prototype$|constructor$)/;

/** Maximum dataset size before sort is skipped to prevent UI freeze (DoS guard — CWE-400) */
const MAX_SORTABLE_ROWS = 100_000;

export function useSort<T extends Record<string, unknown>>(
  data: T[],
  onSort?: (column: string, direction: 'asc' | 'desc') => void,
  /** Controlled sort state. When provided the hook is sort-controlled. */
  controlledState?: SortState,
  /** Called with the new SortState whenever the user changes the sort. */
  onSortChange?: (state: SortState) => void,
): UseSortResult<T> {
  const isControlled = controlledState !== undefined;
  const [internalState, setInternalState] = useState<SortState>(INITIAL_SORT_STATE);

  // Effective sort state: controlled value takes precedence over internal state
  const sortState = isControlled ? controlledState : internalState;

  const handleSort = useCallback(
    (key: string) => {
      // Key sanitisation — reject non-word keys AND dangerous __ prefixed names (prevents __proto__ pollution)
      if (!SAFE_SORT_KEY_PATTERN.test(key) || SORT_KEY_DENYLIST.test(key)) {
        throw new Error(`Invalid sort key: "${key}"`);
      }

      if (isControlled) {
        // In controlled mode: compute next state from controlled value, fire callbacks only
        const newDirection: 'asc' | 'desc' =
          controlledState!.key === key && controlledState!.direction === 'asc' ? 'desc' : 'asc';
        const newState: SortState = { key, direction: newDirection };
        if (onSort) onSort(key, newDirection);
        if (onSortChange) onSortChange(newState);
      } else {
        // In uncontrolled mode: update internal state and fire callbacks
        setInternalState((prev) => {
          let newDirection: 'asc' | 'desc';
          if (prev.key === key && prev.direction === 'asc') {
            newDirection = 'desc';
          } else {
            newDirection = 'asc';
          }
          if (onSort) onSort(key, newDirection);
          if (onSortChange) onSortChange({ key, direction: newDirection });
          return { key, direction: newDirection };
        });
      }
    },
    [isControlled, controlledState, onSort, onSortChange]
  );

  const resetSort = useCallback(() => {
    if (isControlled) {
      if (onSortChange) onSortChange(INITIAL_SORT_STATE);
    } else {
      setInternalState(INITIAL_SORT_STATE);
    }
  }, [isControlled, onSortChange]);

  const sortedData = useMemo(() => {
    if (sortState.direction === 'none' || !sortState.key) {
      return data;
    }

    // Data size guard — skip sort on adversarial payloads to prevent UI thread freeze
    if (data.length > MAX_SORTABLE_ROWS) {
      console.warn(
        `[useSort] Dataset has ${data.length} rows which exceeds the ${MAX_SORTABLE_ROWS}-row sort limit. Returning unsorted data.`
      );
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
