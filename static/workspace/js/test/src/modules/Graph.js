
findCenterOfViewport(element) {
	var canvas_el = d3.select(element).node().getBoundingClientRect();
	var z = d3.zoomTransform(svg.node());
	var w = canvas_el.width;
	var h = canvas_el.height;
	return {
		x: (z.x / z.k * -1) + (w / z.k * 0.5),
		y: (z.y / z.k * -1) + (h / z.k * 0.5)
	};
}

/*
The function of a `Graph`:
- Make and hold the nodes, edges, and their connections
- Provide functions to compute the graph
*/
export default class Graph {

	constructor(parent_el) {

		this.parent  = parent_el;

		this.nodes   = {};
		this.globals = {};
	}

	sort() {}

	compute() {
		Object.keys(this.nodes).forEach((key, i) => this.nodes[key].compute());
	}

	_makeNode(vals, pos) {

		var uid = new ShortUniqueId();
		var nodeId = uid.randomUUID(12);

		this.nodes[nodeId] = {
			id: nodeId,
			x: pos.x,
			y: pos.y,
			label: {
				text: vals.label.text,
				location: vals.label.location,
				isVisible: vals.label.isVisible,
			},
			value: {
				expression: vals.value.expression,
				result: 0,
				displayPrecision: vals.value.displayPrecision,
				format: vals.value.format,
				displayResult: []
			},
			inputs: [],
			globalName: '',
		};

		// Graph.update();
		// Graph.setNodeActive(nodeId);
	}
	newNode() {
		// Find viewport center coords
		var pos = findCenterOfViewport();

		this._makeNode(Graph.Prefs.defaults, pos);
	}
	duplicateNode() {

		var selNode = Nodes[Graph.State.get('selectedNode')];
		if (!selNode) { return; }

		var pos = {
			x: selNode.x + 0,
			y: selNode.y + 24
		};

		this._makeNode(selNode, pos);
	}

	connectNodes() {}

	draw() {

	}
}
