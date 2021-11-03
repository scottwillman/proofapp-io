var Doc = {};
Doc.ID = null;
Doc.CSRF = null;


Doc.init = function(isAuthenticated) {

	Doc.AUTH.set(isAuthenticated);

	// Initialize any functionality that IS NOT authentication specific
	document.getElementById('menu-file-new').addEventListener('click', Doc.newDocument);

	Doc.newDocument();

	// Get and load stored temp doc from localStorage
	var unauthorized_holderover_doc = localStorage.getItem('p_unauth_doc');
	if (unauthorized_holderover_doc) {
		Nodes = JSON.parse(unauthorized_holderover_doc);
		Graph.update();

		if (isAuthenticated) {
			// Remove the localStorage version because it can be stored
			// in the real database.
			localStorage.removeItem('p_unauth_doc');
		}
	}
}

Doc.AUTH = {};
Doc.AUTH.set = function(isAuthenticated) {
	Doc.AUTH.__state = isAuthenticated;

	// Initialize any functionality that IS authentication specific
	if (isAuthenticated) {
		// document.querySelector('.middle').style.display = 'none';
		document.getElementById('document-title').style.display = 'inline-block';
		// document.querySelector('.register-message a').removeEventListener('click', Doc.Register.show);

		document.getElementById('menu-file-open').addEventListener('click', Doc.Browser.open);
		document.getElementById('menu-file-open').classList.remove('disabled');

		document.getElementById('signed-in').style.display = 'inline-block';
		// document.getElementById('sign-in').style.display = 'none';

		// document.getElementById('register-form').removeEventListener('submit', Doc.Register.submit);

		// document.getElementById('username').innerHTML = Doc.AUTH.login;

	} else {
		document.querySelector('.middle').style.display = 'inline-block';
		document.getElementById('document-title').style.display = 'none';

		document.getElementById('menu-file-open').removeEventListener('click', Doc.Browser.open);
		document.getElementById('menu-file-open').classList.add('disabled');

		// document.getElementById('signed-in').style.display = 'none';
		document.getElementById('sign-in').style.display = 'inline-block';

		document.getElementById('register-form').addEventListener('submit', Doc.Register.submit);

		// document.getElementById('username').innerHTML = '';
	}
}
Doc.AUTH.get = function() {
	return Doc.AUTH.__state;
}

Doc.Hash = {};
Doc.Hash.__hash = null;
Doc.Hash.get = function() {
	return Doc.Hash.__hash;
}
Doc.Hash.make = function() {
	return objectHash.sha1(Nodes);
}
Doc.Hash.update = function() {
	Doc.Hash.__hash = Doc.Hash.make();
}

Doc.Title = {};
Doc.Title.__title = null;
Doc.Title.get = function() {
	return Doc.Title.__title;
}
Doc.Title.set = function(value) {
	Doc.Title.__title = value;

	// The DOM title input isn't available when a user is not logged in (can't save anything)
	if (!Doc.AUTH) { return; }

	document.getElementById("document-title").value = value;
}
Doc.Title.save = function() {
	document.getElementById('document-saved').style.opacity = 0;
	var title = document.getElementById("document-title").value;
	Doc.Title.set(title);
	document.getElementById("document-title").blur();

	var payload = {
		id: Doc.ID,
		title: title,
	}

	d3.json('save-title', {
		method: 'post',
		body: JSON.stringify(payload),
		headers: {
			"Content-type": "application/json; charset=UTF-8",
			"X-CSRFToken": Doc.CSRF,
		}
	})
	.then(json => {
		console.log(`result: ${JSON.stringify(json)}`);
		if (!json.result) {
			alert('ERROR: Failed to save the title.')
		}
		Doc.ID = json.id;
		setTimeout(function() { // This is just to make the save action more visible and not instant
			document.getElementById('document-saved').style.opacity = 1;
		}, 1000);

		Doc._saveChanges();
    });
	return;
}

