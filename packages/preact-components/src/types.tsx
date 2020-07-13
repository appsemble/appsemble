import type { ComponentType, h, VNode } from 'preact';

/**
 * A valid HTML or SVG element type or a functional or class component.
 */
export type ElementType = ComponentType | keyof h.JSX.IntrinsicElements;

/**
 * Get props for a Preact string component or functional component.
 *
 * This is similar to React’s `ComponentTypeWithoutRef`.
 */
export type Props<T extends ElementType> = T extends keyof h.JSX.IntrinsicElements
  ? h.JSX.IntrinsicElements[T]
  : T extends () => VNode
  ? {}
  : T extends (props: infer P) => VNode
  ? P
  : never;
