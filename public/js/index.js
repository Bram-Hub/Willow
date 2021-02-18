/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/client/index.ts":
/*!*****************************!*\
  !*** ./src/client/index.ts ***!
  \*****************************/
/***/ (() => {

eval("document.querySelectorAll('#toolbar > .dropdown > button').forEach(button => {\n  button.addEventListener('click', () => {\n    const menu = button.parentNode?.querySelector('.dropdown-menu');\n    if (!(menu instanceof HTMLElement)) {\n      return;\n    }\n    // Toggle the visibility of the dropdown menu when the button is clicked\n    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';\n    // Hide all other dropdown menus\n    document\n      .querySelectorAll('#toolbar > .dropdown > .dropdown-menu')\n      .forEach(otherMenu => {\n        if (!(otherMenu instanceof HTMLElement) || menu === otherMenu) {\n          return;\n        }\n        otherMenu.style.display = 'none';\n      });\n  });\n});\n\nwindow.addEventListener('click', event => {\n  // Hide any visible dropdown menus if anything besides a dropdown button is\n  // clicked\n  if (\n    !(event.target instanceof Element) ||\n    !event.target.matches('#toolbar > .dropdown > button')\n  ) {\n    document\n      .querySelectorAll('#toolbar > .dropdown > .dropdown-menu')\n      .forEach(menu => {\n        if (!(menu instanceof HTMLElement)) {\n          return;\n        }\n        menu.style.display = 'none';\n      });\n  }\n});\n\n\n//# sourceURL=webpack://willow/./src/client/index.ts?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/client/index.ts"]();
/******/ 	
/******/ })()
;