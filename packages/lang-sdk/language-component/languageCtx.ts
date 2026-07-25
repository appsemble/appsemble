import { type Schema, type ValidationError, type Validator } from 'jsonschema';

import {
  analyzeDistinguishability,
  type DistinguishabilityResult,
  type UnionCollision,
} from './distinguishability.js';
import { findPrimitiveComponents, type LanguageComponentBinding } from './languageComponent.js';
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
  // The dialect's environment bag, threaded to every binding hook (`validate`/`complete`/`describe`) so
  // the semantic layer can reach what the document doesn't hold — a block registry, resource catalog,
  // feature config. Held opaque here (`unknown`); a dialect that declared a `Ctx` on its bindings passes
  // the matching value and narrows at the authoring site.
  context?: unknown;
}

function collectHits(validator: Validator, data: unknown, rootSchema: Schema): ScanValidation {
  const hits: ScanHit[] = [];
  // eslint-disable-next-line no-param-reassign
  validator.attributes[COMPONENT_KEY] = (instance, currentSchema, options, context) => {
    const tag = schemaTag(currentSchema);
    if (instance !== undefined && tag) {
      hits.push({
        path: (context as typeof context & { path: ScanHit['path'] }).path,
        schema: currentSchema,
        tag,
      });
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

  // The dialect environment bag passed to every binding hook. Opaque to the engine; the dialect owns
  // its shape. `undefined` when a plain DSL declared no environment.
  readonly context: unknown;

  // Compile-time verdict per union: can ref-cut local matching always pick correctly? Gates the
  // runtime escalation and surfaces the authoring lint via `distinguishabilityLint`.
  private readonly distinguishability: DistinguishabilityResult;

  // Tagged components that are bare primitives — the dialect-sanity violation set (see
  // `findPrimitiveComponents`). Computed once at compile from the schema set.
  private readonly primitiveComponentNames: readonly string[];

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
    this.context = options.context;
    const resolveRef = (ref: string): Schema => this.registry.resolveRef(ref);
    this.distinguishability = analyzeDistinguishability([rootSchema], resolveRef, this.localShape);
    this.primitiveComponentNames = findPrimitiveComponents(schemas);
    this.cachedResolveContext = {
      resolveRef,
      localShape: this.localShape,
      dynamicChild: options.dynamicChild,
      loadDynamicChild: options.loadDynamicChild,
      draftChildSchemas: options.draftChildSchemas,
      validator: this.resolveValidator,
      refCutSufficient: (schema) => this.distinguishability.refCutSufficient.get(schema) ?? true,
      resolutionCache: new WeakMap(),
    };
  }

  // Unions whose branches aren't provably distinguishable by ref-cut local shape — the authoring
  // lint. Each names a union, a colliding branch pair, and a severity set by the component labels:
  // `error` = two distinct labeled components can't be told apart (a labeling-vs-shape contradiction),
  // `warning` = a labeled component whose forms over-broaden, `info` = a structural overlap. Adding a
  // discriminant (a `type` const, a unique required key, or an `x-appsemble-discriminator`) clears it.
  get distinguishabilityLint(): readonly UnionCollision[] {
    return this.distinguishability.collisions;
  }

  // The `error`-severity subset: distinct labeled components a dialect declares as separate kinds yet
  // leaves indistinguishable. The high-signal dialect-sanity failures worth blocking on.
  get distinguishabilityErrors(): readonly UnionCollision[] {
    return this.distinguishability.collisions.filter((collision) => collision.severity === 'error');
  }

  // Tagged components that are bare primitives — a dialect-authoring violation (a primitive belongs as a
  // controlled property, never a standalone identity). A dialect-sanity test asserts this is empty.
  get primitiveComponents(): readonly string[] {
    return this.primitiveComponentNames;
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

  // The binding declared for a component identity, if any — so a consumer (e.g. the GUI editor) can read
  // its behaviors or `getExtraAnnotations`. Dispatched by the same identity name as the walk's hooks.
  bindingFor(name: string): LanguageComponentBinding | undefined {
    return this.binds.get(name);
  }

  // Whole-document validation — the single ref-following pass that answers the cross-`$ref` question.
  // Uses its own validator because collecting hits installs a side effect the resolve validator avoids.
  validate(data: unknown): ScanValidation {
    return collectHits(this.documentValidator, data, this.rootSchema);
  }
}
