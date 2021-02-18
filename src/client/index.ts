document.querySelectorAll('#toolbar > .dropdown > button').forEach(button => {
	button.addEventListener('click', () => {
		const menu = button.parentNode?.querySelector('.dropdown-menu');
		if (!(menu instanceof HTMLElement)) {
			return;
		}
		// Toggle the visibility of the dropdown menu when the button is clicked
		menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
		// Hide all other dropdown menus
		document
			.querySelectorAll('#toolbar > .dropdown > .dropdown-menu')
			.forEach(otherMenu => {
				if (!(otherMenu instanceof HTMLElement) || menu === otherMenu) {
					return;
				}
				otherMenu.style.display = 'none';
			});
	});
});

window.addEventListener('click', event => {
	// Hide any visible dropdown menus if anything besides a dropdown button is
	// clicked
	if (
		!(event.target instanceof Element) ||
		!event.target.matches('#toolbar > .dropdown > button')
	) {
		document
			.querySelectorAll('#toolbar > .dropdown > .dropdown-menu')
			.forEach(menu => {
				if (!(menu instanceof HTMLElement)) {
					return;
				}
				menu.style.display = 'none';
			});
	}
});
