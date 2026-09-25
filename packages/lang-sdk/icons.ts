import { type IconName } from '@fortawesome/fontawesome-common-types';

import { normalized } from './constants/index.js';
import { fontAwesomeAliases } from './fontAwesome.js';
import { has } from './miscellaneous.js';
import { type IconReference, type IconRegistry } from './types/index.js';

/**
 * The prefix marking a reference to a key in the app’s `icons` registry.
 */
export const customIconPrefix = 'icon:';

/**
 * Check whether a value is a valid icon registry key or icon asset name.
 *
 * @param name The value to check.
 * @returns Whether the value matches the icon name grammar.
 */
export function isValidIconName(name: unknown): name is string {
  return typeof name === 'string' && normalized.test(name);
}

/**
 * Fold a Font Awesome alias to the name of the icon it renders.
 *
 * @param name A Font Awesome icon name or alias.
 * @returns The icon name, or the input if it isn’t an alias.
 */
export function foldFontAwesomeAlias(name: string): string {
  return has(fontAwesomeAliases, name) ? fontAwesomeAliases[name] : name;
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
        reason: `has the invalid icon key “${key}”; keys must match ${normalized.source}`,
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

export type ResolvedIcon =
  | { type: 'asset'; key: string; asset: string }
  | { type: 'fontawesome'; name: IconName }
  | { type: 'invalid'; reason: string };

function resolveEntry(key: string, entry: unknown): ResolvedIcon {
  const asset = typeof entry === 'object' && entry ? (entry as { asset?: unknown }).asset : null;
  if (!isValidIconName(asset)) {
    return {
      type: 'invalid',
      reason: `references the icon key “${key}”, which has an invalid asset name`,
    };
  }
  return { type: 'asset', key, asset };
}

/**
 * Resolve an icon reference against an icon registry.
 *
 * A bare name renders the entry whose `overrides` lists it, comparing Font Awesome aliases by the
 * icon they render, and Font Awesome otherwise. Registry keys and entries are validated here as
 * well, so the result is safe to render even if the registry wasn’t validated when it was
 * published. Only own properties of the registry count.
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
  if (parsed.type === 'invalid') {
    return parsed;
  }
  if (typeof registry !== 'object' || !registry) {
    return parsed.type === 'custom'
      ? { type: 'invalid', reason: `references the unknown icon key “${parsed.key}”` }
      : parsed;
  }
  if (parsed.type === 'fontawesome') {
    const icon = foldFontAwesomeAlias(parsed.name);
    let match: string | undefined;
    for (const [key, entry] of Object.entries(registry)) {
      const overrides: unknown = entry?.overrides;
      if (
        Array.isArray(overrides) &&
        overrides.some((name) => typeof name === 'string' && foldFontAwesomeAlias(name) === icon)
      ) {
        if (match !== undefined) {
          return {
            type: 'invalid',
            reason: `is overridden by both icons.${match} and icons.${key}`,
          };
        }
        match = key;
      }
    }
    return match === undefined ? parsed : resolveEntry(match, registry[match]);
  }
  const { key } = parsed;
  if (!has(registry, key)) {
    return { type: 'invalid', reason: `references the unknown icon key “${key}”` };
  }
  return resolveEntry(key, registry[key]);
}
