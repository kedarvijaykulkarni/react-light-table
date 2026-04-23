import { useState, useCallback, useMemo } from 'react';

interface UseSelectionResult<T> {
  selectedKeys: Set<string>;
  isAllSelected: boolean;
  isRowSelected: (key: string) => boolean;
  handleSelect: (key: string) => void;
  handleSelectAll: (allKeys: string[]) => void;
  clearSelection: () => void;
  selectedRows: T[];
}

/** Maximum length for a valid row-key string (prototype-pollution guard — CWE-1321) */
const MAX_KEY_LENGTH = 512;

/**
 * Safely read a row key from an item.
 * Uses hasOwnProperty to avoid prototype-chain traversal (CWE-1321).
 * Falls back to String(index) when the key is not an own property.
 */
function safeRowKey<T extends Record<string, unknown>>(
  item: T,
  rowKey: string,
  index: number
): string {
  if (!Object.prototype.hasOwnProperty.call(item, rowKey)) {
    return String(index);
  }
  return String(item[rowKey]);
}

export function useSelection<T extends Record<string, unknown>>(
  data: T[],
  rowKey: string,
  onSelectionChange?: (selectedRows: T[]) => void
): UseSelectionResult<T> {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const handleSelect = useCallback(
    (key: string) => {
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        if (onSelectionChange) {
          const selected = data.filter((item, idx) => next.has(safeRowKey(item, rowKey, idx)));
          onSelectionChange(selected);
        }
        return next;
      });
    },
    [data, rowKey, onSelectionChange]
  );

  const handleSelectAll = useCallback(
    (allKeys: string[]) => {
      // Validate allKeys: must be an array; filter out entries exceeding MAX_KEY_LENGTH
      const validKeys = Array.isArray(allKeys)
        ? allKeys.filter((k) => typeof k === 'string' && k.length <= MAX_KEY_LENGTH)
        : [];

      setSelectedKeys((prev) => {
        const allSelected = validKeys.length > 0 && validKeys.every((k) => prev.has(k));
        const next = allSelected ? new Set<string>() : new Set(validKeys);
        if (onSelectionChange) {
          const selected = allSelected
            ? []
            : data.filter((item, idx) => next.has(safeRowKey(item, rowKey, idx)));
          onSelectionChange(selected);
        }
        return next;
      });
    },
    [data, rowKey, onSelectionChange]
  );

  const clearSelection = useCallback(() => {
    setSelectedKeys(new Set());
    if (onSelectionChange) {
      onSelectionChange([]);
    }
  }, [onSelectionChange]);

  const isRowSelected = useCallback(
    (key: string) => selectedKeys.has(key),
    [selectedKeys]
  );

  const isAllSelected = useMemo(() => {
    if (data.length === 0) return false;
    return data.every((item, idx) => selectedKeys.has(safeRowKey(item, rowKey, idx)));
  }, [data, selectedKeys, rowKey]);

  const selectedRows = useMemo(
    () => data.filter((item, idx) => selectedKeys.has(safeRowKey(item, rowKey, idx))),
    [data, selectedKeys, rowKey]
  );

  return {
    selectedKeys,
    isAllSelected,
    isRowSelected,
    handleSelect,
    handleSelectAll,
    clearSelection,
    selectedRows,
  };
}
