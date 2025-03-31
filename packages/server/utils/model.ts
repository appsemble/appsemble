import type * as models from '../models/index.js';

/**
 * Resolves the icon url for an app based on whether it’s present and when it was updated.
 *
 * @param app The app to resolve the icon url for.
 * @returns A URL that can be safely cached.
 */
export function resolveIconUrl(app: models.App): string {
  const hasIcon = app.get('hasIcon') ?? Boolean(app.icon);

  if (hasIcon) {
    return `/api/apps/${app.id}/icon?${new URLSearchParams({
      maskable: 'true',
      updated: app.updated.toISOString(),
    })}`;
  }

  const organizationHasIcon = app.Organization?.get('hasIcon');
  if (organizationHasIcon) {
    return `/api/organizations/${app.OrganizationId}/icon?${new URLSearchParams({
      background: app.iconBackground || '#ffffff',
      maskable: 'true',
      updated: app.Organization!.updated.toISOString(),
    })}`;
  }

  // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
  return null;
}
