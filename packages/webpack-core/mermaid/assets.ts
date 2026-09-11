import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

/**
 * The directory in which pre-rendered Mermaid SVGs are committed.
 *
 * Both the render script and the build-time rehype plugin resolve diagram SVGs from here, keyed by
 * a content hash of the diagram source.
 */
export const mermaidAssetsDir = fileURLToPath(new URL('assets/', import.meta.url));

/**
 * Compute the stable content hash for a Mermaid diagram.
 *
 * The hash is derived from the trimmed diagram source so insignificant trailing whitespace does not
 * change the committed filename. The same value is used by the render script to name the SVG and by
 * the rehype plugin to look it up.
 *
 * @param diagram The Mermaid diagram source.
 * @returns A short hexadecimal hash.
 */
export function hashMermaidDiagram(diagram: string): string {
  return createHash('sha256').update(diagram.trim()).digest('hex').slice(0, 16);
}

/**
 * Resolve the absolute path of the committed SVG for a Mermaid diagram.
 *
 * @param diagram The Mermaid diagram source.
 * @returns The absolute path to the SVG file.
 */
export function mermaidSvgPath(diagram: string): string {
  return fileURLToPath(new URL(`assets/${hashMermaidDiagram(diagram)}.svg`, import.meta.url));
}
