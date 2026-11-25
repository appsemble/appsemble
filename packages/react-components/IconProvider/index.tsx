import { type IconRegistry } from '@appsemble/lang-sdk';
import { type AssetIcon, getIconAsset } from '@appsemble/web-utils';
import { createContext, type ReactNode, useContext, useMemo } from 'react';

export interface IconContext {
  /**
   * The `icons` registry of the app whose icons are rendered.
   */
  registry?: IconRegistry;

  /**
   * Get the renderable icon of an asset of the app by its validated asset name.
   */
  getAsset?: (asset: string) => AssetIcon;
}

const Context = createContext<IconContext>({});

interface IconProviderProps {
  /**
   * The base URL of the Appsemble API serving the app’s assets.
   */
  readonly apiUrl: string;

  /**
   * The ID of the app whose icon registry is provided.
   */
  readonly appId: number;

  /**
   * The asset ids of the app’s icon assets, by asset name.
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

  readonly children: ReactNode;
}

/**
 * Provide the icon registry of an app to the `Icon` components rendered inside.
 *
 * Outside a provider, Font Awesome icons still render and registry references resolve as invalid.
 */
export function IconProvider({
  apiUrl,
  appId,
  assetIds,
  children,
  passwordToken,
  registry,
}: IconProviderProps): ReactNode {
  const value = useMemo<IconContext>(
    () => ({
      registry,
      getAsset: (asset) => getIconAsset(apiUrl, appId, asset, assetIds, passwordToken),
    }),
    [apiUrl, appId, assetIds, passwordToken, registry],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useIconContext(): IconContext {
  return useContext(Context);
}
