import { Button } from '@appsemble/react-components';
import { ReactElement, ReactNode } from 'react';

interface AssetPaginationNumbersProps {
  maxPages: number;
  page: number;
  onPageChange: (page: number) => void;
}

const range = (start: number, stop: number): number[] =>
  Array.from({ length: stop - start }, (v, i) => start + i).concat(stop);

export function AssetPaginationNumbers({
  maxPages,
  onPageChange,
  page,
}: AssetPaginationNumbersProps): ReactElement {
  return [
    maxPages < 6
      ? (range(1, maxPages).map((pageNo) => (
          <li key={pageNo}>
            <Button
              className={`pagination-link ${page === pageNo ? 'is-current' : ''}`}
              onClick={() => onPageChange(pageNo)}
            >
              {pageNo}
            </Button>
          </li>
        )) as ReactNode as ReactElement)
      : null,
    (
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
          <span className="pagination-ellipsis">{page < 3 ? null : '...'}</span>
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
          <span className="pagination-ellipsis">{page >= maxPages - 1 ? null : '...'}</span>
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
    ) as ReactNode,
  ] as ReactNode as ReactElement;
}
