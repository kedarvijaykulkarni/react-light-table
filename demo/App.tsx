import React, { useState } from 'react';
import { Table } from '../src/Table';
import type { ColumnDef, SortState } from '../src/Table/Table.types';

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  website: string;
  address: {
    street: string;
    suite: string;
    city: string;
    zipcode: string;
    geo: { lat: string; lng: string };
  };
  company: {
    name: string;
    catchPhrase: string;
    bs: string;
  };
}

// ─── Local data ───────────────────────────────────────────────────────────────

const LOCAL_DATA: User[] = [
  {
    id: 1, name: 'Alice Johnson', username: 'alicej', email: 'alice@example.com',
    phone: '555-0101', website: 'alice.dev',
    address: { street: '123 Main St', suite: 'Apt 1', city: 'Springfield', zipcode: '62701', geo: { lat: '39.7817', lng: '-89.6501' } },
    company: { name: 'TechCorp', catchPhrase: 'Innovative solutions', bs: 'enterprise tech' },
  },
  {
    id: 2, name: 'Bob Smith', username: 'bobs', email: 'bob@example.com',
    phone: '555-0102', website: 'bob.io',
    address: { street: '456 Oak Ave', suite: 'Suite 200', city: 'Portland', zipcode: '97201', geo: { lat: '45.5152', lng: '-122.6784' } },
    company: { name: 'DesignLab', catchPhrase: 'Beautiful by default', bs: 'design services' },
  },
  {
    id: 3, name: 'Carol White', username: 'carolw', email: 'carol@example.com',
    phone: '555-0103', website: 'carol.co',
    address: { street: '789 Pine Rd', suite: 'Floor 3', city: 'Austin', zipcode: '73301', geo: { lat: '30.2672', lng: '-97.7431' } },
    company: { name: 'DataFlow', catchPhrase: 'Data-driven growth', bs: 'analytics platform' },
  },
  {
    id: 4, name: 'David Brown', username: 'davidb', email: 'david@example.com',
    phone: '555-0104', website: 'david.org',
    address: { street: '321 Elm St', suite: 'Unit B', city: 'Denver', zipcode: '80201', geo: { lat: '39.7392', lng: '-104.9903' } },
    company: { name: 'CloudBase', catchPhrase: 'Scale effortlessly', bs: 'cloud infrastructure' },
  },
  {
    id: 5, name: 'Eve Davis', username: 'eved', email: 'eve@example.com',
    phone: '555-0105', website: 'eve.net',
    address: { street: '654 Maple Dr', suite: 'Apt 5C', city: 'Seattle', zipcode: '98101', geo: { lat: '47.6062', lng: '-122.3321' } },
    company: { name: 'AppWorks', catchPhrase: 'Apps that work', bs: 'mobile development' },
  },
];

// ─── Employee data (render prop + formatter demo) ─────────────────────────────

interface Employee {
  id: number;
  name: string;
  department: string;
  salary: number;
  status: string;
  joined: string;
}

const STATUS_LIST = ['active', 'inactive', 'pending', 'active', 'inactive'];
const EMPLOYEE_DATA: Employee[] = LOCAL_DATA.map((u, i) => ({
  id: u.id,
  name: u.name,
  department: u.company.name,
  salary: 60000 + i * 15000,
  status: STATUS_LIST[i],
  joined: `202${i}-0${i + 1}-15`,
}));

// ─── Product data (column pinning demo) ──────────────────────────────────────

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  brand: string;
  price: number;
  stock: number;
  warehouse: string;
  supplier: string;
  status: string;
}

