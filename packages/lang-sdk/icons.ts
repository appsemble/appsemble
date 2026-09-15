import { type IconName } from '@fortawesome/fontawesome-common-types';

import { has } from './miscellaneous.js';
import { type IconReference, type IconRegistry } from './types/index.js';

/**
 * The prefix marking a reference to a key in the app’s `icons` registry.
 */
export const customIconPrefix = 'icon:';

/**
 * The pattern icon registry keys and the asset names they map to must match.
 *
 * This matches the asset names produced by the CLI and Studio upload flows.
 */
export const iconNamePattern = /^[\da-z]+(?:-[\da-z]+)*$/;

/**
 * Check whether a value is a valid icon registry key or icon asset name.
 *
 * @param name The value to check.
 * @returns Whether the value matches the icon name grammar.
 */
export function isValidIconName(name: unknown): name is string {
  return typeof name === 'string' && iconNamePattern.test(name);
}

export type ParsedIconReference =
  | { type: 'custom'; key: string }
  | { type: 'fontawesome'; name: IconName }
  | { type: 'invalid'; reason: string };

/**
 * Parse an icon reference without consulting a registry.
 *
 * Bare names are treated as Font Awesome names without checking them against the Font Awesome
 * icon set. Only the `icon:` prefix is recognized; any other colon-separated prefix is rejected.
 *
 * @param reference The value to parse.
 * @returns The parsed reference, or an invalid result with a reason.
 */
export function parseIconReference(reference: unknown): ParsedIconReference {
  if (typeof reference !== 'string') {
    return { type: 'invalid', reason: 'must be a string' };
  }
  if (!reference) {
    return { type: 'invalid', reason: 'must not be empty' };
  }
  if (reference.startsWith(customIconPrefix)) {
    const key = reference.slice(customIconPrefix.length);
    if (!isValidIconName(key)) {
      return {
        type: 'invalid',
        reason: `has the invalid icon key “${key}”; keys must match ${iconNamePattern.source}`,
      };
    }
    return { type: 'custom', key };
  }
  if (reference.includes(':')) {
    return {
      type: 'invalid',
      reason: `uses the unsupported prefix “${reference.slice(0, reference.indexOf(':') + 1)}”; only “${customIconPrefix}” is supported`,
    };
  }
  return { type: 'fontawesome', name: reference as IconName };
}

/**
 * Check whether a value is a syntactically valid icon reference.
 *
 * This is the check behind the `icon` schema format. It doesn’t consult a registry.
 *
 * @param reference The value to check.
 * @returns Whether the value is a bare icon name or a well-formed `icon:<key>` reference.
 */
export function isValidIconReference(reference: unknown): reference is IconReference {
  return parseIconReference(reference).type !== 'invalid';
}

/**
 * Check whether a value references a custom icon.
 *
 * @param reference The value to check.
 * @returns Whether the value starts with the custom icon prefix.
 */
export function isCustomIconReference(reference: unknown): reference is `icon:${string}` {
  return typeof reference === 'string' && reference.startsWith(customIconPrefix);
}

export type ResolvedIcon =
  | { type: 'asset'; key: string; asset: string }
  | { type: 'fontawesome'; name: IconName }
  | { type: 'invalid'; reason: string };

/**
 * Resolve an icon reference against an icon registry.
 *
 * Registry keys and entries are validated here as well, so the result is safe to render even if
 * the registry wasn’t validated when it was published. Only own properties of the registry count.
 *
 * @param reference The icon reference to resolve.
 * @param registry The app’s icon registry.
 * @returns A Font Awesome icon name, a validated asset name, or an invalid result with a reason.
 */
export function resolveIconReference(
  reference: unknown,
  registry?: IconRegistry | null,
): ResolvedIcon {
  const parsed = parseIconReference(reference);
  if (parsed.type !== 'custom') {
    return parsed;
  }
  const { key } = parsed;
  if (typeof registry !== 'object' || !registry || !has(registry, key)) {
    return { type: 'invalid', reason: `references the unknown icon key “${key}”` };
  }
  const entry: unknown = registry[key];
  const asset = typeof entry === 'object' && entry ? (entry as { asset?: unknown }).asset : null;
  if (!isValidIconName(asset)) {
    return {
      type: 'invalid',
      reason: `references the icon key “${key}”, which has an invalid asset name`,
    };
  }
  return { type: 'asset', key, asset };
}
