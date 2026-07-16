export { LanguageComponent, type LanguageComponentBinding } from './languageComponent.js';
export { type CompileOptions, LanguageCtx, type ScanValidation } from './languageCtx.js';
export { Node } from './node.js';
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
