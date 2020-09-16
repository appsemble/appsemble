import type { ComponentType, h } from 'preact';

/**
 * A valid HTML or SVG element type or a functional or class component.
 */
export type ElementType = ComponentType | keyof h.JSX.IntrinsicElements;
