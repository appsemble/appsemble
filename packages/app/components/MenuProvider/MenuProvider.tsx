import { useToggle } from '@appsemble/react-components';
import { Toggle } from '@appsemble/react-components/hooks/useToggle';
import * as React from 'react';

interface MenuProviderProps {
  children: React.ReactNode;
}

const MenuProviderContext = React.createContext<Toggle>(null);

export function useMenu(): Toggle {
  return React.useContext(MenuProviderContext);
}

export default function MenuProvider({ children }: MenuProviderProps): React.ReactElement {
  const value = useToggle();

  return <MenuProviderContext.Provider value={value}>{children}</MenuProviderContext.Provider>;
}
