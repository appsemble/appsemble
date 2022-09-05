import { Button } from '@appsemble/react-components';
import { ReactElement } from 'react';

interface ResourcePaginationNumbersProps {
  maxPages: number;
  page: number;
  onPageChange: (page: number) => void;
}

const range = (start: number, stop: number): number[] =>
  Array.from({ length: stop - start }, (v, i) => start + i).concat(stop);

export function ResourcePaginationNumbers({
  maxPages,
  onPageChange,
  page,
}: ResourcePaginationNumbersProps): ReactElement {
  return (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>
      {maxPages === 1 ? (
        <li>
          <Button className="pagination-link is-current" type="button">
            {1}
          </Button>
        </li>
      ) : maxPages === 2 ? (
        range(1, 2).map((pageNo) => (
          <li key={pageNo}>
            <Button
              className={`pagination-link ${page === pageNo ? 'is-current' : ''}`}
              onClick={() => onPageChange(pageNo)}
              type="button"
            >
              {pageNo}
            </Button>
          </li>
        ))
      ) : maxPages === 3 ? (
        range(1, 3).map((pageNo) => (
          <li key={pageNo}>
            <Button
              className={`pagination-link ${page === pageNo ? 'is-current' : ''}`}
              onClick={() => onPageChange(pageNo)}
              type="button"
            >
              {pageNo}
            </Button>
          </li>
        ))
      ) : maxPages === 4 ? (
        range(1, 4).map((pageNo) => (
          <li key={pageNo}>
            <Button
              className={`pagination-link ${page === pageNo ? 'is-current' : ''}`}
              onClick={() => onPageChange(pageNo)}
              type="button"
            >
              {pageNo}
            </Button>
          </li>
        ))
      ) : maxPages === 5 ? (
        range(1, 5).map((pageNo) => (
          <li key={pageNo}>
            <Button
              className={`pagination-link ${page === pageNo ? 'is-current' : ''}`}
              onClick={() => onPageChange(pageNo)}
              type="button"
            >
              {pageNo}
            </Button>
          </li>
        ))
      ) : (
        <>
          <li>
            {range(1, 2).includes(page) ? (
              <span className="pagination-ellipsis" />
            ) : (
              <Button className="pagination-link" onClick={() => onPageChange(1)} type="button">
                {1}
              </Button>
            )}
          </li>
          <li>
            {range(1, 2).includes(page) ? (
              <span className="pagination-ellipsis" />
            ) : (
              <span className="pagination-ellipsis">&hellip;</span>
            )}
          </li>
          <li>
            {[1].includes(page) ? (
              <span className="pagination-ellipsis" />
            ) : (
              <Button
                className="pagination-link"
                onClick={() => onPageChange(page - 1)}
                type="button"
              >
                {page - 1}
              </Button>
            )}
          </li>
          <li>
            <Button className="pagination-link is-current" type="button">
              {page}
            </Button>
          </li>
          <li>
            {[maxPages].includes(page) ? (
              <span className="pagination-ellipsis" />
            ) : (
              <Button
                className="pagination-link"
                onClick={() => onPageChange(page + 1)}
                type="button"
              >
                {page + 1}
              </Button>
            )}
          </li>
          <li>
            {range(maxPages - 1, maxPages).includes(page) ? (
              <span className="pagination-ellipsis" />
            ) : (
              <span className="pagination-ellipsis">&hellip;</span>
            )}
          </li>
          <li>
            {range(maxPages - 1, maxPages).includes(page) ? (
              <span className="pagination-ellipsis" />
            ) : (
              <Button
                className="pagination-link"
                onClick={() => onPageChange(maxPages)}
                type="button"
              >
                {maxPages}
              </Button>
            )}
          </li>
        </>
      )}
    </>
  );
}
