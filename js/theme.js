var theme;(()=>{"use strict";var e={};(()=>{var t=e;function a(){let e=localStorage.getItem("theme")||"system";"system"===e&&(e=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"),document.documentElement.setAttribute("data-theme",e),localStorage.setItem("theme",e)}Object.defineProperty(t,"__esModule",{value:!0}),t.updateTheme=void 0,t.updateTheme=a,a()})(),theme=e})();