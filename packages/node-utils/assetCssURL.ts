const assetUrlMatcher = /url\(\s*asset\(\s*(?:("|')(.*?)\1|([^\s"'()][^)]*))\s*\)\s*\)/g;
const standaloneAssetMatcher = /asset\(\s*(?:("|')(.*?)\1|([^\s"'()][^)]*))\s*\)/g;
const urlMatcher = /url\(\s*(?:("|')(.*?)\1|([^\s"'()][^)]*))\s*\)/g;
const appAssetPathMatcher = /^\/api\/apps\/\d+\/assets\/(.+)$/;

function hasRejectedTokens(value: string): boolean {
  let currentValue = value;

  for (let i = 0; i < 3; i += 1) {
    if (currentValue.includes('..') || /%2f|%5c/i.test(currentValue)) {
      return true;
    }

    if (!currentValue.includes('%')) {
      return false;
    }

    try {
      const decodedValue = decodeURIComponent(currentValue);

      if (decodedValue === currentValue) {
        return false;
      }

      if (decodedValue.includes('/') || decodedValue.includes('\\')) {
        return true;
      }

      currentValue = decodedValue;
    } catch {
      return true;
    }
  }

  return false;
}

function rewriteAppAssetURL(url: string, appId: number, host: string): string {
  const trimmedUrl = url.trim();

  if (trimmedUrl.startsWith('/')) {
    const appAssetPathMatch = appAssetPathMatcher.exec(trimmedUrl);
    if (!appAssetPathMatch) {
      return trimmedUrl;
    }

    const appAssetPath = appAssetPathMatch[1];
    if (hasRejectedTokens(appAssetPath)) {
      return trimmedUrl;
    }

    return String(new URL(`/api/apps/${appId}/assets/${appAssetPath}`, host));
  }

  try {
    const parsedUrl = new URL(trimmedUrl, host);
    const appAssetPathMatch = appAssetPathMatcher.exec(parsedUrl.pathname);
    if (!appAssetPathMatch) {
      return trimmedUrl;
    }

    const appAssetPath = appAssetPathMatch[1];
    if (hasRejectedTokens(appAssetPath)) {
      return trimmedUrl;
    }

    const rewrittenUrl = new URL(`/api/apps/${appId}/assets/${appAssetPath}`, host);
    rewrittenUrl.search = parsedUrl.search;
    rewrittenUrl.hash = parsedUrl.hash;

    return String(rewrittenUrl);
  } catch {
    return trimmedUrl;
  }
}

function resolveAssetURL(appId: number, assetId: string, host: string): string | null {
  if (assetId.startsWith('data:')) {
    return assetId;
  }

  if (assetId.startsWith('/')) {
    const appAssetPathMatch = appAssetPathMatcher.exec(assetId.trim());
    if (appAssetPathMatch && hasRejectedTokens(appAssetPathMatch[1])) {
      return null;
    }

    return rewriteAppAssetURL(assetId, appId, host);
  }

  if (/^https?:\/\//.test(assetId)) {
    const trimmedAssetId = assetId.trim();
    try {
      const parsedUrl = new URL(trimmedAssetId, host);
      const appAssetPathMatch = appAssetPathMatcher.exec(parsedUrl.pathname);
      if (appAssetPathMatch && hasRejectedTokens(appAssetPathMatch[1])) {
        return null;
      }
    } catch {
      return null;
    }

    return rewriteAppAssetURL(assetId, appId, host);
  }

  if (hasRejectedTokens(assetId)) {
    return null;
  }

  return String(new URL(`/api/apps/${appId}/assets/${assetId}`, host));
}

/**
 * Resolve `asset()` functions and app asset URLs in CSS to absolute app asset URLs.
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
  if (!appId) {
    return css;
  }

  const replaceAssetFunction = (match: string, ...args: unknown[]): string => {
    const quotedAssetId = args[1] as string | undefined;
    const unquotedAssetId = args[2] as string | undefined;
    const assetId = (quotedAssetId || unquotedAssetId)?.trim();

    if (!assetId) {
      return match;
    }

    const resolvedAssetUrl = resolveAssetURL(appId, assetId, host);

    if (!resolvedAssetUrl) {
      return match;
    }

    return `url('${resolvedAssetUrl}')`;
  };

  const cssWithResolvedAssetFunctionURLs = css
    .replaceAll(assetUrlMatcher, replaceAssetFunction)
    .replaceAll(standaloneAssetMatcher, replaceAssetFunction);

  return cssWithResolvedAssetFunctionURLs.replaceAll(urlMatcher, (match, ...args) => {
    const quotedUrl = args[1] as string | undefined;
    const unquotedUrl = args[2] as string | undefined;
    const url = (quotedUrl || unquotedUrl)?.trim();

    if (!url) {
      return match;
    }

    const rewrittenUrl = rewriteAppAssetURL(url, appId, host);
    if (rewrittenUrl === url) {
      return match;
    }

    return `url('${rewrittenUrl}')`;
  });
}
