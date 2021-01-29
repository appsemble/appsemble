import { Toggle, useToggle } from '@appsemble/react-components';
import { createContext, ReactElement, ReactNode, useContext } from 'react';

interface MenuProviderProps {
  children: ReactNode;
}

const Context = createContext<Toggle>(null);

export function useMenu(): Toggle {
  return useContext(Context);
}

export function MenuProvider({ children }: MenuProviderProps): ReactElement {
  const value = useToggle();

  return <Context.Provider value={value}>{children}</Context.Provider>;
}
