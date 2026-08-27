import React, { useState, useCallback, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import type { TableProps, InternalColumn } from './Table.types';
import { useSort } from '../hooks/useSort';
import { useSearch } from '../hooks/useSearch';
import { useSelection } from '../hooks/useSelection';
import { usePagination } from '../hooks/usePagination';
import { getDefaultClassName } from '../utils/helpers';
import './table.css';

const VIRT_BUFFER = 10;
const MIN_COLUMN_WIDTH = 48;

type GridCell = HTMLTableCellElement;

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

function ExpandIcon({ expanded }: { expanded: boolean }): React.JSX.Element {
  return (
    <span className="rlt-expand-icon" aria-hidden="true">
      <svg viewBox="0 0 10 10">
        <polygon points={expanded ? '1,3 9,3 5,8' : '3,1 8,5 3,9'} />
      </svg>
    </span>
  );
}

function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let text = String(value).replace(/\r?\n|\r/g, ' ');
  text = text.replace(/^[=+\-@]+/, '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function getRowKey<T extends Record<string, unknown>>(item: T, rowKey: keyof T & string, fallback: number): string {
  const value = item[rowKey];
  return value !== undefined && value !== null ? String(value) : String(fallback);
}

function mergeStyles(...styles: Array<React.CSSProperties | undefined>): React.CSSProperties | undefined {
  const merged = Object.assign({}, ...styles.filter(Boolean));
  return Object.keys(merged).length > 0 ? merged : undefined;
}

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
    expandable,
    exportCsv = false,
    searchValue,
    onSearchChange,
    sortState: controlledSortState,
    onSortChange,
    page: controlledPage,
    selectedRows: controlledSelectedRows,
  } = props;

  const [localColumns, setLocalColumns] = useState<InternalColumn<T>[]>(() =>
    columns.map((col) => ({
      ...col,
      isVisible: col.isVisible !== undefined ? col.isVisible : true,
    }))
  );

  useEffect(() => {
    setLocalColumns(
      columns.map((col) => ({
        ...col,
        isVisible: col.isVisible !== undefined ? col.isVisible : true,
      }))
    );
  }, [columns]);

  const [fetchedData, setFetchedData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dataProp !== undefined || !url) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    async function fetchData(): Promise<void> {
      setIsLoading(true);
      setError(null);

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

      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 30_000);

      try {
        const response = await fetch(url as string, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') ?? '';
        if (!contentType.toLowerCase().includes('application/json')) {
          throw new Error('Invalid response content type');
        }

        const text = await response.text();
        if (text.length > 10_000_000) {
          throw new Error('Response too large');
        }

        const json: unknown = JSON.parse(text);
        if (!Array.isArray(json)) {
          throw new Error('Expected array response');
        }

        if (!cancelled) {
          setFetchedData((json as T[]).map((item) => ({ ...item })));
        }
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        if (!cancelled) {
          if (err instanceof DOMException && err.name === 'AbortError') {
            setError('Request timed out');
          } else {
            setError(err instanceof Error ? err.message : 'Unknown error');
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [url, dataProp]);

  const sourceData: T[] = dataProp !== undefined ? dataProp : fetchedData;
  const showLoading = externalLoading || isLoading;

  const virtualScrollRef = useRef<HTMLDivElement>(null);
  const tbodyRef = useRef<HTMLTableSectionElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const columnWidthsRef = useRef<Map<string, number>>(new Map());
  const resizeCleanupRef = useRef<(() => void) | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(400);
  const [measuredRowHeight, setMeasuredRowHeight] = useState(40);
  const [, setColumnResizeTick] = useState(0);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set());

  useLayoutEffect(() => {
    if (!virtualized || !tbodyRef.current) return;
    const firstRow = tbodyRef.current.querySelector('tr:not([data-spacer]):not(.rlt-expanded-row)');
    if (firstRow instanceof HTMLElement) {
      const h = firstRow.getBoundingClientRect().height;
      if (h > 0) setMeasuredRowHeight(h);
    }
  }, [virtualized]);

  useEffect(() => {
    if (!virtualized || !virtualScrollRef.current) return;
    const el = virtualScrollRef.current;
    setViewportHeight(el.clientHeight);
    const ro = new ResizeObserver(() => setViewportHeight(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [virtualized]);

  useEffect(() => {
    return () => {
      resizeCleanupRef.current?.();
    };
  }, []);

  const handleVirtualScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const theadRef = useRef<HTMLTableSectionElement>(null);
  const [pinOffsets, setPinOffsets] = useState<Map<string, number>>(new Map());

  useLayoutEffect(() => {
    if (!theadRef.current) return;

    const currentVisible = localColumns.filter((c) => c.isVisible);
    const hasPinned = currentVisible.some((c) => c.pin);
    if (!hasPinned) {
      setPinOffsets(new Map());
      return;
    }

    const headerRow = theadRef.current.firstElementChild;
    if (!headerRow) return;
    const ths = Array.from(headerRow.querySelectorAll('th'));
    const thWidths = ths.map((th) => th.getBoundingClientRect().width);
    const controlOffset = (isSelectable ? 1 : 0) + (expandable ? 1 : 0);
    const controlWidth = thWidths.slice(0, controlOffset).reduce((sum, w) => sum + (w ?? 0), 0);

    const offsets = new Map<string, number>();
    let leftAccum = controlWidth;
    currentVisible.forEach((col, i) => {
      if (col.pin === 'left') {
        offsets.set(col.key, leftAccum);
        leftAccum += thWidths[controlOffset + i] ?? 0;
      }
    });

    let rightAccum = 0;
    for (let i = currentVisible.length - 1; i >= 0; i--) {
      const col = currentVisible[i];
      if (col.pin === 'right') {
        offsets.set(col.key, rightAccum);
        rightAccum += thWidths[controlOffset + i] ?? 0;
      }
    }

    setPinOffsets(offsets);
  }, [localColumns, isSelectable, expandable]);

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

  useEffect(() => {
    if (!showMenu || !menuRef.current) return;
    const first = menuRef.current.querySelector<HTMLElement>('input:not(:disabled)');
    first?.focus();
  }, [showMenu]);

  const handleMenuKeyDown = useCallback((event: React.KeyboardEvent<HTMLUListElement>) => {
    if (event.key === 'Escape') {
      setShowMenu(false);
      menuButtonRef.current?.focus();
      return;
    }
    if (event.key !== 'Tab' || !menuRef.current) return;

    const focusable = Array.from(menuRef.current.querySelectorAll<HTMLElement>('input:not(:disabled), button:not(:disabled), [tabindex]:not([tabindex="-1"])'));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  const visibleColumnPaths = useMemo(
    () => localColumns.filter((c) => c.isVisible).map((c) => c.path as string),
    [localColumns]
  );

  const { searchText, filteredData, handleSearch } = useSearch<T>(
    sourceData,
    searchableFields ?? visibleColumnPaths,
    searchValue,
    onSearchChange,
  );

  const { sortState, sortedData, handleSort } = useSort<T>(
    filteredData,
    onSort,
    controlledSortState,
    onSortChange,
  );

  const allVisibleKeys = useMemo(
    () => sortedData.map((item, index) => getRowKey(item, rowKey, index)),
    [sortedData, rowKey]
  );

  const {
    isAllSelected,
    isRowSelected,
    handleSelect,
    handleSelectAll,
  } = useSelection<T>(sortedData, rowKey as string, onSelectionChange, controlledSelectedRows);

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
  } = usePagination<T>(sortedData, pageSize, onPageChange, controlledPage);

  useEffect(() => {
    if (!virtualized || !virtualScrollRef.current) return;
    virtualScrollRef.current.scrollTop = 0;
    setScrollTop(0);
  }, [virtualized, searchText, sortState, currentPage]);

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

  const visibleColumns = useMemo(() => localColumns.filter((c) => c.isVisible), [localColumns]);
  const controlColumnCount = (isSelectable ? 1 : 0) + (expandable ? 1 : 0);
  const colSpan = visibleColumns.length + controlColumnCount;
  const hasToolbar = isSearchable || exportCsv;

  const isExpanded = useCallback((key: string) => {
    if (!expandable) return false;
    return expandable.expandedByDefault ? !collapsedKeys.has(key) : expandedKeys.has(key);
  }, [expandable, expandedKeys, collapsedKeys]);

  const toggleExpanded = useCallback((key: string) => {
    if (!expandable) return;
    if (expandable.expandedByDefault) {
      setCollapsedKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    } else {
      setExpandedKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    }
  }, [expandable]);

  const getColumnWidthStyle = useCallback((column: InternalColumn<T>): React.CSSProperties | undefined => {
    const width = columnWidthsRef.current.get(column.path);
    return width ? { width, minWidth: width, maxWidth: width } : undefined;
  }, []);

  const getPinStyle = useCallback((column: InternalColumn<T>): React.CSSProperties | undefined => {
    const pinOffset = pinOffsets.get(column.key);
    if (pinOffset === undefined) return undefined;
    return column.pin === 'left' ? { left: pinOffset } : { right: pinOffset };
  }, [pinOffsets]);

  const handleResizeStart = useCallback((event: React.MouseEvent<HTMLButtonElement>, column: InternalColumn<T>) => {
    event.preventDefault();
    event.stopPropagation();

    resizeCleanupRef.current?.();
    const th = event.currentTarget.closest('th');
    const startX = event.clientX;
    const currentWidth = columnWidthsRef.current.get(column.path) ?? th?.getBoundingClientRect().width ?? MIN_COLUMN_WIDTH;

    const handleMouseMove = (moveEvent: MouseEvent): void => {
      const nextWidth = Math.max(MIN_COLUMN_WIDTH, Math.round(currentWidth + moveEvent.clientX - startX));
      columnWidthsRef.current.set(column.path, nextWidth);
      setColumnResizeTick((tick) => tick + 1);
    };

    const handleMouseUp = (): void => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      resizeCleanupRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    resizeCleanupRef.current = handleMouseUp;
  }, []);

  const handleGridCellKeyDown = useCallback((event: React.KeyboardEvent<GridCell>) => {
    const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    if (!keys.includes(event.key) || !tableRef.current) return;

    const cell = event.currentTarget;
    const currentRow = Number(cell.dataset.rltRow);
    const currentCol = Number(cell.dataset.rltCol);
    if (!Number.isFinite(currentRow) || !Number.isFinite(currentCol)) return;

    const delta = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    }[event.key] as [number, number];

    event.preventDefault();
    let targetRow = currentRow + delta[0];
    let targetCol = currentCol + delta[1];

    const findCell = (): GridCell | null => tableRef.current?.querySelector<GridCell>(`[data-rlt-row="${targetRow}"][data-rlt-col="${targetCol}"]`) ?? null;
    let target = findCell();

    if (!target && delta[1] !== 0) {
      targetCol = currentCol;
      target = findCell();
    }
    if (!target && delta[0] !== 0) {
      targetRow = currentRow;
      target = findCell();
    }
    target?.focus();
  }, []);

  const handleExportCsv = useCallback(() => {
    const header = visibleColumns.map((column) => sanitizeCsvCell(column.label));
    const rows = sortedData.map((item) =>
      visibleColumns.map((column) => sanitizeCsvCell(item[column.path]))
    );
    const csv = [header, ...rows].map((row) => row.join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const urlObject = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = urlObject;
    link.download = 'react-light-table-export.csv';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(urlObject);
  }, [sortedData, visibleColumns]);

  const renderColumnController = useCallback((): React.JSX.Element => {
    return (
      <div className="rlt-column-controller">
        <button
          ref={menuButtonRef}
          onClick={handleToggleMenu}
          className="rlt-btn-column-controller"
          aria-haspopup="menu"
          aria-expanded={showMenu}
          aria-controls="rlt-column-controller-menu"
          aria-label="Toggle column visibility"
          type="button"
        >
          <ColumnControllerIcon />
        </button>
        <ul
          id="rlt-column-controller-menu"
          ref={menuRef}
          className={`rlt-controller-list${showMenu ? '' : ' rlt-hide'}`}
          role="menu"
          aria-label="Column visibility"
          onKeyDown={handleMenuKeyDown}
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
  }, [localColumns, showMenu, handleToggleColumn, handleToggleMenu, handleMenuKeyDown]);

  const renderSortableHeader = useCallback(
    (column: InternalColumn<T>): React.JSX.Element => {
      if (column.sortable) {
        const direction = sortState.key === column.path ? sortState.direction : 'none';
        return (
          <span className="rlt-header-content">
            <span>{column.label}</span>
            <button
              onClick={() => handleSort(column.path)}
              className="rlt-sort-btn"
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

  const renderRows = useCallback((): React.JSX.Element => {
    const rowsToRender = virtualized
      ? paginatedData.slice(virtStart, virtEnd + 1)
      : paginatedData;

    return (
      <>
        {virtualized && topSpacer > 0 && (
          <tr aria-hidden="true" data-spacer="top">
            <td colSpan={colSpan} style={{ height: topSpacer, padding: 0, border: 'none' }} />
          </tr>
        )}

        {rowsToRender.map((item, localIdx) => {
          const absoluteIdx = virtualized ? virtStart + localIdx : localIdx;
          const pageIdx = virtualized ? virtStart + localIdx : localIdx;
          const rowIndex = pageIdx + 1;
          const keyStr = getRowKey(item, rowKey, absoluteIdx);
          const selected = isRowSelected(keyStr);
          const expanded = isExpanded(keyStr);
          let gridCol = 0;

          return (
            <React.Fragment key={keyStr}>
              <tr
                className={selected ? 'rlt-row--selected' : ''}
                role="row"
                aria-selected={isSelectable ? selected : undefined}
              >
                {isSelectable && (
                  <td
                    className="rlt-select-cell"
                    role="gridcell"
                    tabIndex={0}
                    data-rlt-row={rowIndex}
                    data-rlt-col={gridCol++}
                    onKeyDown={handleGridCellKeyDown}
                    aria-label={`Selection for row ${keyStr}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => handleSelect(keyStr)}
                      aria-label={`Select row ${keyStr}`}
                    />
                  </td>
                )}
                {expandable && (
                  <td
                    className="rlt-expand-cell"
                    role="gridcell"
                    tabIndex={0}
                    data-rlt-row={rowIndex}
                    data-rlt-col={gridCol++}
                    onKeyDown={handleGridCellKeyDown}
                    aria-label={`Expansion for row ${keyStr}`}
                  >
                    <button
                      type="button"
                      className="rlt-expand-btn"
                      aria-label={`${expanded ? 'Collapse' : 'Expand'} row ${keyStr}`}
                      aria-expanded={expanded}
                      aria-controls={`rlt-expanded-${keyStr}`}
                      onClick={() => toggleExpanded(keyStr)}
                    >
                      <ExpandIcon expanded={expanded} />
                    </button>
                  </td>
                )}
                {visibleColumns.map((column) => {
                  const cellValue = item[column.path];
                  const defaultCls = getDefaultClassName(column.className);
                  const pinCls =
                    column.pin === 'left' ? 'rlt-td--pin-left' :
                    column.pin === 'right' ? 'rlt-td--pin-right' : '';
                  const cellClass = [
                    column.className ? `rlt-td-${defaultCls} ${column.className}` : '',
                    pinCls,
                  ].filter(Boolean).join(' ');
                  const colIndex = gridCol++;

                  return (
                    <td
                      key={column.key}
                      className={cellClass}
                      style={mergeStyles(getColumnWidthStyle(column), getPinStyle(column))}
                      role="gridcell"
                      tabIndex={0}
                      data-rlt-row={rowIndex}
                      data-rlt-col={colIndex}
                      onKeyDown={handleGridCellKeyDown}
                    >
                      {column.render
                        ? column.render(cellValue, item)
                        : column.formatter
                        ? column.formatter(cellValue, item)
                        : cellValue !== null && cellValue !== undefined
                        ? String(cellValue)
                        : ''}
                    </td>
                  );
                })}
              </tr>
              {expandable && expanded && (
                <tr className="rlt-expanded-row" role="row">
                  <td
                    id={`rlt-expanded-${keyStr}`}
                    className="rlt-expanded-cell"
                    colSpan={colSpan}
                    role="gridcell"
                  >
                    {expandable.render(item)}
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}

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
    visibleColumns,
    virtualized,
    virtStart,
    virtEnd,
    topSpacer,
    bottomSpacer,
    colSpan,
    expandable,
    isExpanded,
    toggleExpanded,
    getColumnWidthStyle,
    getPinStyle,
    handleGridCellKeyDown,
  ]);

  const renderPagination = useCallback((): React.JSX.Element | null => {
    if (!pageSize || pageSize <= 0 || totalItems === 0) return null;

    return (
      <div className="rlt-pagination" role="navigation" aria-label="Table pagination">
        <span className="rlt-pagination-info">{`Showing ${startIndex}-${endIndex} of ${totalItems} results`}</span>
        <div className="rlt-pagination-controls">
          <button
            className="rlt-pagination-btn"
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            aria-label="Previous page"
            type="button"
          >
            {'<'}
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
            {'>'}
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

  if (showLoading) {
    return (
      <div className="rlt-state-container rlt-loading" role="status" aria-live="polite">
        <span className="rlt-spinner" />
        <span>{'Loading...'}</span>
      </div>
    );
  }

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

  const tableClasses = [
    'rlt-table',
    stickyHeader ? 'rlt-table--sticky' : '',
    striped ? 'rlt-table--striped' : '',
    bordered ? 'rlt-table--bordered' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const tableEl = (
    <div className="rlt-table-wrapper">
      <table ref={tableRef} className={tableClasses} role="grid" aria-label="Data table">
        <thead ref={theadRef}>
          <tr role="row">
            {isSelectable && (
              <th
                className="rlt-select-column"
                role="columnheader"
                tabIndex={0}
                data-rlt-row={0}
                data-rlt-col={0}
                onKeyDown={handleGridCellKeyDown}
                aria-label="Select rows"
              >
                <input
                  type="checkbox"
                  id="rlt-select-all"
                  checked={isAllSelected}
                  onChange={() => handleSelectAll(allVisibleKeys)}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {expandable && (
              <th
                className="rlt-expand-column"
                role="columnheader"
                tabIndex={0}
                data-rlt-row={0}
                data-rlt-col={isSelectable ? 1 : 0}
                onKeyDown={handleGridCellKeyDown}
                aria-label="Expand rows"
              />
            )}
            {visibleColumns.map((column, index) => {
              const defaultCls = getDefaultClassName(column.className);
              const pinCls =
                column.pin === 'left' ? 'rlt-th--pin-left' :
                column.pin === 'right' ? 'rlt-th--pin-right' : '';
              const thClass = [
                column.className ? `rlt-th-${defaultCls} ${column.className}` : '',
                pinCls,
              ].filter(Boolean).join(' ');
              const direction = sortState.key === column.path ? sortState.direction : 'none';
              const ariaSort = column.sortable
                ? direction === 'asc'
                  ? 'ascending'
                  : direction === 'desc'
                  ? 'descending'
                  : 'none'
                : undefined;
              const colIndex = controlColumnCount + index;

              return (
                <th
                  key={column.key}
                  className={thClass}
                  style={mergeStyles(getColumnWidthStyle(column), getPinStyle(column))}
                  role="columnheader"
                  aria-sort={ariaSort}
                  tabIndex={0}
                  data-rlt-row={0}
                  data-rlt-col={colIndex}
                  onKeyDown={handleGridCellKeyDown}
                >
                  {renderSortableHeader(column)}
                  <button
                    type="button"
                    className="rlt-resize-handle"
                    aria-label={`Resize ${column.label} column`}
                    onMouseDown={(event) => handleResizeStart(event, column)}
                  />
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody ref={tbodyRef}>{renderRows()}</tbody>
      </table>
    </div>
  );

  return (
    <div className="rlt-container">
      {hasToolbar && (
        <div className="rlt-action-container">
          {isSearchable && (
            <input
              className="rlt-search-input"
              type="text"
              placeholder={'Search...'}
              aria-label="Search table data"
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
            />
          )}
          {exportCsv && (
            <button
              className="rlt-export-btn"
              type="button"
              onClick={handleExportCsv}
              aria-label="Export table data to CSV"
            >
              Export CSV
            </button>
          )}
          {isSearchable && renderColumnController()}
        </div>
      )}

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
