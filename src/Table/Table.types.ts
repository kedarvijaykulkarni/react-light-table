import type React from 'react';

export interface ColumnDef<T = Record<string, unknown>> {
  /** Unique key for the column */
  key: string;
  /** Property path in the data object */
  path: keyof T & string;
  /** Display label for the column header */
  label: string;
  /** Optional CSS class name(s) for the column */
  className?: string;
  /** Whether this column is sortable */
  sortable?: boolean;
  /** Whether this column is visible (default: true) */
  isVisible?: boolean;
  /** Custom cell formatter */
  formatter?: (value: unknown, row: T) => React.ReactNode;
}

export interface TableProps<T = Record<string, unknown>> {
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Local data array (takes priority over url) */
  data?: T[];
  /** Remote data URL */
  url?: string;
  /** Field to use as unique row key (default: 'id') */
  rowKey?: keyof T & string;
  /** Additional CSS class name(s) */
  className?: string;
  /** Whether the search bar is shown */
  isSearchable?: boolean;
  /** Whether row selection checkboxes are shown */
  isSelectable?: boolean;
  /** Which column paths to include in search (default: all string/number columns) */
  searchableFields?: string[];
  /** Number of rows per page (default: show all) */
  pageSize?: number;
  /** Callback when selection changes */
  onSelectionChange?: (selectedRows: T[]) => void;
  /** Callback when sort changes */
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  /** External loading control */
  loading?: boolean;
  /** Message shown when data is empty */
  emptyMessage?: string | React.ReactNode;
  /** Message shown on fetch error */
  errorMessage?: string | React.ReactNode;
  /** Whether to use sticky header */
  stickyHeader?: boolean;
  /** Whether to use striped rows */
  striped?: boolean;
  /** Whether to show borders */
  bordered?: boolean;
  /** Whether to enable row virtualization (renders only visible rows + 10 buffer rows) */
  virtualized?: boolean;
}

export interface SortState {
  key: string;
  direction: 'asc' | 'desc' | 'none';
}

export interface InternalColumn<T = Record<string, unknown>> extends ColumnDef<T> {
  isVisible: boolean;
}