const PRODUCT_DATA: Product[] = [
  { id: 1, name: 'Wireless Headphones Pro', sku: 'WHP-001', category: 'Electronics', brand: 'SoundMax', price: 149.99, stock: 342, warehouse: 'WH-East', supplier: 'AudioTech Ltd', status: 'In Stock' },
  { id: 2, name: 'Ergonomic Office Chair', sku: 'EOC-002', category: 'Furniture', brand: 'ErgoDesk', price: 399.00, stock: 58, warehouse: 'WH-West', supplier: 'FurniPro Inc', status: 'In Stock' },
  { id: 3, name: 'USB-C Hub 7-Port', sku: 'UCH-003', category: 'Accessories', brand: 'ConnectAll', price: 49.95, stock: 0, warehouse: 'WH-Central', supplier: 'TechHub Co', status: 'Out of Stock' },
  { id: 4, name: 'Mechanical Keyboard', sku: 'MKB-004', category: 'Peripherals', brand: 'TypeMaster', price: 129.00, stock: 215, warehouse: 'WH-East', supplier: 'KeyCraft LLC', status: 'In Stock' },
  { id: 5, name: 'Smart LED Desk Lamp', sku: 'SLD-005', category: 'Lighting', brand: 'BrightLife', price: 79.99, stock: 12, warehouse: 'WH-South', supplier: 'LightWave Ltd', status: 'Low Stock' },
  { id: 6, name: '4K Webcam Ultra', sku: 'WCM-006', category: 'Electronics', brand: 'VisioTech', price: 199.95, stock: 87, warehouse: 'WH-West', supplier: 'CamStar Corp', status: 'In Stock' },
  { id: 7, name: 'Standing Desk Converter', sku: 'SDC-007', category: 'Furniture', brand: 'ErgoDesk', price: 289.00, stock: 34, warehouse: 'WH-Central', supplier: 'FurniPro Inc', status: 'In Stock' },
];

// ─── Virtualization dataset (5 000 rows) ─────────────────────────────────────

const VIRTUAL_DATA: User[] = Array.from({ length: 5000 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  username: `user${i + 1}`,
  email: `user${i + 1}@example.com`,
  phone: `555-${String(i + 1).padStart(4, '0')}`,
  website: `user${i + 1}.dev`,
  address: { street: `${i + 1} Main St`, suite: '', city: 'Anytown', zipcode: '00000', geo: { lat: '0', lng: '0' } },
  company: { name: `Company ${i + 1}`, catchPhrase: '', bs: '' },
}));

// ─── Column definitions ───────────────────────────────────────────────────────

const basicColumns: ColumnDef<User>[] = [
  { key: 'key-name', sortable: true, path: 'name', label: 'Name' },
  { key: 'key-username', sortable: true, path: 'username', label: 'Username' },
  { key: 'key-email', sortable: true, path: 'email', label: 'Email' },
  { key: 'key-phone', sortable: false, path: 'phone', label: 'Phone' },
  { key: 'key-website', sortable: false, path: 'website', label: 'Website' },
];

// Employee columns — render prop for Status badge, formatter for Salary
const employeeColumns: ColumnDef<Employee>[] = [
  { key: 'emp-id', path: 'id', label: 'ID', sortable: true },
  { key: 'emp-name', path: 'name', label: 'Name', sortable: true },
  { key: 'emp-dept', path: 'department', label: 'Department', sortable: true },
  {
    key: 'emp-salary',
    path: 'salary',
    label: 'Salary',
    sortable: true,
    formatter: (value) => `$${Number(value).toLocaleString()}`,
  },
  {
    key: 'emp-status',
    path: 'status',
    label: 'Status',
    render: (value) => {
      const s = String(value);
      const style: Record<string, { bg: string; fg: string }> = {
        active: { bg: '#d4edda', fg: '#155724' },
        inactive: { bg: '#f8d7da', fg: '#721c24' },
        pending: { bg: '#fff3cd', fg: '#856404' },
      };
      const c = style[s] ?? { bg: '#e2e3e5', fg: '#383d41' };
      return (
        <span style={{
          padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
          backgroundColor: c.bg, color: c.fg, textTransform: 'capitalize',
        }}>
          {s}
        </span>
      );
    },
  },
  { key: 'emp-joined', path: 'joined', label: 'Joined', sortable: true },
];

