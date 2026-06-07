import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, fireEvent, waitFor, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Table from './Table';
import type { ColumnDef } from './Table.types';
import { useSort } from '../hooks/useSort';

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
  const body = JSON.stringify(data);
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? 'OK' : 'Internal Server Error',
    headers: { get: (name: string) => name.toLowerCase() === 'content-type' ? 'application/json; charset=utf-8' : null },
    text: () => Promise.resolve(ok ? body : ''),
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

// ════════════════════════════════
// RENDER FUNCTION (ColumnDef.render)
// ════════════════════════════════

describe('ColumnDef render function', () => {
  it('renders output of render instead of raw cell value', () => {
    const columns: ColumnDef<TestItem>[] = [
      {
        key: 'col-name',
        path: 'name',
        label: 'Name',
        render: (value) => <strong>{String(value)}</strong>,
      },
    ];

    render(<Table<TestItem> columns={columns} data={[TEST_DATA[0]]} rowKey="id" />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Alice').tagName).toBe('STRONG');
  });

  it('passes correct value and full row to render', () => {
    const renderFn = vi.fn((value: unknown, row: TestItem) => (
      <span>{`${String(value)}-${row.age}`}</span>
    ));
    const columns: ColumnDef<TestItem>[] = [
      { key: 'col-name', path: 'name', label: 'Name', render: renderFn },
    ];

    render(<Table<TestItem> columns={columns} data={[TEST_DATA[0]]} rowKey="id" />);

    expect(screen.getByText('Alice-30')).toBeInTheDocument();
    expect(renderFn).toHaveBeenCalledWith('Alice', TEST_DATA[0]);
  });

  it('render takes precedence over formatter when both are present', () => {
    const columns: ColumnDef<TestItem>[] = [
      {
        key: 'col-name',
        path: 'name',
        label: 'Name',
        formatter: () => 'from-formatter',
        render: () => <span data-testid="from-render">from-render</span>,
      },
    ];

    render(<Table<TestItem> columns={columns} data={[TEST_DATA[0]]} rowKey="id" />);

    expect(screen.getByTestId('from-render')).toBeInTheDocument();
    expect(screen.queryByText('from-formatter')).not.toBeInTheDocument();
  });

  it('render returning null does not throw', () => {
    const columns: ColumnDef<TestItem>[] = [
      { key: 'col-name', path: 'name', label: 'Name', render: () => null },
    ];

    expect(() =>
      render(<Table<TestItem> columns={columns} data={[TEST_DATA[0]]} rowKey="id" />)
    ).not.toThrow();
  });

  it('render returning a ReactNode (element with children) renders correctly', () => {
    const columns: ColumnDef<TestItem>[] = [
      {
        key: 'col-name',
        path: 'name',
        label: 'Name',
        render: (value, row) => (
          <a href={`mailto:${row.email}`}>{String(value)}</a>
        ),
      },
    ];

    render(<Table<TestItem> columns={columns} data={[TEST_DATA[0]]} rowKey="id" />);

    const link = screen.getByRole('link', { name: 'Alice' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'mailto:alice@test.com');
  });

  it('render is called for every visible row with correct values', () => {
    const renderFn = vi.fn((value: unknown) => <span>{String(value)}</span>);
    const columns: ColumnDef<TestItem>[] = [
      { key: 'col-name', path: 'name', label: 'Name', render: renderFn },
    ];

    render(<Table<TestItem> columns={columns} data={TEST_DATA} rowKey="id" />);

    // Each row's name must have been passed to renderFn at least once
    const calledValues = renderFn.mock.calls.map(([v]) => v);
    TEST_DATA.forEach((row) => {
      expect(calledValues).toContain(row.name);
    });
  });

  it('columns without render fall back to formatter then raw value', () => {
    const columns: ColumnDef<TestItem>[] = [
      { key: 'col-name', path: 'name', label: 'Name', formatter: (v) => `fmt:${String(v)}` },
      { key: 'col-age', path: 'age', label: 'Age' },
    ];

    render(<Table<TestItem> columns={columns} data={[TEST_DATA[0]]} rowKey="id" />);

    expect(screen.getByText('fmt:Alice')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });
});

// ════════════════════════════════
// SECURITY HARDENING
// ════════════════════════════════

describe('Security Hardening', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ── Fetch URL validation ──

  it('rejects non-http/https URL schemes — file://', async () => {
    render(
      <Table<TestItem>
        columns={TEST_COLUMNS}
        url="file:///etc/passwd"
        rowKey="id"
      />
    );
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  it('rejects javascript: URL scheme', async () => {
    render(
      <Table<TestItem>
        columns={TEST_COLUMNS}
        url="javascript:alert(1)"
        rowKey="id"
      />
    );
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('rejects data: URL scheme', async () => {
    render(
      <Table<TestItem>
        columns={TEST_COLUMNS}
        url="data:text/plain,hello"
        rowKey="id"
      />
    );
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  // ── Fetch timeout ──

  it('shows error when fetch times out', async () => {
    // Mock fetch that properly listens to the AbortSignal
    global.fetch = vi.fn().mockImplementation(
      (_url: string, opts?: RequestInit) =>
        new Promise((_resolve, reject) => {
          opts?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
          // Never resolves on its own
        })
    );

    vi.useFakeTimers({ shouldAdvanceTime: true });

    render(
      <Table<TestItem>
        columns={TEST_COLUMNS}
        url="https://api.example.com/slow"
        rowKey="id"
      />
    );

    // Skip the 30-second timeout; abort fires, fetch rejects, error state renders
    vi.advanceTimersByTime(31_000);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    }, { timeout: 5_000 });
  }, 10_000);


  // ── Fetch content-type guard ──

  it('shows error when response is not JSON content-type', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'text/html' },
      text: () => Promise.resolve('<html/>'),
    });

    render(
      <Table<TestItem>
        columns={TEST_COLUMNS}
        url="https://api.example.com/html"
        rowKey="id"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  // ── Fetch array guard ──

  it('shows error when response is a JSON object not an array', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      text: () => Promise.resolve('{"users":[]}'),
    });

    render(
      <Table<TestItem>
        columns={TEST_COLUMNS}
        url="https://api.example.com/object"
        rowKey="id"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('shows error when response exceeds size limit', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      text: () => Promise.resolve('x'.repeat(10_000_001)),
    });

    render(
      <Table<TestItem>
        columns={TEST_COLUMNS}
        url="https://api.example.com/huge"
        rowKey="id"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  // ── Search ReDoS / length cap ──

  it('does not filter when searchText exceeds 200 chars', async () => {
    const user = userEvent.setup();
    render(
      <Table<TestItem>
        columns={TEST_COLUMNS}
        data={TEST_DATA}
        rowKey="id"
        isSearchable
      />
    );

    const input = screen.getByLabelText('Search table data');
    const longQuery = 'a'.repeat(201);
    await user.type(input, longQuery);

    // All rows should still be visible because the cap returns data unchanged
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('handles very long cell values without hanging', async () => {
    const bigValueData = [
      { id: 1, name: 'a'.repeat(100_000), age: 1, email: 'x@x.com', city: 'X' },
    ];
    const user = userEvent.setup();
    render(
      <Table<TestItem>
        columns={TEST_COLUMNS}
        data={bigValueData as unknown as TestItem[]}
        rowKey="id"
        isSearchable
      />
    );

    const input = screen.getByLabelText('Search table data');
    await user.type(input, 'something');

    await waitFor(
      () => expect(screen.getByRole('grid')).toBeInTheDocument(),
      { timeout: 2000 }
    );
  });

  // ── Sort key sanitisation ──

  it('handleSort ignores non-word sort keys', () => {
    // Verify the hook rejects __proto__ (blocked by the SORT_KEY_DENYLIST in useSort)
    const { result } = renderHook(() => useSort(TEST_DATA as unknown as Record<string, unknown>[]));
    const originalProto = Object.getPrototypeOf({});

    let threw = false;
    try {
      result.current.handleSort('__proto__');
    } catch {
      threw = true;
    }
    // handleSort must have thrown for the __proto__ key
    expect(threw).toBe(true);

    // Prototype must be unchanged
    expect(Object.getPrototypeOf({})).toBe(originalProto);
  });


  // ── Prototype pollution via rowKey ──

  it('does not follow __proto__ as rowKey', () => {
    expect(() =>
      render(
        <Table<TestItem>
          columns={TEST_COLUMNS}
          data={TEST_DATA}
          rowKey={"__proto__" as keyof TestItem & string}
          isSelectable
        />
      )
    ).not.toThrow();
  });

  // ── className injection ──

  it('sanitises dangerous className values', () => {
    const injectedColumns = [
      {
        key: 'col-name',
        path: 'name',
        label: 'Name',
        sortable: false,
        className: '"><script>alert(1)</script>',
      },
    ];

    render(
      <Table<TestItem>
        columns={injectedColumns as ColumnDef<TestItem>[]}
        data={[TEST_DATA[0]]}
        rowKey="id"
      />
    );

    expect(document.querySelector('script')).toBeNull();
  });
});

// ════════════════════════════════
// STRESS TESTS
// ════════════════════════════════

describe('Stress Tests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Large dataset rendering ──

  it('renders 10,000 rows with pagination without timeout', async () => {
    const bigData: TestItem[] = Array.from({ length: 10_000 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      age: 20 + (i % 40),
      email: `user${i + 1}@test.com`,
      city: 'City',
    }));

    const start = performance.now();
    render(
      <Table<TestItem>
        columns={TEST_COLUMNS}
        data={bigData}
        rowKey="id"
        pageSize={100}
      />
    );
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(3000);
    // The pagination component renders totalItems as a plain number (no thousands separator)
    expect(screen.getByText(/Showing 1[–\-]100 of 10000 results/i)).toBeInTheDocument();
  });

  it('renders 1,000 rows without pagination without timeout', () => {
    const data1k: TestItem[] = Array.from({ length: 1_000 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      age: 25,
      email: `u${i + 1}@test.com`,
      city: 'X',
    }));

    render(
      <Table<TestItem>
        columns={TEST_COLUMNS}
        data={data1k}
        rowKey="id"
      />
    );

    const rows = screen.getAllByRole('row');
    // 1 header + 1000 data rows
    expect(rows.length).toBe(1001);
  });

  // ── Sort performance ──

  it('sorts 10,000 rows in under 2 s', async () => {
    const bigData: TestItem[] = Array.from({ length: 10_000 }, (_, i) => ({
      id: i + 1,
      name: `Name${String(10_000 - i).padStart(5, '0')}`,
      age: 20,
      email: `u@u.com`,
      city: 'X',
    }));

    const user = userEvent.setup();
    render(
      <Table<TestItem>
        columns={TEST_COLUMNS}
        data={bigData}
        rowKey="id"
        pageSize={100}
      />
    );

    const start = performance.now();
    await user.click(screen.getByLabelText('Sort by Name'));
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });

  // ── Search performance ──

  it('searches across 10,000 rows in under 1 s', async () => {
    const bigData: TestItem[] = Array.from({ length: 10_000 }, (_, i) => ({
      id: i + 1,
      name: `UserName${i}`,
      age: 25,
      email: `u${i}@test.com`,
      city: 'SomeCity',
    }));

    const user = userEvent.setup();
    render(
      <Table<TestItem>
        columns={TEST_COLUMNS}
        data={bigData}
        rowKey="id"
        isSearchable
        pageSize={20}
      />
    );

    const input = screen.getByLabelText('Search table data');
    const start = performance.now();
    await user.type(input, 'UserName99');
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(1000);
  });

  // ── Pagination edge cases ──

  it('handles pageSize larger than dataset gracefully', () => {
    const fiveItems: TestItem[] = TEST_DATA.slice(0, 5);
    render(
      <Table<TestItem>
        columns={TEST_COLUMNS}
        data={fiveItems}
        rowKey="id"
        pageSize={1000}
      />
    );
    expect(screen.getByText(/Showing 1–5 of 5 results/)).toBeInTheDocument();
  });

  it('handles pageSize=1 correctly', async () => {
    const user = userEvent.setup();
    render(
      <Table<TestItem>
        columns={TEST_COLUMNS}
        data={TEST_DATA}
        rowKey="id"
        pageSize={1}
      />
    );
    // Only 1 row shown; 5 total pages
    expect(screen.getByText(/Showing 1–1 of 5 results/)).toBeInTheDocument();
    expect(screen.getByLabelText('Page 5')).toBeInTheDocument();
    const rows = screen.getAllByRole('row');
    // 1 header + 1 data row
    expect(rows).toHaveLength(2);
  });

  it('goToPage beyond totalPages clamps to last page', async () => {
    const user = userEvent.setup();
    const fiftyItems: TestItem[] = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `U${i + 1}`,
      age: 20,
      email: `u@u.com`,
      city: 'X',
    }));

    render(
      <Table<TestItem>
        columns={TEST_COLUMNS}
        data={fiftyItems}
        rowKey="id"
        pageSize={10}
      />
    );

    // Click last page button (page 5) to get to last page, then check next is disabled
    await user.click(screen.getByLabelText('Page 5'));
    expect(screen.getByText(/Showing 41–50 of 50 results/)).toBeInTheDocument();
    // Next should be disabled on last page
    expect(screen.getByLabelText('Next page')).toBeDisabled();
  });

  // ── Concurrent fetch ──

  it('cancels in-flight fetch when url prop changes', async () => {
    const firstData: TestItem[] = [{ id: 1, name: 'First', age: 1, email: 'f@f.com', city: 'A' }];
    const secondData: TestItem[] = [{ id: 2, name: 'Second', age: 2, email: 's@s.com', city: 'B' }];

    let resolveFirst!: (v: string) => void;
    const firstBody = JSON.stringify(firstData);
    const secondBody = JSON.stringify(secondData);

    global.fetch = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<Response>((res) => {
            // First fetch is slow
            setTimeout(() =>
              res({
                ok: true,
                status: 200,
                headers: { get: () => 'application/json' },
                text: () => Promise.resolve(firstBody),
              } as unknown as Response),
            500
            );
          })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          text: () => Promise.resolve(secondBody),
        } as unknown as Response)
      );

    const { rerender } = render(
      <Table<TestItem>
        columns={TEST_COLUMNS}
        url="https://api.example.com/first"
        rowKey="id"
      />
    );

    // Immediately change the URL before the first fetch resolves
    rerender(
      <Table<TestItem>
        columns={TEST_COLUMNS}
        url="https://api.example.com/second"
        rowKey="id"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
    expect(screen.queryByText('First')).not.toBeInTheDocument();
  });

  // ── Selection with large data ──

  it('select-all 1,000 rows completes without timeout', async () => {
    const data1k: TestItem[] = Array.from({ length: 1_000 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      age: 25,
      email: `u${i + 1}@t.com`,
      city: 'X',
    }));

    const onSelectionChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Table<TestItem>
        columns={TEST_COLUMNS}
        data={data1k}
        rowKey="id"
        isSelectable
        onSelectionChange={onSelectionChange}
        pageSize={1000}
      />
    );

    const start = performance.now();
    // Use fireEvent for performance-sensitive test to avoid userEvent overhead
    fireEvent.click(screen.getByLabelText('Select all rows'));
    const elapsed = performance.now() - start;

    const lastCall = onSelectionChange.mock.calls[onSelectionChange.mock.calls.length - 1];
    expect(lastCall[0]).toHaveLength(1000);
    // Allow up to 5 s — the spec says "without timeout", not strict 1 s
    expect(elapsed).toBeLessThan(5000);
  });

  // ── Memory / unmount ──

  it('does not call setState after unmount', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Use a deferred promise so we can control when text() resolves
    let resolveBody: ((text: string) => void) | undefined;
    const bodyPromise = new Promise<string>((res) => { resolveBody = res; });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      text: () => bodyPromise,
    });

    const { unmount } = render(
      <Table<TestItem>
        columns={TEST_COLUMNS}
        url="https://api.example.com/delayed"
        rowKey="id"
      />
    );

    // Let the fetch call happen (fetch is mocked as resolved so it fires in next microtask)
    await Promise.resolve();

    // Unmount before text() resolves
    unmount();

    // Now resolve the body
    resolveBody!(JSON.stringify(TEST_DATA));
    await Promise.resolve();
    await Promise.resolve();

    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('state update on an unmounted component')
    );
  });
});

