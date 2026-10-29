/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import { basename } from 'node:path';

import { type Connection } from 'vscode-languageserver';
import { type TextDocument } from 'vscode-languageserver-textdocument';
import {
  type CodeActionParams,
  type CodeLensParams,
  type DefinitionParams,
  type DidChangeWatchedFilesParams,
  type DocumentFormattingParams,
  type DocumentLinkParams,
  type DocumentOnTypeFormattingParams,
  type DocumentSymbolParams,
  type FoldingRangeParams,
  type SelectionRangeParams,
  type TextDocumentPositionParams,
} from 'vscode-languageserver-protocol';
import {
  type CodeAction,
  type CodeLens,
  type CompletionList,
  type DefinitionLink,
  type DocumentLink,
  type DocumentSymbol,
  type FoldingRange,
  type Hover,
  type SelectionRange,
  type SymbolInformation,
  type TextEdit,
} from 'vscode-languageserver-types';
import { isKubernetesAssociatedDocument } from 'yaml-language-server/lib/esm/languageservice/parser/isKubernetes.js';
import { yamlDocumentsCache } from 'yaml-language-server/lib/esm/languageservice/parser/yaml-documents.js';
import { matchOffsetToDocument } from 'yaml-language-server/lib/esm/languageservice/utils/arrUtils.js';
import { type LanguageService } from 'yaml-language-server/lib/esm/languageservice/yamlLanguageService.js';

import { type ValidationHandler } from './validationHandlers.js';
import { ResultLimitReachedNotification } from '../../requestTypes.js';
import { type SettingsState } from '../../yamlSettings.js';

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }
  return String(error);
}

function describePosition(
  document: TextDocument,
  position: TextDocumentPositionParams['position'],
): string {
  const text = document.getText();
  const lines = text.split(/\r?\n/);
  const from = Math.max(0, position.line - 2);
  const to = Math.min(lines.length, position.line + 3);
  const excerpt = lines
    .slice(from, to)
    .map((line, index) => {
      const lineNumber = from + index;
      const marker = lineNumber === position.line ? '>' : ' ';
      return `${marker} ${lineNumber}:${line}`;
    })
    .join('\n');

  try {
    const offset = document.offsetAt(position);
    const yamlDocument = yamlDocumentsCache.getYamlDocument(document);
    const currentDocument = matchOffsetToDocument(offset, yamlDocument);
    const node = currentDocument?.getNodeFromOffset(offset);

    if (!node) {
      return `offset: ${offset}\nnode: <none>\n${excerpt}`;
    }

    return [
      `offset: ${offset}`,
      `node: ${node.type} offset=${node.offset} length=${node.length}`,
      `parent: ${node.parent?.type ?? '<none>'}`,
      excerpt,
    ].join('\n');
  } catch (error: unknown) {
    return `position context failed: ${formatError(error)}\n${excerpt}`;
  }
}

export class LanguageHandlers {
  pendingLimitExceededWarnings: Record<
    string,
    { features: Record<string, string>; timeout?: NodeJS.Timeout }
  >;

  private languageService: LanguageService;

  private yamlSettings: SettingsState;

  private validationHandler: ValidationHandler;

  private readonly connection: Connection;

  constructor(
    connection: Connection,
    languageService: LanguageService,
    yamlSettings: SettingsState,
    validationHandler: ValidationHandler,
  ) {
    this.connection = connection;
    this.languageService = languageService;
    this.yamlSettings = yamlSettings;
    this.validationHandler = validationHandler;
    this.pendingLimitExceededWarnings = {};
  }

  registerHandlers(): void {
    this.connection.onDocumentLinks((params) => this.documentLinkHandler(params));
    this.connection.onDocumentSymbol((documentSymbolParams) =>
      this.documentSymbolHandler(documentSymbolParams),
    );
    this.connection.onDocumentFormatting((formatParams) => this.formatterHandler(formatParams));
    this.connection.onHover((textDocumentPositionParams) =>
      this.hoverHandler(textDocumentPositionParams),
    );
    this.connection.onCompletion((textDocumentPosition) =>
      this.completionHandler(textDocumentPosition),
    );
    this.connection.onDidChangeWatchedFiles((change) => this.watchedFilesHandler(change));
    this.connection.onFoldingRanges((params) => this.foldingRangeHandler(params));
    this.connection.onSelectionRanges((params) => this.selectionRangeHandler(params));
    this.connection.onCodeAction((params) => this.codeActionHandler(params));
    this.connection.onDocumentOnTypeFormatting((params) => this.formatOnTypeHandler(params));
    this.connection.onCodeLens((params) => this.codeLensHandler(params));
    this.connection.onCodeLensResolve((params) => this.codeLensResolveHandler(params));
    this.connection.onDefinition((params) => this.definitionHandler(params));

    this.yamlSettings.documents.onDidChangeContent((change) =>
      this.cancelLimitExceededWarnings(change.document.uri),
    );
    this.yamlSettings.documents.onDidClose((event) =>
      this.cancelLimitExceededWarnings(event.document.uri),
    );
  }

