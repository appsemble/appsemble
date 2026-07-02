import { type NodePath } from './types.js';

function escapePathPart(part: number | string): string {
  return String(part).replaceAll('~', '~0').replaceAll('/', '~1');
}

export function formatPath(path: NodePath): string {
  return path.length ? `/${path.map(escapePathPart).join('/')}` : '/';
}

export function getPath(root: unknown, path: NodePath): unknown {
  let value = root;
  for (const key of path) {
    if (value == null || typeof value !== 'object') {
      return undefined;
    }
    value = (value as Record<number | string, unknown>)[key];
  }
  return value;
}
