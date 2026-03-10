import { Button, Loader, Message, type UseAxiosResult } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';

interface AsyncDataViewProps<T> {
  /**
   * How to render the data.
   *
   * @param data The resulting data from the axios result.
   */
  readonly children: (data: T) => ReactNode;

  /**
   * The message to display if the loaded data was empty.
   */
  readonly emptyMessage?: ReactNode;

  /**
   * The message to display if there was a problem loading the data.
   */
  readonly errorMessage: ReactNode;

  /**
   * The message to display if the data is being loaded.
   */
  readonly loadingMessage: ReactNode;

  /**
   * The result from a `useAxios()` hook.
   */
  readonly result: UseAxiosResult<T>;
}

/**
 * Render the result of a `useData()` result.
 *
 * If the result is still loading, a loader is displayed.
 *
 * If there was an error loading the data, an error message is displayed containing a retry button.
 *
 * Otherwise, the data is rendered using the child function.
 */
export function AsyncDataView<T>({
  children,
  emptyMessage,
  errorMessage,
  loadingMessage,
  result: { data, error, loading, refresh },
}: AsyncDataViewProps<T>): ReactNode {
  if (loading) {
    return (
      <div className={`my-3 ${styles.loading}`}>
        <Loader className={styles.loader} />
        <p className="mt-2">{loadingMessage}</p>
      </div>
    );
  }

  if (error) {
    return (
      <Message className="my-3" color="danger">
        <div className="mb-3">{errorMessage}</div>
        <Button color="danger" onClick={refresh}>
          <FormattedMessage {...messages.retry} />
        </Button>
      </Message>
    );
  }

  if (Array.isArray(data) && (!data.length || Object.keys(data[0]).length === 0)) {
    return emptyMessage;
  }

  return children(data);
}
