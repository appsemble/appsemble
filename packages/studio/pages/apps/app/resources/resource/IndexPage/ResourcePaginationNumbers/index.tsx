import { Button } from '@appsemble/react-components';
import { ReactElement } from 'react';

interface ResourcePaginationNumbersProps {
  maxPages: number;
  page: number;
  onPageChange: (page: number) => void;
}

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
        [1, 2].map((pageNo) => (
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
        [1, 2, 3].map((pageNo) => (
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
        [1, 2, 3, 4].map((pageNo) => (
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
        [1, 2, 3, 4, 5].map((pageNo) => (
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
            {[1, 2].includes(page) ? (
              <span className="pagination-ellipsis" />
            ) : (
              <Button className="pagination-link" onClick={() => onPageChange(1)} type="button">
                {1}
              </Button>
            )}
          </li>
          <li>
            {[1, 2].includes(page) ? (
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
            {[maxPages - 1, maxPages].includes(page) ? (
              <span className="pagination-ellipsis" />
            ) : (
              <span className="pagination-ellipsis">&hellip;</span>
            )}
          </li>
          <li>
            {[maxPages - 1, maxPages].includes(page) ? (
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
