/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
var theme;
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/client/theme.ts":
/*!*****************************!*\
  !*** ./src/client/theme.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, exports) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.updateTheme = void 0;\nfunction updateTheme() {\n    // Default to the system theme\n    let theme = localStorage.getItem('theme') || 'system';\n    if (theme === 'system') {\n        theme = window.matchMedia('(prefers-color-scheme: dark)').matches\n            ? 'dark'\n            : 'light';\n    }\n    document.documentElement.setAttribute('data-theme', theme);\n    localStorage.setItem('theme', theme);\n}\nexports.updateTheme = updateTheme;\nupdateTheme();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvY2xpZW50L3RoZW1lLnRzLmpzIiwibWFwcGluZ3MiOiI7OztBQUFBLFNBQWdCLFdBQVc7SUFDMUIsOEJBQThCO0lBQzlCLElBQUksS0FBSyxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksUUFBUSxDQUFDO0lBQ3RELElBQUksS0FBSyxLQUFLLFFBQVEsRUFBRTtRQUN2QixLQUFLLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLE9BQU87WUFDaEUsQ0FBQyxDQUFDLE1BQU07WUFDUixDQUFDLENBQUMsT0FBTyxDQUFDO0tBQ1g7SUFFRCxRQUFRLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDM0QsWUFBWSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDdEMsQ0FBQztBQVhELGtDQVdDO0FBQ0QsV0FBVyxFQUFFLENBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9bbmFtZV0vLi9zcmMvY2xpZW50L3RoZW1lLnRzP2IyMGYiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVRoZW1lKCkge1xuXHQvLyBEZWZhdWx0IHRvIHRoZSBzeXN0ZW0gdGhlbWVcblx0bGV0IHRoZW1lID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3RoZW1lJykgfHwgJ3N5c3RlbSc7XG5cdGlmICh0aGVtZSA9PT0gJ3N5c3RlbScpIHtcblx0XHR0aGVtZSA9IHdpbmRvdy5tYXRjaE1lZGlhKCcocHJlZmVycy1jb2xvci1zY2hlbWU6IGRhcmspJykubWF0Y2hlc1xuXHRcdFx0PyAnZGFyaydcblx0XHRcdDogJ2xpZ2h0Jztcblx0fVxuXG5cdGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2RhdGEtdGhlbWUnLCB0aGVtZSk7XG5cdGxvY2FsU3RvcmFnZS5zZXRJdGVtKCd0aGVtZScsIHRoZW1lKTtcbn1cbnVwZGF0ZVRoZW1lKCk7XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./src/client/theme.ts\n");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval-source-map devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/client/theme.ts"](0, __webpack_exports__);
/******/ 	theme = __webpack_exports__;
/******/ 	
/******/ })()
;