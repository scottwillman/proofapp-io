
// var Parser = require('expr-eval').Parser;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

let Graph = {};


let Nodes = {};
let Globals = {};

Graph.init = function() {

}

Graph.State = {
	__vals: {},
	set: function(attr, val, callback) {
		this.__vals[attr] = val;
		// console.log(this.__vals);
		if (callback) { return callback() }
	},
	get: function(attr) { return this.__vals[attr]; },
};


Graph.Prefs = {};
Graph.Prefs.defaults = {
	label: {
		text: 'Label',
		location: 'left',
		isVisible: true,
	},
	value: {
		minWidth: 80,
		boxPadding: 5, // px on either side
		format: 'number',
		displayPrecision: 0,
		expression: '0',
		// result: 0,
	}
};

Graph.__timer = null;

Graph.Utils = {};
Graph.Utils.findCenterOfCanvas = function() {
	var canvas_el = d3.select('#nodegraph').node().getBoundingClientRect();
	var z = d3.zoomTransform(svg.node());
	var w = canvas_el.width;
	var h = canvas_el.height;
	return {
		x: (z.x / z.k * -1) + (w / z.k * 0.5),
		y: (z.y / z.k * -1) + (h / z.k * 0.5)
	};
}

Graph.newNode = function() {
	// Find viewport center coords
	var pos = Graph.Utils.findCenterOfCanvas();

	Graph.__makeNode(Graph.Prefs.defaults, pos);
};

Graph.duplicateNode = function() {

	var selNode = Nodes[Graph.State.get('selectedNode')];
	if (!selNode) { return; }

	var pos = {
		x: selNode.x + 0,
		y: selNode.y + 24
	};

	Graph.__makeNode(selNode, pos);
};

