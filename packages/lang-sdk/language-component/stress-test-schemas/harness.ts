import { type Identity, LanguageCtx, scan, type ScanResult } from '../index.js';
import { miniSchemas } from './schemas.js';

const ctx = LanguageCtx.compile(miniSchemas, 'Root');

/**
 * The only coupling point between the stress-test suite and the language component
 * implementation. Tests assert against the shapes produced here, never against
 * implementation internals, so the engine can be rewritten without touching the
 * scenario assertions.
 */

export function analyze(data: unknown): ScanResult {
  return scan(ctx, data);
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
// describeIdentity(object)`. Accepts anything carrying an `mounts` map (the full
// ScanResult or a MountTree), so tests share one projection instead of copying it.
export function describeIdentities(source: {
  mounts: ScanResult['mounts'];
}): Record<string, string> {
  return Object.fromEntries(
    [...source.mounts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([path, interpretation]) => [path, describeIdentity(interpretation.identity)]),
  );
}
