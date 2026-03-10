import { Button, SelectField } from '../index.js';
import { type ChangeEvent, type ReactNode, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import { PaginationNumbers } from '../PaginationNumbers/index.js';

export interface PaginationNavigatorProps {
  /**
   * An array of amounts of rows to display per page. Infinity represents all rows.
   */
  readonly rowsPerPageOptions: number[];

  /**
   * The amount of rows to display per page.
   */
  readonly rowsPerPage: number;

  /**
   * The maximum number of entries.
   */
  readonly count: number;

  /**
   * The current page to display.
   */
  readonly page: number;

  /**
   * The callback to invoke when the page changes.
   *
   * @param page
   */
  readonly onPageChange: (page: number) => void;

  /**
   * The callback to invoke when the amount of rows per page changes.
   *
   * @param rowsPerPage
   */
  readonly onRowsPerPageChange: (rowsPerPage: number) => void;
}

/**
 * A component to render a pagination control. Contains a dropdown to select the amount of rows to
 * display per page, and a set of buttons to navigate to the previous and next page.
 *
 * @param props The properties of the component.
 */
export function PaginationNavigator({
  count,
  onPageChange,
  onRowsPerPageChange,
  page,
  rowsPerPage,
  rowsPerPageOptions,
}: PaginationNavigatorProps): ReactNode {
  const onDropdownChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const newRowsPerPage = Number(event.target.value);
      onRowsPerPageChange(newRowsPerPage);
    },
    [onRowsPerPageChange],
  );

  const maxPages =
    rowsPerPage === Number.POSITIVE_INFINITY || page < 1 ? 1 : Math.ceil(count / rowsPerPage);

  return (
    <div className="level">
      <div className="level-left">
        <div className="level-item">
          <SelectField
            addonLeft={
              <span className="button is-static">
                <FormattedMessage {...messages.rowsPerPageLabel} />
              </span>
            }
            onChange={onDropdownChange}
            value={rowsPerPage}
          >
            {rowsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option === Number.POSITIVE_INFINITY
                  ? (messages.allRowsLabel.defaultMessage as string)
                  : option}
              </option>
            ))}
          </SelectField>
        </div>
      </div>
      <div className="level-right">
        <div className="level-item">
          {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
          <div aria-label="pagination" className="pagination" role="navigation">
            <ul className="pagination-list">
              <li>
                <Button
                  className="mx-1"
                  disabled={page <= 1}
                  onClick={() => onPageChange(page - 1)}
                >
                  <FormattedMessage {...messages.previousPageLabel} />
                </Button>
              </li>
              <PaginationNumbers maxPages={maxPages} onPageChange={onPageChange} page={page} />
              <li>
                <Button
                  className="mx-1"
                  disabled={page + 1 > maxPages || rowsPerPage === Number.POSITIVE_INFINITY}
                  onClick={() => onPageChange(page + 1)}
                >
                  <FormattedMessage {...messages.nextPageLabel} />
                </Button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
