/**
 * This file exists to support older web browsers. Don’t use `let`, `var`, `async`, `await`, etc.
 * here.
 */
if (!window.appsembleHasLoaded) {
  document.getElementById('legacy-browser-support').style.display = 'block';
}
