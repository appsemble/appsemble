import { App } from '@appsemble/types';
import axios from 'axios';
import * as React from 'react';
import { useLocation } from 'react-router-dom';

import { AppContext } from '../../hooks/useApp';

interface AppProviderProps {
  children: React.ReactNode;
}

export default function AppProvider({ children }: AppProviderProps): React.ReactElement {
  const [app, setApp] = React.useState<App>();
  const match = useLocation();
  const parts = match.pathname.split('/');
  const id = parts[parts.length - 1];

  const refreshAppInfo = React.useCallback(async () => {
    const { data } = await axios.get<App>(`/api/apps/${id}`);
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
      if (app === undefined) {
        const { data } = await axios.get<App>(`/api/apps/${id}`);
        setApp(data);
      } else if (app !== undefined) {
        // avoid unneccessary API calls
      } else {
        setApp(undefined);
      }
    };
    getApp();
  }, [refreshAppInfo, app, id]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
