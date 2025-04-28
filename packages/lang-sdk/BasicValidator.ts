import {
  type CustomFormat,
  type Options,
  type Schema,
  Validator,
  type ValidatorResult,
} from 'jsonschema';

import { schemas as allSchemas } from './index.js';
import { escapeJsonPointer } from './jsonPointer.js';
import { has } from './miscellaneous.js';

interface ValidatorFactoryOptions {
  schemas: Record<string, Schema>;
  customFormats?: Record<string, CustomFormat>;
}

export class BaseValidatorFactory {
  static readonly defaultOptions: Options = {
    base: '#',
    nestedErrors: true,
  };

  static readonly defaultCustomFormats = {
    int32: () => true,
    int64: () => true,
    float: () => true,
    double: () => true,
    byte: () => true,
    binary: () => true,
    password: () => true,
  };

  private schemas;

  private customFormats;

  constructor({ customFormats, schemas }: ValidatorFactoryOptions) {
    this.customFormats = customFormats;
    this.schemas = schemas;
  }

  build(): Validator {
    const validator = new Validator();

    for (const [key, format] of Object.entries(this.customFormats ?? {})) {
      validator.customFormats[key] = format;
    }

    for (const [key, schema] of Object.entries(this.schemas)) {
      const path = `#/components/schemas/${escapeJsonPointer(key)}`;
      validator.addSchema(schema, path);
    }

    return validator;
  }
}

export class BlockExampleValidator {
  private validator: Validator;

  constructor() {
    this.validator = new BaseValidatorFactory({
      schemas: allSchemas,
      customFormats: {
        ...BaseValidatorFactory.defaultCustomFormats,
        fontawesome: () => true,
        remapper: () => true,
        action: () => true,
        'event-listener': () => true,
        'event-emitter': () => true,
      },
    }).build();
  }

  validate(example: any): ValidatorResult {
    const { required, ...blockSchema } = structuredClone(allSchemas!.BlockDefinition) as Schema;

    delete blockSchema.properties?.name;
    delete blockSchema.properties?.version;

    const actionsSchema = blockSchema.properties!.actions as Schema;

    delete actionsSchema?.additionalProperties;
    if (example.actions) {
      // TODO: do we handle `$any` appropriately here?
      actionsSchema.properties = Object.fromEntries(
        Object.keys(example.actions).map((key) => [
          key,
          { $ref: '#/components/schemas/ActionDefinition' },
        ]),
      );
    }
    const blockEventsSchema = {
      type: 'object',
      additionalProperties: false,
      properties: {} as {
        emit?: Schema;
        listen?: Schema;
      },
    } satisfies Schema;
    blockSchema.properties!.events = blockEventsSchema;
    if (example.events) {
      if (example.events.emit) {
        blockEventsSchema.properties.emit = has(example.events.emit, '$any')
          ? { type: 'object', additionalProperties: { type: 'string' } }
          : {
              type: 'object',
              properties: Object.fromEntries(
                Object.keys(example.events.emit).map((emitter) => [emitter, { type: 'string' }]),
              ),
            };
      }
      if (example.events.listen) {
        blockEventsSchema.properties.listen = has(example.events.listen, '$any')
          ? { type: 'object', additionalProperties: { type: 'string' } }
          : {
              type: 'object',
              properties: Object.fromEntries(
                Object.keys(example.events.listen).map((listener) => [
                  listener,
                  { type: 'string' },
                ]),
              ),
            };
      }
    }

    // TODO: do we validate example parameters properly?

    const validationResult = this.validator.validate(
      example,
      blockSchema,
      BaseValidatorFactory.defaultOptions,
    );
    return validationResult;
  }
}

interface BlockParamInstanceValidatorOptions {
  listeners?: string[];
  emitters?: string[];
  actions?: string[];
}

export class BlockParamInstanceValidator {
  private validator: Validator;

  constructor({
    actions = [],
    emitters = [],
    listeners = [],
  }: BlockParamInstanceValidatorOptions = {}) {
    this.validator = new BaseValidatorFactory({
      // TODO: this may not be so reasonable. Limit these schemas.
      schemas: allSchemas,
      customFormats: {
        ...BaseValidatorFactory.defaultCustomFormats,
        // TODO: validate more
        fontawesome: () => true,
        // TODO: validate more
        remapper: () => true,
        action: (property) => actions.includes(property),
        'event-listener': (property) => listeners.includes(property),
        'event-emitter': (property) => emitters.includes(property),
      },
    }).build();
  }

  // TODO: validate actions and listeners too, somehow
  validateParametersInstance(instance: unknown, schema: Schema): ValidatorResult {
    const actionFormat = this.validator.customFormats.action;
    const listenerFormat = this.validator.customFormats['event-listener'];
    const emitterFormat = this.validator.customFormats['event-emitter'];

    const actionsReferenced = new Set<string>();
    this.validator.customFormats.action = (property) => {
      actionsReferenced.add(property);
      return actionFormat(property);
    };
    return this.validator.validate(instance, schema, BaseValidatorFactory.defaultOptions);
  }
}

export class BlockParamSchemaValidator {
  private validator: Validator;

  constructor() {
    this.validator = new BaseValidatorFactory({
      // TODO: this may not be so reasonable. Limit these schemas.
      schemas: allSchemas,
      customFormats: {
        ...BaseValidatorFactory.defaultCustomFormats,
        fontawesome: () => true,
        remapper: () => true,
        action: () => true,
        'event-listener': () => true,
        'event-emitter': () => true,
      },
    }).build();
  }

  validateParamSchema(paramSchema: Schema): ValidatorResult {
    return this.validator.validate(
      paramSchema,
      allSchemas.JSONSchemaRoot,
      BaseValidatorFactory.defaultOptions,
    );
  }
}

// TODO: complete
export class BlockInstanceValidator {
  private validator: Validator;

  constructor() {
    this.validator = new BaseValidatorFactory({
      schemas: allSchemas,
      customFormats: {
        ...BaseValidatorFactory.defaultCustomFormats,
        fontawesome: () => true,
        remapper: () => true,
        action: () => true,
        'event-listener': () => true,
        'event-emitter': () => true,
      }
    }).build();
  }

  validate(instance: unknown): ValidatorResult {

  }
}

export class AppValidator {
  private validator: Validator;

  constructor() {
    this.validator = new BaseValidatorFactory({
      schemas: allSchemas,
      customFormats: {
        ...BaseValidatorFactory.defaultCustomFormats,
      },
    }).build();
  }

  validateApp(app: unknown): ValidatorResult {
    return this.validator.validate(
      app,
      allSchemas.AppDefinition,
      BaseValidatorFactory.defaultOptions,
    );
  }
}

export class RemapperValidator {
  private validator: Validator;

  constructor() {
    this.validator = new BaseValidatorFactory({
      schemas: allSchemas,
      customFormats: {
        ...BaseValidatorFactory.defaultCustomFormats,
      },
    }).build();
  }

  validateRemapper(remapper: unknown): ValidatorResult {
    return this.validator.validate(
      remapper,
      allSchemas.RemapperDefinition,
      BaseValidatorFactory.defaultOptions,
    );
  }
}
