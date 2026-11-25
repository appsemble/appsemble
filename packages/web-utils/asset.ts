/**
 * Get the URLs which serve an app asset, in the order they should be tried.
 *
 * The asset is addressed by id when its id is known, because the asset served under an id never
 * changes, so it can be cached for good. The name URL is then its fallback, because the id goes
 * stale when the asset is replaced. Otherwise the asset is addressed by name.
 *
 * @param apiUrl The base URL of the Appsemble API.
 * @param appId The ID of the app owning the asset.
 * @param asset The name of the asset.
 * @param assetIds The asset ids of the app assets which are known, by asset name.
 * @param passwordToken The token which grants access to the assets of a password protected app.
 * @returns The URL to request the asset from, and the URL to fall back to if it fails.
 */
export function getAssetUrls(
  apiUrl: string,
  appId: number,
  asset: string,
  assetIds?: Record<string, string>,
  passwordToken?: string,
): { fallbackUrl?: string; url: string } {
  const assetsUrl = `${apiUrl}/api/apps/${appId}/assets`;
  const search = passwordToken ? `?passwordToken=${passwordToken}` : '';
  const url = `${assetsUrl}/${encodeURIComponent(asset)}${search}`;

  // An asset named `constructor` may not resolve against `Object.prototype`.
  return assetIds && Object.hasOwn(assetIds, asset)
    ? { url: `${assetsUrl}/${encodeURIComponent(assetIds[asset])}${search}`, fallbackUrl: url }
    : { url };
}
