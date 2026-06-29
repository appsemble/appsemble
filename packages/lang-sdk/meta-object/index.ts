export {
  analyzeMetaObjects,
  type IncrementalOptions,
  type MetaAnalysisResult,
  MetaAnalyzer,
  type MetaTree,
  type MetaValidation,
} from './analyze.js';
export { annotateSchema, annotateSchemas } from './annotate.js';
export {
  defineMetaObject,
  type MetaBinding,
  type MetaObjectDef,
  metaBindings,
  metaSchemas,
} from './binding.js';
export { Cursor, cursorAt } from './cursor.js';
export { formatPath, getPath } from './path.js';
export {
  META_KEY,
  type MetaHit,
  type MetaIdentity,
  type MetaInterpretation,
  type MetaMode,
  type MetaObjectPath,
  type MetaTag,
} from './types.js';
