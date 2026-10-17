/**
 * Check whether an element and its ancestors in the flat tree are displayed.
 *
 * @param element The element to check.
 * @returns Whether the element is displayed.
 */
function isDisplayed(element: Element): boolean {
  if (getComputedStyle(element).display === 'none') {
    return false;
  }
  const root = element.getRootNode();
  const parent = element.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
  return parent ? isDisplayed(parent) : true;
}

// Test files may opt into jsdom, so the polyfills are only applied in a DOM environment.
if (typeof document !== 'undefined') {
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

  // Jsdom has no top layer, so the elements shown in it are tracked, ordered from bottom to top.
  const topLayer: Element[] = [];

  const removeFromTopLayer = (element: Element): void => {
    const index = topLayer.indexOf(element);
    if (index !== -1) {
      topLayer.splice(index, 1);
    }
  };

  // Jsdom implements no layout, so an element in the top layer is treated as if it covers the whole
  // viewport. This lets tests check which element is rendered on top.
  document.elementsFromPoint = function elementsFromPoint() {
    return [
      ...topLayer.filter((element) => element.isConnected).toReversed(),
      document.body,
      document.documentElement,
    ];
  };

  // Jsdom has no top layer, so it doesn't implement popovers. A popover requires the popover
  // attribute, and a dialog can't be shown as a modal dialog while it is shown as a popover. Showing
  // an element adds it on top of the top layer.
  const shownPopovers = new WeakSet<HTMLElement>();

  HTMLElement.prototype.showPopover = function showPopover() {
    if (!this.hasAttribute('popover')) {
      throw new DOMException('The element is not a popover.', 'NotSupportedError');
    }
    if (shownPopovers.has(this)) {
      return;
    }
    shownPopovers.add(this);
    topLayer.push(this);
  };

  HTMLElement.prototype.hidePopover = function hidePopover() {
    shownPopovers.delete(this);
    removeFromTopLayer(this);
  };

  // Jsdom has no top layer, so it doesn't implement the methods of a dialog. Opening a dialog sets
  // its open attribute, and closing it removes the attribute and fires a close event.
  HTMLDialogElement.prototype.show = function show() {
    if (this.open) {
      throw new DOMException('The dialog is already open.', 'InvalidStateError');
    }
    this.open = true;
  };

  // A modal dialog moves focus to its first focusable descendant, or to the dialog itself.
  HTMLDialogElement.prototype.showModal = function showModal() {
    if (shownPopovers.has(this)) {
      throw new DOMException('The dialog is shown as a popover.', 'InvalidStateError');
    }
    this.show();
    topLayer.push(this);
    const delegate = this.querySelector<HTMLElement>(
      'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    );
    (delegate ?? this).focus();
  };

  HTMLDialogElement.prototype.close = function close() {
    if (!this.open) {
      return;
    }
    this.open = false;
    removeFromTopLayer(this);
    setTimeout(() => this.dispatchEvent(new Event('close')));
  };
}
