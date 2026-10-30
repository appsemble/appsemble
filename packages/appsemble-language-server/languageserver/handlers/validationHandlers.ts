/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */
import { type AppDefinition, AppValidator, validateAppDefinition } from '@appsemble/lang-sdk';
import { type Connection } from 'vscode-languageserver';
import { type TextDocument } from 'vscode-languageserver-textdocument';
import { type Diagnostic, DiagnosticSeverity } from 'vscode-languageserver-types';
import { type Document, isNode, type LineCounter, visit } from 'yaml';
import { isKubernetesAssociatedDocument } from 'yaml-language-server/lib/esm/languageservice/parser/isKubernetes.js';
import { removeDuplicatesObj } from 'yaml-language-server/lib/esm/languageservice/utils/arrUtils.js';
import { type LanguageService } from 'yaml-language-server/lib/esm/languageservice/yamlLanguageService.js';

import { type SettingsState } from '../../yamlSettings.js';
import { type BlockManifestCacher } from '../utils/BlockManifestCacher.js';
import { type YamlCacher } from '../utils/YamlCacher.js';

interface ValidationOptions {
  refreshBlockSchemas?: boolean;
}

function validatorRangeToDiagnosticRange(
  counter: LineCounter,
  [start, valueEnd, ,]: [number, number, number],
): Diagnostic['range'] {
  const lineStart = counter.linePos(start);
  const lineEnd = counter.linePos(valueEnd);
  return {
    start: {
      line: lineStart.line - 1,
      character: lineStart.col - 1,
    },
    end: {
      line: lineEnd.line - 1,
      character: lineEnd.col - 1,
    },
  };
}

/**
 * Describe why a YAML document could not be converted to plain data.
 *
 * @param doc The document that failed to convert.
 * @param counter The line counter of the document.
 * @param error The error the conversion threw.
 * @returns A diagnostic for each alias without an anchor, or one at the start of the document if no
 *   alias is to blame.
 */
function unconvertibleDocumentDiagnostics(
  doc: Document,
  counter: LineCounter,
  error: unknown,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  visit(doc, {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Alias(key, alias) {
      if (!alias.resolve(doc) && alias.range) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          message: `Unresolved alias (the anchor must be set before the alias): ${alias.source}`,
          range: validatorRangeToDiagnosticRange(counter, alias.range),
        });
      }
    },
  });
  if (diagnostics.length) {
    return diagnostics;
  }
  return [
    {
      severity: DiagnosticSeverity.Error,
      message: error instanceof Error ? error.message : String(error),
      range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
    },
  ];
}

export class ValidationHandler {
  private languageService: LanguageService;

  private yamlSettings: SettingsState;

  private readonly connection: Connection;

  private readonly yamlCacher: YamlCacher;

  private readonly blockManifestCacher: BlockManifestCacher;

  private readonly appValidator: AppValidator;

  private readonly activeValidationControllers = new Map<string, AbortController>();

  private blockSchemaUpdater: (() => Promise<boolean>) | undefined;

  constructor(
    connection: Connection,
    languageService: LanguageService,
    yamlSettings: SettingsState,
    yamlCacher: YamlCacher,
    blockManifestCacher: BlockManifestCacher,
  ) {
    this.connection = connection;
    this.languageService = languageService;
    this.yamlSettings = yamlSettings;

    this.yamlSettings.documents.onDidChangeContent((change) => {
      this.validate(change.document);
    });
    this.yamlSettings.documents.onDidClose((event) => {
      this.cleanPendingValidation(event.document);
      this.connection.sendDiagnostics({ uri: event.document.uri, diagnostics: [] });
    });

    this.appValidator = new AppValidator();
    this.yamlCacher = yamlCacher;
    this.blockManifestCacher = blockManifestCacher;
  }

  setBlockSchemaUpdater(blockSchemaUpdater: () => Promise<boolean>): void {
    this.blockSchemaUpdater = blockSchemaUpdater;
  }

  handleSettingsUpdate(): void {
    this.blockManifestCacher.apiUrl = this.yamlSettings.blockRegistryBaseUrl;

    for (const document of this.yamlSettings.documents.all()) {
      this.validate(document);
    }
  }