// Product columns — ID + Name pinned left, Status pinned right
const productColumns: ColumnDef<Product>[] = [
  { key: 'prod-id', path: 'id', label: 'ID', sortable: true, pin: 'left' },
  { key: 'prod-name', path: 'name', label: 'Product Name', sortable: true, pin: 'left' },
  { key: 'prod-sku', path: 'sku', label: 'SKU' },
  { key: 'prod-cat', path: 'category', label: 'Category', sortable: true },
  { key: 'prod-brand', path: 'brand', label: 'Brand', sortable: true },
  {
    key: 'prod-price', path: 'price', label: 'Price', sortable: true,
    formatter: (v) => `$${Number(v).toFixed(2)}`,
  },
  { key: 'prod-stock', path: 'stock', label: 'Stock', sortable: true },
  { key: 'prod-warehouse', path: 'warehouse', label: 'Warehouse' },
  { key: 'prod-supplier', path: 'supplier', label: 'Supplier' },
  {
    key: 'prod-status',
    path: 'status',
    label: 'Status',
    pin: 'right',
    render: (value) => {
      const s = String(value);
      const fg: Record<string, string> = { 'In Stock': '#155724', 'Out of Stock': '#721c24', 'Low Stock': '#856404' };
      const bg: Record<string, string> = { 'In Stock': '#d4edda', 'Out of Stock': '#f8d7da', 'Low Stock': '#fff3cd' };
      return (
        <span style={{
          padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
          backgroundColor: bg[s] ?? '#e2e3e5', color: fg[s] ?? '#383d41', whiteSpace: 'nowrap',
        }}>
          {s}
        </span>
      );
    },
  },
];

// ─── Shared tab button ────────────────────────────────────────────────────────

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px', cursor: 'pointer',
        background: active ? '#4a90d9' : '#fff',
        color: active ? '#fff' : '#333',
        border: '1px solid #ccc', borderRadius: 4,
        fontWeight: active ? 600 : 400,
      }}
    >
      {label}
    </button>
  );
}

// ─── Demo sections ────────────────────────────────────────────────────────────

function LocalDemo() {
  const [selected, setSelected] = useState<User[]>([]);
  return (
    <>
      <p style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
        Local array with search, sort, pagination (3 rows/page), and row selection.
      </p>
      <Table<User>
        columns={basicColumns}
        data={LOCAL_DATA}
        rowKey="id"
        isSearchable
        isSelectable
        pageSize={3}
        striped
        bordered
        onSelectionChange={setSelected}
      />
      {selected.length > 0 && (
        <div style={{ marginTop: 12, padding: 10, background: '#e3f2fd', borderRadius: 4, fontSize: 13 }}>
          <strong>Selected ({selected.length}):</strong> {selected.map((r) => r.name).join(', ')}
        </div>
      )}
    </>
  );
}

function RemoteDemo() {
  return (
    <>
      <p style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
        Fetches data from <code>jsonplaceholder.typicode.com/users</code> on mount.
        Loading spinner and error handling are built-in.
      </p>
      <Table<User>
        columns={basicColumns}
        url="https://jsonplaceholder.typicode.com/users"
        rowKey="id"
        isSearchable
        striped
        bordered
        emptyMessage="No users found"
        errorMessage="Failed to load users"
      />
    </>
  );
}

function RenderPropDemo() {
  const [selected, setSelected] = useState<Employee[]>([]);
  return (
    <>
      <p style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
        The <code>render</code> prop returns full JSX per cell — used here for the{' '}
        <strong>Status</strong> badge. The <code>formatter</code> prop still works for simple
        string transforms (see <strong>Salary</strong>). <code>render</code> takes precedence when
        both are present.
      </p>
      <Table<Employee>
        columns={employeeColumns}
        data={EMPLOYEE_DATA}
        rowKey="id"
        isSearchable
        isSelectable
        pageSize={5}
        striped
        bordered
        onSelectionChange={setSelected}
      />
      {selected.length > 0 && (
        <div style={{ marginTop: 12, padding: 10, background: '#e3f2fd', borderRadius: 4, fontSize: 13 }}>
          <strong>Selected ({selected.length}):</strong> {selected.map((r) => r.name).join(', ')}
        </div>
      )}
    </>
  );
}

function PinnedColumnsDemo() {
  return (
    <>
      <p style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
        <strong>ID</strong> and <strong>Product Name</strong> are pinned left (<code>pin: &apos;left&apos;</code>);{' '}
        <strong>Status</strong> is pinned right (<code>pin: &apos;right&apos;</code>). Scroll
        horizontally — pinned columns stay fixed while middle columns scroll.
      </p>
      <Table<Product>
        columns={productColumns}
        data={PRODUCT_DATA}
        rowKey="id"
        isSearchable
        striped
        bordered
        stickyHeader
      />
    </>
  );
}

