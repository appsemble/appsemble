import { Toggle, useToggle } from '@appsemble/react-components';
import React, { createContext, ReactElement, ReactNode, useContext } from 'react';

interface MenuProviderProps {
  children: ReactNode;
}

const MenuProviderContext = createContext<Toggle>(null);

export function useMenu(): Toggle {
  return useContext(MenuProviderContext);
}

export default function MenuProvider({ children }: MenuProviderProps): ReactElement {
  const value = useToggle();

  return <MenuProviderContext.Provider value={value}>{children}</MenuProviderContext.Provider>;
}
