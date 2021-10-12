export function updateTheme() {
	// Default to the system theme
	let theme = localStorage.getItem('theme') || 'system';
	if (theme === 'system') {
		theme = window.matchMedia('(prefers-color-scheme: dark)').matches
			? 'dark'
			: 'light';
	}

	document.documentElement.setAttribute('data-theme', theme);
	localStorage.setItem('theme', theme);
}
updateTheme();
