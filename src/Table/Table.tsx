import React, { useState, useCallback, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import type { TableProps, InternalColumn } from './Table.types';
import { useSort } from '../hooks/useSort';
import { useSearch } from '../hooks/useSearch';
import { useSelection } from '../hooks/useSelection';
import { usePagination } from '../hooks/usePagination';
import { getDefaultClassName } from '../utils/helpers';
import './table.css';

const VIRT_BUFFER = 10;

/**
 * SortIcon — inline SVG sort indicators (replaces image-based icons, fixes B11)
 */
function SortIcon({ direction }: { direction: 'asc' | 'desc' | 'none' }): React.JSX.Element {
  if (direction === 'asc') {
    return (
      <span className="rlt-sort-icon" aria-hidden="true">
        <svg viewBox="0 0 10 10"><polygon points="5,2 9,8 1,8" /></svg>
      </span>
    );
  }
  if (direction === 'desc') {
    return (
      <span className="rlt-sort-icon" aria-hidden="true">
        <svg viewBox="0 0 10 10"><polygon points="5,8 1,2 9,2" /></svg>
      </span>
    );
  }
  return (
    <span className="rlt-sort-icon" aria-hidden="true">
      <svg viewBox="0 0 10 14">
        <polygon points="5,1 9,6 1,6" opacity="0.4" />
        <polygon points="5,13 1,8 9,8" opacity="0.4" />
      </svg>
    </span>
  );
}

/**
 * ColumnControllerIcon — inline SVG for column visibility menu button
 */
function ColumnControllerIcon(): React.JSX.Element {
  return (
    <span className="rlt-column-icon" aria-hidden="true">
      <svg viewBox="0 0 16 16">
        <rect x="1" y="1" width="6" height="6" rx="1" />
        <rect x="9" y="1" width="6" height="6" rx="1" />
        <rect x="1" y="9" width="6" height="6" rx="1" />
        <rect x="9" y="9" width="6" height="6" rx="1" />
      </svg>
    </span>
  );
}

/**
 * Table — A lightweight, accessible, sortable, searchable, and selectable React table component.
 */
function Table<T extends Record<string, unknown>>(props: TableProps<T>): React.JSX.Element {
  const {
    columns,
    data: dataProp,
    url,
    rowKey = 'id' as keyof T & string,
    className = '',
    isSearchable = false,
    isSelectable = false,
    searchableFields,
    pageSize,
    onSelectionChange,
    onSort,
    onPageChange,
    loading: externalLoading,
    emptyMessage = 'No data available',
    errorMessage = 'Failed to load data',
    stickyHeader = false,
    striped = false,
    bordered = false,
    virtualized = false,
  } = props;

  // ─── Internal column state (cloned from props, fixes B1/B4) ───
  const [localColumns, setLocalColumns] = useState<InternalColumn<T>[]>(() =>
    columns.map((col) => ({
      ...col,
      isVisible: col.isVisible !== undefined ? col.isVisible : true,
    }))
  );

  // Sync localColumns when columns prop changes
  useEffect(() => {
    setLocalColumns(
      columns.map((col) => ({
        ...col,
        isVisible: col.isVisible !== undefined ? col.isVisible : true,
      }))
    );
  }, [columns]);

  // ─── Remote data fetching (fixes B5/B6) ───
  const [fetchedData, setFetchedData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dataProp !== undefined) {
      // Local data mode — data prop takes priority over url (Task 7)
      return;
    }

    if (!url) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    async function fetchData(): Promise<void> {
      setIsLoading(true);
      setError(null);

      // ── URL validation: only http/https schemes accepted (SSRF guard — CWE-918) ──
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url as string);
      } catch {
        if (!cancelled) {
          setError('Invalid URL');
          setIsLoading(false);
        }
        return;
      }
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        if (!cancelled) {
          setError(`Blocked URL scheme: ${parsedUrl.protocol}`);
          setIsLoading(false);
        }
        return;
      }

      // ── Timeout via AbortController (30 s) ──
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 30_000);

      try {
        const response = await fetch(url as string, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // ── Content-Type guard: must be application/json ──
        const contentType = response.headers.get('content-type') ?? '';
        if (!contentType.toLowerCase().includes('application/json')) {
          throw new Error('Invalid response content type');
        }

        // ── Size guard: consume body as text and cap at 10 MB (CWE-770) ──
        const text = await response.text();
        if (text.length > 10_000_000) {
          throw new Error('Response too large');
        }

        // ── Parse and validate array response ──
        const json: unknown = JSON.parse(text);
        if (!Array.isArray(json)) {
          throw new Error('Expected array response');
        }

        if (!cancelled) {
          // Map to new objects instead of mutating (fixes B6)
          setFetchedData((json as T[]).map((item) => ({ ...item })));
        }
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        if (!cancelled) {
          let message: string;
          if (err instanceof DOMException && err.name === 'AbortError') {
            message = 'Request timed out';
          } else {
            message = err instanceof Error ? err.message : 'Unknown error';
          }
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [url, dataProp]);

  // ─── Resolve data source ───
  const sourceData: T[] = dataProp !== undefined ? dataProp : fetchedData;
  const showLoading = externalLoading || isLoading;

  // ─── Virtualization refs & state ───
  const virtualScrollRef = useRef<HTMLDivElement>(null);
  const tbodyRef = useRef<HTMLTableSectionElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(400);
  const [measuredRowHeight, setMeasuredRowHeight] = useState(40);

  // Measure actual row height from the first rendered data row (once on mount)
  useLayoutEffect(() => {
    if (!virtualized || !tbodyRef.current) return;
    const firstRow = tbodyRef.current.firstElementChild;
    if (firstRow instanceof HTMLElement && !firstRow.hasAttribute('data-spacer')) {
      const h = firstRow.getBoundingClientRect().height;
      if (h > 0) setMeasuredRowHeight(h);
    }
  }, [virtualized]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track scroll container height (ResizeObserver — pure browser API, no deps)
  useEffect(() => {
    if (!virtualized || !virtualScrollRef.current) return;
    const el = virtualScrollRef.current;
    setViewportHeight(el.clientHeight);
    const ro = new ResizeObserver(() => setViewportHeight(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [virtualized]);

  const handleVirtualScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // ─── Column visibility toggle (fixes B4) ───
  const [showMenu, setShowMenu] = useState<boolean>(false);

  const handleToggleColumn = useCallback((index: number) => {
    setLocalColumns((prev) =>
      prev.map((col, i) =>
        i === index ? { ...col, isVisible: !col.isVisible } : col
      )
    );
  }, []);

  const handleToggleMenu = useCallback(() => {
    setShowMenu((prev) => !prev);
  }, []);

  // ─── Hooks ───
  const visibleColumnPaths = useMemo(
    () => localColumns.filter((c) => c.isVisible).map((c) => c.path as string),
    [localColumns]
  );

  const { searchText, filteredData, handleSearch } = useSearch<T>(
    sourceData,
    searchableFields ?? visibleColumnPaths
  );

  const { sortState, sortedData, handleSort } = useSort<T>(filteredData, onSort);

  const allVisibleKeys = useMemo(
    () => sortedData.map((item) => String(item[rowKey])),
    [sortedData, rowKey]
  );

  const {
    isAllSelected,
    isRowSelected,
    handleSelect,
    handleSelectAll,
  } = useSelection<T>(sortedData, rowKey as string, onSelectionChange);

  const {
    currentPage,
    totalPages,
    paginatedData,
    startIndex,
    endIndex,
    totalItems,
    goToPage,
    goToNextPage,
    goToPrevPage,
    pageNumbers,
  } = usePagination<T>(sortedData, pageSize, onPageChange);

  // ─── Reset scroll when visible dataset changes (search / sort / page) ───
  useEffect(() => {
    if (!virtualized || !virtualScrollRef.current) return;
    virtualScrollRef.current.scrollTop = 0;
    setScrollTop(0);
  }, [virtualized, searchText, sortState, currentPage]);

  // ─── Virtual window calculation ───
  const { virtStart, virtEnd, topSpacer, bottomSpacer } = useMemo(() => {
    if (!virtualized) {
      return { virtStart: 0, virtEnd: paginatedData.length - 1, topSpacer: 0, bottomSpacer: 0 };
    }
    const total = paginatedData.length;
    if (total === 0) {
      return { virtStart: 0, virtEnd: -1, topSpacer: 0, bottomSpacer: 0 };
    }
    const start = Math.max(0, Math.floor(scrollTop / measuredRowHeight) - VIRT_BUFFER);
    const end = Math.min(total - 1, Math.ceil((scrollTop + viewportHeight) / measuredRowHeight) + VIRT_BUFFER);
    return {
      virtStart: start,
      virtEnd: end,
      topSpacer: start * measuredRowHeight,
      bottomSpacer: Math.max(0, (total - end - 1) * measuredRowHeight),
    };
  }, [virtualized, scrollTop, measuredRowHeight, viewportHeight, paginatedData.length]);

  // ─── Render: Column Controller ───
  const renderColumnController = useCallback((): React.JSX.Element => {
    return (
      <div className="rlt-column-controller">
        <button
          onClick={handleToggleMenu}
          className="rlt-btn-column-controller"
          aria-haspopup="true"
          aria-expanded={showMenu}
          aria-label="Toggle column visibility"
          type="button"
        >
          <ColumnControllerIcon />
        </button>
        <ul
          className={`rlt-controller-list${showMenu ? '' : ' rlt-hide'}`}
          role="menu"
        >
          {localColumns.map((column, index) => (
            <li key={column.key} role="menuitemcheckbox" aria-checked={column.isVisible}>
              <input
                type="checkbox"
                id={`rlt-col-toggle-${column.key}`}
                checked={column.isVisible}
                onChange={() => handleToggleColumn(index)}
                tabIndex={showMenu ? 0 : -1}
              />
              <label htmlFor={`rlt-col-toggle-${column.key}`}>
                {column.label}
              </label>
            </li>
          ))}
        </ul>
      </div>
    );
  }, [localColumns, showMenu, handleToggleColumn, handleToggleMenu]);

  // ─── Render: Sort button for a column header ───
  const renderSortableHeader = useCallback(
    (column: InternalColumn<T>): React.JSX.Element => {
      if (column.sortable) {
        const direction =
          sortState.key === column.path ? sortState.direction : 'none';
        const ariaSort =
          direction === 'asc'
            ? 'ascending'
            : direction === 'desc'
            ? 'descending'
            : 'none';

        return (
          <span className="rlt-header-content">
            <span>{column.label}</span>
            <button
              onClick={() => handleSort(column.path)}
              className="rlt-sort-btn"
              aria-sort={ariaSort}
              aria-label={`Sort by ${column.label}`}
              type="button"
            >
              <SortIcon direction={direction} />
            </button>
          </span>
        );
      }
      return <span>{column.label}</span>;
    },
    [sortState, handleSort]
  );

  // ─── Render: Table rows ───
  const renderRows = useCallback((): React.JSX.Element => {
    const rowsToRender = virtualized
      ? paginatedData.slice(virtStart, virtEnd + 1)
      : paginatedData;
    const colSpan =
      localColumns.filter((c) => c.isVisible).length + (isSelectable ? 1 : 0);

    return (
      <>
        {/* Top spacer — fills the height of rows scrolled past */}
        {virtualized && topSpacer > 0 && (
          <tr aria-hidden="true" data-spacer="top">
            <td colSpan={colSpan} style={{ height: topSpacer, padding: 0, border: 'none' }} />
          </tr>
        )}

        {rowsToRender.map((item, localIdx) => {
          const absoluteIdx = virtualized ? virtStart + localIdx : localIdx;
          const keyValue = item[rowKey];
          const keyStr =
            keyValue !== undefined && keyValue !== null
              ? String(keyValue)
              : String(absoluteIdx);
          const selected = isRowSelected(keyStr);

          return (
            <tr
              key={keyStr}
              className={selected ? 'rlt-row--selected' : ''}
              role="row"
            >
              {isSelectable && (
                <td className="rlt-select-cell" role="gridcell">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => handleSelect(keyStr)}
                    aria-label={`Select row ${keyStr}`}
                  />
                </td>
              )}
              {localColumns.map((column) => {
                if (!column.isVisible) return null;
                const cellValue = item[column.path];
                const defaultCls = getDefaultClassName(column.className);
                const cellClass = column.className
                  ? `rlt-td-${defaultCls} ${column.className}`
                  : '';

                return (
                  <td key={column.key} className={cellClass} role="gridcell">
                    {column.formatter
                      ? column.formatter(cellValue, item)
                      : cellValue !== null && cellValue !== undefined
                      ? String(cellValue)
                      : ''}
                  </td>
                );
              })}
            </tr>
          );
        })}

        {/* Bottom spacer — fills the height of rows not yet scrolled to */}
        {virtualized && bottomSpacer > 0 && (
          <tr aria-hidden="true" data-spacer="bottom">
            <td colSpan={colSpan} style={{ height: bottomSpacer, padding: 0, border: 'none' }} />
          </tr>
        )}
      </>
    );
  }, [
    paginatedData,
    rowKey,
    isSelectable,
    isRowSelected,
    handleSelect,
    localColumns,
    virtualized,
    virtStart,
    virtEnd,
    topSpacer,
    bottomSpacer,
  ]);

  // ─── Render: Pagination ───
  const renderPagination = useCallback((): React.JSX.Element | null => {
    if (!pageSize || pageSize <= 0 || totalItems === 0) return null;

    return (
      <div className="rlt-pagination" role="navigation" aria-label="Table pagination">
        <span className="rlt-pagination-info">
          Showing {startIndex}–{endIndex} of {totalItems} results
        </span>
        <div className="rlt-pagination-controls">
          <button
            className="rlt-pagination-btn"
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            aria-label="Previous page"
            type="button"
          >
            ‹
          </button>
          {pageNumbers.map((page) => (
            <button
              key={page}
              className={`rlt-pagination-btn${
                page === currentPage ? ' rlt-pagination-btn--active' : ''
              }`}
              onClick={() => goToPage(page)}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
              type="button"
            >
              {page}
            </button>
          ))}
          <button
            className="rlt-pagination-btn"
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
            type="button"
          >
            ›
          </button>
        </div>
      </div>
    );
  }, [
    pageSize,
    totalItems,
    startIndex,
    endIndex,
    currentPage,
    totalPages,
    pageNumbers,
    goToPage,
    goToNextPage,
    goToPrevPage,
  ]);

  // ─── Loading state ───
  if (showLoading) {
    return (
      <div className="rlt-state-container rlt-loading" role="status" aria-live="polite">
        <span className="rlt-spinner" />
        <span>Loading…</span>
      </div>
    );
  }

  // ─── Error state ───
  if (error) {
    return (
      <div className="rlt-state-container rlt-error" role="alert">
        {typeof errorMessage === 'string' ? errorMessage : errorMessage}
        {typeof errorMessage === 'string' && (
          <span style={{ marginLeft: 8, fontSize: '0.85em', opacity: 0.7 }}>({error})</span>
        )}
      </div>
    );
  }

  // ─── Build table className (fixes B14 — no duplicate) ───
  const tableClasses = [
    'rlt-table',
    stickyHeader ? 'rlt-table--sticky' : '',
    striped ? 'rlt-table--striped' : '',
    bordered ? 'rlt-table--bordered' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const visibleColumns = localColumns.filter((c) => c.isVisible);

  const tableEl = (
    <table className={tableClasses} role="grid">
      <thead>
        <tr role="row">
          {isSelectable && (
            <th className="rlt-select-column" role="columnheader">
              <input
                type="checkbox"
                id="rlt-select-all"
                checked={isAllSelected}
                onChange={() => handleSelectAll(allVisibleKeys)}
                aria-label="Select all rows"
              />
            </th>
          )}
          {visibleColumns.map((column) => {
            const defaultCls = getDefaultClassName(column.className);
            const thClass = column.className
              ? `rlt-th-${defaultCls} ${column.className}`
              : '';

            return (
              <th key={column.key} className={thClass} role="columnheader">
                {renderSortableHeader(column)}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody ref={tbodyRef}>{renderRows()}</tbody>
    </table>
  );

  return (
    <div className="rlt-container">
      {/* Search bar + column controller */}
      {isSearchable && (
        <div className="rlt-action-container">
          <input
            className="rlt-search-input"
            type="text"
            placeholder="Search…"
            aria-label="Search table data"
            value={searchText}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
          />
          {renderColumnController()}
        </div>
      )}

      {/* Empty state */}
      {sourceData.length === 0 && !showLoading && !error ? (
        <div className="rlt-state-container rlt-empty" role="status">
          {emptyMessage}
        </div>
      ) : (
        <>
          {virtualized ? (
            <div
              ref={virtualScrollRef}
              className="rlt-virtual-scroll"
              onScroll={handleVirtualScroll}
            >
              {tableEl}
            </div>
          ) : (
            tableEl
          )}
          {renderPagination()}
        </>
      )}
    </div>
  );
}

export default Table;