function VirtualizedDemo() {
  return (
    <>
      <p style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
        Rendering 5 000 rows with <code>virtualized</code> — only ~20 rows are in the DOM at any
        time. Scroll the table to see windowing in action. Container height is controlled by{' '}
        <code>--rlt-virtual-height</code> (400 px default).
      </p>
      <Table<User>
        columns={basicColumns}
        data={VIRTUAL_DATA}
        rowKey="id"
        isSearchable
        striped
        bordered
        virtualized
        stickyHeader
      />
    </>
  );
}

function ControlledDemo() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState>({ key: '', direction: 'none' });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<User[]>([]);

  return (
    <>
      <p style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
        All four state dimensions are owned by the parent. Useful for URL-synced tables,
        server-side data, or shared filter panels.
      </p>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12, alignItems: 'flex-start' }}>
        <div>
          <label style={{ fontSize: 12, display: 'block', marginBottom: 4, fontWeight: 600 }}>
            Search (controlled)
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type to filter…"
            style={{ padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 13, minWidth: 200 }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, display: 'block', marginBottom: 4, fontWeight: 600 }}>
            Sort state (read-only display)
          </label>
          <div style={{ fontSize: 13, padding: '7px 10px', border: '1px solid #e0e0e0', borderRadius: 4, background: '#f9f9f9', minWidth: 200 }}>
            {sort.direction === 'none'
              ? <span style={{ color: '#999' }}>none</span>
              : <><strong>{sort.key}</strong> {sort.direction === 'asc' ? '▲' : '▼'}</>}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, display: 'block', marginBottom: 4, fontWeight: 600 }}>
            Page (controlled)
          </label>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2].map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  padding: '6px 12px', cursor: 'pointer', borderRadius: 4,
                  border: '1px solid #ccc',
                  background: page === p ? '#4a90d9' : '#fff',
                  color: page === p ? '#fff' : '#333',
                }}
              >
                Page {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, display: 'block', marginBottom: 4, fontWeight: 600 }}>
            Selection (controlled)
          </label>
          <button
            onClick={() => setSelected([])}
            disabled={selected.length === 0}
            style={{
              padding: '6px 12px', cursor: selected.length > 0 ? 'pointer' : 'not-allowed',
              border: '1px solid #ccc', borderRadius: 4, background: '#fff',
              opacity: selected.length === 0 ? 0.5 : 1,
            }}
          >
            Clear selection ({selected.length})
          </button>
        </div>
      </div>

      <Table<User>
        columns={basicColumns}
        data={LOCAL_DATA}
        rowKey="id"
        isSelectable
        pageSize={3}
        striped
        bordered
        searchValue={search}
        onSearchChange={setSearch}
        sortState={sort}
        onSortChange={setSort}
        page={page}
        onPageChange={setPage}
        selectedRows={selected}
        onSelectionChange={setSelected}
      />

      {selected.length > 0 && (
        <div style={{ marginTop: 12, padding: 10, background: '#e3f2fd', borderRadius: 4, fontSize: 13 }}>
          <strong>Selected ({selected.length}):</strong> {selected.map((r) => r.name).join(', ')}
        </div>
      )}
    </>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

type TabId = 'local' | 'remote' | 'render' | 'pinned' | 'virtual' | 'controlled';

const TABS: { id: TabId; label: string }[] = [
  { id: 'local', label: 'Local Data' },
  { id: 'remote', label: 'Remote URL' },
  { id: 'render', label: 'render prop' },
  { id: 'pinned', label: 'Pinned Columns' },
  { id: 'virtual', label: 'Virtualized (5 000 rows)' },
  { id: 'controlled', label: 'Controlled Props' },
];

function App(): React.JSX.Element {
  const [tab, setTab] = useState<TabId>('local');

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px' }}>
      <h1 style={{ marginBottom: 4 }}>React Light Table — Demo</h1>
      <p style={{ color: '#666', fontSize: 13, marginTop: 0, marginBottom: 20 }}>
        @kedman1234/react-light-table · zero dependencies · TypeScript-first
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {TABS.map((t) => (
          <Tab key={t.id} label={t.label} active={tab === t.id} onClick={() => setTab(t.id)} />
        ))}
      </div>

      {tab === 'local' && <LocalDemo />}
      {tab === 'remote' && <RemoteDemo />}
      {tab === 'render' && <RenderPropDemo />}
      {tab === 'pinned' && <PinnedColumnsDemo />}
      {tab === 'virtual' && <VirtualizedDemo />}
      {tab === 'controlled' && <ControlledDemo />}
    </div>
  );
}

export default App;
