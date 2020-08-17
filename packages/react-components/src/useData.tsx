import axios, { AxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface AxiosState<T> {
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
}

interface UseAxiosResult<T> extends AxiosState<T> {
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
  setData: (data: T) => void;
}

const initialState: AxiosState<any> = { data: null, loading: true, error: null };

/**
 * Use data fetched from a temote API.
 *
 * Whenever the URL is changed, new data is loaded.
 *
 * @param url - The URL from which to fetch data.
 *
 * @returns A state which holds the Axios data and some utility functions.
 */
export function useData<T>(url: string): UseAxiosResult<T> {
  const [state, setState] = useState<AxiosState<T>>(initialState);

  const [refresher, setRefresher] = useState<{ [key: string]: unknown }>();

  const refresh = useCallback(() => setRefresher({}), []);

  const setData = useCallback((data: T) => {
    setState({
      data,
      error: null,
      loading: false,
    });
  }, []);

  useEffect(() => {
    const source = axios.CancelToken.source();
    setState(initialState);

    axios
      .get(url, { cancelToken: source.token })
      .then(({ data }) => setState({ data, error: null, loading: false }))
      .catch((error) => {
        if (!axios.isCancel(error)) {
          setState({ data: null, error, loading: false });
        }
      });

    return source.cancel;
  }, [refresher, url]);

  return useMemo(() => ({ ...state, refresh, setData }), [refresh, setData, state]);
}
