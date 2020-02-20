import { App } from '@appsemble/types';
import axios from 'axios';
import * as React from 'react';
import { useLocation } from 'react-router-dom';

import { AppContext } from '../../hooks/useApp';
import useUser from '../../hooks/useUser';

interface AppProviderProps {
  children: React.ReactNode;
}

export default function AppProvider({ children }: AppProviderProps): React.ReactElement {
  const { initialized, userInfo } = useUser();
  const [app, setApp] = React.useState<App[]>();
  const match = useLocation();
  const parts = match.pathname.split('/');
  const id = parts[parts.length - 1];
  const isnum = /^\d+$/.test(id);

  const refreshAppInfo = React.useCallback(async () => {
    const { data } = await axios.get<App[]>(`/api/apps/${id}`);
    setApp(data);
  }, [id]);

  const value = React.useMemo(
    () => ({
      app,
      refreshAppInfo,
    }),
    [app, refreshAppInfo],
  );

  React.useEffect(() => {
    const getApp = async (): Promise<void> => {
      if (isnum && userInfo) {
        const { data } = await axios.get<App[]>(`/api/apps/${id}`);
        setApp(data);
      } else if (app !== undefined) {
        // avoid unneccessary API calls
      } else {
        setApp([]);
      }
    };

    if (initialized) {
      getApp();
    }
  }, [app, id, initialized, isnum, match.pathname, refreshAppInfo, userInfo]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
