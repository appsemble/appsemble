export {
  analyzeDistinguishability,
  type CollisionSeverity,
  type DistinguishabilityResult,
  formatCollision,
  type UnionCollision,
} from './distinguishability.js';
export {
  type Diagnostic,
  findPrimitiveComponents,
  LanguageComponent,
  type LanguageComponentBinding,
  readExtraAnnotations,
} from './languageComponent.js';
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
export {
  type Discriminator,
  type DynamicChild,
  type LoadDynamicChild,
  readDiscriminator,
  type ResolvedUnion,
  type ResolveOptions,
  type Resolution,
  type UnionBranch,
} from './resolve.js';
export {
  type BindingContext,
  buildTree,
  buildTreeAsync,
  type IncrementalOptions,
  MountIndex,
  scan,
  scanAsync,
  ScanResult,
} from './treeLayer.js';
export {
  COMPONENT_KEY,
  type CompositeIdentity,
  isTagged,
  type Identity,
  type Mount,
  type NodePath,
  type ScanHit,
  type SchemaTag,
  type SingleIdentity,
  type TagMode,
  type UnresolvedIdentity,
} from './types.js';
