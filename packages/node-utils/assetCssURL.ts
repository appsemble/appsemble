import { normalized, StyleValidationError, uuid4Pattern } from '@appsemble/utils';
import { type CssNode, parse, walk } from 'css-tree';

const appIdPattern = /^\d+$/;

interface Replacement {
  start: number;
  end: number;
  value: string;
}

/**
 * Create a replacement of the source a node was parsed from.
 *
 * @param node The node whose source to replace. It must have been parsed with positions.
 * @param offset The offset of the source the node was parsed from within the stylesheet.
 * @param value The value to replace the source of the node with.
 * @returns The replacement.
 */
function replaceNode(node: CssNode, offset: number, value: string): Replacement {
  return {
    start: offset + node.loc!.start.offset,
    end: offset + node.loc!.end.offset,
    value,
  };
}

/**
 * Parse the value of a declaration whose value the stylesheet parser left raw.
 *
 * Custom properties hold an arbitrary token stream, so their value is never parsed as part of the
 * stylesheet.
 *
 * @param value The raw value to parse.
 * @returns The parsed value, or `null` if it is not a valid declaration value.
 */
function parseRawValue(value: string): CssNode | null {
  try {
    return parse(value, { context: 'value', positions: true });
  } catch {
    return null;
  }
}

function isValidAssetReference(reference: string): boolean {
  return normalized.test(reference) || uuid4Pattern.test(reference);
}

/**
 * Split a URL value into the part that addresses a resource and the query and fragment that follow.
 *
 * @param value The URL value to split.
 * @returns The path and the query and fragment suffix.
 */
function splitURLParts(value: string): { path: string; suffix: string } {
  const suffixIndex = Math.min(
    ...['?', '#'].map((separator) => {
      const index = value.indexOf(separator);
      return index === -1 ? value.length : index;
    }),
  );

  return { path: value.slice(0, suffixIndex), suffix: value.slice(suffixIndex) };
}

/**
 * Extract the asset reference addressed by an app asset endpoint path.
 *
 * @param path The path to inspect.
 * @returns The asset reference, or `null` if the path is not an app asset endpoint path.
 */
function getAppAssetPathReference(path: string): string | null {
  const [empty, api, apps, appIdSegment, assets, reference, ...rest] = path.split('/');

  if (rest.length || empty !== '' || api !== 'api' || apps !== 'apps' || assets !== 'assets') {
    return null;
  }

  if (!appIdPattern.test(appIdSegment) || !isValidAssetReference(reference)) {
    return null;
  }

  return reference;
}

/**
 * Create the app asset URL addressing an asset, to be embedded in a single quoted CSS string.
 *
 * The query and fragment are taken from the reference the asset was addressed with, so they may
 * hold characters that end the CSS string. `URL` strips or encodes all of those except the quote
 * and the backslash, which are percent encoded here.
 *
 * @param reference The reference of the asset to address.
 * @param suffix The query and fragment to append to the URL.
 * @param appId The id of the app the asset belongs to.
 * @param host The host on which the app asset endpoints are available.
 * @returns The app asset URL.
 */
function createAppAssetURL(reference: string, suffix: string, appId: number, host: string): string {
  const path = `/api/apps/${appId}/assets/${encodeURIComponent(reference)}${suffix}`;

  return String(new URL(path, host)).replaceAll('\\', '%5C').replaceAll("'", '%27');
}

/**
 * Resolve the contents of an `asset()` utility to an app asset URL.
 *
 * @param value The asset reference or app asset endpoint path the utility was called with.
 * @param appId The id of the app the asset belongs to.
 * @param host The host on which the app asset endpoints are available.
 * @returns The app asset URL the utility resolves to.
 */
