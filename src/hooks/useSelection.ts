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
          const selected = data.filter((item) => next.has(String(item[rowKey])));
          onSelectionChange(selected);
        }
        return next;
      });
    },
    [data, rowKey, onSelectionChange]
  );

  const handleSelectAll = useCallback(
    (allKeys: string[]) => {
      setSelectedKeys((prev) => {
        const allSelected = allKeys.length > 0 && allKeys.every((k) => prev.has(k));
        const next = allSelected ? new Set<string>() : new Set(allKeys);
        if (onSelectionChange) {
          const selected = allSelected ? [] : data.filter((item) => next.has(String(item[rowKey])));
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
    return data.every((item) => selectedKeys.has(String(item[rowKey])));
  }, [data, selectedKeys, rowKey]);

  const selectedRows = useMemo(
    () => data.filter((item) => selectedKeys.has(String(item[rowKey]))),
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
