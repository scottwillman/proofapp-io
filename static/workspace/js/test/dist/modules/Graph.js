"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

// Graph.js

/*
The function of a `Graph`:
- Make and hold the nodes, edges, and their connections
- Provide functions to compute the graph
*/
var Graph =
/*#__PURE__*/
function () {
  function Graph(parent_el) {
    _classCallCheck(this, Graph);

    this.parent = parent_el;
    this.nodes = [];
  }

  _createClass(Graph, [{
    key: "sort",
    value: function sort() {}
  }, {
    key: "compute",
    value: function compute() {
      this.nodes.forEach(function (n, i) {
        return n.compute();
      });
    }
  }, {
    key: "addNode",
    value: function addNode(node) {
      this.nodes.push(node);
    }
  }, {
    key: "connectNodes",
    value: function connectNodes() {}
  }, {
    key: "draw",
    value: function draw() {}
  }]);

  return Graph;
}();

exports["default"] = Graph;