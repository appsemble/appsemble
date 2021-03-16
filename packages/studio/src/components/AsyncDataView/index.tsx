import { Button, Loader, Message, UseAxiosResult } from '@appsemble/react-components';
import { ReactElement, ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages';

interface AsyncDataViewProps<T> {
  /**
   * How to render the data.
   *
   * @param data - The resulting data from the axios result.
   */
  children: (data: T) => ReactNode;

  /**
   * The message to display if the loaded data was empty.
   */
  emptyMessage?: ReactNode;

  /**
   * The message to display if there was a problem loading the data.
   */
  errorMessage: ReactNode;

  /**
   * The message to display if the data is being loaded.
   */
  loadingMessage: ReactNode;

  /**
   * The result from a `useAxios()` hook.
   */
  result: UseAxiosResult<T>;
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
}: AsyncDataViewProps<T>): ReactElement {
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

  if (Array.isArray(data) && !data.length) {
    return emptyMessage as ReactElement;
  }

  return children(data) as ReactElement;
}
