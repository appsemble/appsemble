import { type IconReference, type IconRegistry } from '@appsemble/lang-sdk';
import { fa, getIconAsset, resolveIcon } from '@appsemble/web-utils';
import { type IconName } from '@fortawesome/fontawesome-common-types';
import { type ComponentChildren, createContext, type VNode } from 'preact';
import { useContext, useMemo } from 'preact/hooks';

export interface IconContext {
  /**
   * Get the Font Awesome class names of an icon.
   */
  fa: (icon: IconName) => string;

  /**
   * Resolve an icon reference against the icon registry of the app.
   */
  resolveIcon: (reference: IconReference) => ReturnType<typeof resolveIcon>;
}

const Context = createContext<IconContext | null>(null);

interface IconProviderProps {
  /**
   * The base URL of the Appsemble API serving the app's assets.
   */
  readonly apiUrl: string;

  /**
   * The ID of the app whose icon registry is provided.
   */
  readonly appId: number;

  /**
   * The asset ids of the app's icon assets, by asset name.
   */
  readonly assetIds?: Record<string, string>;

  /**
   * The token which grants access to the assets of a password protected app.
   */
  readonly passwordToken?: string;

  /**
   * The `icons` registry of the app definition.
   */
  readonly registry: IconRegistry | undefined;

  readonly children: ComponentChildren;
}

/**
 * Provide the icon registry of an app to the `Icon` components rendered inside.
 *
 * Inside a block, `Icon` resolves icons using the block utils instead, so blocks don't bundle the
 * icon resolution.
 */
export function IconProvider({
  apiUrl,
  appId,
  assetIds,
  children,
  passwordToken,
  registry,
}: IconProviderProps): VNode {
  const value = useMemo<IconContext>(
    () => ({
      fa,
      resolveIcon: (reference) =>
        resolveIcon(reference, registry, (asset) =>
          getIconAsset(apiUrl, appId, asset, assetIds, passwordToken),
        ),
    }),
    [apiUrl, appId, assetIds, passwordToken, registry],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useIconContext(): IconContext | null {
  return useContext(Context);
}
