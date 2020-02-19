import { App } from '@appsemble/types';
import { createContext, useContext } from 'react';

interface AppContext {
  refreshAppInfo(): Promise<void>;
  app: App;
}

export const AppContext = createContext<AppContext>(null);

export default function useApp(): AppContext {
  return useContext(AppContext);
}
