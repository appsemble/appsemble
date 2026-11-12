import { appsembleCompletionDefs, compileAppsembleDialect } from '@appsemble/lang-sdk';
import { type LanguageCtx, type Node, type NodePath } from '@appsemble/lang-sdk/language-component';
import { type TextDocument } from 'vscode-languageserver-textdocument';
import {
  type CompletionItem,
  CompletionItemKind,
  type Position,
} from 'vscode-languageserver-types';
import { type ASTNode } from 'yaml-language-server/lib/esm/languageservice/jsonASTTypes.js';
import { getNodeValue } from 'yaml-language-server/lib/esm/languageservice/parser/astNodeUtils.js';
import { yamlDocumentsCache } from 'yaml-language-server/lib/esm/languageservice/parser/yaml-documents.js';
import { matchOffsetToDocument } from 'yaml-language-server/lib/esm/languageservice/utils/arrUtils.js';

let appsembleLanguage: LanguageCtx | undefined;

// The document path of an AST node: a property contributes its key, an array its item's index.
function nodePath(node: ASTNode | undefined): NodePath {
  const path: (number | string)[] = [];
  let current = node;
  while (current?.parent) {
    const { parent } = current;
    if (parent.type === 'property') {
      path.unshift(parent.keyNode.value);
    } else if (parent.type === 'array') {
      path.unshift(parent.items.indexOf(current));
    }
    current = parent;
  }
  return path;
}

/**
 * Completions from the language components' `complete` bindings: the nearest component around the
 * cursor that has one answers, with the path from that component to the cursor.
 *
 * @param document The app definition being edited.
 * @param position The cursor position.
 * @returns The completion items the bindings offer, or none when no binding covers the cursor.
 */
export async function languageComponentCompletions(
  document: TextDocument,
  position: Position,
): Promise<CompletionItem[]> {
  const offset = document.offsetAt(position);
  const yamlDocument = matchOffsetToDocument(offset, yamlDocumentsCache.getYamlDocument(document));
  if (!yamlDocument) {
    return [];
  }
  const cursorNode = yamlDocument.getNodeFromOffset(offset, true);
  // `complete` bindings offer values, so a key under the cursor gets none.
  if (cursorNode?.parent?.type === 'property' && cursorNode.parent.keyNode === cursorNode) {
    return [];
  }
  appsembleLanguage ??= compileAppsembleDialect(appsembleCompletionDefs());
  // The yaml-language-server AST has its aliases expanded already.
  const value = getNodeValue(yamlDocument.root);
  const path = nodePath(cursorNode);
  // Only the nodes along the path are resolved, never the whole document. The cursor may sit below
  // the last node that exists, like an element not written yet, so the walk stops there.
  let node: Node = appsembleLanguage.root(value);
  for (const key of path) {
    const next = node.child(key);
    if (!next) {
      break;
    }
    node = next;
  }
  const context = appsembleLanguage.bindingContextFor(node, 'complete', path);
  const completions = context
    ? await context.binding.complete!(context, appsembleLanguage.context)
    : [];
  return completions.map(({ detail, label, value: completion }) => ({
    label,
    detail,
    kind: CompletionItemKind.Value,
    insertText: typeof completion === 'string' ? completion : JSON.stringify(completion),
  }));
}
