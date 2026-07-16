import { type Schema, type ValidationError, type Validator } from 'jsonschema';

import { type LanguageComponentBinding } from './languageComponent.js';
import { Node } from './node.js';
import { localShapeFactory, type ResolveContext, type ResolveOptions } from './resolve.js';
import { SchemaRegistry } from './schemaRegistry.js';
import { COMPONENT_KEY, type NodePath, type ScanHit, schemaTag } from './types.js';

/**
 * A schema set compiled once and reused across analyses and edits, like a compiled regex: the
 * registry, the two validators, and the ref-cut (`localShape`) cache are keyed on the schema set,
 * never on the data — the value enters at `root(data)`, so a per-keystroke re-analysis reuses every
 * compiled artifact. `LanguageCtx` owns the one non-local op, `validate` (the whole-document
 * ref-following pass), and hands the descent core to `Node`/`TreeLayer` via `resolveContext`.
 */

export interface ScanValidation {
  documentValid: boolean;
  errors: ValidationError[];
  hits: ScanHit[];
}

// Resolve options plus per-component bindings for `MountIndex.callBindingAt` (kept here, not in
// `ResolveOptions`, so the resolve core stays binding-unaware).
export interface CompileOptions extends ResolveOptions {
  binds?: Map<string, LanguageComponentBinding>;
}

function collectHits(validator: Validator, data: unknown, rootSchema: Schema): ScanValidation {
  const hits: ScanHit[] = [];
  // eslint-disable-next-line no-param-reassign
  validator.attributes[COMPONENT_KEY] = (instance, currentSchema, options, context) => {
    const tag = schemaTag(currentSchema);
    if (instance !== undefined && tag) {
      hits.push({ path: context.path, schema: currentSchema, tag });
    }
    return undefined as never;
  };
  const result = validator.validate(data, rootSchema, { base: '#', nestedErrors: true });
  return { documentValid: result.valid, errors: result.errors, hits };
}

export class LanguageCtx {
  private readonly registry: SchemaRegistry;

  // Clean validator for the walk's local checks; never carries the hit side effect.
  private readonly resolveValidator: Validator;

  // Whole-document validator, reused across scans (registering every schema isn't free);
  // `collectHits` reinstalls its hit side effect per call, so it stays separate from the hit-free
  // `resolveValidator`.
  private readonly documentValidator: Validator;

  private readonly localShape: (schema: Schema) => Schema;

  private readonly cachedResolveContext: ResolveContext;

  // The pinned root (a registry key + its schema). The value is not part of the compiled context —
  // it enters at `root(data)`.
  readonly rootName: string;

  readonly rootSchema: Schema;

  // Per-component bindings dispatched by identity name (see `MountIndex.callBindingAt`).
  readonly binds: Map<string, LanguageComponentBinding>;

  private constructor(schemas: Record<string, Schema>, rootName: string, options: CompileOptions) {
    const rootSchema = schemas[rootName];
    if (!rootSchema) {
      throw new Error(`Unknown root component: ${rootName}`);
    }
    this.registry = new SchemaRegistry(schemas);
    const validatorFactory = options.validatorFactory ?? (() => this.registry.createValidator());
    this.resolveValidator = validatorFactory();
    this.documentValidator = validatorFactory();
    this.localShape = localShapeFactory();
    this.rootName = rootName;
    this.rootSchema = rootSchema;
    this.binds = options.binds ?? new Map();
    this.cachedResolveContext = {
      resolveRef: (ref) => this.registry.resolveRef(ref),
      localShape: this.localShape,
      dynamicChild: options.dynamicChild,
      validator: this.resolveValidator,
    };
  }

  // Compile a schema set, pinning `rootName` (a registry key) as the document root. Reuse the
  // returned context across every value and edit — compile once, then `root`/`buildTree`/`scan` many.
  static compile(
    schemas: Record<string, Schema>,
    rootName: string,
    options: CompileOptions = {},
  ): LanguageCtx {
    return new LanguageCtx(schemas, rootName, options);
  }

  // The descent core (ref resolver, ref-cut, resolve validator, dynamic-child hook) shared by `Node`
  // and `TreeLayer`. Value-independent, built once.
  resolveContext(): ResolveContext {
    return this.cachedResolveContext;
  }

  // A navigable root node over `data` (for interactive navigation, boundary-finding,
  // `MountIndex.nodeAt`); the walk doesn't go through here.
  root(data: unknown, path: NodePath = []): Node {
    return new Node(this.cachedResolveContext, this.rootSchema, data, path, null);
  }

  // Whole-document validation — the single ref-following pass that answers the cross-`$ref` question.
  // Uses its own validator because collecting hits installs a side effect the resolve validator avoids.
  validate(data: unknown): ScanValidation {
    return collectHits(this.documentValidator, data, this.rootSchema);
  }
}
