// THIS IS ALL ON PAGE LOAD!!


const zoom = d3.zoom()
					.scaleExtent([0.25 ,5])
					.on("zoom", function() {
						root.attr('transform', d3.event.transform);
					});


var svg = d3.select("div#nodegraph")
					.append("svg")
						.attr("width", "100%")
						.attr("height", "100%")
						.on('click', Graph.setNodeInactive)
						.on('mousedown.drag', Graph.Selection.DragLasso.handler)
						.call(zoom);


var defs = svg.append("defs");

defs.append("marker")
		.attr("id", "arrow")
		.attr("viewBox", "0 0 6 6")
		.attr("refX", 3)
		.attr("refY", 3)
		.attr("markerWidth", 6)
		.attr("markerHeight", 6)
		.attr("orient", "auto-start-reverse")
		.append("svg:path")
			.attr("d", "M 0 0 L 6 3 L 0 6 z")
			.classed("arrow", true);

// defs.append("marker")
// 		.attr("id", "arrow-sel")
// 		.attr("viewBox", "0 0 6 6")
// 		.attr("refX", 3)
// 		.attr("refY", 3)
// 		.attr("markerWidth", 6)
// 		.attr("markerHeight", 6)
// 		.attr("orient", "auto-start-reverse")
// 		.append("svg:path")
// 			.attr("d", "M 0 0 L 6 3 L 0 6 z")
// 			.classed("arrow-sel", true);

defs.append("marker")
		.attr("id", "arrow-round")
		.attr("viewBox", "0 0 200 200")
		.attr("refX", 100)
		.attr("refY", 100)
		.attr("markerWidth", 5)
		.attr("markerHeight", 5)
		.attr("orient", "auto-start-reverse")
		.append("svg:path")
			.attr("d", "M 100, 100 m -75, 0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0")
			.classed("arrow", true);



var root = svg.append('g')
						.classed('nodegraph-root unselectable', true);

var center = Graph.Utils.findCenterOfCanvas();
var watermark = root.append('text')
						.attr('x', center.x)
						.attr('y', center.y)
						.text('P')
						.classed('watermark', true)

var edgeroot = root.append('g').attr("id", "edgeroot");
Graph.Edges.svgRoot = edgeroot;
var noderoot = root.append('g').attr("id", "noderoot");

Graph.State.set('draggingActive', false);
Graph.State.set('propsContainerSeen', false);
