import { useState, useCallback, useMemo } from 'react';

interface UsePaginationResult<T> {
  currentPage: number;
  totalPages: number;
  paginatedData: T[];
  startIndex: number;
  endIndex: number;
  totalItems: number;
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  pageNumbers: number[];
}

export function usePagination<T>(
  data: T[],
  pageSize?: number,
  onPageChange?: (page: number) => void,
  /** Controlled current page (1-based). When provided the hook is page-controlled. */
  controlledPage?: number,
): UsePaginationResult<T> {
  const isControlled = controlledPage !== undefined;
  const [internalPage, setInternalPage] = useState<number>(1);

  const totalItems = data.length;

  const totalPages = useMemo(() => {
    if (!pageSize || pageSize <= 0) return 1;
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }, [totalItems, pageSize]);

  // Effective page: controlled value takes precedence, then clamp to valid range
  const rawPage = isControlled ? controlledPage : internalPage;
  const safePage = useMemo(() => {
    return Math.min(Math.max(1, rawPage), totalPages);
  }, [rawPage, totalPages]);

  const paginatedData = useMemo(() => {
    if (!pageSize || pageSize <= 0) return data;
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, safePage, pageSize]);

  const startIndex = useMemo(() => {
    if (!pageSize || pageSize <= 0 || totalItems === 0) return 0;
    return (safePage - 1) * pageSize + 1;
  }, [safePage, pageSize, totalItems]);

  const endIndex = useMemo(() => {
    if (!pageSize || pageSize <= 0) return totalItems;
    return Math.min(safePage * pageSize, totalItems);
  }, [safePage, pageSize, totalItems]);

  const goToPage = useCallback(
    (page: number) => {
      const target = Math.max(1, Math.min(page, totalPages));
      if (!isControlled) setInternalPage(target);
      if (onPageChange) onPageChange(target);
    },
    [totalPages, onPageChange, isControlled]
  );

  const goToNextPage = useCallback(() => {
    goToPage(safePage + 1);
  }, [safePage, goToPage]);

  const goToPrevPage = useCallback(() => {
    goToPage(safePage - 1);
  }, [safePage, goToPage]);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, safePage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [safePage, totalPages]);

  return {
    currentPage: safePage,
    totalPages,
    paginatedData,
    startIndex,
    endIndex,
    totalItems,
    goToPage,
    goToNextPage,
    goToPrevPage,
    pageNumbers,
  };
}
