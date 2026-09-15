import { type IconRegistry } from '@appsemble/lang-sdk';
import { getIconAssetUrl } from '@appsemble/web-utils';
import { createContext, type ReactNode, useContext, useMemo } from 'react';

export interface IconContext {
  /**
   * The `icons` registry of the app whose icons are rendered.
   */
  registry?: IconRegistry;

  /**
   * Build the URL of an icon asset of the app by its validated asset name.
   */
  getAssetUrl?: (asset: string) => string;
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
export function IconProvider({ apiUrl, appId, children, registry }: IconProviderProps): ReactNode {
  const value = useMemo<IconContext>(
    () => ({
      registry,
      getAssetUrl: (asset) => getIconAssetUrl(apiUrl, appId, asset),
    }),
    [apiUrl, appId, registry],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useIconContext(): IconContext {
  return useContext(Context);
}
