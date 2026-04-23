import React, { useState } from 'react';
import { Table } from '../src/Table';
import type { ColumnDef } from '../src/Table/Table.types';

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

const columns: ColumnDef<User>[] = [
  {
    key: 'key-name',
    sortable: true,
    path: 'name',
    label: 'Name',
    className: 'name-class',
    formatter: (value: unknown) => String(value ?? '').toUpperCase(),
  },
  {
    key: 'key-username',
    sortable: true,
    path: 'username',
    label: 'Username',
    className: 'username-class',
  },
  {
    key: 'key-email',
    sortable: true,
    path: 'email',
    label: 'Email',
    className: 'email-class',
  },
  {
    key: 'key-phone',
    sortable: false,
    path: 'phone',
    label: 'Phone',
    className: 'phone-class',
  },
  {
    key: 'key-website',
    sortable: false,
    path: 'website',
    label: 'Website',
    className: 'website-class',
  },
];

function App(): React.JSX.Element {
  const [selectedRows, setSelectedRows] = useState<User[]>([]);
  const [mode, setMode] = useState<'local' | 'remote'>('local');

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px' }}>
      <h1>React Light Table — Demo</h1>

      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => setMode('local')}
          style={{
            padding: '8px 16px', marginRight: 8, cursor: 'pointer',
            background: mode === 'local' ? '#4a90d9' : '#fff',
            color: mode === 'local' ? '#fff' : '#333',
            border: '1px solid #ccc', borderRadius: 4,
          }}
        >
          Local Data
        </button>
        <button
          onClick={() => setMode('remote')}
          style={{
            padding: '8px 16px', cursor: 'pointer',
            background: mode === 'remote' ? '#4a90d9' : '#fff',
            color: mode === 'remote' ? '#fff' : '#333',
            border: '1px solid #ccc', borderRadius: 4,
          }}
        >
          Remote Data (URL)
        </button>
      </div>

      <Table<User>
        columns={columns}
        data={mode === 'local' ? LOCAL_DATA : undefined}
        url={mode === 'remote' ? 'https://jsonplaceholder.typicode.com/users' : undefined}
        rowKey="id"
        isSearchable={true}
        isSelectable={true}
        pageSize={3}
        striped={true}
        bordered={true}
        onSelectionChange={setSelectedRows}
        onSort={(col, dir) => {
          // Sort callback - for demo purposes
        }}
      />

      {selectedRows.length > 0 && (
        <div style={{ marginTop: 16, padding: 12, background: '#e3f2fd', borderRadius: 4 }}>
          <strong>Selected ({selectedRows.length}):</strong>{' '}
          {selectedRows.map((r) => r.name).join(', ')}
        </div>
      )}
    </div>
  );
}

export default App;
