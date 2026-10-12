import {
  type KeyboardEvent,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import styles from './index.module.css';

const tabbableSelector = [
  'a[href]',
  'area[href]',
  'audio[controls]',
  'button',
  'iframe',
  'input:not([type="hidden"])',
  'select',
  'summary',
  'textarea',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(',');

/**
 * The open modal dialogs, ordered from bottom to top.
 */
const openDialogs: HTMLElement[] = [];

/**
 * The elements made inert to block the page underneath the topmost dialog.
 */
let inertElements: Element[] = [];

/**
 * Watches the ancestors of the topmost dialog, so content added behind it is made inert too.
 */
let pageObserver: MutationObserver | undefined;

/**
 * Block everything except the topmost dialog for keyboard, pointer, and assistive technology users.
 *
 * Live regions stay available, so messages shown while a dialog is open are still announced.
 */
function updatePageBehindDialogs(): void {
  pageObserver?.disconnect();
  for (const element of inertElements) {
    element.removeAttribute('inert');
  }
  inertElements = [];

  const dialog = openDialogs.at(-1);
  document.documentElement.classList.toggle(styles['scroll-lock'], Boolean(dialog));
  if (!dialog) {
    return;
  }

  pageObserver ??= new MutationObserver(updatePageBehindDialogs);
  let element = dialog;
  while (element !== document.body && element.parentElement) {
    const parent = element.parentElement;
    pageObserver.observe(parent, { childList: true });
    for (const sibling of parent.children) {
      if (
        sibling !== element &&
        !sibling.hasAttribute('inert') &&
        !sibling.matches('[aria-live]')
      ) {
        sibling.setAttribute('inert', '');
        inertElements.push(sibling);
      }
    }
    element = parent;
  }
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
 * Find the elements that can be reached using the tab key, including those inside shadow roots.
 *
 * @param root The element or shadow root to search in.
 * @returns The tabbable elements in document order.
 */
function getTabbableElements(root: Element | ShadowRoot): HTMLElement[] {
  const tabbable: HTMLElement[] = [];
  for (const element of root.querySelectorAll<HTMLElement>('*')) {
    if (
      element.matches(tabbableSelector) &&
      element.tabIndex >= 0 &&
      !element.matches(':disabled') &&
      !element.closest('[inert]') &&
      element.checkVisibility({ visibilityProperty: true })
    ) {
      tabbable.push(element);
    }
    if (element.shadowRoot) {
      tabbable.push(...getTabbableElements(element.shadowRoot));
    }
  }
  return tabbable;
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
   * A function that is called when the user closes the dialog using the escape key.
   */
  onClose?: (event: KeyboardEvent) => void;
}

interface UseModalDialogResult {
  /**
   * The keyboard handler to apply on the dialog element.
   */
  onKeyDown: (event: KeyboardEvent) => void;

  /**
   * The ref to apply on the dialog element.
   */
  ref: RefObject<HTMLDivElement>;
}

/**
 * Implement the keyboard and focus behavior of a modal dialog.
 *
 * While the dialog is open, the rest of the page is inert and can't be scrolled. Focus moves into
 * the dialog when it opens, stays inside it when tabbing, and returns to the element that opened
 * it when it closes.
 *
 * @param options The options for the modal dialog.
 * @returns The ref and keyboard handler to apply on the dialog element.
 */
export function useModalDialog({
  closable,
  isActive,
  onClose,
}: UseModalDialogOptions): UseModalDialogResult {
  const ref = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const dialog = ref.current;
    if (!isActive || !dialog) {
      return;
    }

    openDialogs.push(dialog);
    updatePageBehindDialogs();
    if (!dialog.contains(document.activeElement)) {
      dialog.focus();
    }

    return () => {
      openDialogs.splice(openDialogs.indexOf(dialog), 1);
      updatePageBehindDialogs();
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
    (event: KeyboardEvent) => {
      const dialog = ref.current;
      if (!dialog || openDialogs.at(-1) !== dialog || event.defaultPrevented) {
        return;
      }

      if (event.key === 'Escape') {
        if (closable && onClose) {
          event.preventDefault();
          onClose(event);
        }
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const tabbable = getTabbableElements(dialog);
      const active = getActiveElement();
      const first = tabbable.at(0);
      const last = tabbable.at(-1);
      if (!first || !last) {
        event.preventDefault();
      } else if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [closable, onClose],
  );

  return { onKeyDown, ref };
}
