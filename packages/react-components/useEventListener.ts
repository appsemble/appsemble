import { useEffect } from 'react';

type EventListener<E extends Event = Event> = (event: E) => void;
type Options = AddEventListenerOptions | boolean;

/**
 * Attach an event listener to an event target.
 *
 * @param target The target to add the event listener to.
 * @param type The type of the event listener to add
 * @param listener The event listener callback function.
 * @param options Additional event listener options.
 */
export function useEventListener<K extends keyof DocumentEventMap>(
  target: Document,
  type: K,
  listener: EventListener<DocumentEventMap[K]>,
  options?: Options,
): void;
export function useEventListener<T extends HTMLElement, K extends keyof HTMLElementEventMap>(
  target: T,
  type: K,
  listener: EventListener<HTMLElementEventMap[K]>,
  options?: Options,
): void;
export function useEventListener(
  target: EventTarget,
  type: string,
  listener: EventListener,
  options?: Options,
): void;
export function useEventListener(
  target: EventTarget,
  type: string,
  listener: EventListener,
  options?: Options,
): void {
  useEffect(() => {
    target.addEventListener(type, listener, options);
    return () => target.removeEventListener(type, listener, options);
  }, [listener, options, target, type]);
}
