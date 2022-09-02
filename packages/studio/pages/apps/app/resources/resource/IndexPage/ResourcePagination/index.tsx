import { Button } from '@appsemble/react-components';
import { ChangeEvent, ReactElement, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import { ResourcePaginationNumbers } from '../ResourcePaginationNumbers/index.js';
import { messages } from './messages.js';

export interface ResourcePaginationProps {
  rowsPerPageOptions: number[];
  rowsPerPage: number;
  count: number;
  page: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
}

export function ResourcePagination({
  count,
  onPageChange,
  onRowsPerPageChange,
  page,
  rowsPerPage,
  rowsPerPageOptions,
}: ResourcePaginationProps): ReactElement {
  const onDropdownChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const newRowsPerPage = Number(event.target.value);
      onRowsPerPageChange(newRowsPerPage);
      if (newRowsPerPage === -1) {
        return;
      }
      const pages = Math.ceil(count / newRowsPerPage);
      const currentIndex = (page - 1) * rowsPerPage;
      if (page >= pages) {
        onPageChange(pages - 1);
      } else {
        const newPage = Math.floor(currentIndex / newRowsPerPage) + 1;
        onPageChange(newPage > 1 ? newPage : 1);
      }
    },
    [onRowsPerPageChange, count, page, rowsPerPage, onPageChange],
  );

  const maxPages = rowsPerPage === -1 || page < 1 ? 1 : Math.ceil(count / rowsPerPage);

  return (
    <div className="level">
      <div className="level-left">
        <div className="level-item">
          <div className="field has-addons">
            <p className="control">
              <button className="button is-static" type="button">
                <FormattedMessage {...messages.rowsPerPageLabel} />
              </button>
            </p>
            <p className="control">
              <span className="select">
                <select onChange={onDropdownChange} value={rowsPerPage}>
                  {rowsPerPageOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === -1 ? messages.allRowsLabel.defaultMessage : option}
                    </option>
                  ))}
                </select>
              </span>
            </p>
          </div>
        </div>
      </div>
      <div className="level-right">
        <div className="level-item">
          <div aria-label="pagination" className="pagination" role="navigation">
            <ul className="pagination-list">
              <li>
                <Button
                  className="mx-1"
                  disabled={page <= 1}
                  onClick={() => onPageChange(page - 1)}
                >
                  Previous
                </Button>
              </li>
              <ResourcePaginationNumbers
                maxPages={maxPages}
                onPageChange={onPageChange}
                page={page}
              />
              <li>
                <Button
                  className="mx-1"
                  disabled={page + 1 > maxPages || rowsPerPage === -1}
                  onClick={() => onPageChange(page + 1)}
                >
                  Next
                </Button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
