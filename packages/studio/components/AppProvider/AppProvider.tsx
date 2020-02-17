import { App } from '@appsemble/types';
import axios from 'axios';
import * as React from 'react';
import { useLocation, useParams, useRouteMatch } from 'react-router-dom';

import { AppContext } from '../../hooks/useApp';
import useUser from '../../hooks/useUser';

interface AppProviderProps {
  children: React.ReactNode;
}

export default function AppProvider({ children }: AppProviderProps): React.ReactElement {
  const { initialized, userInfo } = useUser();
  const [app, setApp] = React.useState<App[]>();
  const match = useLocation();
  const value = React.useMemo(() => app, [app]);

  React.useEffect(() => {
    const parts = match.pathname.split('/');
    const id = parts[parts.length - 1];

    const getApp = async (): Promise<void> => {
      if (userInfo) {
        const { data } = await axios.get<App[]>(`/api/apps/${id}`);
        setApp(data);
      } else {
        setApp([]);
      }
    };

    if (initialized) {
      getApp();
    }
  }, [initialized, match.pathname, userInfo]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
