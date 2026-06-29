import {
  analyzeMetaObjects,
  formatPath,
  type MetaAnalysisResult,
  type MetaIdentity,
  type MetaInterpretation,
  type MetaObjectPath,
} from '../meta-object/index.js';
import { miniSchemas, Root } from './schemas.js';

/**
 * The only coupling point between the mini-schema tests and the meta-object
 * implementation. Tests assert against the shapes produced here, never against
 * implementation internals, so the engine can be rewritten without touching the
 * scenario assertions.
 */

export function analyze(data: unknown): MetaAnalysisResult {
  return analyzeMetaObjects(data, Root, miniSchemas);
}

export function describeObject(object: MetaIdentity): string {
  if (object.kind === 'single') {
    return object.name;
  }
  if (object.kind === 'unresolved') {
    return `unresolved(${object.reason}) [${object.parts.map(describeObject).join(', ')}]`;
  }
  const head = object.name === object.mode ? object.mode : `${object.name}:${object.mode}`;
  return `${head}(${object.parts.map(describeObject).join(', ')})`;
}

// Stable string-tree projection over any analysis result or tree: `JSON Pointer ->
// describeObject(object)`. Accepts anything carrying an `interpretations` map (the full
// MetaAnalysisResult or a MetaTree), so tests share one projection instead of copying it.
export function describeObjects(source: {
  interpretations: MetaAnalysisResult['interpretations'];
}): Record<string, string> {
  return Object.fromEntries(
    [...source.interpretations.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([path, interpretation]) => [path, describeObject(interpretation.identity)]),
  );
}

export function interpretationAt(
  result: MetaAnalysisResult,
  path: MetaObjectPath,
): MetaInterpretation | undefined {
  return result.interpretations.get(formatPath(path));
}

export { formatPath };
