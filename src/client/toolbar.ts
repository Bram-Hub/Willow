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

window.addEventListener('click', event => {
	const toolbar = document.getElementById('toolbar');
	if (toolbar === null) {
		return;
	}

	if (
		event.target instanceof Element &&
		event.target.matches('#toolbar .dropdown > button')
	) {
		toolbar.toggleAttribute('data-active');
	} else {
		toolbar.removeAttribute('data-active');
	}
});

const dropdowns = document.querySelectorAll<HTMLElement>('#toolbar .dropdown');
dropdowns.forEach(dropdown => {
	dropdown.addEventListener('mouseenter', event => {
		dropdowns.forEach(dropdown => dropdown.removeAttribute('data-active'));

		const target = event.target;
		if (target instanceof HTMLElement) {
			target.setAttribute('data-active', '');
		}
	});
});