  documentLinkHandler(params: DocumentLinkParams): Promise<DocumentLink[]> {
    return (
      this.withDocument(params.textDocument.uri, (document) =>
        this.languageService.findLinks(document),
      ) ?? Promise.resolve([])
    );
  }

  /**
   * Called when the code outline in an editor needs to be populated
   * Returns a list of symbols that is then shown in the code outline
   *
   * @param documentSymbolParams {DocumentSymbolParams}
   * @returns DocumentSymbol[] | SymbolInformation[]
   */
  documentSymbolHandler(
    documentSymbolParams: DocumentSymbolParams,
  ): DocumentSymbol[] | SymbolInformation[] | undefined {
    return this.withDocument(documentSymbolParams.textDocument.uri, (document) => {
      const onResultLimitExceeded = this.onResultLimitExceeded(
        document.uri,
        this.yamlSettings.maxItemsComputed,
        'document symbols',
      );

      const context = { resultLimit: this.yamlSettings.maxItemsComputed, onResultLimitExceeded };

      if (this.yamlSettings.hierarchicalDocumentSymbolSupport) {
        return this.languageService.findDocumentSymbols2(document, context);
      }
      return this.languageService.findDocumentSymbols(document, context);
    });
  }

  /**
   * Called when the formatter is invoked
   * Returns the formatted document content using prettier
   *
   * @param formatParams {DocumentFormattingParams}
   * @returns Promise<TextEdit[] | undefined>
   */
  formatterHandler(formatParams: DocumentFormattingParams): Promise<TextEdit[] | undefined> {
    return (
      this.withDocument(formatParams.textDocument.uri, (document) => {
        const customFormatterSettings = {
          tabWidth: formatParams.options.tabSize,
          ...this.yamlSettings.yamlFormatterSettings,
        };

        return this.languageService.doFormat(document, customFormatterSettings);
      }) ?? Promise.resolve([])
    );
  }

  formatOnTypeHandler(
    params: DocumentOnTypeFormattingParams,
  ): Promise<TextEdit[] | undefined> | TextEdit[] | undefined {
    return this.withDocument(params.textDocument.uri, (document) =>
      this.languageService.doDocumentOnTypeFormatting(document, params),
    );
  }

  /**
   * Called when the user hovers with their mouse over a keyword
   * Returns an informational tooltip
   *
   * @param textDocumentPositionParams {TextDocumentPositionParams}
   * @returns Promise<Hover | undefined>
   */
  async hoverHandler(
    textDocumentPositionParams: TextDocumentPositionParams,
  ): Promise<Hover | undefined> {
    try {
      const hover = await this.withDocument(
        textDocumentPositionParams.textDocument.uri,
        (document) => this.languageService.doHover(document, textDocumentPositionParams.position),
      );
      return hover || undefined;
    } catch (error: unknown) {
      this.withDocument(textDocumentPositionParams.textDocument.uri, (document) => {
        this.connection.console.error(
          `Hover failed for ${document.uri} at ${textDocumentPositionParams.position.line}:${textDocumentPositionParams.position.character}\n${describePosition(document, textDocumentPositionParams.position)}\n${formatError(error)}`,
        );
      });
      return undefined;
    }
  }

  /**
   * Called when auto-complete is triggered in an editor
   * Returns a list of valid completion items
   *
   * @param textDocumentPosition {TextDocumentPositionParams}
   * @returns Promise<CompletionList>
   */
  completionHandler(textDocumentPosition: TextDocumentPositionParams): Promise<CompletionList> {
    const result: CompletionList = {
      items: [],
      isIncomplete: false,
    };

    return (
      this.withDocument(textDocumentPosition.textDocument.uri, async (document) => {
        try {
          return await this.languageService.doComplete(
            document,
            textDocumentPosition.position,
            isKubernetesAssociatedDocument(document, this.yamlSettings.specificValidatorPaths),
          );
        } catch (error: unknown) {
          this.connection.console.error(
            `Completion failed for ${document.uri} at ${textDocumentPosition.position.line}:${textDocumentPosition.position.character}\n${describePosition(document, textDocumentPosition.position)}\n${formatError(error)}`,
          );
          return result;
        }
      }) ?? Promise.resolve(result)
    );
  }

