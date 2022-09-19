import { Button } from '@appsemble/react-components';
import { ReactElement } from 'react';

interface PaginationNumbersProps {
  /**
   * The maximum number of pages.
   */
  maxPages: number;
  /**
   * The current page.
   */
  page: number;
  /**
   * The callback to invoke when a page is selected.
   *
   * @param page The page being selected.
   */
  onPageChange: (page: number) => void;
}

const range = (start: number, stop: number): number[] =>
  Array.from({ length: stop - start }, (v, i) => start + i).concat(stop);

/**
 * A component to render a pagination control using numbers.
 * This component is used inside the `PaginationNavigator` component.
 * It is not meant to be used directly.
 *
 * @param props The properties of the component.
 */
export function PaginationNumbers({
  maxPages,
  onPageChange,
  page,
}: PaginationNumbersProps): ReactElement {
  if (maxPages < 6) {
    return (
      <li>
        <ul className="pagination-list">
          {range(1, maxPages).map((pageNo) => (
            <li key={pageNo}>
              <Button
                className={`pagination-link ${page === pageNo ? 'is-current' : ''}`}
                onClick={() => onPageChange(pageNo)}
              >
                {pageNo}
              </Button>
            </li>
          ))}
        </ul>
      </li>
    );
  }

  return (
    <>
      <li>
        {page < 3 ? (
          <span className="pagination-ellipsis" />
        ) : (
          <Button className="pagination-link" onClick={() => onPageChange(1)}>
            {1}
          </Button>
        )}
      </li>
      <li>
        <span className="pagination-ellipsis">{page < 3 ? null : '…'}</span>
      </li>
      <li>
        {page === 1 ? (
          <span className="pagination-ellipsis" />
        ) : (
          <Button className="pagination-link" onClick={() => onPageChange(page - 1)}>
            {page - 1}
          </Button>
        )}
      </li>
      <li>
        <Button className="pagination-link is-current">{page}</Button>
      </li>
      <li>
        {page === maxPages ? (
          <span className="pagination-ellipsis" />
        ) : (
          <Button className="pagination-link" onClick={() => onPageChange(page + 1)}>
            {page + 1}
          </Button>
        )}
      </li>
      <li>
        <span className="pagination-ellipsis">{page >= maxPages - 1 ? null : '…'}</span>
      </li>
      <li>
        {page >= maxPages - 1 ? (
          <span className="pagination-ellipsis" />
        ) : (
          <Button className="pagination-link" onClick={() => onPageChange(maxPages)}>
            {maxPages}
          </Button>
        )}
      </li>
    </>
  );
}
