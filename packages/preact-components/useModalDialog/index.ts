import {
  closeModalDialog,
  getActiveElement,
  modalDialogCloseEvent,
  modalDialogShowEvent,
  showDialogAsModal,
} from '@appsemble/web-utils';
import { type RefObject } from 'preact';
import { useCallback, useId, useLayoutEffect, useRef, useState } from 'preact/hooks';

import styles from './index.module.css';

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

  /**
   * The name of the slot to render inside the dialog element.
   */
  slot: string;
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
 * The dialog dispatches a composed show event when it is shown as a modal dialog, and a cancelable
 * composed close event when it stops being shown as a modal dialog. This lets the app render
 * content, such as messages, inside the topmost dialog. The detail of the show event contains the
 * name of the slot that renders this content. The app cancels the close event if the dialog isn't
 * the topmost modal dialog.
 *
 * @param options The options for the modal dialog.
 * @returns The class name, ref, slot name, and event handlers to apply on the dialog element.
 */
export function useModalDialog({
  closable,
  isActive,
  onClose,
}: UseModalDialogOptions): UseModalDialogResult {
  const ref = useRef<HTMLDialogElement>(null);
  const isModal = useRef(false);
  const slot = useId();

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

  const show = useCallback(
    (dialog: HTMLDialogElement) => {
      showDialogAsModal(dialog);
      isModal.current = true;
      dialog.dispatchEvent(
        new CustomEvent(modalDialogShowEvent, {
          bubbles: true,
          composed: true,
          detail: { slot },
        }),
      );
    },
    [slot],
  );

  const close = useCallback((dialog: HTMLDialogElement) => {
    isModal.current = false;
    const onTop = dialog.dispatchEvent(
      new CustomEvent(modalDialogCloseEvent, { bubbles: true, cancelable: true, composed: true }),
    );
    closeModalDialog(dialog, onTop);
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

  return {
    className: styles.dialog,
    onCancel: handleCancel,
    onClose: handleClose,
    onKeyDown,
    ref,
    slot,
  };
}