  /**
   * Called when a monitored file is changed in an editor
   * Re-validates the entire document
   *
   * @param change {DidChangeWatchedFilesParams}
   */
  watchedFilesHandler(change: DidChangeWatchedFilesParams): void {
    let hasChanges = false;

    for (const c of change.changes) {
      if (this.languageService.resetSchema(c.uri)) {
        hasChanges = true;
      }
    }

    if (hasChanges) {
      for (const document of this.yamlSettings.documents.all()) {
        this.validationHandler.validate(document);
      }
    }
  }

  foldingRangeHandler(
    params: FoldingRangeParams,
  ): FoldingRange[] | Promise<FoldingRange[] | undefined> | undefined {
    return this.withDocument(params.textDocument.uri, (document) => {
      const capabilities = this.yamlSettings.capabilities.textDocument?.foldingRange;
      const rangeLimit = capabilities?.rangeLimit || this.yamlSettings.maxItemsComputed;
      const onRangeLimitExceeded = this.onResultLimitExceeded(
        document.uri,
        rangeLimit,
        'folding ranges',
      );

      const context = {
        rangeLimit,
        onRangeLimitExceeded,
        lineFoldingOnly: capabilities?.lineFoldingOnly,
      };

      const ranges = this.languageService.getFoldingRanges(document, context);
      return ranges ?? undefined;
    });
  }

  selectionRangeHandler(params: SelectionRangeParams): SelectionRange[] | undefined {
    return this.withDocument(params.textDocument.uri, (document) =>
      this.languageService.getSelectionRanges(document, params.positions),
    );
  }

  codeActionHandler(params: CodeActionParams): CodeAction[] | undefined {
    return this.withDocument(params.textDocument.uri, (document) =>
      this.languageService
        .getCodeAction(document, params)
        ?.filter((action) => action.command?.command !== 'jumpToSchema'),
    );
  }

  codeLensHandler(
    params: CodeLensParams,
  ): CodeLens[] | PromiseLike<CodeLens[] | undefined> | undefined {
    return this.withDocument(params.textDocument.uri, (document) =>
      this.languageService.getCodeLens(document),
    );
  }

  codeLensResolveHandler(param: CodeLens): CodeLens | PromiseLike<CodeLens> {
    return this.languageService.resolveCodeLens(param);
  }

  definitionHandler(params: DefinitionParams): DefinitionLink[] | undefined {
    return this.withDocument(params.textDocument.uri, (document) =>
      this.languageService.doDefinition(document, params),
    );
  }

  private withDocument<T>(uri: string, callback: (document: TextDocument) => T): T | undefined {
    const document = this.yamlSettings.documents.get(uri);
    return document ? callback(document) : undefined;
  }

  // Adapted from:
  // https://github.com/microsoft/vscode/blob/94c9ea46838a9a619aeafb7e8afd1170c967bb55/extensions/json-language-features/server/src/jsonServer.ts#L172
  private cancelLimitExceededWarnings(uri: string): void {
    const warning = this.pendingLimitExceededWarnings[uri];
    if (warning && warning.timeout) {
      clearTimeout(warning.timeout);
      delete this.pendingLimitExceededWarnings[uri];
    }
  }

  private onResultLimitExceeded(uri: string, resultLimit: number, name: string) {
    return () => {
      let warning = this.pendingLimitExceededWarnings[uri];
      if (warning) {
        if (!warning.timeout) {
          // Already shown
          return;
        }
        warning.features[name] = name;
        warning.timeout.refresh();
      } else {
        warning = { features: { [name]: name } };
        warning.timeout = setTimeout(() => {
          this.connection.sendNotification(
            ResultLimitReachedNotification.type,
            `${basename(uri)}: For performance reasons, ${Object.keys(warning.features).join(
              ' and ',
            )} have been limited to ${resultLimit} items.`,
          );
          warning.timeout = undefined;
        }, 2000);
        this.pendingLimitExceededWarnings[uri] = warning;
      }
    };
  }
}
