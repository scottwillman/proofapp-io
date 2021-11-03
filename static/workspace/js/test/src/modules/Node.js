
// Node.js
/*
The function of a `Node`:
- Stores the individual data related to that node including:
	- expression
	- computed result
	- display result
*/
export default class Node {

	constructor(opts) {
		this.data = opts;
		this.compute();
	}

	select() {}

	__formatDisplayResult() {}

	_updateDisplayResults() {
		// do stuff
		this.__formatDisplayResults()
	}

	setExpression() {}

	compute() {
		// do stuff
		this._updateDisplayResults();
	}

}
