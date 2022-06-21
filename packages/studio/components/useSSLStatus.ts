import { useData } from '@appsemble/react-components';
import { SSLStatusMap } from '@appsemble/types';
import { useEffect } from 'react';

/**
 * Get the SSL status for the specified domain names.
 *
 * @param domains - The domain names to get the status for.
 * @returns An SSL status map which maps domain names to their SSL status.
 */
export function useSSLStatus(...domains: string[]): SSLStatusMap {
  const params = new URLSearchParams();
  for (const domain of domains) {
    params.append('domains', domain);
  }
  const { data: sslStatus, refresh: refreshSSLStatus } = useData<SSLStatusMap>(
    `/api/ssl?${params}`,
  );

  useEffect(() => {
    if (sslStatus) {
      for (const status of Object.values(sslStatus)) {
        if (status !== 'ready') {
          const timeout = setTimeout(refreshSSLStatus, 30_000);

          return () => {
            clearTimeout(timeout);
          };
        }
      }
    }
  }, [refreshSSLStatus, sslStatus]);

  return sslStatus;
}
