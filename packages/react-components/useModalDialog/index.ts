import {
  createContext,
  type KeyboardEvent,
  type RefObject,
  type SyntheticEvent,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import styles from './index.module.css';

export interface ModalDialog {
  /**
   * The dialog element that is shown as a modal dialog.
   */
  dialog: HTMLDialogElement;

  /**
   * For a dialog inside a shadow root, the name of the slot in the dialog that renders the children
   * of the shadow host with this slot name.
   */
  slot?: string;
}

/**
 * The dialogs that are shown as modal dialogs, ordered from bottom to top.
 */
let modalDialogs: readonly ModalDialog[] = [];

/**
 * The functions to call when the modal dialogs change.
 */
const listeners = new Set<() => void>();

/**
 * Whether the children are rendered inside a modal dialog.
 */
export const ModalDialogContext = createContext(false);

/**
 * Find out whether a component is rendered inside a modal dialog.
 *
 * Content that belongs to a dialog must be rendered inside it, because everything outside the
 * topmost dialog is blocked.
 *
 * @returns Whether the component is rendered inside a modal dialog.
 */
export function useIsInModalDialog(): boolean {
  return useContext(ModalDialogContext);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getModalDialogs(): readonly ModalDialog[] {
  return modalDialogs;
}

/**
 * Find the dialogs that are shown as modal dialogs.
 *
 * Content rendered outside of the topmost dialog is blocked while it is open.
 *
 * @returns The modal dialogs, ordered from bottom to top.
 */
export function useModalDialogs(): readonly ModalDialog[] {
  return useSyncExternalStore(subscribe, getModalDialogs, getModalDialogs);
}

function isModalDialog(dialog: HTMLDialogElement): boolean {
  return modalDialogs.some((modalDialog) => modalDialog.dialog === dialog);
}

function setModalDialogs(dialogs: readonly ModalDialog[]): void {
  modalDialogs = dialogs;
  document.documentElement.classList.toggle(styles['scroll-lock'], modalDialogs.length > 0);
  for (const listener of listeners) {
    listener();
  }
}

function removeModalDialog(dialog: HTMLDialogElement): void {
  setModalDialogs(modalDialogs.filter((modalDialog) => modalDialog.dialog !== dialog));
}

/**
 * Track the modal dialogs inside the shadow root of an element.
 *
 * A dialog inside the shadow root dispatches a composed `AppsembleModalDialogShow` event when it is
 * shown as a modal dialog, and a composed `AppsembleModalDialogClose` event when it stops being shown
 * as a modal dialog. The detail of the show event contains the name of a slot in the dialog, so
 * content can be rendered inside the dialog by the shadow host.
 *
 * @param host The shadow host whose modal dialogs to track.
 * @returns A function that stops tracking the modal dialogs, and removes the ones that are shown.
 */
export function trackShadowModalDialogs(host: Element): () => void {
  const dialogs = new Set<HTMLDialogElement>();

  const onShow = (event: Event): void => {
    const [dialog] = event.composedPath() as HTMLDialogElement[];
    const { slot } = (event as CustomEvent<{ slot: string }>).detail;
    dialogs.add(dialog);
    setModalDialogs([...modalDialogs, { dialog, slot }]);
  };

  const onClose = (event: Event): void => {
    const [dialog] = event.composedPath() as HTMLDialogElement[];
    dialogs.delete(dialog);
    removeModalDialog(dialog);
  };

  host.addEventListener('AppsembleModalDialogShow', onShow);
  host.addEventListener('AppsembleModalDialogClose', onClose);

  return () => {
    host.removeEventListener('AppsembleModalDialogShow', onShow);
    host.removeEventListener('AppsembleModalDialogClose', onClose);
    for (const dialog of dialogs) {
      removeModalDialog(dialog);
    }
    dialogs.clear();
  };
}

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

/**
 * Show an open dialog as a modal dialog.
 *
 * Focus stays on an element inside the dialog that claimed focus using autoFocus.
 *
 * @param dialog The dialog to show.
 */
function showModalDialog(dialog: HTMLDialogElement): void {
  const focused = dialog.contains(document.activeElement) ? getActiveElement() : null;
  if (dialog.hasAttribute('popover')) {
    dialog.hidePopover();
    dialog.removeAttribute('popover');
  }
  dialog.close();
  dialog.showModal();
  if (focused instanceof HTMLElement) {
    focused.focus();
  }
  setModalDialogs([...modalDialogs, { dialog }]);
}

/**
 * Stop showing a dialog as a modal dialog.
 *
 * The dialog stays open as a manual popover, so it remains rendered on top of the page while it
 * transitions out, without blocking the page.
 *
 * @param dialog The dialog to stop showing as a modal dialog.
 */
function closeModalDialog(dialog: HTMLDialogElement): void {
  dialog.close();
  // eslint-disable-next-line no-param-reassign
  dialog.open = true;
  dialog.setAttribute('popover', 'manual');
  dialog.showPopover();
  removeModalDialog(dialog);
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
  onClose?: (event: SyntheticEvent) => void;
}

interface UseModalDialogResult {
  /**
   * The class name to apply on the dialog element.
   */
  className: string;

  /**
   * The cancel handler to apply on the dialog element.
   */
  onCancel: (event: SyntheticEvent<HTMLDialogElement>) => void;

  /**
   * The close handler to apply on the dialog element.
   */
  onClose: (event: SyntheticEvent<HTMLDialogElement>) => void;

  /**
   * The keyboard handler to apply on the dialog element.
   */
  onKeyDown: (event: KeyboardEvent<HTMLDialogElement>) => void;

  /**
   * The ref to apply on the dialog element.
   */
  ref: RefObject<HTMLDialogElement>;
}

/**
 * Show an open dialog element as a modal dialog while it is active.
 *
 * The browser renders the dialog on top of the page and blocks the page behind it. The page can't
 * be scrolled while the dialog is open, and focus returns to the element that opened the dialog
 * when it closes.
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

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!isActive || !dialog) {
      return;
    }

    const update = (): void => {
      const isDisplayed = dialog.checkVisibility();
      if (isDisplayed && !isModalDialog(dialog)) {
        showModalDialog(dialog);
      } else if (!isDisplayed && isModalDialog(dialog)) {
        closeModalDialog(dialog);
      }
    };

    update();
    window.addEventListener('resize', update);

    return () => {
      window.removeEventListener('resize', update);
      if (isModalDialog(dialog)) {
        closeModalDialog(dialog);
      }
    };
  }, [isActive]);

  // Focus is returned in a passive effect, because React restores the focus it had before a commit
  // after layout effects are cleaned up.
  useEffect(() => {
    const dialog = ref.current;
    if (!isActive || !dialog) {
      return;
    }

    return () => {
      const { activeElement } = document;
      if (
        opener instanceof HTMLElement &&
        (activeElement === document.body || dialog.contains(activeElement))
      ) {
        opener.focus();
      }
    };
  }, [isActive, opener]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDialogElement>) => {
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
    (event: SyntheticEvent<HTMLDialogElement>) => {
      event.preventDefault();
      if (closable) {
        onClose?.(event);
      }
    },
    [closable, onClose],
  );

  const handleClose = useCallback(
    (event: SyntheticEvent<HTMLDialogElement>) => {
      const dialog = event.currentTarget;
      // The browser may close a modal dialog on a close request that can't be canceled. Dialogs
      // that are open again by the time the close event is fired were closed by this hook.
      if (dialog.open || !isModalDialog(dialog)) {
        return;
      }

      closeModalDialog(dialog);
      if (closable) {
        onClose?.(event);
      } else {
        showModalDialog(dialog);
      }
    },
    [closable, onClose],
  );

  return { className: styles.dialog, onCancel: handleCancel, onClose: handleClose, onKeyDown, ref };
}
