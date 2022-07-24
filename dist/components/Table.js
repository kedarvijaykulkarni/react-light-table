"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("core-js/modules/es.promise.js");

require("core-js/modules/web.dom-collections.iterator.js");

var _react = _interopRequireDefault(require("react"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const Table = _ref => {
  let {
    columns,
    url,
    cellPadding = 0,
    cellSpacing = 0,
    tableClassName = "table",
    tableBorder = 0
  } = _ref;
  // const [data, setData] = React.useState([]);
  let data = []; // React.useEffect(() => {

  async function fetchData() {
    data = [];
    const response = await fetch(url);
    const json = await response.json();
    data = [...json];
  }

  fetchData(); // }, [url]);

  return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, data.length > 0 && /*#__PURE__*/_react.default.createElement("table", {
    cellPadding: cellPadding,
    cellSpacing: cellSpacing,
    className: tableClassName,
    border: tableBorder
  }, columns && /*#__PURE__*/_react.default.createElement("thead", null, /*#__PURE__*/_react.default.createElement("tr", null, columns.map(column => /*#__PURE__*/_react.default.createElement("th", {
    key: column.path || column.key
  }, column.label)))), /*#__PURE__*/_react.default.createElement("tbody", null, data.map(item => /*#__PURE__*/_react.default.createElement("tr", {
    key: item.id
  }, columns.map(column => /*#__PURE__*/_react.default.createElement("td", {
    key: item.id + (column.path || column.key)
  }, item[column.path || column.key])))))));
};

var _default = Table;
exports.default = _default;