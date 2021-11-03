/**
 * Updates the theme on this page.
 * @param theme the theme name
 */
export function updateTheme(theme: string) {
	if (theme === 'system') {
		theme = window.matchMedia('(prefers-color-scheme: dark)').matches
			? 'dark'
			: 'light';
	}
	document.documentElement.setAttribute('data-theme', theme);
}

updateTheme(localStorage.getItem('theme') || 'system');
