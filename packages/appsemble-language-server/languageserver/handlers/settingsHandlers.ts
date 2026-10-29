/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */
import {
  type Connection,
  DidChangeConfigurationNotification,
  DocumentFormattingRequest,
} from 'vscode-languageserver';
import { cloneDeep } from 'lodash-es';
import { type Telemetry } from 'yaml-language-server/lib/esm/languageservice/telemetry.js';
import {
  isRelativePath,
  relativeToAbsolutePath,
} from 'yaml-language-server/lib/esm/languageservice/utils/paths.js';
import {
  checkSchemaURI,
  KUBERNETES_SCHEMA_URL,
} from 'yaml-language-server/lib/esm/languageservice/utils/schemaUrls.js';
import {
  type LanguageService,
  type LanguageSettings,
  SchemaPriority,
} from 'yaml-language-server/lib/esm/languageservice/yamlLanguageService.js';

import { type ValidationHandler } from './validationHandlers.js';
import { type Logger } from '../../Logger.js';
import { type Settings, type SettingsState } from '../../yamlSettings.js';

export class SettingsHandler {
  private connection: Connection;

  private languageService: LanguageService;

  private yamlSettings: SettingsState;

  private validationHandler: ValidationHandler;

  private telemetry: Telemetry;

  private logger: Logger;

  constructor(
    connection: Connection,
    languageService: LanguageService,
    yamlSettings: SettingsState,
    validationHandler: ValidationHandler,
    telemetry: Telemetry,
    logger: Logger,
  ) {
    this.connection = connection;
    this.languageService = languageService;
    this.yamlSettings = yamlSettings;
    this.validationHandler = validationHandler;
    this.telemetry = telemetry;
    this.logger = logger;
  }

  async registerHandlers(): Promise<void> {
    if (
      this.yamlSettings.hasConfigurationCapability &&
      this.yamlSettings.clientDynamicRegisterSupport
    ) {
      try {
        // Register for all configuration changes.
        await this.connection.client.register(DidChangeConfigurationNotification.type);
      } catch (err) {
        this.telemetry.sendError('yaml.settings.error', err);
      }
    }
    this.connection.onDidChangeConfiguration(() =>
      this.pullConfiguration().catch((error: unknown) => {
        this.connection.console.error(`Error pulling configuration: ${error}`);
      }),
    );
  }

  async pullConfiguration(): Promise<void> {
    const appsemble = await this.connection.workspace.getConfiguration({ section: 'appsemble' });
    const settings: Readonly<Settings> = {
      appsemble: appsemble ?? {},
    };
    this.setConfiguration(settings);
  }

  private setConfiguration(settings: Settings): void {
    this.yamlSettings.specificValidatorPaths = [];

    if (settings.appsemble.blockRegistryBaseUrl) {
      this.yamlSettings.blockRegistryBaseUrl = settings.appsemble.blockRegistryBaseUrl;
      this.logger.log(`Changed block registry URL to ${this.yamlSettings.blockRegistryBaseUrl}`);
    }

    this.updateConfiguration();

    // Dynamically enable & disable the formatter
    if (this.yamlSettings.clientDynamicRegisterSupport) {
      const enableFormatter = this.yamlSettings.yamlFormatterSettings.enable;

      if (enableFormatter) {
        if (!this.yamlSettings.formatterRegistration) {
          this.yamlSettings.formatterRegistration = this.connection.client.register(
            DocumentFormattingRequest.type,
            {
              documentSelector: [
                { language: 'yaml' },
                { language: 'dockercompose' },
                { language: 'github-actions-workflow' },
                { pattern: '*.y(a)ml' },
              ],
            },
          );
        }
      } else if (this.yamlSettings.formatterRegistration) {
        this.yamlSettings.formatterRegistration.then((r) => r.dispose());
        this.yamlSettings.formatterRegistration = null;
      }
    }
  }

  /**
   * Called when server settings or schema associations are changed
   * Re-creates schema associations and re-validates any open YAML files
   */
  private updateConfiguration(): void {
    this.applyLanguageSettings();
    this.validationHandler.handleSettingsUpdate();
  }

