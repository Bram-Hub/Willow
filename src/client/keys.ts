export const pressedKeyCodes = new Set<string>();

document.addEventListener(
	'keydown',
	(event: KeyboardEvent) => pressedKeyCodes.add(event.key),
	true
);

document.addEventListener(
	'keyup',
	(event: KeyboardEvent) => pressedKeyCodes.delete(event.key),
	false
);
