/**
 * Shows a modal on the screen. Any other visible modals will be hidden.
 * @param modalId the id of the modal to be made visible
 */
export function showModal(modalId: string) {
	// Hide any visible modals
	document
		.querySelectorAll<HTMLElement>('.modal')
		.forEach(modal => (modal.style.display = 'none'));

	// Show the desired modal
	const modal = document.getElementById(modalId);
	if (modal === null) {
		return;
	}
	modal.style.display = 'initial';
}

document.querySelectorAll('#toolbar .dropdown > button').forEach(button => {
	button.addEventListener('click', () => {
		const menu =
			button.parentNode?.querySelector<HTMLElement>('.dropdown-menu');
		if (menu === null || menu === undefined) {
			return;
		}

		// Toggle the visibility of the dropdown menu when the button is clicked
		menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
		// Hide all other dropdown menus
		document
			.querySelectorAll<HTMLElement>('#toolbar .dropdown > .dropdown-menu')
			.forEach(otherMenu => {
				if (menu === otherMenu) {
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
		!event.target.matches('#toolbar .dropdown > button')
	) {
		document
			.querySelectorAll<HTMLElement>('#toolbar .dropdown > .dropdown-menu')
			.forEach(menu => (menu.style.display = 'none'));
	}
});
