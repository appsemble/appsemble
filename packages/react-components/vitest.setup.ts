function isDisplayed(element: Element): boolean {
  if (getComputedStyle(element).display === 'none') {
    return false;
  }
  const root = element.getRootNode();
  const parent = element.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
  return parent ? isDisplayed(parent) : true;
}

// Jsdom implements no layout, so it has no `checkVisibility()`. Treat an element as visible unless
// it or an ancestor in the flat tree is not displayed, or its visibility is hidden.
Element.prototype.checkVisibility = function checkVisibility(options) {
  if (
    (options?.visibilityProperty || options?.checkVisibilityCSS) &&
    getComputedStyle(this).visibility === 'hidden'
  ) {
    return false;
  }
  return isDisplayed(this);
};