Graph.__makeNode = function(vals, pos) {

	var uid = new ShortUniqueId();
	var nodeId = uid.randomUUID(12);

	Nodes[nodeId] = {
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

	Graph.update();
	// Graph.setNodeActive(nodeId);
}



Graph.__topologicalSort = function() {

	let visited = [];
	let ordered = [];


	function visit(id) {
		if (visited.includes(id)) { return; }

		visited.push(id);

		// 'inputs' are labeled IDs and an associative array, so we just want the values
		Nodes[id].inputs.forEach(function(i) {
			visit(i);
		});
		ordered.push(id);
		// console.log(id);
	}

	function sort() {

		// Give preferrential sorting to nodes with global exports
		Object.keys(Nodes).forEach(function(id) {
			if (Nodes[id].globalName !== '') { visit(id); }
		});

		// Continue sorting in no particular order
		Object.keys(Nodes).forEach(function(id) {
			visit(id);
		});
		return ordered;
	}

	return sort();

}

Graph.__compute = function() {

	var nodes = Graph.__topologicalSort();

	var formulaStrings = [];

	nodes.forEach(function(id, n) {

		var refs = {}; // refs are the letter variables in the expression
		var exp = Nodes[id].value.expression.trim();

		// for each input get the computed result to fill in the 'refs'
		Nodes[id].inputs.forEach(function(i, n) {
			var char = ALPHABET[n].toLowerCase();
			refs[char] = Nodes[i].value.result;
		});

		var vars = Object.assign({}, Globals, refs); // combine all globals and refs
		var valueCont = noderoot.select(`#n-${id}`).selectAll('.node-value-cont');

		// Basic validation (cannot be empty)
		if (exp.length === 0) {
			valueCont.classed('node-value-error', true);
			console.log("Expression Error: Expression field cannot be empty.")
			return;
		}

		try {
			// var n = math.parse(exp, vars);
			// Nodes[id].value.result = n.compile().eval();
			// console.log(n.toTex());
			formulaStrings.push(exp);
			Nodes[id].value.result = math.eval(exp, vars);
			valueCont.classed('node-value-error', false);
		} catch(err) {
			// console.log(err);
			valueCont.classed('node-value-error', true);
			return;
		}


		if (Nodes[id].globalName !== '') {
			Globals[Nodes[id].globalName] = Nodes[id].value.result;
		}
	});
}

// Graph.__buildFormulaString = function() {
//
// 	var selNodeId = Graph.State.get('selectedNode');
// 	if (selNodeId === '') { return; } // hack in case this is called at a time when no node is selectedNode
//
// 	var output = Nodes[selNodeId].value.expression;
//
// 	function getUpstreamNodes(nodeId) {
//
// 		Nodes[nodeId].inputs.forEach(function(i, n) {
//
// 			var char  = ALPHABET[n].toLowerCase();
// 			var upExp = Nodes[i].value.expression;
//
// 			const regex = new RegExp(`\\b[${char}]\\b`, 'gm');
// 			output = output.replace(regex, `(${upExp})`);
// 			// output = output.replace(char, `(${upExp})`);
//
// 			getUpstreamNodes(i);
// 		});
// 	}
//
// 	getUpstreamNodes(selNodeId);
//
// 	d3.select('#formula-result-bar')
// 					.style('display','block')
// 					.transition().style("opacity", 1)
// 					.select('#formula-result')
// 						.text(output);
// }
// Graph.__clearFormulaString = function() {
// 	var el = d3.select('#formula-result-bar');
//
// 	el.transition().style("opacity", 0).on("end", function() {
// 		el.style('display', 'none')
// 			.select('#formula-result')
// 				.text('');
// 	});
// }

Graph.__drawNodes = function() {

	// The final width of the formatted value is needed to draw and position the
	// value container and arrow connections. So, I'm pre-computing it and storing
	// in the d.value.boxWidth attr. Original .value.boxWidth
	// is adjusted.

	var charWidth = 9; // this should be computed (not assumed) or moved to preferences? Could change with font selection.

	// var displayResults = {};
	Object.keys(Nodes).forEach(function(id, n) {
		// Format the result
		var d = Nodes[id];

		function doFormat(val, format, precision) {
			var result = null;

			switch (format) {
				case "number":
					var rounded = math.round(val, precision);
					var result = rounded.toLocaleString('en-US', {
						minimumFractionDigits: precision,
						maximumFractionDigits: precision
					});
					return result;

				case "dollar":
					var rounded = math.round(val, precision);
					var result = rounded.toLocaleString('en-US', {
						minimumFractionDigits: precision,
						maximumFractionDigits: precision
					});
					return `$${result}`;

				case "percent":
					var result = math.round(val*100, precision);
					// var result = rounded * 100;
					result = result.toLocaleString('en-US', {
						minimumFractionDigits: precision,
						maximumFractionDigits: precision
					});
					return `${result}%`;

				case "boolean":
					if (val <= 0) {
						return 'NO';
					} else {
						return 'YES';
					}
			}
		}

		d.value.displayResult = [];
		if (math.typeof(d.value.result) === 'Matrix') {

			d.value.result.toArray().forEach(function(n) {
				var result = doFormat(n, d.value.format, d.value.displayPrecision);
				d.value.displayResult.push(result);
			});

		} else {
			try {
				var result = doFormat(d.value.result, d.value.format, d.value.displayPrecision);
				d.value.displayResult.push(result);
			} catch(err) {
				var result = 0;
				d.value.displayResult.push(result);
				// console.log(err);
			}
		}

		// Calculate the box boxWidth
		var charLength = 0;
		if (d.value.displayResult.length > 1) {
			// find the longest number string in the Matrix
			d.value.displayResult.forEach(function(n) {
				var n_length = n.toString().length;
				if (n_length > charLength) {
					charLength = n_length;
				}
			});
		} else {
			charLength = d.value.displayResult[0].length;
		}

		var resultWidth = charLength * charWidth;
		var defs = Graph.Prefs.defaults.value;
		Nodes[id].value.boxWidth = (resultWidth > defs.minWidth) ? resultWidth + defs.boxPadding : defs.minWidth + defs.boxPadding;
		Nodes[id].value.boxHeight = 24;
	});

	// Start drawing the nodes
	var nodes = noderoot.selectAll('.node').data(Object.values(Nodes))
					.join('g')
						.attr('id', function(d) { return `n-${d.id}`; })
						.attr('transform', function (d) { return `translate(${d.x}, ${d.y})`; })
						.classed('node', true)
						.on('mouseover', function(d) {
							if (!Graph._tempEdge) {
								d3.select(this).select(".node-label-text").lower(); // to handle label text on bottom
								d3.select(this).select(".node-connect-bttn").transition().style('opacity', 1);
							}
						})
						.on('click', function(d) {
							d3.event.stopImmediatePropagation();
							Graph.setNodeActive(d.id);
							// d3.select(this).raise(); // This seem to break the node-selected class (no idea why)
						})
						.on('mouseout', function(d) {
							// d3.select(this).select("[elementType=value-rect]").transition().attr('stroke', '#c4c4c4');
							d3.select(this).select(".node-connect-bttn").transition().style('opacity', 0);
						})
						.call(d3.drag()
								.on('start', Graph.Drag.start)
								.on('drag',  Graph.Drag.active)
								.on('end',   Graph.Drag.end)
						)
						.raise();

	var valueContainerGrp = nodes.selectAll('.node-value-group')
			.data(function(d) { return [d]; })
			.join('g')
				.classed('node-value-group', true);


	valueContainerGrp.selectAll('.node-value-cont')
			.data(function(d) {
					// create a new data array so `.data` sees this as seperate datums (i.e. creates seperate nodes)
					var results = [];

					d.value.displayResult.forEach(function(n, i) {
						var newD = objectCopy(d);
						newD.pos_y = d.value.boxHeight * i;
						newD.value.displayResult = n;
						results.push(newD);
					});

					return results;

				})
			.join('rect')
				.attr('x', 0)
				.attr('y', function(d) { return d.pos_y; })
				.attr("rx", 3)
			    .attr("ry", 3)
				.attr('width', function(d) { return d.value.boxWidth; })
				.attr('height', function(d) { return d.value.boxHeight; })
				.classed('node-value-cont', true)
				.classed('node-global', function(d) {
					return (d.globalName !== '');
				});


	valueContainerGrp.selectAll('.node-value-text')
			.data(function(d) {
					// create a new data array so `.data` sees this as seperate datums (i.e. creates seperate nodes)
					var results = [];

					d.value.displayResult.forEach(function(n, i) {
						var newD = objectCopy(d);
						newD.pos_y = d.value.boxHeight * i;
						newD.value.displayResult = n;
						results.push(newD);
					});

					return results;
				})
			.join('text')
				.attr('x', function(d) { return d.value.boxWidth - Graph.Prefs.defaults.value.boxPadding; }) // minus because it's right justified
				.attr('y', function(d) { return d.pos_y + 17; })
				.attr("text-anchor", "end")
				.classed("node-value-text unselectable", true)
				.text(function(d) { return d.value.displayResult; })
				.raise();


	// nodes.selectAll('.node-icon-global-export')
	// 		.data(function(d) { return (d.globalName !== '') ? [d] : []; })
	// 		.join('circle')
	// 			.attr('cx', 0)
	// 			.attr('cy', 0)
	// 			.attr('r', 4)
	// 			.classed('node-icon-global-export', true);

	nodes.selectAll('.node-icon-global-consume')
			.data(function(d) {
				var found = false;
				Object.keys(Globals).forEach(function(g) {
					if (d.value.expression.indexOf(g) !== -1) {
						found = true;
						return;
					}
				});
				return (found) ? [d] : [];
			})
			.join('circle')
				.attr('cx', 0)
				.attr('cy', 0)
				.attr('r', 3)
				.classed('node-icon-global-consume', true);

	// var tri = d3.symbol().type(d3.symbolTriangle);
	// nodes.selectAll('.node-icon-global-consume')
	// 		.data(function(d) {
	// 			var found = false;
	// 			Object.keys(Globals).forEach(function(g) {
	// 				if (d.value.expression.indexOf(g) !== -1) {
	// 					found = true;
	// 					return;
	// 				}
	// 			});
	// 			return (found) ? [d] : [];
	// 		})
	// 		.join('path')
	// 			.attr('d', tri)
	// 			.classed('node-icon-global-consume', true)
	// 			.attr('transform', function(d) {
	// 				return `translate(-8,0) rotate(90)`;
	// 			})
	// 			.raise();


	nodes.selectAll('.node-label-text')
			.data(function (d) { return (d.label.isVisible) ? [d] : []; })
			.join('text')
				.attr('x', function(d) {
					switch (d.label.location) {
						case 'right':
							return d.value.boxWidth + 5;
						case 'left':
							return -5;
						case 'top':
						case 'bottom':
							return d.value.boxWidth / 2;
					}
				})
				.attr('y', function(d) {
					switch (d.label.location) {
						case 'right':
						case 'left':
							return d.value.boxHeight - 7;
						case 'top':
							return - 7;
						case 'bottom':
							return d.value.boxHeight * d.value.displayResult.length + 15;
					}
				})
				.attr("text-anchor", function(d) {
					switch (d.label.location) {
						case 'top':
						case 'bottom':
							return 'middle';
						case 'left':
							return 'end';
						case 'right':
							return 'start';
					}
				})
				.classed("node-label-text unselectable", true)
				.text(function (d) { return d.label.text; })
				.lower();



	var connectBttnGrp = nodes.selectAll('.node-connect-bttn')
			.data(function(d) { return [d]; })
			.join('g')
				.attr("transform", function(d) { return `translate(0, ${d.value.boxHeight * d.value.displayResult.length})`; })
				.classed('node-connect-bttn', true)
				.lower()
				.on('mousedown', Graph.newEdgeStart);


	connectBttnGrp.selectAll('.node-connect-bttn-rect')
			.data(function (d) { return [d]; })
			.join('rect')
				.attr('rx', 5)
				.attr('ry', 5)
				.attr('x', 0)
				.attr('y', -5)
				.attr('width', function(d) { return d.value.boxWidth; })
				.attr('height', 22)
				.classed('node-connect-bttn-rect', true);

	connectBttnGrp.selectAll('.node-connect-bttn-text')
			.data(function (d) { return [d]; })
			.join('text')
				.attr('x', function(d) { return d.value.boxWidth / 2; })
				.attr('y', 13)
				.attr("text-anchor", "middle")
				.classed("node-connect-bttn-text unselectable", true)
				.text("CONNECT");

	// Empty this out to prevent leaks
	// displayResults = null;

	Graph.__drawEdges();

}

Graph.__drawEdges = function() {

	var edgeLocations = []; //transformEdgeData(Edges, Nodes);
	var srcNode  = null;
	var destNode = null;
	Object.values(Nodes).forEach(function(destNode) {
		destNode.inputs.forEach(function(sourceId) {
			srcNode = Nodes[sourceId];

			var s = { // source node
				tl: {x: srcNode.x, y: srcNode.y},
				tr: {
					x: srcNode.x + srcNode.value.boxWidth,
					y: srcNode.y
				},
				bl: {
					x: srcNode.x,
					y: srcNode.y + srcNode.value.boxHeight * srcNode.value.displayResult.length
				},
				br: {
					x: srcNode.x + srcNode.value.boxWidth,
					y: srcNode.y + srcNode.value.boxHeight * srcNode.value.displayResult.length
				}
			};

			var t = { // target node
				tl: {x: destNode.x, y: destNode.y},
				tr: {
					x: destNode.x + destNode.value.boxWidth,
					y: destNode.y
				},
				bl: {
					x: destNode.x,
					y: destNode.y + destNode.value.boxHeight * destNode.value.displayResult.length
				},
				br: {
					x: destNode.x + destNode.value.boxWidth,
					y: destNode.y + destNode.value.boxHeight * destNode.value.displayResult.length
				}
			};

			var locs = []; // store the possible orientations (may be multiple);
			if (s.bl.y < t.tl.y) { locs.push({orientation:'above', diff: t.tl.y - s.bl.y}); }
			if (s.tl.y > t.bl.y) { locs.push({orientation:'below', diff: s.tl.y - t.bl.y}); }
			if (s.tr.x < t.tl.x) { locs.push({orientation:'left', diff: t.tl.x - s.tr.x});  }
			if (s.tl.x > t.tr.x) { locs.push({orientation:'right', diff: s.tl.x - t.tr.x});  }

			// The below condition is met when the nodes overlap
			if (locs.length === 0) { locs.push({orientation:'above', diff: t.tl.y - s.bl.y}); }

			// when the condition matches multiple orientations (i.e. 'above' and 'right'), use
			// the diff to choose which wins.
			var orientation = null;
			if (locs.length > 1) {
				if (locs[0].diff > locs[1].diff) {
					orientation = locs[0].orientation;
				} else {
					orientation = locs[1].orientation;
				}
			} else {
				orientation = locs[0].orientation;
			}

			//  The +/- 5 below is to compensate for the arrowhead
			switch (orientation) {
				case 'left':
					edgeLocations.push({
						source: {
							x: srcNode.x + srcNode.value.boxWidth,
							y: srcNode.y + srcNode.value.boxHeight * srcNode.value.displayResult.length / 2,
							id: srcNode.id
						},
						target: {
							x: destNode.x - 5,
							y: destNode.y + destNode.value.boxHeight * destNode.value.displayResult.length / 2,
							id: destNode.id
						},
						orientation: 'left'
					});
					break;

				case 'right':
					edgeLocations.push({
						source: {
							x: srcNode.x,
							y: srcNode.y + srcNode.value.boxHeight * srcNode.value.displayResult.length / 2,
							id: srcNode.id
						},
						target: {
							x: destNode.x + destNode.value.boxWidth + 5,
							y: destNode.y + destNode.value.boxHeight * destNode.value.displayResult.length / 2,
							id: destNode.id
						},
						orientation: 'right'
					});
					break;

				case 'above':
					edgeLocations.push({
						source: {
							x: srcNode.x + srcNode.value.boxWidth / 2,
							y: srcNode.y + srcNode.value.boxHeight * srcNode.value.displayResult.length,
							id: srcNode.id
						},
						target: {
							x: destNode.x + destNode.value.boxWidth / 2,
							y: destNode.y - 5,
							id: destNode.id
						},
						orientation: 'top'
					});
					break;

				case 'below':
					edgeLocations.push({
						source: {
							x: srcNode.x + srcNode.value.boxWidth / 2,
							y: srcNode.y,
							id: srcNode.id
						},
						target: {
							x: destNode.x + destNode.value.boxWidth / 2,
							y: destNode.y + destNode.value.boxHeight * destNode.value.displayResult.length + 5,
							id: destNode.id
						},
						orientation: 'bottom'
					});
					break;

			}
		});
	});

	var vertLink = d3.linkVertical()
							.x(function (d) { return d.x; })
							.y(function (d) { return d.y; });

	var horizLink = d3.linkHorizontal()
							.x(function(d) { return d.x; })
							.y(function(d) { return d.y; });

	function getLink(d) {
		if ((d.orientation === 'top') || (d.orientation === 'bottom')) {
			return vertLink(d);
		} else {
			return horizLink(d);
		}
	}


	edgeroot.selectAll('.edge').data(edgeLocations)
		.join('path')
			.attr('d', getLink)
			.attr('id', function(d) { return `e-${d.source.id}-${d.target.id}`; })
			.attr("marker-end", "url(#arrow)")
			// .attr("marker-end", function(d) {
			// 	return (d.target.id === Graph.State.get('selectedNode')) ? "url(#arrow-sel)" : "url(#arrow)";
			// })
			.classed('edge', true)
			.on('click', function(d) {
				Graph.deleteEdge(this, d);
			});

};

Graph.deleteEdge = function(el, d) {
	var index = Nodes[d.target.id].inputs.indexOf(d.source.id);
	if (index !== -1) Nodes[d.target.id].inputs.splice(index, 1);
	d3.select(el).remove();
	Graph.update();
}

Graph.update = function() {
	Graph.__compute();
	Graph.__drawNodes(); // Graph.__drawEdges() is called at the end of Graph.__drawNodes().

	Doc.autoSaveChanges();

	// if (Graph.State.get('selectedNode')) {
	// 	Graph.__buildFormulaString();
	// }
}

Graph.setNodeActive = function(newId) {
	// Gather all edge classes
	var allEdgeClasses = [];
	for (var i = 0; i < ALPHABET.length; i++) {
		allEdgeClasses.push(`edge-${ALPHABET[i].toLowerCase()}`);
	}

	// Deselect all nodes and edges
	var curId = Graph.State.get('selectedNode');
	noderoot.selectAll(".node-value-cont").classed("node-selected", false);
	edgeroot.selectAll(".edge")
							.classed(allEdgeClasses.join(' '), false)
							.attr("marker-end", "url(#arrow)");


	Graph.State.set('selectedNode', newId);
	noderoot.select(`#n-${newId}`).selectAll(".node-value-cont").classed("node-selected", true);
	PropsPanel.showProperties(newId);

	var alpha_index = 0;
	Nodes[newId].inputs.forEach(function(id) {
		var alpha = ALPHABET[alpha_index].toLowerCase();
		edgeroot.select(`#e-${id}-${newId}`)
			.classed(`edge-${alpha}`, true);
			// .attr("marker-end", `url(#arrow-sel)`);
		alpha_index++;
	});

	noderoot.select(`#n-${newId}`).select(".node-label-text").lower(); // to handle label text on bottom
	// root.select(`[nodeId='${newId}']`).raise();

	// Graph.__buildFormulaString();
}

Graph.setNodeInactive = function() {
	d3.event.stopImmediatePropagation();

	var selNode = Graph.State.get('selectedNode');
	if (selNode) {
		Graph.State.set('selectedNode', null, function() {
			PropsPanel.hideProperties();
			noderoot.select(`#n-${selNode}`).selectAll(".node-value-cont").classed("node-selected", false);

			var alpha_index = 0;
			Nodes[selNode].inputs.forEach(function(inputNode) {
				edgeroot.select(`#e-${inputNode}-${selNode}`)
									.classed(`edge-${ALPHABET[alpha_index].toLowerCase()}`, false)
									.attr("marker-end", "url(#arrow)");
				alpha_index++;
			});
		});
	}

	// Graph.__clearFormulaString();
}

Graph.deleteSelectedNode = function() {
	var nodeId = Graph.State.get('selectedNode');
	if (nodeId) {
		var globalName = Nodes[nodeId].globalName;
		if (globalName) {
			delete Globals[globalName];
		}
		delete Nodes[nodeId];
		d3.select(`#n-${nodeId}`).remove();


		Object.keys(Nodes).forEach(function(id) {
			var index = Nodes[id].inputs.indexOf(nodeId);
			if (index !== -1) { Nodes[id].inputs.splice(index, 1); }
		});
	}
	Graph.State.set('selectedNode', null);
	Graph.update();
	PropsPanel.hideProperties();
}

Graph.resetNodegraphZoom = function(transition) {
	if (transition) {
		svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
	} else {
		svg.call(zoom.transform, d3.zoomIdentity);
	}
}


Graph.Edges = {

	__colorClasses: [],

	svgRoot: null,

	getColorClasses: function() {
		if (!this.__colorClasses) {
			for (var i = 0; i < ALPHABET.length; i++) {
				this.__colorClasses.push(`edge-${ALPHABET[i].toLowerCase()}`);
			}
		}
		return this.__colorClasses;
	},

	resetColors: function() {
		this.svgRoot.selectAll(".edge")
					.classed(this.__colorClasses.join(' '), false)
					.attr("marker-end", "url(#arrow)");
		return true;
	},
};
// Graph.Edges.__colorClasses = [];
// Graph.Edges.svgRoot = null;
// Graph.Edges.getColorClasses = function() {
// 	if (!Graph.Edges.__colorClasses) {
// 		for (var i = 0; i < ALPHABET.length; i++) {
// 			Graph.Edges.__colorClasses.push(`edge-${ALPHABET[i].toLowerCase()}`);
// 		}
// 	}
// 	return Graph.Edges.__colorClasses;
// }
// Graph.Edges.resetColors = function() {
// 	Graph.Edges.svgRoot.selectAll(".edge")
// 				.classed(Graph.Edges.__colorClasses.join(' '), false)
// 				.attr("marker-end", "url(#arrow)");
// 	return true;
// }


Graph.Drag = {};
Graph.Drag.start = function(d) {
	Graph.setNodeActive(d.id);
	Graph._tempEdge = null;
	Graph._tempEdgeData = null;
	Graph.State.set('draggingActive', true);
}
Graph.Drag.active = function(d) {
	// d3.event.stopImmediatePropagation();
	if (d3.select('#grid-snapping').property("checked")) {
		d.x = Math.ceil(d3.event.x/6)*6;
		d.y = Math.ceil(d3.event.y/6)*6;
	} else {
		d.x = d3.event.x;
		d.y = d3.event.y;
	}
	Graph.update();
}
Graph.Drag.end = function(d) {
	Graph.State.set('draggingActive', false);
}

Graph.Selection = {};
Graph.Selection.__selectedNodes = [];
Graph.Selection.setNodeSelected = function(nodeId) {
	Graph.Selection.__selectedNodes.push(nodeId);
	return Graph.Selection.__selectedNodes;
}
Graph.Selection.isNodeSelected = function(nodeId) {
	if (Graph.Selection.__selectedNodes.indexOf(nodeId) != -1) {
		return true;
	} else {
		return false;
	}
}
Graph.Selection.deselectAllNodes = function() {
	Graph.Selection.__selectedNodes = [];
	return true;
}
Graph.Selection.getSelectedNodes = function() {
	return Graph.Selection.__selectedNodes;
}

Graph.Selection.DragLasso = {};
Graph.Selection.DragLasso.__lasso = null;
Graph.Selection.DragLasso.drag = function(e) {
	var m = d3.mouse(this);

	var z = d3.zoomTransform(svg.node());
	var x = (z.x / z.k * -1) + (m[0] / z.k);
	var y = (z.y / z.k * -1) + (m[1] / z.k);

	Graph.Selection.DragLasso.__lasso
		.attr("width", Math.max(0,  x - +Graph.Selection.DragLasso.__lasso.attr("x")))
		.attr("height", Math.max(0, y - +Graph.Selection.DragLasso.__lasso.attr("y")));

	var lasso = {
		left:   parseInt(Graph.Selection.DragLasso.__lasso.attr('x')),
		right:  parseInt(Graph.Selection.DragLasso.__lasso.attr('x')) + parseInt(Graph.Selection.DragLasso.__lasso.attr('width')),
		top:    parseInt(Graph.Selection.DragLasso.__lasso.attr('y')),
		bottom: parseInt(Graph.Selection.DragLasso.__lasso.attr('y')) + parseInt(Graph.Selection.DragLasso.__lasso.attr('height')),
	};

	Graph.Selection.deselectAllNodes();
	Object.keys(Nodes).forEach(function(id) {
		var coords = {
			x: Nodes[id].x,
			y: Nodes[id].y,
		};

		if (lasso.left < coords.x && lasso.right > coords.x && lasso.top < coords.y && lasso.bottom > coords.y ) {
			Graph.Selection.setNodeSelected(id);
		}
	});
	// console.log(Graph.Selection.getSelectedNodes());
}
Graph.Selection.DragLasso.end = function() {
	svg.on('mousemove.drag', null).on('mouseup.drag', null);
	Graph.Selection.DragLasso.__lasso.remove();
	Graph.Selection.DragLasso.__lasso = null;
}
Graph.Selection.DragLasso.handler = function() {
	if (d3.event.shiftKey) {
		d3.event.stopImmediatePropagation();

		if (Graph.Selection.DragLasso.__lasso) {
			Graph.Selection.DragLasso.__lasso.remove();
			Graph.Selection.DragLasso.__lasso = null;
		}

		var m = d3.mouse(this);

		svg
			.on('mousemove.drag', Graph.Selection.DragLasso.drag)
			.on('mouseup.drag', Graph.Selection.DragLasso.end);

		var z = d3.zoomTransform(svg.node());
		var x = (z.x / z.k * -1) + (m[0] / z.k);
		var y = (z.y / z.k * -1) + (m[1] / z.k);

		Graph.Selection.DragLasso.__lasso = noderoot.append('rect')
													.attr("fill", 'red')
													.attr('x', x)
													.attr('y', y)
													.attr('width', 0)
													.attr('height', 0)
													.classed('selection-lasso', true);
	}
}

Graph._tempEdgeData = null;
Graph._tempEdge = null;

Graph.newEdgeStart = function() {
	// This was ACCIDENTALLY clever. The mouse down event registers this
	// function which then registers the mouseup event to the SVG.
	// Effecively, creating a DRAG situation.
	d3.event.stopImmediatePropagation();

	var lineFunction = d3.linkVertical()
							.x(function (d) { return d.x; })
							.y(function (d) { return d.y; });

	var node   = d3.select(this.parentNode);
	var offset = getTransformation(node.attr('transform'));

	var transform = {
		x: offset.translateX + node.datum().value.boxWidth / 2,
		y: offset.translateY + node.datum().value.boxHeight * node.datum().value.displayResult.length / 2,
	}

	Graph._tempEdgeData = {
		source: {x: transform.x, y: transform.y, id: node.datum().id},
		target: {x: transform.x, y: transform.y, id: null},
	};

	Graph._tempEdge = edgeroot.append("path")
		.attr('elementType', 'tempEdge-path')
		.classed('edge', true)
		.attr('d', lineFunction(Graph._tempEdgeData))
		.attr("marker-end", "url(#arrow-round)")
		.lower();

	// temporarily subscribe to the mouseup event on all nodes to see if it gets the connection.
	// Much easier than a hit test.
	noderoot.selectAll(".node").on('mouseup', Graph.connectNodes);

	function newEdgeActive() {
		var m = d3.mouse(noderoot.node());
		if (isNaN(m[0])) {
			// Do nothing
		} else {
			try {
				Graph._tempEdgeData.target = {
					x: m[0],
					y: m[1]
				};
			} catch (e) {
				// something went wront, ABORT
				// this should be the same as the newEdgeEnd function
				Graph._tempEdge.remove();
				Graph._tempEdge = null;
				Graph._tempEdgeData = null;
				svg.on("mousemove", null).on("mouseup", null);
				noderoot.selectAll(".node").on('mouseup', null); // Remove the mouseup event for all nodes.
				console.log(e);
			}

		}

		Graph._tempEdge.attr('d', lineFunction(Graph._tempEdgeData));
	}
	function newEdgeEnd() {
		Graph._tempEdge.remove();
		Graph._tempEdge = null;
		Graph._tempEdgeData = null;
		svg.on("mousemove", null).on("mouseup", null);
		noderoot.selectAll(".node").on('mouseup', null); // Remove the mouseup event for all nodes.
	}

	svg.on("mousemove", newEdgeActive).on("mouseup", newEdgeEnd);
}

Graph.connectNodes = function() {
	// console.log(this);
	var targetNode = d3.select(this);

	var source_id = Graph._tempEdgeData.source.id;
	var target_id = targetNode.datum().id

	if (target_id === source_id) { return; } // ignore if dropped on source node
	if (Nodes[target_id].inputs.includes(source_id)) { return; } // ignore connection already exists

	// TODO: Check the graph to prevent a cycle

	var offset = getTransformation(targetNode.attr('transform'));
	var rect = targetNode.select('.node-value-cont');

	var transform = {
		x: offset.translateX + rect.attr('width') / 2,
		y: offset.translateY + rect.attr('height') / 2,
	}
	Graph._tempEdgeData.target = {
		x: transform.x,
		y: transform.y,
		id: target_id,
	};

	svg.on("mousemove", null).on("mouseup", null);
	Nodes[target_id].inputs.push(source_id);

	Graph._tempEdge.remove();
	Graph._tempEdge = null;
	Graph._tempEdgeData = null;
	Graph.update();
	Graph.setNodeActive(target_id);
}














// d3.select('body').on('keydown', function() {
//
// 	switch (d3.event.keyCode) {
// 		case 8: // delete
// 			// d3.event.preventDefault();
// 			// Graph.deleteSelectedNode();
// 			break;
// 		case 78: // N key
// 			d3.event.preventDefault();
// 			makeNode();
// 			break;
// 		// default:
// 			// console.log(d3.event.keyCode);
// 	}
// });
