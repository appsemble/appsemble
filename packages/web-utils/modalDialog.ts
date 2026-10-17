/**
 * The name of the composed event a dialog inside a shadow root dispatches when it is shown as a
 * modal dialog.
 *
 * The detail of the event contains the name of a slot in the dialog, so the shadow host can render
 * content inside the dialog.
 */
export const modalDialogShowEvent = 'AppsembleModalDialogShow';

/**
 * The name of the cancelable composed event a dialog inside a shadow root dispatches when it stops
 * being shown as a modal dialog.
 *
 * The event is canceled if the dialog isn't the topmost modal dialog, so it isn't rendered on top
 * of the modal dialogs above it while it transitions out.
 */
export const modalDialogCloseEvent = 'AppsembleModalDialogClose';

/**
 * Find the focused element, including focused elements inside shadow roots.
 *
 * @returns The element that has focus.
 */
export function getActiveElement(): Element | null {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement;
  }
  return active;
}

/**
 * Show an open dialog as a modal dialog.
 *
 * Focus stays on an element inside the dialog that has focus, for example because it claimed focus
 * using autoFocus.
 *
 * @param dialog The dialog to show.
 */
export function showDialogAsModal(dialog: HTMLDialogElement): void {
  const { activeElement } = dialog.getRootNode() as Document | ShadowRoot;
  const focused = activeElement && dialog.contains(activeElement) ? getActiveElement() : null;
  if (dialog.hasAttribute('popover')) {
    dialog.hidePopover();
    dialog.removeAttribute('popover');
  }
  dialog.close();
  dialog.showModal();
  if (focused instanceof HTMLElement) {
    focused.focus();
  }
}

/**
 * Stop showing a dialog as a modal dialog, without blocking the page.
 *
 * The dialog stays open, so it can transition out. A dialog on top stays rendered on top of the
 * page as a manual popover. Other dialogs are rendered in place, below the modal dialogs above them.
 *
 * @param dialog The dialog to stop showing as a modal dialog.
 * @param onTop Whether the dialog is the topmost modal dialog.
 */
export function closeModalDialog(dialog: HTMLDialogElement, onTop: boolean): void {
  dialog.close();
  // eslint-disable-next-line no-param-reassign
  dialog.open = true;
  if (onTop) {
    dialog.setAttribute('popover', 'manual');
    dialog.showPopover();
  }
}
