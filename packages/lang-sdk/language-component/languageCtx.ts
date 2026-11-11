import { type Schema, type ValidationError, type Validator } from 'jsonschema';

import {
  findPrimitiveComponents,
  LanguageComponent,
  type LanguageComponentBinding,
  type RegistryOf,
  type RootValue,
} from './languageComponent.js';
import { type Components, Node } from './node.js';
import { localShapeFactory, type ResolveContext, type ResolveOptions } from './resolve.js';
import { SchemaRegistry } from './schemaRegistry.js';
import { type BindingContext, type NodeBindingHook } from './treeLayer.js';
import { COMPONENT_KEY, identityNames, type NodePath, type ScanHit, schemaTag } from './types.js';

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

// `Root` (the root value type) and `C` (the component registry) are phantom: they only type the nodes
// `root` hands out (see `Node`).
export class LanguageCtx<Root = unknown, C = Components> {
  private readonly registry: SchemaRegistry;

  // Clean validator for the walk's local checks; never carries the hit side effect.
  private readonly resolveValidator: Validator;

  // Whole-document validator, reused across scans (registering every schema isn't free);
  // `collectHits` reinstalls its hit side effect per call, so it stays separate from the hit-free
  // `resolveValidator`.
  private readonly documentValidator: Validator;

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
    this.rootName = rootName;
    this.rootSchema = rootSchema;
    this.binds = options.binds ?? new Map();
    this.context = options.context;
    const resolveRef = (ref: string): Schema => this.registry.resolveRef(ref);
    this.primitiveComponentNames = findPrimitiveComponents(schemas);
    this.cachedResolveContext = {
      resolveRef,
      localShape: localShapeFactory(),
      dynamicChild: options.dynamicChild,
      loadDynamicChild: options.loadDynamicChild,
      draftChildSchemas: options.draftChildSchemas,
      validator: this.resolveValidator,
      resolutionCache: new WeakMap(),
    };
  }

  // Tagged components that are bare primitives — a dialect-authoring violation (a primitive belongs as a
  // controlled property, never a standalone identity). A dialect-sanity test asserts this is empty.
  get primitiveComponents(): readonly string[] {
    return this.primitiveComponentNames;
  }

  // Compile a schema set, pinning `rootName` (a registry key) as the document root. Reuse the
  // returned context across every value and edit — compile once, then `root`/`buildTree`/`scan` many.
  // Pass `Root`/`C` to type the nodes; they are the caller's promise about the data.
  static compile<Root = unknown, C = Components>(
    schemas: Record<string, Schema>,
    rootName: string,
    options: CompileOptions = {},
  ): LanguageCtx<Root, C> {
    return new LanguageCtx<Root, C>(schemas, rootName, options);
  }

  // Compile component definitions, harvesting the root value type and the registry from each def's
  // `define`-time value type and wiring their bindings (unless `options.binds` overrides them).
  static compileComponents<
    const Defs extends readonly LanguageComponent[],
    RootName extends Defs[number]['name'],
  >(
    defs: Defs,
    rootName: RootName,
    options: CompileOptions = {},
  ): LanguageCtx<RootValue<Defs, RootName>, RegistryOf<Defs>> {
    const list = defs as unknown as LanguageComponent[];
    return LanguageCtx.compile(LanguageComponent.schemas(list), rootName, {
      ...options,
      binds: options.binds ?? LanguageComponent.bindings(list),
    });
  }

  // The descent core (ref resolver, ref-cut, resolve validator, dynamic-child hook) shared by `Node`
  // and `TreeLayer`. Value-independent, built once.
  resolveContext(): ResolveContext {
    return this.cachedResolveContext;
  }

  // Register schemas that arrive after compile — a block's parameter schema, fetched at runtime, carries
  // its own `definitions` and refers to them as `#/definitions/{name}`. Keyed by full ref so `resolveRef`
  // finds them; an already-registered key is kept, so a type one block registers isn't clobbered by
  // another registering the same name. Both validators learn them too, so validation resolves the same
  // refs. (A shared global namespace: two blocks defining the same name with different shapes would
  // collide — acceptable while block-scoped resolution isn't modelled.)
  registerSchemas(schemas: Record<string, Schema>): void {
    for (const [ref, schema] of Object.entries(schemas)) {
      if (this.registry.schemas[ref]) {
        continue;
      }
      this.registry.schemas[ref] = schema;
      this.resolveValidator.addSchema(schema, ref);
      this.documentValidator.addSchema(schema, ref);
    }
  }

  // A navigable root node over `data` (for interactive navigation, boundary-finding,
  // `MountIndex.nodeAt`); the walk doesn't go through here.
  root(data: Root, path: NodePath = []): Node<Root, C> {
    return new Node<Root, C>(this.cachedResolveContext, this.rootSchema, data, path, null);
  }

  // The binding declared for a component identity, if any — so a consumer (e.g. the GUI editor) can read
  // its behaviors or `getExtraAnnotations`.
  bindingFor(name: string): LanguageComponentBinding | undefined {
    return this.binds.get(name);
  }

  // The nearest component at or above `node` whose binding has `hook` (any binding when omitted),
  // and where `path` sits inside it. A node and this context are all a consumer needs: no tree.
  bindingContextFor(
    node: Node,
    hook?: NodeBindingHook,
    path: NodePath = node.path,
  ): BindingContext | undefined {
    for (let current: Node | null = node; current; current = current.parent()) {
      const { identity } = current;
      for (const name of identity ? identityNames(identity) : []) {
        const binding = this.binds.get(name);
        if (binding && (!hook || binding[hook])) {
          return {
            node: current,
            binding,
            componentPath: current.path,
            relativePath: path.slice(current.path.length),
          };
        }
      }
    }
    return undefined;
  }

  // Whole-document validation — the single ref-following pass that answers the cross-`$ref` question.
  // Uses its own validator because collecting hits installs a side effect the resolve validator avoids.
  validate(data: unknown): ScanValidation {
    return collectHits(this.documentValidator, data, this.rootSchema);
  }
}