  /**
   * Configure the language service from the current settings.
   *
   * This drops every schema the language service has loaded, so each is loaded again from its
   * source the next time it is needed.
   */
  applyLanguageSettings(): void {
    let languageSettings: LanguageSettings = {
      validate: this.yamlSettings.yamlShouldValidate,
      hover: this.yamlSettings.yamlShouldHover,
      completion: this.yamlSettings.yamlShouldCompletion,
      schemas: [],
      customTags: this.yamlSettings.customTags,
      format: this.yamlSettings.yamlFormatterSettings.enable,
      indentation: this.yamlSettings.indentation,
      disableAdditionalProperties: this.yamlSettings.disableAdditionalProperties,
      disableDefaultProperties: this.yamlSettings.disableDefaultProperties,
      parentSkeletonSelectedFirst: this.yamlSettings.suggest.parentSkeletonSelectedFirst,
      flowMapping: this.yamlSettings.style?.flowMapping,
      flowSequence: this.yamlSettings.style?.flowSequence,
      yamlVersion: this.yamlSettings.yamlVersion,
      keyOrdering: this.yamlSettings.keyOrdering,
    };

    if (this.yamlSettings.schemaAssociations) {
      if (Array.isArray(this.yamlSettings.schemaAssociations)) {
        for (const association of this.yamlSettings.schemaAssociations) {
          languageSettings = this.configureSchemas(
            association.uri,
            association.fileMatch ?? [],
            association.schema,
            languageSettings,
            SchemaPriority.SchemaAssociation,
          );
        }
      } else {
        for (const uri in this.yamlSettings.schemaAssociations) {
          if (Object.hasOwn(this.yamlSettings.schemaAssociations, uri)) {
            const fileMatch = this.yamlSettings.schemaAssociations[uri];
            languageSettings = this.configureSchemas(
              uri,
              fileMatch,
              null,
              languageSettings,
              SchemaPriority.SchemaAssociation,
            );
          }
        }
      }
    }

    if (this.yamlSettings.schemaConfigurationSettings) {
      this.connection.console.info('Applying schemaConfigurationSettings');
      for (const schema of this.yamlSettings.schemaConfigurationSettings) {
        let uri = schema.uri as string | undefined;
        if (!uri && schema.schema) {
          uri = schema.schema?.id;
        }
        if (!uri && schema.fileMatch) {
          uri = `vscode://schemas/custom/${encodeURIComponent(schema.fileMatch.join('&'))}`;
        }
        if (uri) {
          if (isRelativePath(uri)) {
            uri = relativeToAbsolutePath(
              this.yamlSettings.workspaceFolders,
              this.yamlSettings.workspaceRoot!,
              uri,
            );
          }

          languageSettings = this.configureSchemas(
            uri,
            schema.fileMatch ?? [],
            schema.schema,
            languageSettings,
            SchemaPriority.Settings,
          );
        }
      }
    }

    if (this.yamlSettings.schemaStoreSettings) {
      languageSettings.schemas = (languageSettings.schemas ?? []).concat(
        this.yamlSettings.schemaStoreSettings,
      );
    }

    this.connection.console.info(
      `Applying languageSettings with N schemas: ${languageSettings.schemas?.length}`,
    );

    this.languageService.configure(languageSettings);
  }

  /**
   * Stores schema associations in server settings, handling kubernetes
   *
   * @param checkedURI string path to schema (whether local or online)
   * @param fileMatch file pattern to apply the schema to
   * @param schema schema id
   * @param languageSettings current server settings
   * @param priorityLevel
   */

  private configureSchemas(
    uri: string,
    fileMatch: string[] | string,
    schema: unknown,
    languageSettings: LanguageSettings,
    priorityLevel: number,
  ): LanguageSettings {
    const checkedURI = checkSchemaURI(
      this.yamlSettings.workspaceFolders,
      this.yamlSettings.workspaceRoot!,
      uri,
      this.telemetry,
    );

    const fileMatchArray = ([] as string[]).concat(fileMatch);

    if (schema == null) {
      languageSettings.schemas?.push({
        uri: checkedURI,
        fileMatch: fileMatchArray,
        priority: priorityLevel,
      });
    } else {
      languageSettings.schemas?.push({
        uri: checkedURI,
        fileMatch: fileMatchArray,
        schema: cloneDeep(schema),
        priority: priorityLevel,
      });
    }

    if (checkedURI === KUBERNETES_SCHEMA_URL) {
      this.yamlSettings.specificValidatorPaths.push(...fileMatchArray);
    }

    return languageSettings;
  }
}
