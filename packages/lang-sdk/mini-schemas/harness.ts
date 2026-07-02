import {
  scanComponents,
  formatPath,
  type ScanResult,
  type Identity,
  type Mount,
  type NodePath,
} from '../language-component/index.js';
import { miniSchemas, Root } from './schemas.js';

/**
 * The only coupling point between the mini-schema tests and the language component
 * implementation. Tests assert against the shapes produced here, never against
 * implementation internals, so the engine can be rewritten without touching the
 * scenario assertions.
 */

export function analyze(data: unknown): ScanResult {
  return scanComponents(data, Root, miniSchemas);
}

export function describeIdentity(object: Identity): string {
  if (object.kind === 'single') {
    return object.name;
  }
  if (object.kind === 'unresolved') {
    return `unresolved(${object.reason}) [${object.parts.map(describeIdentity).join(', ')}]`;
  }
  const head = object.name === object.mode ? object.mode : `${object.name}:${object.mode}`;
  return `${head}(${object.parts.map(describeIdentity).join(', ')})`;
}

// Stable string-tree projection over any analysis result or tree: `JSON Pointer ->
// describeIdentity(object)`. Accepts anything carrying an `interpretations` map (the full
// ScanResult or a MountTree), so tests share one projection instead of copying it.
export function describeIdentities(source: {
  interpretations: ScanResult['interpretations'];
}): Record<string, string> {
  return Object.fromEntries(
    [...source.interpretations.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([path, interpretation]) => [path, describeIdentity(interpretation.identity)]),
  );
}

export function mountAt(result: ScanResult, path: NodePath): Mount | undefined {
  return result.interpretations.get(formatPath(path));
}

export { formatPath };
