let PropsPanel = {};

PropsPanel.updateLabelPosition = function(selectEl) {
	var newPos = selectEl.value;
	var nodeId = d3.select("#properties-node-id").attr('value');
	Nodes[nodeId].label.location = newPos;
	Graph.update();
}

PropsPanel.showProperties = function(nodeId) {
	var propsContainer = d3.select("#properties-container");
	var ngContainer = document.getElementById("nodegraph");

	if (!Graph.State.get('propsContainerSeen')) {
		var xpos = ngContainer.getBoundingClientRect().width - 470; // 460px width of props plus 10px margin
		var ypos = ngContainer.getBoundingClientRect().y;

		propsContainer
			.style('left', `${xpos}px`)
			.style('top', `${ypos}px`);

		propsContainer.datum({
				x: xpos,
				y: ypos,
			})

			.call(d3.drag()
					.on('start', PropsPanel.Drag.start)
					.on('drag',  PropsPanel.Drag.active)
					.on('end',   PropsPanel.Drag.end)
			);
	}

	propsContainer
		.style('display', 'block')
		.transition().style("opacity", 1);

	PropsPanel.__updateProperties(nodeId);
	Graph.State.set('propsContainerSeen', true);
}

PropsPanel.__updateProperties = function(nodeId) {
	var propsContainer = d3.select("#properties");
	propsContainer.select("#properties-node-id").property('value', nodeId);
	propsContainer.select("#properties-label").property('value', Nodes[nodeId].label.text);
	propsContainer.select("#properties-show-label").property('checked', (Nodes[nodeId].label.isVisible) ? 'checked':'');
	propsContainer.select("#properties-expression").property('value', Nodes[nodeId].value.expression);
	propsContainer.select("#properties-label").text(Nodes[nodeId].label.text);
	propsContainer.select("#properties-label-position").property('value', Nodes[nodeId].label.location);
	propsContainer.select("#properties-value-format").property('value', Nodes[nodeId].value.format);
	propsContainer.select("#properties-display-precision").property('value', Nodes[nodeId].value.displayPrecision);
	propsContainer.select("#properties-global-name").property('value', Nodes[nodeId].globalName);
	d3.selectAll(".expression-var").remove();

	var alpha_index = 0;
	Nodes[nodeId].inputs.forEach(function(id) {
		var char = ALPHABET[alpha_index].toLowerCase();
		d3.select('.expression-vars').append('span')
			.text(char)
			.classed(`expression-var expression-var-${char}`, true)
			.property('title', Nodes[id].value.result);
		alpha_index++;
	});
}

PropsPanel.hideProperties = function() {
	var propsContainer = d3.select("#properties-container");
	propsContainer.select("#properties-node-id").attr('value', null);
	propsContainer.transition().style("opacity", 0).on("end", function() {
		propsContainer.style('display', 'none');
	});
}

PropsPanel.setExpression = function(inputEl) {
	var newExpression = inputEl.value;
	var nodeId = d3.select("#properties-node-id").attr('value');
	Nodes[nodeId].value.expression = newExpression;
	Graph.update();
}

PropsPanel.updateDisplayPrecision = function(inputEl) {
	var newPrecision = inputEl.value;
	var nodeId = d3.select("#properties-node-id").attr('value');
	Nodes[nodeId].value.displayPrecision = newPrecision;
	Graph.update();
}

PropsPanel.updateValueFormat = function(inputEl) {
	var newFormat = inputEl.value;
	var nodeId = d3.select("#properties-node-id").attr('value');
	Nodes[nodeId].value.format = newFormat;
	if (newFormat === 'dollar') {
		Nodes[nodeId].value.displayPrecision = 2;
		PropsPanel.__updateProperties(nodeId);
	}
	Graph.update();
}

PropsPanel.updateLabelText = function(inputEl) {
	var newLabel = inputEl.value;
	var nodeId = d3.select("#properties-node-id").attr('value');
	Nodes[nodeId].label.text = newLabel;
	Graph.update();
}

PropsPanel.updateLabelVisibility = function(inputEl) {
	var nodeId = d3.select("#properties-node-id").attr('value');
	Nodes[nodeId].label.isVisible = d3.select(inputEl).property('checked');
	Graph.update();
}

PropsPanel.updateGlobalName = function(inputEl) {
	var newGlobalName = inputEl.value.trim();
	var nodeId = d3.select("#properties-node-id").attr('value');
	var previous_globalName = Nodes[nodeId].globalName;

	//// Global name validations

	// What to do if blank
	if (newGlobalName === '') {
		delete Globals[previous_globalName];
		Nodes[nodeId].globalName = newGlobalName;
		Graph.update();
		return;
	}

	// Must be longer than one char
	if (newGlobalName.length <= 1) {
		alert(`Global name needs to be longer than one character.`);
		d3.select(inputEl).property('value', previous_globalName);
		return;
	}

	// Cannot contain spaces or special characters
	if (/[^a-zA-Z0-9_]/.test(newGlobalName)) {
		alert(`Global name cannot contain spaces or special characters.`);
		d3.select(inputEl).property('value', previous_globalName);
		return;
	}

	// Must begin with a letter
	if (!/^[a-zA-Z]/.test(newGlobalName)) {
		alert(`Global name must start with a letter.`);
		d3.select(inputEl).property('value', previous_globalName);
		return;
	}

	// Cannot match reserved math words
	var reserved = ['mean','median','mult','sum'];
	if (reserved.indexOf(newGlobalName.toLowerCase()) !== -1) {
		alert(`Global name cannot be the same as a common math word.`);
		d3.select(inputEl).property('value', previous_globalName);
		return;
	}

	// Can't be already in use
	for (var name in Globals) {
		if (newGlobalName === name) {
			alert(`Global name "${newGlobalName}" already in use.`);
			d3.select(inputEl).property('value', '');
			return;
		}
	}

	delete Globals[previous_globalName];
	Nodes[nodeId].globalName = newGlobalName;
	Globals[newGlobalName] = null;
	Graph.update();

	// console.log(Globals);
}

PropsPanel.Drag = {};
PropsPanel.Drag.start = function() {}
PropsPanel.Drag.active = function(d) {
	d3.select(this)
		.style('left', (d.x = d3.event.x) + "px")
		.style('top',  (d.y = d3.event.y) + "px");
}
PropsPanel.Drag.end = function() {}
