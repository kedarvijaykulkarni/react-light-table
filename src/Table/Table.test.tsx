import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Table from './Table';
import type { ColumnDef } from './Table.types';

// ─── Test Data ───

interface TestItem {
  id: number;
  name: string;
  age: number;
  email: string;
  city: string | null;
}

const TEST_COLUMNS: ColumnDef<TestItem>[] = [
  { key: 'col-name', path: 'name', label: 'Name', sortable: true },
  { key: 'col-age', path: 'age', label: 'Age', sortable: true },
  { key: 'col-email', path: 'email', label: 'Email', sortable: true },
  { key: 'col-city', path: 'city', label: 'City', sortable: true },
];

const TEST_DATA: TestItem[] = [
  { id: 1, name: 'Alice', age: 30, email: 'alice@test.com', city: 'New York' },
  { id: 2, name: 'Bob', age: 25, email: 'bob@test.com', city: 'London' },
  { id: 3, name: 'Charlie', age: 35, email: 'charlie@test.com', city: null },
  { id: 4, name: 'Diana', age: 28, email: 'diana@test.com', city: 'Paris' },
  { id: 5, name: 'Eve', age: 22, email: 'eve@test.com', city: 'Tokyo' },
];

const LARGE_DATA: TestItem[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  age: 20 + (i % 40),
  email: `user${i + 1}@test.com`,
  city: ['New York', 'London', 'Paris', 'Tokyo', 'Berlin'][i % 5],
}));

// ─── Helpers ───

function renderTable(props: Partial<React.ComponentProps<typeof Table<TestItem>>> = {}) {
  return render(
    <Table<TestItem>
      columns={TEST_COLUMNS}
      data={TEST_DATA}
      rowKey="id"
      {...props}
    />
  );
}

// ─── Mock fetch ───

function mockFetch(data: unknown, options?: { ok?: boolean; status?: number }): void {
  const { ok = true, status = 200 } = options ?? {};
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? 'OK' : 'Internal Server Error',
    json: () => Promise.resolve(data),
  });
}

function mockFetchError(errorMessage: string): void {
  global.fetch = vi.fn().mockRejectedValue(new Error(errorMessage));
}

// ─── Tests ───

