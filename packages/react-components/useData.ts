import axios, { type AxiosError } from 'axios';
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

export interface UseAxiosResult<T> {
  /**
   * The current data, if it has been loaded and no error has occurred.
   */
  data?: T;

  /**
   * The Axios error that occurred, if any.
   */
  error?: AxiosError;

  /**
   * An indicator whether the data is still being loading.
   */
  loading: boolean;

  /**
   * A function to reload the data.
   */
  refresh: () => void;

  /**
   * Override the data with new data.
   *
   * This may be useful if the data has been updated because of user interaction. E.g. a resource
   * has been updated or deleted.
   */
  setData: Dispatch<SetStateAction<T | undefined>>;
}

/**
 * Use data fetched from a remote API.
 *
 * Whenever the URL is changed, new data is loaded.
 *
 * @param url Either the URL from which to fetch data.
 * @returns A state which holds the target data and some utility functions.
 */
export function useData<T>(url: string): UseAxiosResult<T> {
  const [error, setError] = useState<AxiosError | undefined>();
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line unicorn/no-useless-undefined
  const [result, setResult] = useState<T | undefined>(undefined);

  const [refresher, setRefresher] = useState<Record<string, unknown>>();

  const refresh = useCallback(() => setRefresher({}), []);

  useEffect(() => {
    const source = axios.CancelToken.source();
    setLoading(true);
    // eslint-disable-next-line unicorn/no-useless-undefined
    setError(undefined);
    // eslint-disable-next-line unicorn/no-useless-undefined
    setResult(undefined);

    axios
      .get<T>(url, { cancelToken: source.token })
      .then(({ data }) => {
        setResult(data);
        // eslint-disable-next-line unicorn/no-useless-undefined
        setError(undefined);
        setLoading(false);
      })
      .catch((err) => {
        if (!axios.isCancel(err)) {
          // eslint-disable-next-line unicorn/no-useless-undefined
          setResult(undefined);
          setError(err);
          setLoading(false);
        }
      });

    return source.cancel;
  }, [refresher, url]);

  return useMemo(
    () => ({
      loading,
      error,
      data: result,
      refresh,
      setData(data: SetStateAction<T | undefined>) {
        setResult(data);
        // eslint-disable-next-line unicorn/no-useless-undefined
        setError(undefined);
        setLoading(false);
      },
    }),
    [error, loading, refresh, result],
  );
}
