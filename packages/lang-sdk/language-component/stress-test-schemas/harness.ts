import { type Schema } from 'jsonschema';

import { type DynamicChild, type Identity, LanguageCtx, scan, type ScanResult } from '../index.js';
import { BadgeListBlockParams, miniSchemas, WidgetBlockParams } from './schemas.js';

// The block manifest: `type@version` -> the schema validating that block's `parameters`. In a real
// app this is populated between the two walks from fetched manifests; here it is hand-built.
const blockManifest = new Map<string, Schema>([
  ['widget-block@0.0.0', WidgetBlockParams],
  ['badge-list@0.0.0', BadgeListBlockParams],
]);

// A block's `parameters` schema is absent from BlockDefinition; the resolver supplies it from the
// manifest by the block's own type+version, so no parameter union is ever walked.
const resolveBlockParameters: DynamicChild = (parentIdentity, parentValue, key) => {
  if (parentIdentity !== 'BlockDefinition' || key !== 'parameters') {
    return null;
  }
  const block = parentValue as { type?: string; version?: string };
  return blockManifest.get(`${block.type}@${block.version}`) ?? null;
};

// The compiled tiny-app context (Root = AppDefinition, blocks resolved through the manifest).
// Exported so the incremental cases can drive edits deep in the app through the same resolver.
export const appCtx = LanguageCtx.compile(miniSchemas, 'Root', {
  dynamicChild: resolveBlockParameters,
});

/**
 * The only coupling point between the stress-test suite and the language component
 * implementation. Tests assert against the shapes produced here, never against
 * implementation internals, so the engine can be rewritten without touching the
 * scenario assertions.
 */

export function analyze(data: unknown): ScanResult {
  return scan(appCtx, data);
}

// Compile one registry component as its own root and scan `data` against it — the entry point for
// the component probes, which isolate a single schema instead of walking the whole app. Compiled
// contexts are cached by root name (compile is reused across a probe's scenario and focused tests).
const componentCtx = new Map<string, LanguageCtx>();

export function analyzeComponent(root: string, data: unknown): ScanResult {
  let compiled = componentCtx.get(root);
  if (!compiled) {
    compiled = LanguageCtx.compile(miniSchemas, root, { dynamicChild: resolveBlockParameters });
    componentCtx.set(root, compiled);
  }
  return scan(compiled, data);
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
// ScanResult or a MountIndex), so tests share one projection instead of copying it.
export function describeIdentities(source: {
  mounts: ScanResult['mounts'];
}): Record<string, string> {
  return Object.fromEntries(
    [...source.mounts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([path, interpretation]) => [path, describeIdentity(interpretation.identity)]),
  );
}
