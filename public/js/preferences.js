/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
var preferences;
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/client/preferences.ts":
/*!***********************************!*\
  !*** ./src/client/preferences.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.instance = void 0;\nconst vue = __webpack_require__(/*! vue */ \"./node_modules/vue/dist/vue.esm-browser.js\");\nexports.instance = vue\n    .createApp({\n    data: function () {\n        return {\n            theme: localStorage.getItem('theme') || 'system',\n        };\n    },\n    watch: {\n        theme(newVal) {\n            localStorage.setItem('theme', newVal);\n            theme.updateTheme(newVal);\n        },\n    },\n})\n    .mount('#preferences-form');\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvY2xpZW50L3ByZWZlcmVuY2VzLnRzLmpzIiwibWFwcGluZ3MiOiI7OztBQUFBLHlGQUEyQjtBQUlkLGdCQUFRLEdBQUcsR0FBRztLQUN6QixTQUFTLENBQUM7SUFDVixJQUFJLEVBQUU7UUFDTCxPQUFPO1lBQ04sS0FBSyxFQUFFLFlBQVksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksUUFBUTtTQUNoRCxDQUFDO0lBQ0gsQ0FBQztJQUNELEtBQUssRUFBRTtRQUNOLEtBQUssQ0FBQyxNQUFjO1lBQ25CLFlBQVksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3RDLEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0IsQ0FBQztLQUNEO0NBQ0QsQ0FBQztLQUNELEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vW25hbWVdLy4vc3JjL2NsaWVudC9wcmVmZXJlbmNlcy50cz8zNTYxIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHZ1ZSBmcm9tICd2dWUnO1xuXG5kZWNsYXJlIGNvbnN0IHRoZW1lOiBhbnk7XG5cbmV4cG9ydCBjb25zdCBpbnN0YW5jZSA9IHZ1ZVxuXHQuY3JlYXRlQXBwKHtcblx0XHRkYXRhOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR0aGVtZTogbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3RoZW1lJykgfHwgJ3N5c3RlbScsXG5cdFx0XHR9O1xuXHRcdH0sXG5cdFx0d2F0Y2g6IHtcblx0XHRcdHRoZW1lKG5ld1ZhbDogc3RyaW5nKSB7XG5cdFx0XHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKCd0aGVtZScsIG5ld1ZhbCk7XG5cdFx0XHRcdHRoZW1lLnVwZGF0ZVRoZW1lKG5ld1ZhbCk7XG5cdFx0XHR9LFxuXHRcdH0sXG5cdH0pXG5cdC5tb3VudCgnI3ByZWZlcmVuY2VzLWZvcm0nKTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./src/client/preferences.ts\n");

/***/ }),

/***/ "./node_modules/vue/dist/vue.esm-browser.js":
/*!**************************************************!*\
  !*** ./node_modules/vue/dist/vue.esm-browser.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval-source-map devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/client/preferences.ts");
/******/ 	preferences = __webpack_exports__;
/******/ 	
/******/ })()
;