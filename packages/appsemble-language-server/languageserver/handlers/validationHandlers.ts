/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */
import { AppValidator, validateAppDefinition } from '@appsemble/lang-sdk';
import { type Connection } from 'vscode-languageserver';
import { type TextDocument } from 'vscode-languageserver-textdocument';
import { type Diagnostic, DiagnosticSeverity } from 'vscode-languageserver-types';
import { isNode, type LineCounter } from 'yaml';
import { isKubernetesAssociatedDocument } from 'yaml-language-server/lib/esm/languageservice/parser/isKubernetes.js';
import { removeDuplicatesObj } from 'yaml-language-server/lib/esm/languageservice/utils/arrUtils.js';
import { type LanguageService } from 'yaml-language-server/lib/esm/languageservice/yamlLanguageService.js';

import { type SettingsState } from '../../yamlSettings.js';
import { type BlockManifestCacher } from '../utils/BlockManifestCacher.js';
import { type YamlCacher } from '../utils/YamlCacher.js';

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

export class ValidationHandler {
  private languageService: LanguageService;

  private yamlSettings: SettingsState;

  private readonly connection: Connection;

  private readonly yamlCacher: YamlCacher;

  private readonly blockManifestCacher: BlockManifestCacher;

  private readonly appValidator: AppValidator;

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

  handleSettingsUpdate(): void {
    this.blockManifestCacher.apiUrl = this.yamlSettings.blockRegistryBaseUrl;

    for (const document of this.yamlSettings.documents.all()) {
      this.validate(document);
    }
  }

  validate(textDocument: TextDocument): void {
    this.cleanPendingValidation(textDocument);
    this.yamlSettings.pendingValidationRequests[textDocument.uri] = setTimeout(() => {
      delete this.yamlSettings.pendingValidationRequests[textDocument.uri];
      this.validateTextDocument(textDocument);
    }, this.yamlSettings.validationDelayMs);
  }

  private async validateTextDocument(textDocument: TextDocument): Promise<Diagnostic[]> {
    if (!textDocument) {
      return [];
    }

    const diagnosticResults = await this.languageService.doValidation(
      textDocument,
      isKubernetesAssociatedDocument(textDocument, this.yamlSettings.specificValidatorPaths),
    );

    const { counter, doc } = this.yamlCacher.parseOrGetCached(textDocument);
    const definition = doc.toJS({ maxAliasCount: 10_000 });
    this.connection.console.info(`Validating ${textDocument.uri}`);
    const validatorResult = this.appValidator.validateApp(definition);
    const validationResult = await validateAppDefinition(
      definition,
      (blocks) => this.blockManifestCacher.getCachedBlockVersions(blocks),
      undefined,
      validatorResult,
    );
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
    const diagnostics: Diagnostic[] = [...errors];
    for (const diagnosticItem of diagnosticResults) {
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
    const request = this.yamlSettings.pendingValidationRequests[textDocument.uri];

    if (request) {
      clearTimeout(request);
      delete this.yamlSettings.pendingValidationRequests[textDocument.uri];
    }
  }
}
