import React from 'react';
import Table from './lib/components/Table';

function App() {
  const queryParams = (params) => {
    return [...params, (params['key'] = 'value')];
  };

  return (
    <React.Fragment>
      <h1>React Light Table Example</h1>

      <Table
        tableClassName="table-class kedar-table"
        tableBorder="1"
        columns={[
          {
            key: 'key-name',
            sortable: true,
            path: 'name',
            label: 'Name',
            className: 'name-class',
            formatter(value) {
              return value.toUpperCase();
            },
          },
          {
            key: 'key-username',
            sortable: true,
            path: 'username',
            label: 'username',
            className: 'username-class',
            formatter(value) {
              return value.toUpperCase();
            },
          },
          {
            key: 'key-email',
            sortable: false,
            path: 'email',
            label: 'Email',
            className: 'email-class',
          },
          {
            key: 'key-phone',
            sortable: false,
            path: 'phone',
            label: 'Phone',
            className: 'phone-class phone',
          },
          {
            key: 'key-address',
            sortable: false,
            path: 'website',
            label: 'Website',
            className: 'website-class',
          },
        ]}
        isSearchable={true}
        pageSize={25}
        pageList={[25, 50]}
        queryParams={queryParams}
        url={'https://jsonplaceholder.typicode.com/users'}
      />
    </React.Fragment>
  );
}

export default App;