describe('Table Component', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ════════════════════════════════
  // RENDERING
  // ════════════════════════════════

  describe('Rendering', () => {
    it('renders table with local data', () => {
      renderTable();
      expect(screen.getByRole('grid')).toBeInTheDocument();
      // Check all row data is rendered
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    it('renders correct number of columns and rows', () => {
      renderTable();
      const grid = screen.getByRole('grid');
      const rows = within(grid).getAllByRole('row');
      // 1 header row + 5 data rows
      expect(rows).toHaveLength(6);
      // 4 column headers
      const headers = within(rows[0]).getAllByRole('columnheader');
      expect(headers).toHaveLength(4);
    });

    it('renders table from URL (mock fetch)', async () => {
      const remoteData = [
        { id: 10, name: 'Remote User', age: 40, email: 'remote@test.com', city: 'Mars' },
      ];
      mockFetch(remoteData);

      render(
        <Table<TestItem>
          columns={TEST_COLUMNS}
          url="https://api.example.com/users"
          rowKey="id"
        />
      );

      // Initially shows loading
      expect(screen.getByText('Loading…')).toBeInTheDocument();

      // After fetch resolves
      await waitFor(() => {
        expect(screen.getByText('Remote User')).toBeInTheDocument();
      });
    });

    it('renders loading state', () => {
      renderTable({ loading: true, data: undefined });
      expect(screen.getByText('Loading…')).toBeInTheDocument();
    });

    it('renders error state on fetch failure', async () => {
      mockFetchError('Network error');

      render(
        <Table<TestItem>
          columns={TEST_COLUMNS}
          url="https://api.example.com/fail"
          rowKey="id"
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('renders empty state with emptyMessage', () => {
      renderTable({ data: [], emptyMessage: 'Nothing here!' });
      expect(screen.getByText('Nothing here!')).toBeInTheDocument();
    });

    it('renders custom empty message as ReactNode', () => {
      renderTable({
        data: [],
        emptyMessage: <span data-testid="custom-empty">Custom Empty</span>,
      });
      expect(screen.getByTestId('custom-empty')).toBeInTheDocument();
    });
  });

  // ════════════════════════════════
  // SORTING
  // ════════════════════════════════

  describe('Sorting', () => {
    it('sorts string column ascending', async () => {
      const user = userEvent.setup();
      renderTable();

      const sortBtn = screen.getByLabelText('Sort by Name');
      await user.click(sortBtn);

      const grid = screen.getByRole('grid');
      const rows = within(grid).getAllByRole('row');
      // First data row should be Alice (A comes first)
      expect(within(rows[1]).getByText('Alice')).toBeInTheDocument();
    });

    it('sorts string column descending on second click', async () => {
      const user = userEvent.setup();
      renderTable();

      const sortBtn = screen.getByLabelText('Sort by Name');
      await user.click(sortBtn); // asc
      await user.click(sortBtn); // desc

      const grid = screen.getByRole('grid');
      const rows = within(grid).getAllByRole('row');
      // First data row should be Eve (E comes last in alpha, first in desc)
      expect(within(rows[1]).getByText('Eve')).toBeInTheDocument();
    });

    it('sorts numeric column ascending', async () => {
      const user = userEvent.setup();
      renderTable();

      const sortBtn = screen.getByLabelText('Sort by Age');
      await user.click(sortBtn);

      const grid = screen.getByRole('grid');
      const rows = within(grid).getAllByRole('row');
      // Youngest first: Eve (22)
      expect(within(rows[1]).getByText('22')).toBeInTheDocument();
    });

    it('sorts numeric column descending', async () => {
      const user = userEvent.setup();
      renderTable();

      const sortBtn = screen.getByLabelText('Sort by Age');
      await user.click(sortBtn); // asc
      await user.click(sortBtn); // desc

      const grid = screen.getByRole('grid');
      const rows = within(grid).getAllByRole('row');
      // Oldest first: Charlie (35)
      expect(within(rows[1]).getByText('35')).toBeInTheDocument();
    });

    it('handles null/undefined values in sort without crashing', async () => {
      const user = userEvent.setup();
      renderTable();

      // City column has a null value (Charlie)
      const sortBtn = screen.getByLabelText('Sort by City');
      await user.click(sortBtn); // asc — should not throw

      // Null values should be pushed to end
      const grid = screen.getByRole('grid');
      const rows = within(grid).getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1);
    });

    it('fires onSort callback', async () => {
      const onSort = vi.fn();
      const user = userEvent.setup();
      renderTable({ onSort });

      const sortBtn = screen.getByLabelText('Sort by Name');
      await user.click(sortBtn);

      expect(onSort).toHaveBeenCalledWith('name', 'asc');
    });
  });

  // ════════════════════════════════
  // SEARCHING
  // ════════════════════════════════

  describe('Searching', () => {
    it('filters rows matching search text', async () => {
      const user = userEvent.setup();
      renderTable({ isSearchable: true });

      const input = screen.getByLabelText('Search table data');
      await user.type(input, 'Alice');

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    });

    it('search is case-insensitive', async () => {
      const user = userEvent.setup();
      renderTable({ isSearchable: true });

      const input = screen.getByLabelText('Search table data');
      await user.type(input, 'BOB');

      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    });

    it('clears filter when search is emptied', async () => {
      const user = userEvent.setup();
      renderTable({ isSearchable: true });

      const input = screen.getByLabelText('Search table data');
      await user.type(input, 'Alice');
      expect(screen.queryByText('Bob')).not.toBeInTheDocument();

      await user.clear(input);
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('searches only string/number fields', async () => {
      const user = userEvent.setup();
      renderTable({ isSearchable: true });

      const input = screen.getByLabelText('Search table data');
      // Search for an age (number)
      await user.type(input, '25');

      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  // ════════════════════════════════
  // SELECTION
  // ════════════════════════════════

  describe('Selection', () => {
    it('selects individual row', async () => {
      const user = userEvent.setup();
      renderTable({ isSelectable: true });

      const checkbox = screen.getByLabelText('Select row 1');
      await user.click(checkbox);

      expect(checkbox).toBeChecked();
    });

    it('deselects individual row', async () => {
      const user = userEvent.setup();
      renderTable({ isSelectable: true });

      const checkbox = screen.getByLabelText('Select row 1');
      await user.click(checkbox); // select
      await user.click(checkbox); // deselect

      expect(checkbox).not.toBeChecked();
    });

    it('select-all selects all visible rows', async () => {
      const user = userEvent.setup();
      renderTable({ isSelectable: true });

      const selectAll = screen.getByLabelText('Select all rows');
      await user.click(selectAll);

      // All row checkboxes should be checked
      TEST_DATA.forEach((item) => {
        const checkbox = screen.getByLabelText(`Select row ${item.id}`);
        expect(checkbox).toBeChecked();
      });
    });

    it('deselect-all deselects all rows', async () => {
      const user = userEvent.setup();
      renderTable({ isSelectable: true });

      const selectAll = screen.getByLabelText('Select all rows');
      await user.click(selectAll); // select all
      await user.click(selectAll); // deselect all

      TEST_DATA.forEach((item) => {
        const checkbox = screen.getByLabelText(`Select row ${item.id}`);
        expect(checkbox).not.toBeChecked();
      });
    });

    it('fires onSelectionChange callback', async () => {
      const onSelectionChange = vi.fn();
      const user = userEvent.setup();
      renderTable({ isSelectable: true, onSelectionChange });

      const checkbox = screen.getByLabelText('Select row 1');
      await user.click(checkbox);

      expect(onSelectionChange).toHaveBeenCalled();
      const lastCall = onSelectionChange.mock.calls[onSelectionChange.mock.calls.length - 1];
      expect(lastCall[0]).toHaveLength(1);
      expect(lastCall[0][0].name).toBe('Alice');
    });
  });

  // ════════════════════════════════
  // COLUMN VISIBILITY
  // ════════════════════════════════

  describe('Column Visibility', () => {
    it('hides column when toggled off', async () => {
      const user = userEvent.setup();
      renderTable({ isSearchable: true });

      // Open column controller menu
      const menuBtn = screen.getByLabelText('Toggle column visibility');
      await user.click(menuBtn);

      // Toggle off the Name column
      const nameToggle = screen.getByLabelText('Name');
      await user.click(nameToggle);

      // Name column header should not be visible in table headers
      const grid = screen.getByRole('grid');
      const headers = within(grid).getAllByRole('columnheader');
      const headerTexts = headers.map((h) => h.textContent);
      expect(headerTexts.join('')).not.toContain('NameSort by Name');
    });

    it('shows column when toggled back on', async () => {
      const user = userEvent.setup();
      renderTable({ isSearchable: true });

      const menuBtn = screen.getByLabelText('Toggle column visibility');
      await user.click(menuBtn);

      const nameToggle = screen.getByLabelText('Name');
      await user.click(nameToggle); // hide
      await user.click(nameToggle); // show

      // Name should be back
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('menu opens and closes', async () => {
      const user = userEvent.setup();
      renderTable({ isSearchable: true });

      const menuBtn = screen.getByLabelText('Toggle column visibility');

      // Initially hidden
      expect(menuBtn).toHaveAttribute('aria-expanded', 'false');

      await user.click(menuBtn);
      expect(menuBtn).toHaveAttribute('aria-expanded', 'true');

      await user.click(menuBtn);
      expect(menuBtn).toHaveAttribute('aria-expanded', 'false');
    });
  });

  // ════════════════════════════════
  // PAGINATION
  // ════════════════════════════════

  describe('Pagination', () => {
    it('shows correct page of data', () => {
      renderTable({ data: LARGE_DATA, pageSize: 10 });

      // Should show "Showing 1–10 of 50 results"
      expect(screen.getByText(/Showing 1–10 of 50 results/)).toBeInTheDocument();
    });

    it('navigates between pages', async () => {
      const user = userEvent.setup();
      renderTable({ data: LARGE_DATA, pageSize: 10 });

      // Go to page 2
      const page2Btn = screen.getByLabelText('Page 2');
      await user.click(page2Btn);

      expect(screen.getByText(/Showing 11–20 of 50 results/)).toBeInTheDocument();
    });

    it('navigates with prev/next buttons', async () => {
      const user = userEvent.setup();
      renderTable({ data: LARGE_DATA, pageSize: 10 });

      const nextBtn = screen.getByLabelText('Next page');
      await user.click(nextBtn);
      expect(screen.getByText(/Showing 11–20 of 50 results/)).toBeInTheDocument();

      const prevBtn = screen.getByLabelText('Previous page');
      await user.click(prevBtn);
      expect(screen.getByText(/Showing 1–10 of 50 results/)).toBeInTheDocument();
    });

    it('disables prev button on first page', () => {
      renderTable({ data: LARGE_DATA, pageSize: 10 });
      const prevBtn = screen.getByLabelText('Previous page');
      expect(prevBtn).toBeDisabled();
    });

    it('fires onPageChange callback', async () => {
      const onPageChange = vi.fn();
      const user = userEvent.setup();
      renderTable({ data: LARGE_DATA, pageSize: 10, onPageChange });

      const page2Btn = screen.getByLabelText('Page 2');
      await user.click(page2Btn);

      expect(onPageChange).toHaveBeenCalledWith(2);
    });
  });

  // ════════════════════════════════
  // ACCESSIBILITY
  // ════════════════════════════════

  describe('Accessibility', () => {
    it('has correct ARIA roles', () => {
      renderTable({ isSelectable: true });
      expect(screen.getByRole('grid')).toBeInTheDocument();
      expect(screen.getAllByRole('row').length).toBeGreaterThan(0);
      expect(screen.getAllByRole('columnheader').length).toBeGreaterThan(0);
      expect(screen.getAllByRole('gridcell').length).toBeGreaterThan(0);
    });

    it('sort buttons have aria-sort', () => {
      renderTable();
      const sortBtns = screen.getAllByRole('button', { name: /Sort by/i });
      sortBtns.forEach((btn) => {
        expect(btn).toHaveAttribute('aria-sort', 'none');
      });
    });

    it('search input has proper aria-label', () => {
      renderTable({ isSearchable: true });
      expect(screen.getByLabelText('Search table data')).toBeInTheDocument();
    });

    it('select-all checkbox has aria-label', () => {
      renderTable({ isSelectable: true });
      expect(screen.getByLabelText('Select all rows')).toBeInTheDocument();
    });

    it('row checkboxes have aria-label', () => {
      renderTable({ isSelectable: true });
      TEST_DATA.forEach((item) => {
        expect(screen.getByLabelText(`Select row ${item.id}`)).toBeInTheDocument();
      });
    });
  });

  // ════════════════════════════════
  // EDGE CASES
  // ════════════════════════════════

  describe('Edge Cases', () => {
    it('handles data with no id field using custom rowKey', () => {
      interface CustomItem {
        code: string;
        label: string;
      }
      const customColumns: ColumnDef<CustomItem>[] = [
        { key: 'col-code', path: 'code', label: 'Code', sortable: false },
        { key: 'col-label', path: 'label', label: 'Label', sortable: false },
      ];
      const customData: CustomItem[] = [
        { code: 'A1', label: 'First' },
        { code: 'B2', label: 'Second' },
      ];

      render(
        <Table<CustomItem>
          columns={customColumns}
          data={customData}
          rowKey="code"
        />
      );

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });

    it('renders formatter with row data', () => {
      const formatterColumns: ColumnDef<TestItem>[] = [
        {
          key: 'col-name',
          path: 'name',
          label: 'Name',
          sortable: false,
          formatter: (value: unknown, row: TestItem) =>
            `${String(value)} (${row.age})`,
        },
      ];

      render(
        <Table<TestItem>
          columns={formatterColumns}
          data={[TEST_DATA[0]]}
          rowKey="id"
        />
      );

      expect(screen.getByText('Alice (30)')).toBeInTheDocument();
    });

    it('does not mutate columns prop', () => {
      const originalColumns = TEST_COLUMNS.map((c) => ({ ...c }));
      renderTable();
      // Columns should be unchanged
      expect(TEST_COLUMNS).toEqual(originalColumns);
    });
  });
});
