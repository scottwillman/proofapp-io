// ATTACH DROPDOWN MENUS TO THEIR BUTTONS
// DOM must follow the structure:
// div.dropdown
//   a.dropdown-button
//     div.dropdown-menu
//
var DropdownMenus = {};

DropdownMenus.init = function() {
	var dropdowns = document.querySelectorAll('.dropdown');
	dropdowns.forEach(function(dropdown, n) {
		var button = dropdown.querySelector('.dropdown-button');
		button.addEventListener('click', function(e) {
			// Close all other menus
			document.querySelectorAll('.dropdown-menu').forEach(function(menu) {
				menu.classList.remove('menu-show');
			});
			document.querySelectorAll('.dropdown-button').forEach(function(bttn) {
				bttn.classList.remove('button-active');
			});

			var b = e.target;
			b.classList.toggle('button-active');
			var drpdwn = b.parentElement;
			var menu = drpdwn.querySelector('.dropdown-menu');
			menu.classList.toggle('menu-show');
		});
	});
	window.addEventListener('click', function(e) {
		if (!e.target.matches('.dropdown-button')) {
			document.querySelectorAll('.dropdown-menu').forEach(function(menu) {
				menu.classList.remove('menu-show');
			});
			document.querySelectorAll('.dropdown-button').forEach(function(bttn) {
				bttn.classList.remove('button-active');
			});
		}
	});
}
