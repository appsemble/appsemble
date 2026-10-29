import { NotificationType, RequestType } from 'vscode-languageserver';
import {
  type SchemaAdditions,
  type SchemaDeletions,
} from 'yaml-language-server/lib/esm/languageservice/services/yamlSchemaService.js';
import { type SchemaConfiguration } from 'yaml-language-server/lib/esm/languageservice/yamlLanguageService.js';
import { type SchemaVersions } from 'yaml-language-server/lib/esm/languageservice/yamlTypes.js';

export type ISchemaAssociations = Record<string, string[]>;

export interface JSONSchemaDescription {
  /**
   * Schema URI
   */
  uri: string;

  /**
   * Schema name, from schema store
   */
  name?: string;

  /**
   * Schema description, from schema store
   */
  description?: string;
}

export interface JSONSchemaDescriptionExt extends JSONSchemaDescription {
  /**
   * Is schema used for current document
   */
  usedForCurrentFile: boolean;

  /**
   * Is schema from schema store
   */
  fromStore: boolean;

  versions?: SchemaVersions;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace SchemaAssociationNotification {
  export const type = new NotificationType<ISchemaAssociations | SchemaConfiguration[]>(
    'json/schemaAssociations',
  );
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace DynamicCustomSchemaRequestRegistration {
  export const type = new NotificationType<unknown>('yaml/registerCustomSchemaRequest');
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace VSCodeContentRequestRegistration {
  export const type = new NotificationType<unknown>('yaml/registerContentRequest');
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ResultLimitReachedNotification {
  export const type = new NotificationType<string>('yaml/resultLimitReached');
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace VSCodeContentRequest {
  export const type = new RequestType<string, string, unknown>('vscode/content');
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CustomSchemaContentRequest {
  export const type = new RequestType<string, string, unknown>('custom/schema/content');
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CustomSchemaRequest {
  export const type = new RequestType<unknown, unknown, unknown>('custom/schema/request');
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ColorSymbolRequest {
  export const type = new RequestType<unknown, unknown, unknown>('json/colorSymbols');
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace SchemaModificationNotification {
  export const type = new RequestType<SchemaAdditions | SchemaDeletions, void, unknown>(
    'json/schema/modify',
  );
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace SchemaSelectionRequests {
  export const type = new NotificationType<void>('yaml/supportSchemaSelection');
  export const getSchema = new RequestType<string, JSONSchemaDescription[], unknown>(
    'yaml/get/jsonSchema',
  );
  export const getAllSchemas = new RequestType<string, JSONSchemaDescriptionExt[], unknown>(
    'yaml/get/all/jsonSchemas',
  );
  export const schemaStoreInitialized = new NotificationType<unknown>(
    'yaml/schema/store/initialized',
  );
}
