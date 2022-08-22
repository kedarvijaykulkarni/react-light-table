"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("core-js/modules/web.dom-collections.iterator.js");

require("core-js/modules/es.array.sort.js");

require("core-js/modules/es.array.reverse.js");

require("core-js/modules/es.promise.js");

require("core-js/modules/es.regexp.exec.js");

require("core-js/modules/es.string.split.js");

require("core-js/modules/es.array.includes.js");

require("core-js/modules/es.string.includes.js");

var _react = _interopRequireDefault(require("react"));

require("./table.css");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const Table = _ref => {
  let {
    columns,
    url,
    cellPadding = 0,
    cellSpacing = 0,
    className = 'rst-table',
    tableBorder = 0,
    isSearchable = false,
    isSelectable = false
  } = _ref;
  // const [data, setData] = React.useState([]);
  // const [cashData, setCashData] = React.useState([]); // cashData is used to store the data which is fetched from the server and is used for searching
  // const [searchText, setSearchText] = React.useState('');
  // const [localColumns, setLocalColumns] = React.useState(columns);
  // const [showMenu, setShowMenu] = React.useState(false);
  // const [isAllSelected, setIsAllSelected] = React.useState(false);

  /*
   * this function is only used while build library
   */
  let data = [];
  let cashData = [];
  let searchText = '';
  let localColumns = columns;
  let showMenu = false;
  let isAllSelected = false;

  let setData = newData => {
    console.log('setData called', newData);
    data = newData;
  };

  let setCashData = newCashData => {
    cashData = newCashData;
  };

  let setSearchText = newSearchText => {
    searchText = newSearchText;
  };

  let setLocalColumns = newLocalColumns => {
    localColumns = newLocalColumns;
  };

  let setShowMenu = newShowMenu => {
    showMenu = newShowMenu;
  };

  let setIsAllSelected = newIsAllSelected => {
    isAllSelected = newIsAllSelected;
  };
  /**********************************/
  // set default visible columns


  for (let column of columns) {
    if ((column === null || column === void 0 ? void 0 : column.isVisible) === undefined) {
      column.isVisible = true;
    }

    if ((column === null || column === void 0 ? void 0 : column.isSelectable) === undefined) {
      column.isSelectable = isSelectable;
    }
  }

  console.log(columns);
  /**
   * sort columns
   * @param {string} column - column key
   * @param {boolean} isAsc - sort order
   */

  const sortable = column => {
    const isAsc = (column === null || column === void 0 ? void 0 : column.sortAsc) === true;

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
        return a[column.path].toUpperCase() === b[column.path].toUpperCase() ? 0 : a[column.path].toUpperCase() > b[column.path].toUpperCase() ? 1 : -1;
      }
    });
    setData(isAsc ? sortedData : sortedData.reverse());
  };
  /**
   * Table header with sortable action button or normal text
   * @param {string} column - column key
   */


  const sortableColumn = column => {
    if (column.sortable) {
      return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement("span", null, column.label), /*#__PURE__*/_react.default.createElement("button", {
        onClick: () => sortable(column),
        className: "rst-btn rst-sort-btn"
      }, /*#__PURE__*/_react.default.createElement("span", {
        className: "sort-icon"
      }, column.sortAsc === undefined && /*#__PURE__*/_react.default.createElement("img", {
        className: "rst-sort",
        alt: "sort",
        src: "./images/sort.png"
      }), column.sortAsc !== undefined && /*#__PURE__*/_react.default.createElement("img", {
        className: "rst-sort",
        alt: "sort",
        src: column.sortAsc ? './images/down.png' : './images/up.png'
      }))));
    } else {
      return /*#__PURE__*/_react.default.createElement("span", null, column.label);
    }
  };
  /**
   * Table column add/remove action button
   */


  const ColumnControler = () => {
    return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement("div", {
      className: "rst-column-controller"
    }, /*#__PURE__*/_react.default.createElement("button", {
      onClick: () => {
        setShowMenu(!showMenu);
      },
      className: "rst-btn rst-btn-column-controller"
    }, /*#__PURE__*/_react.default.createElement("img", {
      className: "rst-sort",
      alt: "sort",
      src: "./images/th.png"
    })), /*#__PURE__*/_react.default.createElement("ul", {
      className: "rst-controller-list ".concat(!showMenu ? 'hide' : '')
    }, localColumns.map((column, index) => {
      return /*#__PURE__*/_react.default.createElement("li", {
        key: "column-checkbox-".concat(index)
      }, /*#__PURE__*/_react.default.createElement("input", {
        type: "checkbox",
        id: "column-checkbox-".concat(index),
        name: column.label,
        checked: column.isVisible,
        value: column.label,
        onChange: () => {
          column.isVisible = !column.isVisible;
          setLocalColumns(columns);
          setData([...data]);
        }
      }), /*#__PURE__*/_react.default.createElement("label", {
        htmlFor: "column-checkbox-".concat(index)
      }, ' ', column.label));
    }))));
  };
  /**
   * Table row with data
   * @param {object} row - row data
   */


  const ListComponent = _ref2 => {
    let {
      data
    } = _ref2;
    return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, data.map(item => {
      return /*#__PURE__*/_react.default.createElement("tr", {
        key: item.id,
        className: "tr-".concat(item.id).concat(item.isSelected ? ' selected' : '')
      }, console.log('item :::', item), isSelectable && /*#__PURE__*/_react.default.createElement("td", {
        align: "center"
      }, /*#__PURE__*/_react.default.createElement("input", {
        type: "checkbox",
        id: "checkbox-".concat(item.id),
        name: item.id,
        checked: item.isSelected,
        value: item.id,
        onChange: () => {
          handleSelect(item.id);
        }
      }), /*#__PURE__*/_react.default.createElement("label", {
        htmlFor: "checkbox-".concat(item.id)
      }, " ")), localColumns.map(column => {
        if (column.isVisible) {
          return /*#__PURE__*/_react.default.createElement("td", {
            key: column.key,
            className: "td-".concat(getDefaultClassName(column.className), " ").concat(column.className)
          }, column.formatter ? column.formatter(item[column.path]) : item[column.path]);
        } else {
          return null;
        }
      }));
    }));
  }; // React.useEffect(() => {


  async function fetchData() {
    const response = await fetch(url);
    const json = await response.json(); // set selected rows props

    for (let item of json) {
      if ((item === null || item === void 0 ? void 0 : item.isSelected) === undefined) {
        item.isSelected = false;
      }
    }

    setData([...json]);
    setCashData([...json]);
  }

  fetchData(); // }, [url]);

  /**
   * Sometime multiple classnes are occuring, hence need to take first class name as default class name
   * @param {*} className
   * @returns single class name
   */

  const getDefaultClassName = className => {
    return className.indexOf(' ') ? className.split(' ')[0] : className;
  };
  /**
   * Search text change handler
   * @param {string} text - search text
   */


  const handleSearch = text => {
    setSearchText(text);
    const localData = [...cashData];
    let ids = [];

    for (let txt in localData) {
      for (let key in localData[txt]) {
        if (typeof localData[txt][key] === 'string' && localData[txt][key].toUpperCase().indexOf(text.toUpperCase()) > -1) {
          ids.push(localData[txt].id);
        }
      }
    } // remove duplicate ids


    ids = [...new Set(ids)]; // reset all selected rows

    setData(ids ? [...localData].filter(item => ids.includes(item.id)) : localData); // checkIsAllSelected();
  };

  const handleSelectAll = () => {
    const localData = [...data];

    for (let item of localData) {
      item.isSelected = !isAllSelected;
    }

    setData([...localData]);
    setIsAllSelected(!isAllSelected);
  };

  const handleSelect = id => {
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
    const selectedIds = localData.filter(item => item.isSelected);
    setIsAllSelected(selectedIds.length > 0 && selectedIds.length === localData.length);
  };

  return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, isSearchable && /*#__PURE__*/_react.default.createElement("div", {
    className: "rst-action-container"
  }, /*#__PURE__*/_react.default.createElement("input", {
    className: "rst-search-input",
    type: "text",
    placeholder: "Input Search",
    "aria-label": "Input username",
    value: searchText,
    onChange: e => {
      handleSearch(e.target.value);
    }
  }), /*#__PURE__*/_react.default.createElement(ColumnControler, null)), data.length > 0 && /*#__PURE__*/_react.default.createElement("table", {
    cellPadding: cellPadding,
    cellSpacing: cellSpacing,
    className: ['rst-table', className].join(' '),
    border: tableBorder
  }, localColumns && /*#__PURE__*/_react.default.createElement("thead", null, /*#__PURE__*/_react.default.createElement("tr", null, isSelectable && /*#__PURE__*/_react.default.createElement("th", {
    className: "rst-select-column"
  }, /*#__PURE__*/_react.default.createElement("input", {
    type: "checkbox",
    id: "select-all",
    name: "select-all",
    checked: isAllSelected,
    onChange: () => {
      handleSelectAll();
    }
  }), /*#__PURE__*/_react.default.createElement("label", {
    htmlFor: "select-all"
  }, "Select All")), localColumns.map(column => {
    if (column.isVisible) {
      return /*#__PURE__*/_react.default.createElement("th", {
        key: column.path || column.key,
        className: "th-".concat(getDefaultClassName(column.className), " ").concat(column.className)
      }, sortableColumn(column));
    } else {
      return null;
    }
  }))), /*#__PURE__*/_react.default.createElement("tbody", null, data && /*#__PURE__*/_react.default.createElement(ListComponent, {
    data: data
  }))));
};

var _default = Table;
exports.default = _default;