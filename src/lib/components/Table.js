import React from 'react';
import './table.css';

const Table = ({
  columns,
  url,
  cellPadding = 0,
  cellSpacing = 0,
  className = 'rst-table',
  tableBorder = 0,
  isSearchable = false,
  isSelectable = false,
}) => {
  const [data, setData] = React.useState([]);
  const [cashData, setCashData] = React.useState([]); // cashData is used to store the data which is fetched from the server and is used for searching
  const [searchText, setSearchText] = React.useState('');
  const [localColumns, setLocalColumns] = React.useState(columns);
  const [showMenu, setShowMenu] = React.useState(false);
  const [isAllSelected, setIsAllSelected] = React.useState(false);

  /*
   * this function is only used while build library
   */

  // let data = [];
  // let cashData = [];
  // let searchText = '';
  // let localColumns = columns;
  // let showMenu = false;
  // let isAllSelected = false;

  // let setData = (newData) => {
  //   console.log('setData called', newData);
  //   data = newData;
  //   return data;
  // };
  // let setCashData = (newCashData) => {
  //   cashData = newCashData;
  // };
  // let setSearchText = (newSearchText) => {
  //   searchText = newSearchText;
  // };
  // let setLocalColumns = (newLocalColumns) => {
  //   localColumns = newLocalColumns;
  // };
  // let setShowMenu = (newShowMenu) => {
  //   showMenu = newShowMenu;
  // };
  // let setIsAllSelected = (newIsAllSelected) => {
  //   isAllSelected = newIsAllSelected;
  // };
  /**********************************/

  // set default visible columns
  for (let column of columns) {
    if (column?.isVisible === undefined) {
      column.isVisible = true;
    }
    if (column?.isSelectable === undefined) {
      column.isSelectable = isSelectable;
    }
  }

  console.log(columns);

  /**
   * sort columns
   * @param {string} column - column key
   * @param {boolean} isAsc - sort order
   */
  const sortable = (column) => {
    const isAsc = column?.sortAsc === true;

    if (isAsc) {
      column.sortAsc = false;
    } else {
      // first time sortAsc is undefined so set to true
      column.sortAsc = true;
    }

    const sortedData = [...data].sort((a, b) => {
      const isNumber = !isNaN(a[column.path]);
      if (isNumber) {
        return a[column.path] - b[column.path];
      } else {
        return a[column.path].toUpperCase() === b[column.path].toUpperCase()
          ? 0
          : a[column.path].toUpperCase() > b[column.path].toUpperCase()
          ? 1
          : -1;
      }
    });

    setData(isAsc ? sortedData : sortedData.reverse());
  };

  /**
   * Table header with sortable action button or normal text
   * @param {string} column - column key
   */
  const sortableColumn = (column) => {
    if (column.sortable) {
      return (
        <React.Fragment>
          <span>{column.label}</span>
          <button
            onClick={() => sortable(column)}
            className="rst-btn rst-sort-btn"
          >
            <span className="sort-icon">
              {column.sortAsc === undefined && (
                <img className="rst-sort" alt="sort" src="./images/sort.png" />
              )}

              {column.sortAsc !== undefined && (
                <img
                  className="rst-sort"
                  alt="sort"
                  src={column.sortAsc ? './images/down.png' : './images/up.png'}
                />
              )}
            </span>
          </button>
        </React.Fragment>
      );
    } else {
      return <span>{column.label}</span>;
    }
  };

  /**
   * Table column add/remove action button
   */
  const ColumnControler = () => {
    return (
      <React.Fragment>
        <div className="rst-column-controller">
          <button
            onClick={() => {
              setShowMenu(!showMenu);
            }}
            className="rst-btn rst-btn-column-controller"
          >
            <img className="rst-sort" alt="sort" src="./images/th.png" />
          </button>
          <ul className={`rst-controller-list ${!showMenu ? 'hide' : ''}`}>
            {localColumns.map((column, index) => {
              return (
                <li key={`column-checkbox-${index}`}>
                  <input
                    type="checkbox"
                    id={`column-checkbox-${index}`}
                    name={column.label}
                    checked={column.isVisible}
                    value={column.label}
                    onChange={() => {
                      column.isVisible = !column.isVisible;
                      setLocalColumns(columns);
                      setData([...data]);
                    }}
                  />
                  <label htmlFor={`column-checkbox-${index}`}>
                    {' '}
                    {column.label}
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      </React.Fragment>
    );
  };

  /**
   * Table row with data
   * @param {object} row - row data
   */
  const ListComponent = ({ data }) => {
    return (
      <React.Fragment>
        {data.map((item) => {
          return (
            <tr
              key={item.id}
              className={`tr-${item.id}${item.isSelected ? ' selected' : ''}`}
            >
              {console.log('item :::', item)}

              {isSelectable && (
                <td align="center">
                  <input
                    type="checkbox"
                    id={`checkbox-${item.id}`}
                    name={item.id}
                    checked={item.isSelected}
                    value={item.id}
                    onChange={() => {
                      handleSelect(item.id);
                    }}
                  />
                  <label htmlFor={`checkbox-${item.id}`}> </label>
                </td>
              )}

              {localColumns.map((column) => {
                if (column.isVisible) {
                  return (
                    <td
                      key={column.key}
                      className={`td-${getDefaultClassName(column.className)} ${
                        column.className
                      }`}
                    >
                      {column.formatter
                        ? column.formatter(item[column.path])
                        : item[column.path]}
                    </td>
                  );
                } else {
                  return null;
                }
              })}
            </tr>
          );
        })}
      </React.Fragment>
    );
  };

  React.useEffect(() => {
    async function fetchData() {
      const response = await fetch(url);
      const json = await response.json();

      // set selected rows props
      for (let item of json) {
        if (item?.isSelected === undefined) {
          item.isSelected = false;
        }
      }
      setData([...json]);
      setCashData([...json]);
    }
    fetchData();
  }, [url]);

  /**
   * Sometime multiple classnes are occuring, hence need to take first class name as default class name
   * @param {*} className
   * @returns single class name
   */
  const getDefaultClassName = (className) => {
    return className.indexOf(' ') ? className.split(' ')[0] : className;
  };

  /**
   * Search text change handler
   * @param {string} text - search text
   */
  const handleSearch = (text) => {
    setSearchText(text);
    const localData = [...cashData];
    let ids = [];
    for (let txt in localData) {
      for (let key in localData[txt]) {
        if (
          typeof localData[txt][key] === 'string' &&
          localData[txt][key].toUpperCase().indexOf(text.toUpperCase()) > -1
        ) {
          ids.push(localData[txt].id);
        }
      }
    }
    // remove duplicate ids
    ids = [...new Set(ids)];
    // reset all selected rows

    setData(
      ids ? [...localData].filter((item) => ids.includes(item.id)) : localData
    );
    // checkIsAllSelected();
  };

  const handleSelectAll = () => {
    const localData = [...data];
    for (let item of localData) {
      item.isSelected = !isAllSelected;
    }
    setData([...localData]);
    setIsAllSelected(!isAllSelected);
  };

  const handleSelect = (id) => {
    const localData = [...data];
    for (let item of localData) {
      if (item.id === id) {
        item.isSelected = !item.isSelected;
      }
    }
    checkIsAllSelected();

    setData([...localData]);
  };

  const checkIsAllSelected = () => {
    const localData = [...data];

    const selectedIds = localData.filter((item) => item.isSelected);
    setIsAllSelected(
      selectedIds.length > 0 && selectedIds.length === localData.length
    );
  };

  return (
    <>
      {isSearchable && (
        <div className="rst-action-container">
          <input
            className="rst-search-input"
            type="text"
            placeholder="Input Search"
            aria-label="Input username"
            value={searchText}
            onChange={(e) => {
              handleSearch(e.target.value);
            }}
          />

          <ColumnControler />
        </div>
      )}
      {console.log('data :::', data)}

      {data.length > 0 && (
        <table
          cellPadding={cellPadding}
          cellSpacing={cellSpacing}
          className={['rst-table', className].join(' ')}
          border={tableBorder}
        >
          {localColumns && (
            <thead>
              <tr>
                {isSelectable && (
                  <th className="rst-select-column">
                    <input
                      type="checkbox"
                      id="select-all"
                      name="select-all"
                      checked={isAllSelected}
                      onChange={() => {
                        handleSelectAll();
                      }}
                    />
                    <label htmlFor="select-all">Select All</label>
                  </th>
                )}
                {localColumns.map((column) => {
                  if (column.isVisible) {
                    return (
                      <th
                        key={column.path || column.key}
                        className={`th-${getDefaultClassName(
                          column.className
                        )} ${column.className}`}
                      >
                        {sortableColumn(column)}
                      </th>
                    );
                  } else {
                    return null;
                  }
                })}
              </tr>
            </thead>
          )}
          <tbody>{data && <ListComponent data={data} />}</tbody>
        </table>
      )}
    </>
  );
};

export default Table;
