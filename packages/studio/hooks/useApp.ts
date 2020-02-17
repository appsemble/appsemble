import { App } from '@appsemble/types';
import { createContext, useContext } from 'react';

export const AppContext = createContext<App[]>(null);

export default function useApp(): App[] {
  return useContext(AppContext);
}
