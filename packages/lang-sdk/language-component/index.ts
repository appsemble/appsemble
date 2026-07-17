export { LanguageComponent, type LanguageComponentBinding } from './languageComponent.js';
export { type CompileOptions, LanguageCtx, type ScanValidation } from './languageCtx.js';
export { Node } from './node.js';
// The fork-free typed-cursor overlay. The opt-in FromSchema derivation (`./overlay-schema.js`) is a
// deep import on purpose, so the barrel never pulls in json-schema-to-ts.
export {
  type ChildValue,
  type ChildValues,
  type Components,
  compileTyped,
  typed,
  type TypedLanguageCtx,
  type TypedNode,
} from './overlay.js';
export { type DynamicChild, type ResolveOptions, type Resolution } from './resolve.js';
export {
  type BindingContext,
  buildTree,
  type IncrementalOptions,
  MountIndex,
  scan,
  ScanResult,
} from './treeLayer.js';
export {
  COMPONENT_KEY,
  type CompositeIdentity,
  type Identity,
  type Mount,
  type NodePath,
  type ScanHit,
  type SchemaTag,
  type SingleIdentity,
  type TagMode,
  type UnresolvedIdentity,
} from './types.js';
