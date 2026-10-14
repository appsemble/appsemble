import { type RefObject } from 'preact';
import { useCallback, useLayoutEffect, useRef, useState } from 'preact/hooks';

import styles from './index.module.css';

/**
 * Find the focused element, including focused elements inside shadow roots.
 *
 * @returns The element that has focus.
 */
function getActiveElement(): Element | null {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement;
  }
  return active;
}

interface UseModalDialogOptions {
  /**
   * Whether the user is allowed to close the dialog using the escape key.
   */
  closable: boolean;

  /**
   * Whether the dialog is currently open.
   */
  isActive: boolean;

  /**
   * A function that is called when the user closes the dialog using the escape key or another
   * close request of the browser.
   */
  onClose?: (event: Event) => void;
}

interface UseModalDialogResult {
  /**
   * The class name to apply on the dialog element.
   */
  className: string;

  /**
   * The cancel handler to apply on the dialog element.
   */
  onCancel: (event: Event) => void;

  /**
   * The close handler to apply on the dialog element.
   */
  onClose: (event: Event) => void;

  /**
   * The keyboard handler to apply on the dialog element.
   */
  onKeyDown: (event: KeyboardEvent) => void;

  /**
   * The ref to apply on the dialog element.
   */
  ref: RefObject<HTMLDialogElement>;
}

/**
 * Show an open dialog element as a modal dialog while it is active.
 *
 * The browser renders the dialog on top of the page and blocks the page behind it. Focus returns to
 * the element that opened the dialog when it closes.
 *
 * A dialog hidden using CSS, for example by a media query, isn't shown as a modal dialog, so it
 * doesn't block the page.
 *
 * @param options The options for the modal dialog.
 * @returns The class name, ref, and event handlers to apply on the dialog element.
 */
export function useModalDialog({
  closable,
  isActive,
  onClose,
}: UseModalDialogOptions): UseModalDialogResult {
  const ref = useRef<HTMLDialogElement>(null);
  const isModal = useRef(false);

  // The opener is read during render, because elements inside the dialog may claim focus using
  // autoFocus before any effect runs.
  const [opener, setOpener] = useState(() => (isActive ? getActiveElement() : null));
  const [wasActive, setWasActive] = useState(isActive);
  if (isActive !== wasActive) {
    setWasActive(isActive);
    if (isActive) {
      setOpener(getActiveElement());
    }
  }

  const show = useCallback((dialog: HTMLDialogElement) => {
    const focused = getActiveElement();
    if (dialog.hasAttribute('popover')) {
      dialog.hidePopover();
      dialog.removeAttribute('popover');
    }
    dialog.close();
    dialog.showModal();
    isModal.current = true;
    if (dialog.contains(focused) && focused instanceof HTMLElement) {
      focused.focus();
    }
  }, []);

  // The dialog stays open as a manual popover, so it remains rendered on top of the page while it
  // transitions out, without blocking the page.
  const close = useCallback((dialog: HTMLDialogElement) => {
    isModal.current = false;
    dialog.close();
    // eslint-disable-next-line no-param-reassign
    dialog.open = true;
    dialog.setAttribute('popover', 'manual');
    dialog.showPopover();
  }, []);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!isActive || !dialog) {
      return;
    }

    const update = (): void => {
      const isDisplayed = dialog.checkVisibility();
      if (isDisplayed && !isModal.current) {
        show(dialog);
      } else if (!isDisplayed && isModal.current) {
        close(dialog);
      }
    };

    update();
    window.addEventListener('resize', update);

    return () => {
      window.removeEventListener('resize', update);
      if (isModal.current) {
        close(dialog);
      }
      const activeElement = getActiveElement();
      if (
        opener instanceof HTMLElement &&
        (activeElement === document.body || dialog.contains(activeElement))
      ) {
        opener.focus();
      }
    };
  }, [close, isActive, opener, show]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) {
        return;
      }

      // The dialog is closed by the parent component, not by the browser.
      event.preventDefault();
      if (closable) {
        onClose?.(event);
      }
    },
    [closable, onClose],
  );

  const handleCancel = useCallback(
    (event: Event) => {
      event.preventDefault();
      if (closable) {
        onClose?.(event);
      }
    },
    [closable, onClose],
  );

  const handleClose = useCallback(
    (event: Event) => {
      const dialog = event.currentTarget as HTMLDialogElement;
      // The browser may close a modal dialog on a close request that can't be canceled. Dialogs
      // that are open again by the time the close event is fired were closed by this hook.
      if (dialog.open || !isModal.current) {
        return;
      }

      close(dialog);
      if (closable) {
        onClose?.(event);
      } else {
        show(dialog);
      }
    },
    [close, closable, onClose, show],
  );

  return { className: styles.dialog, onCancel: handleCancel, onClose: handleClose, onKeyDown, ref };
}