Doc.newDocument = function() {

	// This is a delay to prevent a new document being created
	// while waiting for an auto-save preventing data loss.
	// TODO: Should be a promise or callback.
	if (Graph.__timer) {
		setTimeout(Doc.newDocument, 1000);
		return;
	}

	Doc.ID = null;
	Doc.Title.set("Untitled Draft");

	Nodes = {};
	Globals = {};
	PropsPanel.hideProperties();
	Graph.State.set('selectedNode', false);
	Graph.State.set('propsContainerSeen', false);

	Graph.update();
	Doc.Hash.update();
	Graph.resetNodegraphZoom();
}

Doc.autoSaveChanges = function() {
	const AUTOSAVE_DELAY = 2000; // milliseconds

	if (!Doc.AUTH.get()) {
		// Save in localStorage (Browser) and show message about registering (if not seen)
		setTimeout(function() {
			localStorage.setItem('p_unauth_doc', JSON.stringify(Nodes));

			if (document.querySelector('.register-message').style.opacity == 0) {
				document.querySelector('.register-message').style.opacity = 1;
				var link = document.querySelector('.register-message a');
				link.addEventListener('click', Doc.Register.show);
				link.style.cursor = 'pointer';
			}
		}, AUTOSAVE_DELAY);
		return;
	}

	document.getElementById('document-saved').style.opacity = 0;
	// 1. when a compute cycle happens, we set a timer for AUTOSAVE_DELAY
	// 2. if another compute cycle happens before the end of the timer, the timer resets
	// 3. (Doc._saveChanges) if the timer completes, we check if there are any changes with the hash
	// 4. (Doc._saveChanges) if changes are made, the save proceeds.
	if (Doc.__autoSaveTimer) { // 2. start the timer over if it exists
		clearTimeout(Doc.__autoSaveTimer);
		Doc.__autoSaveTimer = null; // null it out to make it easier to ask if it's been cleared
	}
	Doc.__autoSaveTimer = setTimeout(Doc._saveChanges, AUTOSAVE_DELAY); // 1. Start the timer
}
Doc._saveChanges = function() {
	Doc.__autoSaveTimer = null; // null it out to make it easier to ask if it's been cleared

	if (Doc.Hash.get() === Doc.Hash.make()) {
		// console.log('nothing to save');
		return;
	}

	var payload = {
		id: Doc.ID,
		nodes: Nodes,
		title: Doc.Title.get(),
	}

	d3.json('save-changes', {
		method: 'post',
		body: JSON.stringify(payload),
		headers: {
			"Content-type": "application/json; charset=UTF-8",
			"X-CSRFToken": Doc.CSRF,
		}
	})
	.then(json => {
		console.log(`result: ${JSON.stringify(json)}`);
		// TODO: Replace with proper feedback message
		if (!json.result) {
			alert('ERROR: Failed to save document.')
		}
		Doc.ID = json.id;
		document.getElementById('document-saved').style.opacity = 1;
		Doc.Hash.update();
    });
}


