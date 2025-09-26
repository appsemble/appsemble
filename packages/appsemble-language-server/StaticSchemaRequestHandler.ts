import { type Logger } from './Logger.js';
import { type SchemaRequestChainHandler } from './SchemaRequestWrapper.js';

interface SchemaLikeEntry {
  uri: string;
  schema?: unknown;
}

export class StaticSchemaRequestHandler implements SchemaRequestChainHandler {
  private readonly schemas: SchemaLikeEntry[];

  private readonly logger: Logger;

  constructor(schemas: SchemaLikeEntry[], logger: Logger) {
    this.schemas = schemas;
    this.logger = logger;
  }

  handle(uri: string): Promise<string | null> {
    this.logger.info(
      `Static schema request for ${uri} among ${this.schemas.map((s) => s.uri).join(', ')}`,
    );
    const schemaEntry = this.schemas.find((s) => s.uri.toLowerCase() === uri.toLowerCase());
    if (schemaEntry) {
      this.logger.info(`Resolving ${uri} as ${JSON.stringify(schemaEntry.schema).slice(0, 100)}`);
      return Promise.resolve(JSON.stringify(schemaEntry.schema));
    }
    this.logger.info(`No static schema found for ${uri}`);
    return Promise.resolve(null);
  }
}
