"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

// Node.js

/*
The function of a `Node`:
- Stores the individual data related to that node including:
	- expression
	- computed result
	- display result
*/
var Node =
/*#__PURE__*/
function () {
  function Node(opts) {
    _classCallCheck(this, Node);

    this.data = opts;
    this.compute();
  }

  _createClass(Node, [{
    key: "select",
    value: function select() {}
  }, {
    key: "__formatDisplayResult",
    value: function __formatDisplayResult() {}
  }, {
    key: "_updateDisplayResults",
    value: function _updateDisplayResults() {
      // do stuff
      this.__formatDisplayResults();
    }
  }, {
    key: "setExpression",
    value: function setExpression() {}
  }, {
    key: "compute",
    value: function compute() {
      // do stuff
      this._updateDisplayResults();
    }
  }]);

  return Node;
}();

exports["default"] = Node;