Doc.Browser = {};
Doc.Browser.open = function() {
	PropsPanel.hideProperties();

	d3.json('get-documents', {
		method: 'get',
		headers: {
			"Content-type": "application/json; charset=UTF-8",
			"X-CSRFToken": Doc.CSRF,
		}
	})
	.then(json => {
		Doc.Browser.populate(json.documents);
		// console.log(json.documents);
	});


	var el = document.getElementById('doc-browser-container');
	el.style.display = 'block';
	el.addEventListener('click', function(e) {
		if (e.target == document.getElementById('doc-browser-container')) {
			Doc.Browser.close();
		}
	});
}
Doc.Browser.populate = function(documents) {

	var new_tbody = document.createElement('tbody');
	documents.forEach(function(doc, id) {
		var row = new_tbody.insertRow();
		row.setAttribute('data-doc-id', doc.id);

		row.addEventListener('click', function(el) {
			var id = el.target.parentElement.getAttribute('data-doc-id');
			Doc.Browser.setSelected(id);
		});

		let c = row.insertCell();
		if (Doc.ID === doc.id) {
			c.innerHTML = `${doc.title} <span class="small">(Open)</span>`;
		} else {
			c.innerHTML = doc.title;
		}

		c.className = 'doc-title';

		c = row.insertCell();
		c.innerHTML = moment(doc.last_modified).format("ddd, MMM Do YYYY, h:mm a");
		c.className = 'doc-date';

		c = row.insertCell();
		c.innerHTML = moment(doc.creation_date).format("MMM Do YYYY, h:mm a");
		c.className = 'doc-date';
	});

	// Swap out the old tbody for a new one (removing old file list)
	var table = document.getElementById('doc-browser-table');
	var tbody = table.querySelector('tbody');
	table.replaceChild(new_tbody, tbody);
}
Doc.Browser.setSelected = function(new_id) {
	var old_id = Doc.Browser.__selected;
	if (old_id) {
		var table = document.getElementById('doc-browser-table');
		var row   = table.querySelector(`tr[data-doc-id="${old_id}"]`);
		row.classList.remove('selected');
		document.getElementById('doc-browser-bttn-open').classList.remove('enabled');
	}

	Doc.Browser.__selected = new_id;
	var table = document.getElementById('doc-browser-table');
	var row   = table.querySelector(`tr[data-doc-id="${new_id}"]`);
	row.classList.add('selected');

	document.getElementById('doc-browser-bttn-open').classList.add('enabled');
}
Doc.Browser.loadDocument = function() {
	if (!Doc.Browser.__selected) return;

	d3.json('get-document', {
		method: 'post',
		body: JSON.stringify({'id': Doc.Browser.__selected}),
		headers: {
			"Content-type": "application/json; charset=UTF-8",
			"X-CSRFToken": Doc.CSRF,
		}
	})
	.then(json => {
		Globals = {};
		Nodes = {};
		PropsPanel.hideProperties();
		Graph.update();

		var doc = json.document[0];

		Doc.ID = doc.id;
		Doc.Title.set(doc.title);

		Nodes = JSON.parse(doc.body);


		Graph.resetNodegraphZoom();
		Graph.State.set('propsContainerSeen', false);
		Graph.State.set('selectedNode', false);
		Graph.update();
		Doc.Hash.update();
		Doc.Browser.close();
	});
}
Doc.Browser.close = function() {
	if (Doc.Browser.__selected) {
		var table = document.getElementById('doc-browser-table');
		var row = table.querySelector(`tr[data-doc-id="${Doc.Browser.__selected}"]`);
		row.classList.remove('selected');
	}
	Doc.Browser.__selected = null;
	document.getElementById('doc-browser-bttn-open').classList.remove('enabled');
	document.getElementById('doc-browser-container').style.display = 'none';
}

Doc.toggleHelp = function() {
	var frame = document.getElementById('help-frame');
	if (frame.style.display == 'block') {
		frame.style.display = 'none';
	} else {
		frame.style.display = 'block';
	}
}

