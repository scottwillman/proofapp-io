"use strict";

var _Node = _interopRequireDefault(require("./Node.js"));

var _Edge = _interopRequireDefault(require("./Edge.js"));

var _Graph = _interopRequireDefault(require("./Graph.js"));

var _Application = _interopRequireDefault(require("./Application.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// Live Code
!function () {
  var graph = new _Graph["default"]();
  var node = new _Node["default"](opts);
  graph.addNode(node);
}();