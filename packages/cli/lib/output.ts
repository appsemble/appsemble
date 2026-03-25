import { type ValidationError } from 'jsonschema';
import {
  isAlias,
  isNode,
  LineCounter,
  parseDocument,
  type Node as YAMLNode,
  YAMLMap,
  YAMLSeq,
} from 'yaml';

type YAMLPathNode = YAMLNode | null | undefined;

/**
 * Resolve a validation path to the original YAML node, even when the path crosses aliases.
 *
 * Validation errors are produced from the fully expanded app definition, but the YAML AST still
 * contains alias nodes such as `*item-form-fields`. `doc.getIn()` stops at those aliases,
 * so we walk the path manually and resolve aliases along the way to recover the source node.
 *
 * @param doc The parsed YAML document.
 * @param path The validation error path, e.g. `['form', 'fields', 0, 'type']`.
 * @returns The YAML node at the given path, or `undefined` if the path is invalid.
 */
function getNodeAtPath(
  doc: ReturnType<typeof parseDocument>,
  path: readonly (number | string)[],
): YAMLPathNode {
  function resolveNode(node: YAMLPathNode, docu: ReturnType<typeof parseDocument>): YAMLPathNode {
    return isAlias(node) ? node.resolve(docu) : node;
  }
  let current: YAMLPathNode = doc.contents;

  for (const segment of path) {
    current = resolveNode(current, doc);

    if (current instanceof YAMLMap) {
      current = current.get(segment, true);
    } else if (current instanceof YAMLSeq) {
      if (typeof segment !== 'number') {
        return undefined;
      }
      const item = current.items[segment];
      current = isNode(item) ? item : undefined;
    } else {
      return undefined;
    }

    if (current == null) {
      return undefined;
    }
  }

  return resolveNode(current, doc);
}

/**
 * Format validation errors from an Axios response as `file:line:col` messages when possible.
 *
 * @param filename The YAML file path shown in the output.
 * @param yaml The YAML source text.
 * @param errors The validation errors returned by the API.
 * @returns A newline-separated list of formatted validation messages.
 */
export function printAxiosError(filename: string, yaml: string, errors: ValidationError[]): string {
  const lineCounter = new LineCounter();
  const doc = parseDocument(yaml, { lineCounter });

  return errors
    .map((error) => {
      const node = getNodeAtPath(doc, error.path);
      let result = filename;
      if (isNode(node) && node.range) {
        const { col, line } = lineCounter.linePos(node.range[0]);
        result += `:${line}:${col}`;
      }
      return `${result} ${error.message}`;
    })
    .join('\n');
}
