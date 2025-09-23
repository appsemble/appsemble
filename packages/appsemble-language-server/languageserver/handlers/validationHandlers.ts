/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */
import { AppValidator, schemas, validateAppDefinition } from '@appsemble/lang-sdk';
import { type Connection } from 'vscode-languageserver';
import { type TextDocument } from 'vscode-languageserver-textdocument';
import { type Diagnostic, DiagnosticSeverity } from 'vscode-languageserver-types';
import { isNode, type LineCounter } from 'yaml';
import { isKubernetesAssociatedDocument } from 'yaml-language-server/lib/esm/languageservice/parser/isKubernetes.js';
import { removeDuplicatesObj } from 'yaml-language-server/lib/esm/languageservice/utils/arrUtils.js';
import { type LanguageService } from 'yaml-language-server/lib/esm/languageservice/yamlLanguageService.js';

import { type SettingsState } from '../../yamlSettings.js';
import { YamlCacher } from '../utils/YamlCacher.js';

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

  private readonly appValidator: AppValidator;

  constructor(
    connection: Connection,
    languageService: LanguageService,
    yamlSettings: SettingsState,
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

    this.yamlCacher = new YamlCacher();
    this.appValidator = new AppValidator();
  }

  validate(textDocument: TextDocument): void {
    this.cleanPendingValidation(textDocument);
    this.yamlSettings.pendingValidationRequests[textDocument.uri] = setTimeout(() => {
      delete this.yamlSettings.pendingValidationRequests[textDocument.uri];
      this.validateTextDocument(textDocument);
    }, this.yamlSettings.validationDelayMs);
  }

  async validateTextDocument(textDocument: TextDocument): Promise<Diagnostic[]> {
    if (!textDocument) {
      return [];
    }

    const diagnosticResults = await this.languageService.doValidation(
      textDocument,
      isKubernetesAssociatedDocument(textDocument, this.yamlSettings.specificValidatorPaths),
    );

    const { counter, doc } = this.yamlCacher.parseOrGetCached(textDocument);
    const definition = doc.toJS({ maxAliasCount: 10_000 });
    this.connection.console.info(`Validating ${JSON.stringify(definition)}`);
    const validatorResult = this.appValidator.validateApp(definition);
    const validationResult = await validateAppDefinition(
      definition,
      // TODO: please implement!
      () => [],
      undefined,
      validatorResult,
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    this.connection.console.info(`errors are ${errors}`);
    const diagnostics: Diagnostic[] = [...errors];
    //
    // TODO: get cached YAML using textDocument.version and similar logic to
    // `../../../studio/components/MonacoEditor/appValidation/worker.ts`
    // and pass that to `validateAppDefinition`
    //
    for (const diagnosticItem of diagnosticResults) {
      // Convert all warnings to errors
      if (diagnosticItem.severity === 2) {
        diagnosticItem.severity = 1;
      }
      diagnostics.push(diagnosticItem);
    }
    const removeDuplicatesDiagnostics = removeDuplicatesObj(diagnostics);
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