Doc.Register = {};
Doc.Register.show = function() {
	var el = document.getElementById('register-container');
	el.style.display = 'block';

	el.addEventListener('click', function(e) {
		if (e.target == document.getElementById('register-container')) {
			Doc.Register.hide();
		}
	});

	document.getElementById('register-form-container').style.display = 'block';
	document.getElementById('authtoken-form-container').style.display = 'none';
	document.getElementById('authtoken-success-container').style.display = 'none';

	// Auth Token Form Setup
	document.getElementById("auth-code-direct-link").addEventListener('click', function(e) {
		document.getElementById('register-form-container').style.display = 'none';
		document.getElementById('authtoken-form-container').style.display = 'block';
	});
	document.querySelector('#authtoken-form').addEventListener('submit', Doc.Register.checkAuthTokenForm);

}
Doc.Register.submit = function(event) {
	event.preventDefault();

	var form = document.getElementById('register-form');
	var data = new FormData(form);

	d3.json('/users/ajax/register/', {
		method: 'post',
		body: data,
		headers: {
			// "Content-type": "charset=UTF-8",
			"X-CSRFToken": Doc.CSRF,
		}
	})
	.then(result => {
		if (result.hasOwnProperty('errors')) {
			var errors = result.errors;
			var form_el = document.getElementById('register-form');

			var em_el = form_el.querySelector('#register-form-email-error');
			em_el.innerHTML = '';
			var ul = document.createElement('ul');
			if (errors.hasOwnProperty('email')) {
				form_el.querySelector('#id_email').classList.add('error');
				em_el.style.display = 'block';
				em_el.appendChild(ul);
				for (var i = 0; i < errors.email.length; i++) {
					var li = document.createElement('li');
					li.innerHTML = errors.email[i];
					ul.appendChild(li);
				}
			} else {
				form_el.querySelector('#id_email').classList.remove('error');
				em_el.style.display = 'none';
			}

			var pw_el = form_el.querySelector('#register-form-password-error');
			pw_el.innerHTML = '';
			var ul = document.createElement('ul');
			if (errors.hasOwnProperty('password1') || errors.hasOwnProperty('password2')) {
				form_el.querySelector('#id_password1').classList.add('error');
				pw_el.style.display = 'block';
				pw_el.appendChild(ul);
			} else {
				pw_el.style.display = 'none';
			}
			if (errors.hasOwnProperty('password1')) {
				for (var i = 0; i < errors.password1.length; i++) {
					var li = document.createElement('li');
					li.innerHTML = errors.password1[i];
					ul.appendChild(li);
				}
			}
			if (errors.hasOwnProperty('password2')) {
				for (var i = 0; i < errors.password2.length; i++) {
					var li = document.createElement('li');
					li.innerHTML = errors.password2[i];
					ul.appendChild(li);
				}
			}
		} else if (result.hasOwnProperty('user_email')) {
			// Register SUCCESSFUL
			localStorage.setItem('p_unauth_doc', JSON.stringify(Nodes));

			document.querySelector('#authtoken-form #id_token-email').value = result.user_email;
			document.getElementById('register-form-container').style.display = 'none';
			document.getElementById('authtoken-form-container').style.display = 'block';
			// console.log(result);
		}

	});
	return;
}
Doc.Register.hide = function() {
	document.getElementById('register-container').style.display = 'none';
}
Doc.Register.checkAuthTokenForm = function(event) {
	event.preventDefault();

	var form = document.getElementById('authtoken-form');
	var data = new FormData(form);

	d3.json('/users/ajax/checkAuthToken/', {
		method: 'post',
		body: data,
		headers: {
			// "Content-type": "charset=UTF-8",
			"X-CSRFToken": Doc.CSRF,
		}
	})
	.then(result => {
		if (result.hasOwnProperty('errors')) {
			var errors = result.errors;
			var form_el = document.getElementById('authtoken-form');

			var em_el = form_el.querySelector('#authtoken-form-email-error');
			em_el.innerHTML = '';
			var ul = document.createElement('ul');
			if (errors.hasOwnProperty('email')) {
				form_el.querySelector('#id_token-email').classList.add('error');
				em_el.style.display = 'block';
				em_el.appendChild(ul);
				for (var i = 0; i < errors.email.length; i++) {
					var li = document.createElement('li');
					li.innerHTML = errors.email[i];
					ul.appendChild(li);
				}
			} else {
				form_el.querySelector('#id_token-email').classList.remove('error');
				em_el.style.display = 'none';
			}

			var tk_el = form_el.querySelector('#authtoken-form-token-error');
			tk_el.innerHTML = '';
			var ul = document.createElement('ul');
			if (errors.hasOwnProperty('token')) {
				form_el.querySelector('#id_token-token').classList.add('error');
				tk_el.style.display = 'block';
				tk_el.appendChild(ul);
				for (var i = 0; i < errors.token.length; i++) {
					var li = document.createElement('li');
					li.innerHTML = errors.token[i];
					ul.appendChild(li);
				}
			} else {
				form_el.querySelector('#id_token-token').classList.remove('error');
				tk_el.style.display = 'none';
			}
		} else {
			document.getElementById('register-form-container').style.display = 'none';
			document.getElementById('authtoken-form-container').style.display = 'none';
			document.getElementById('authtoken-success-container').style.display = 'block';

			setTimeout(function() { location.reload() }, 2000);
		}
	});
	return;
}
