/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import { basename } from 'node:path';

import { type Connection, LSPErrorCodes, ResponseError } from 'vscode-languageserver';
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
import { appDefinitionFileNames } from '../../appsembleSchemaConfig.js';
import { ResultLimitReachedNotification } from '../../requestTypes.js';
import { type SettingsState } from '../../yamlSettings.js';
import { languageComponentCompletions } from '../languageComponentCompletion.js';
import { handleWaitingMessages } from '../utils/handleWaitingMessages.js';

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

  async documentLinkHandler(params: DocumentLinkParams): Promise<DocumentLink[]> {
    return (
      (await this.withDocument(params.textDocument.uri, (document) =>
        this.languageService.findLinks(document),
      )) ?? []
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
  ): Promise<DocumentSymbol[] | SymbolInformation[] | undefined> {
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
  async formatterHandler(formatParams: DocumentFormattingParams): Promise<TextEdit[] | undefined> {
    return (
      (await this.withDocument(formatParams.textDocument.uri, (document) => {
        const customFormatterSettings = {
          tabWidth: formatParams.options.tabSize,
          ...this.yamlSettings.yamlFormatterSettings,
        };

        return this.languageService.doFormat(document, customFormatterSettings);
      })) ?? []
    );
  }

  formatOnTypeHandler(params: DocumentOnTypeFormattingParams): Promise<TextEdit[] | undefined> {
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
  hoverHandler(textDocumentPositionParams: TextDocumentPositionParams): Promise<Hover | undefined> {
    return this.withDocument(textDocumentPositionParams.textDocument.uri, async (document) => {
      try {
        const hover = await this.languageService.doHover(
          document,
          textDocumentPositionParams.position,
        );
        return hover || undefined;
      } catch (error: unknown) {
        this.connection.console.error(
          `Hover failed for ${document.uri} at ${textDocumentPositionParams.position.line}:${textDocumentPositionParams.position.character}\n${describePosition(document, textDocumentPositionParams.position)}\n${formatError(error)}`,
        );
        return undefined;
      }
    });
  }

  /**
   * Called when auto-complete is triggered in an editor
   * Returns a list of valid completion items
   *
   * @param textDocumentPosition {TextDocumentPositionParams}
   * @returns Promise<CompletionList>
   */
  async completionHandler(
    textDocumentPosition: TextDocumentPositionParams,
  ): Promise<CompletionList> {
    const result: CompletionList = {
      items: [],
      isIncomplete: false,
    };

    return (
      (await this.withDocument(textDocumentPosition.textDocument.uri, async (document) => {
        try {
          if (appDefinitionFileNames.includes(basename(document.uri))) {
            // A failing binding must not take yaml-language-server's own completions down with it.
            const items = await languageComponentCompletions(
              document,
              textDocumentPosition.position,
            ).catch((error: unknown) => {
              this.connection.console.error(
                `Language component completion failed for ${document.uri}\n${formatError(error)}`,
              );
              return [];
            });
            // Where a binding completes, its answer is the whole answer, which skips
            // yaml-language-server's whole-document schema matching.
            if (items.length) {
              return { items, isIncomplete: false };
            }
          }
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
      })) ?? result
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

  foldingRangeHandler(params: FoldingRangeParams): Promise<FoldingRange[] | undefined> {
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

  selectionRangeHandler(params: SelectionRangeParams): Promise<SelectionRange[] | undefined> {
    return this.withDocument(params.textDocument.uri, (document) =>
      this.languageService.getSelectionRanges(document, params.positions),
    );
  }

  codeActionHandler(params: CodeActionParams): Promise<CodeAction[] | undefined> {
    return this.withDocument(params.textDocument.uri, (document) =>
      this.languageService
        .getCodeAction(document, params)
        ?.filter((action) => action.command?.command !== 'jumpToSchema'),
    );
  }

  codeLensHandler(params: CodeLensParams): Promise<CodeLens[] | undefined> {
    return this.withDocument(params.textDocument.uri, (document) =>
      this.languageService.getCodeLens(document),
    );
  }

  codeLensResolveHandler(param: CodeLens): CodeLens | PromiseLike<CodeLens> {
    return this.languageService.resolveCodeLens(param);
  }

  definitionHandler(params: DefinitionParams): Promise<DefinitionLink[] | undefined> {
    return this.withDocument(params.textDocument.uri, (document) =>
      this.languageService.doDefinition(document, params),
    );
  }

  /**
   * Answer a request about a document, unless the document changed after the request was sent.
   * Editors send requests such as folding ranges after every edit, and each new version of a large
   * document takes long to parse, so answering outdated requests builds up a queue that delays the
   * answers that are still wanted. The editor ignores a content modified error, as the language
   * server protocol prescribes.
   */
  private async withDocument<T>(
    uri: string,
    callback: (document: TextDocument) => PromiseLike<T> | T,
  ): Promise<T | undefined> {
    const version = this.yamlSettings.documents.get(uri)?.version;
    await handleWaitingMessages();
    const document = this.yamlSettings.documents.get(uri);
    if (!document) {
      return undefined;
    }
    if (document.version !== version) {
      throw new ResponseError(LSPErrorCodes.ContentModified, `${uri} changed`);
    }
    return callback(document);
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