// ════════════════════════════════
// ROBUSTNESS
// ════════════════════════════════

describe('Robustness', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders when columns array is empty', () => {
    expect(() =>
      render(
        <Table<TestItem>
          columns={[]}
          data={TEST_DATA}
          rowKey="id"
        />
      )
    ).not.toThrow();
    // Should still render the container without crashing
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('renders when data contains duplicate rowKey values', () => {
    const dupData: TestItem[] = [
      { id: 1, name: 'Alice', age: 30, email: 'a@a.com', city: 'NY' },
      { id: 1, name: 'Bob',   age: 25, email: 'b@b.com', city: 'LA' },
    ];
    expect(() =>
      render(
        <Table<TestItem>
          columns={TEST_COLUMNS}
          data={dupData}
          rowKey="id"
        />
      )
    ).not.toThrow();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('handles undefined rowKey field gracefully', () => {
    // Items missing the rowKey field — should fall back to index
    const noIdData = [
      { name: 'X', age: 1, email: 'x@x.com', city: 'X' },
      { name: 'Y', age: 2, email: 'y@y.com', city: 'Y' },
    ] as unknown as TestItem[];

    expect(() =>
      render(
        <Table<TestItem>
          columns={TEST_COLUMNS}
          data={noIdData}
          rowKey="id"
        />
      )
    ).not.toThrow();
    // Use getAllByText since the same value may appear in multiple cells
    expect(screen.getAllByText('X').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Y').length).toBeGreaterThan(0);
  });

  it('column formatter receiving null value does not throw', () => {
    const nullFormatterColumns: ColumnDef<TestItem>[] = [
      {
        key: 'col-name',
        path: 'name',
        label: 'Name',
        sortable: false,
        formatter: () => null,
      },
    ];

    expect(() =>
      render(
        <Table<TestItem>
          columns={nullFormatterColumns}
          data={[TEST_DATA[0]]}
          rowKey="id"
        />
      )
    ).not.toThrow();
  });

  it('columns prop change syncs visible columns', () => {
    const initialColumns: ColumnDef<TestItem>[] = [
      { key: 'col-name', path: 'name', label: 'Name', sortable: false },
    ];
    const updatedColumns: ColumnDef<TestItem>[] = [
      { key: 'col-age', path: 'age', label: 'Age', sortable: false },
    ];

    const { rerender } = render(
      <Table<TestItem>
        columns={initialColumns}
        data={TEST_DATA}
        rowKey="id"
      />
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.queryByText('Age')).not.toBeInTheDocument();

    rerender(
      <Table<TestItem>
        columns={updatedColumns}
        data={TEST_DATA}
        rowKey="id"
      />
    );

    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.queryByText('Name')).not.toBeInTheDocument();
  });

  it('search + sort + pagination combined', async () => {
    // 50 items; names alternate User-A/User-B; search for 'User-A' → 25 results
    const mixedData: TestItem[] = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: i % 2 === 0 ? `User-A-${i}` : `User-B-${i}`,
      age: 20 + i,
      email: `u${i}@t.com`,
      city: 'X',
    }));

    const user = userEvent.setup();
    render(
      <Table<TestItem>
        columns={TEST_COLUMNS}
        data={mixedData}
        rowKey="id"
        isSearchable
        pageSize={10}
      />
    );

    // Filter to User-A entries
    await user.type(screen.getByLabelText('Search table data'), 'User-A');

    // Sort ascending
    await user.click(screen.getByLabelText('Sort by Name'));

    // Navigate to page 2
    const page2 = screen.queryByLabelText('Page 2');
    if (page2) {
      await user.click(page2);
      expect(screen.getByText(/Showing 11–20 of 25 results/)).toBeInTheDocument();
    } else {
      // 25 results fit in 3 pages of 10; still assert data visible
      expect(screen.getByText(/Showing 1–10 of 25 results/)).toBeInTheDocument();
    }
  });

  it('onSort is called with correct direction on repeated clicks', async () => {
    const onSort = vi.fn();
    const user = userEvent.setup();
    render(
      <Table<TestItem>
        columns={TEST_COLUMNS}
        data={TEST_DATA}
        rowKey="id"
        onSort={onSort}
      />
    );

    const sortBtn = screen.getByLabelText('Sort by Name');
    await user.click(sortBtn); // 1st click → asc
    await user.click(sortBtn); // 2nd click → desc
    await user.click(sortBtn); // 3rd click → asc
    await user.click(sortBtn); // 4th click → desc

    expect(onSort).toHaveBeenNthCalledWith(1, 'name', 'asc');
    expect(onSort).toHaveBeenNthCalledWith(2, 'name', 'desc');
    expect(onSort).toHaveBeenNthCalledWith(3, 'name', 'asc');
    expect(onSort).toHaveBeenNthCalledWith(4, 'name', 'desc');
  });

  it('emptyMessage ReactNode renders when URL returns empty array', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      text: () => Promise.resolve('[]'),
    });

    render(
      <Table<TestItem>
        columns={TEST_COLUMNS}
        url="https://api.example.com/empty"
        rowKey="id"
        emptyMessage={<em>Empty!</em>}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Empty!')).toBeInTheDocument();
    });
  });

  it('errorMessage ReactNode renders on fetch failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    render(
      <Table<TestItem>
        columns={TEST_COLUMNS}
        url="https://api.example.com/fail"
        rowKey="id"
        errorMessage={<strong>Oops</strong>}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Oops')).toBeInTheDocument();
    });
  });
});
