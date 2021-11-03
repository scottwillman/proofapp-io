
// Live Code

import Node from "./modules/Node.js";
import Edge from "./modules/Edge.js";
import Graph from "./modules/Graph.js";
import Doc from "./modules/Document.js";

import { node_defaults } from "./config.js";


!function() {

	var graph_el = document.getElementById('#graph-container');
	var graph = new Graph(graph_el);


	function makeNode() {
		var node = new Node(node_defaults);
		graph.addNode(node);
	}


	document.getElementById('new-node-button').addEventListener('click', graph.newNode);
}();
