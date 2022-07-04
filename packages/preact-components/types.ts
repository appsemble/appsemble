import { ComponentType, JSX } from 'preact';

/**
 * A valid HTML or SVG element type or a functional or class component.
 */
export type ElementType = ComponentType | keyof JSX.IntrinsicElements;
