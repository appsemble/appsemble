import { type Schema } from 'jsonschema';

import {
  type AnnotationFactory,
  compileDialect,
  deriveBindings,
  type Dialect,
  mergeWithDerived,
} from './dialect.js';
import {
  type CompileOptions,
  type Diagnostic,
  LanguageComponent,
  type LanguageCtx,
  type NodePath,
} from './language-component/index.js';
import * as schemas from './schemas/index.js';
import { type AppDefinition } from './types/core.js';
import { type ProjectImplementations } from './types/index.js';
import { type BlockVersionsGetter, validateAppDefinition } from './validation.js';

/**
 * The Appsemble dialect of the language-component system: the shipped schemas bulk-`annotate`d into
 * language components, plus any explicitly-`define`d components — which override by name and carry
 * bindings/value-types — rooted at `AppDefinition`.
 *
 * Every consumer (the dialect-sanity gate, the studio/vscode LSP, the GUI editor) should build its
 * context through this one entry point rather than re-annotating the raw schemas, so the
 * schema→component mapping has a single source of truth. An optional `annotationFactory` attaches
 * bindings to the bulk-annotated components no def owns (see `mergeWithDerived`), so a consumer can
 * enrich the shipped schemas without a def each. `options` passes engine hooks through unchanged (e.g.
 * `dynamicChild` for block parameters, `draftChildSchemas` for staged drafts).
 *
 * @param defs Explicitly-defined language components that override bulk-annotated schemas by name.
 * @param annotationFactory Optional factory that attaches bindings to bulk-annotated components no def owns.
 * @returns The assembled dialect rooted at `AppDefinition`.
 */
export function buildAppsembleDialect(
  defs: readonly LanguageComponent[] = [],
  annotationFactory?: AnnotationFactory,
): Dialect {
  const annotated = LanguageComponent.annotate(schemas as unknown as Record<string, Schema>);
  const derived = annotationFactory ? deriveBindings(annotated, annotationFactory) : new Map();
  const { components, schemas: registry } = mergeWithDerived([...defs], annotated, derived);
  return { components, schemas: registry, root: 'AppDefinition' };
}

/**
 * The environment a compiled Appsemble dialect threads to its bindings (`compile({ context })`): what
 * the semantic layer needs but the definition doesn't hold. `validateAppDefinition` reaches its block
 * manifests through `getBlockVersions` and its controller shape through `controllerImplementations`.
 */
export interface AppsembleDialectContext {
  getBlockVersions: BlockVersionsGetter;
  controllerImplementations?: ProjectImplementations;
}

/**
 * The `AppDefinition` component with a binding that runs the shipped `validateAppDefinition` — the
 * whole-document semantic checks JSON-schema can't express (references, block wiring, page geometry).
 * A `define` so it overrides the bulk-annotated `AppDefinition` by name; pass it into
 * `buildAppsembleDialect`/`compileAppsembleDialect`'s `defs`, and the getter through the compile
 * `context`. `validateAppDefinition` stays untouched and the source of truth for every other consumer
 * (server, CLI, studio worker); this only makes it dispatchable as a node binding for the GUI editor.
 * Each error keeps its own path (relative to the root `AppDefinition` node, i.e. absolute in the
 * document), so a consumer places it on the offending node rather than piling every issue on the root.
 *
 * @returns The `AppDefinition` component whose binding dispatches `validateAppDefinition`.
 */
export function appDefinitionValidationDef(): LanguageComponent<
  'AppDefinition',
  AppDefinition,
  AppsembleDialectContext
> {
  return LanguageComponent.define<'AppDefinition', AppDefinition, AppsembleDialectContext>(
    'AppDefinition',
    schemas.AppDefinition as Schema,
    {
      async validate(node, ctx): Promise<Diagnostic[]> {
        const result = await validateAppDefinition(
          node.val as AppDefinition,
          ctx.getBlockVersions,
          ctx.controllerImplementations,
        );
        return result.errors.map((error) => ({
          message: error.message,
          path: error.path as NodePath,
        }));
      },
    },
  );
}

// Build the Appsemble dialect and compile it in one step — sugar over
// `compileDialect(buildAppsembleDialect(...))`.
export function compileAppsembleDialect(
  defs: readonly LanguageComponent[] = [],
  options: CompileOptions = {},
  annotationFactory?: AnnotationFactory,
): LanguageCtx {
  return compileDialect(buildAppsembleDialect(defs, annotationFactory), options);
}
