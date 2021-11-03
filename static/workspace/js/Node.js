
export default class Node {

	constructor (nodeId, pos, parent) {
		this.id = nodeId;
		this.pos = {
			x: pos.x,
			y: pos.y,
		};
		this.label = {
			text: vals.label.text,
			location: vals.label.location,
			isVisible: vals.label.isVisible,
		};
		this.value = {
			expression: vals.value.expression,
			result: 0,
			displayPrecision: vals.value.displayPrecision,
			format: vals.value.format,
			displayResult: []
		};
		this.inputs = [];
		this.globalName = '';

		this.parent = parent;
		this.elementId = `#n-${this.id}`;
		this.isSelected = false;
	}

	select(doSelect) {
		this.parent.select(this.elementId).select(".node-value-cont").classed("node-selected", doSelect);
		this.isSelected = doSelect;
		this.errorMessage = "";
	}

	__formatDisplayResult() {

		var precision = this.value.displayPrecision;

		switch (this.value.format) {
			case "number":
				var rounded = math.round(this.value.result, precision);
				return rounded.toLocaleString('en-US', {
					minimumFractionDigits: precision,
					maximumFractionDigits: precision
				});

			case "dollar":
				var rounded = math.round(this.value.result, precision);
				var result = rounded.toLocaleString('en-US', {
					minimumFractionDigits: precision,
					maximumFractionDigits: precision
				});
				return `$${result}`;

			case "percent":
				var result = math.round(this.value.result*100, precision);
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

	_updateDisplayResults() {

		if (math.typeof(this.value.result) === 'Matrix') {

			this.value.result.toArray().forEach(function(n) {
				var result = this._formatDisplayResult();
				this.value.displayResult.push(result);
			});

		} else {
			try {
				var result = this._formatDisplayResult();
				this.value.displayResult.push(result);
			} catch(err) {
				var result = 0;
				this.value.displayResult.push(result);
				// console.log(err);
			}
		}

		// Calculate the box boxWidth
		var charLength = 0;
		if (this.value.displayResult.length > 1) {
			// find the longest number string in the Matrix
			this.value.displayResult.forEach(function(n) {
				var n_length = n.toString().length;
				if (n_length > charLength) {
					charLength = n_length;
				}
			});
		} else {
			charLength = this.value.displayResult[0].length;
		}

		var resultWidth = charLength * charWidth;
		var defs = Graph.Prefs.defaults.value;
		this.value.boxWidth = (resultWidth > defs.minWidth) ? resultWidth + defs.boxPadding : defs.minWidth + defs.boxPadding;
		this.value.boxHeight = 24;
	}

	setExpression(newExp) {
		this.value.expression = newExp;
	}

	compute(referenceValues={}, globals={}) {
		/*
		References are the "variable" letters being used in the expressions
		referenceValues={} is expecting {a: 33, b: 234.2}
		global={} is expecting {myVar1: 234, myVar2: .3234}
		*/
		var vars = Object.assign({}, globals, referenceValues); // combine all globals and refs

		try {
			this.value.result = math.eval(this.value.expression, vars);
			this.errorMessage = "";
		} catch(err) {
			this.errorMessage = err;
			return;
		}

		this._updateDisplayResults();
	}

	draw() {

	}
}