function resolveAssetReference(value: string, appId: number, host: string): string {
  if (value.startsWith('/')) {
    const { path, suffix } = splitURLParts(value);
    const reference = getAppAssetPathReference(path);

    if (reference) {
      return createAppAssetURL(reference, suffix, appId, host);
    }
  } else if (isValidAssetReference(value)) {
    return createAppAssetURL(value, '', appId, host);
  }

  throw new StyleValidationError(`Invalid asset reference: ${value}`);
}

/**
 * Rewrite an app asset URL so it addresses the given app on the given host.
 *
 * Stylesheets are stored with their asset references already resolved to absolute URLs, so a
 * stylesheet copied from another app addresses that app on this host. Such URLs are rewritten as
 * well, unlike URLs addressing another host.
 *
 * @param value The URL to rewrite.
 * @param appId The id of the app the asset belongs to.
 * @param host The host on which the app asset endpoints are available.
 * @returns The rewritten URL, or `null` if the value does not address an app asset.
 */
function rewriteAppAssetURL(value: string, appId: number, host: string): string | null {
  let path: string;
  let suffix: string;

  if (value.startsWith('/')) {
    ({ path, suffix } = splitURLParts(value));
  } else {
    if (!URL.canParse(value)) {
      return null;
    }

    const url = new URL(value);

    if (url.origin !== new URL(host).origin) {
      return null;
    }

    path = url.pathname;
    suffix = `${url.search}${url.hash}`;
  }

  const reference = getAppAssetPathReference(path);

  return reference ? createAppAssetURL(reference, suffix, appId, host) : null;
}

/**
 * Resolve all app asset references in CSS to absolute app asset URLs.
 *
 * @param css The CSS to process.
 * @param appId The id of the app the assets belong to.
 * @param host The host on which the app asset endpoints are available.
 * @returns The CSS with all app asset references resolved.
 */
function resolveAssetReferences(css: string, appId: number, host: string): string {
  const replacements: Replacement[] = [];

  /**
   * Collect the replacements of all app asset references in a tree.
   *
   * @param node The tree to collect replacements from.
   * @param offset The offset of the source the tree was parsed from within the stylesheet.
   */
  function collectReplacements(node: CssNode, offset: number): void {
    walk(node, (child) => {
      if (child.type === 'Function' && child.name.toLowerCase() === 'asset') {
        const [argument, ...rest] = child.children;

        if (rest.length || argument?.type !== 'String') {
          throw new StyleValidationError('The asset utility takes a single string');
        }

        replacements.push(
          replaceNode(
            child,
            offset,
            `url('${resolveAssetReference(argument.value, appId, host)}')`,
          ),
        );
        return;
      }

      if (child.type === 'Url') {
        const rewrittenURL = rewriteAppAssetURL(child.value, appId, host);

        if (rewrittenURL) {
          replacements.push(replaceNode(child, offset, `url('${rewrittenURL}')`));
        }
        return;
      }

      if (child.type === 'Raw') {
        const value = parseRawValue(child.value);

        if (value) {
          collectReplacements(value, offset + child.loc!.start.offset);
        }
      }
    });
  }

  collectReplacements(parse(css, { positions: true }), 0);

  let result = css;

  for (const replacement of replacements.reverse()) {
    result = result.slice(0, replacement.start) + replacement.value + result.slice(replacement.end);
  }

  return result;
}

/**
 * Resolve `asset()` utilities and app asset URLs in CSS to absolute app asset URLs.
 *
 * An `asset()` utility takes a single string, holding either an asset reference or an app asset
 * endpoint path. Both it and `url()` values addressing an app asset endpoint are replaced with a
 * `url()` value addressing the given app on the given host. All other values are left untouched.
 *
 * @param css The CSS to process.
 * @param appId The id of the app the assets belong to.
 * @param host The host on which the app asset endpoints are available.
 * @returns The CSS with all app asset references resolved.
 */
export function replaceAssetFunctions(
  css: string,
  appId: number | undefined,
  host: string,
): string {
  return appId ? resolveAssetReferences(css, appId, host) : css;
}