  validate(textDocument: TextDocument, options: ValidationOptions = {}): void {
    this.cleanPendingValidation(textDocument);
    this.yamlSettings.pendingValidationRequests[textDocument.uri] = setTimeout(() => {
      delete this.yamlSettings.pendingValidationRequests[textDocument.uri];
      const abortController = new AbortController();
      this.activeValidationControllers.set(textDocument.uri, abortController);
      this.validateTextDocument(textDocument, abortController.signal, {
        refreshBlockSchemas: options.refreshBlockSchemas ?? true,
      })
        .catch((error: unknown) => {
          this.connection.console.error(`Validation failed for ${textDocument.uri}: ${error}`);
        })
        .finally(() => {
          if (this.activeValidationControllers.get(textDocument.uri) === abortController) {
            this.activeValidationControllers.delete(textDocument.uri);
          }
        });
    }, this.yamlSettings.validationDelayMs);
  }

  private async validateTextDocument(
    textDocument: TextDocument,
    signal: AbortSignal,
    options: Required<ValidationOptions>,
  ): Promise<Diagnostic[]> {
    if (!textDocument) {
      return [];
    }

    if (options.refreshBlockSchemas && this.blockSchemaUpdater) {
      const blockSchemasChanged = await this.blockSchemaUpdater();
      if (signal.aborted) {
        return [];
      }

      if (blockSchemasChanged) {
        for (const document of this.yamlSettings.documents.all()) {
          if (document.uri !== textDocument.uri) {
            this.validate(document, { refreshBlockSchemas: false });
          }
        }
      }
    }

    const diagnosticResults = await this.languageService.doValidation(
      textDocument,
      isKubernetesAssociatedDocument(textDocument, this.yamlSettings.specificValidatorPaths),
    );
    if (signal.aborted) {
      return [];
    }

    const { counter, doc } = this.yamlCacher.parseOrGetCached(textDocument);
    let definition: AppDefinition;
    try {
      definition = doc.toJS({ maxAliasCount: 10_000 });
    } catch (error: unknown) {
      // The app validation works on plain data, which a document with an alias that has no anchor
      // cannot be converted to. Report why, alongside the yaml language service diagnostics.
      return this.publishDiagnostics(
        textDocument,
        unconvertibleDocumentDiagnostics(doc, counter, error),
        diagnosticResults,
      );
    }
    this.connection.console.info(`Validating ${textDocument.uri}`);
    const validatorResult = this.appValidator.validateApp(definition);
    const validationResult = await validateAppDefinition(
      definition,
      (blocks) => this.blockManifestCacher.getCachedBlockVersions(blocks),
      undefined,
      validatorResult,
    );
    if (signal.aborted) {
      return [];
    }

    const errors: Diagnostic[] = validationResult.errors
      .map((error) => {
        const node = doc.getIn(error.path, true);
        if (!isNode(node)) {
          return null;
        }
        const range = validatorRangeToDiagnosticRange(counter, node.range!);

        return {
          severity: DiagnosticSeverity.Warning,
          message: error.message,
          range,
        } as Diagnostic;
      })
      .filter((x) => x != null);
    return this.publishDiagnostics(textDocument, errors, diagnosticResults);
  }

  private publishDiagnostics(
    textDocument: TextDocument,
    appDiagnostics: Diagnostic[],
    yamlDiagnostics: Diagnostic[],
  ): Diagnostic[] {
    const diagnostics: Diagnostic[] = [...appDiagnostics];
    for (const diagnosticItem of yamlDiagnostics) {
      // Convert all warnings to errors
      if (diagnosticItem.severity === 2) {
        diagnosticItem.severity = 1;
      }
      diagnostics.push(diagnosticItem);
    }
    const removeDuplicatesDiagnostics = removeDuplicatesObj(diagnostics);
    if (this.yamlSettings.documents.get(textDocument.uri)?.version !== textDocument.version) {
      return removeDuplicatesDiagnostics;
    }
    this.connection.sendDiagnostics({
      uri: textDocument.uri,
      diagnostics: removeDuplicatesDiagnostics,
    });
    return removeDuplicatesDiagnostics;
  }

  private cleanPendingValidation(textDocument: TextDocument): void {
    this.activeValidationControllers.get(textDocument.uri)?.abort();
    this.activeValidationControllers.delete(textDocument.uri);

    const request = this.yamlSettings.pendingValidationRequests[textDocument.uri];

    if (request) {
      clearTimeout(request);
      delete this.yamlSettings.pendingValidationRequests[textDocument.uri];
    }
  }
}
