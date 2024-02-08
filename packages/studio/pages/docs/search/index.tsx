import { Title, useMeta } from '@appsemble/react-components';
import { type ReactNode, useDeferredValue, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useLocation } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { highlight } from '../../../utils/search.js';
import { docs } from '../docs.js';

interface SearchEntry {
  url: string;
  title: string;
  haystack: string;
}

interface SearchResult {
  url: string;
  title: string;
  match: ReactNode[];
  matchLength: number;
}

const index: SearchEntry[] = [];
for (const doc of docs) {
  for (const [hash, { haystack, title }] of doc.searchIndex) {
    index.push({
      url: `../${doc.path.replace(/^\//, '')}#${hash}`,
      title,
      haystack,
    });
  }
}

export function SearchPage(): ReactNode {
  useMeta(messages.title);
  const location = useLocation();

  const needle = useDeferredValue(decodeURIComponent(location.hash.slice(1)));
  const cleanedNeedle = needle.replaceAll(/[^\dA-Za-z]/g, '');

  const matchCharLength = 2;

  const results = useMemo(() => {
    const matches: SearchResult[] = [];
    if (!needle) {
      return matches;
    }

    for (const { haystack, title, url } of index) {
      const result = highlight(haystack, needle);

      if (result) {
        const { match, matchLength } = result;

        if (!match || matchLength === 0) {
          continue;
        }
        matches.push({ match, url, title, matchLength });
      }
    }
    // Sort matches based on match char length.
    matches.sort((a, b) => b.matchLength - a.matchLength);

    return matches;
  }, [needle]);

  return (
    <div>
      {results.length ? (
        <p className="mb-3">
          <FormattedMessage
            {...messages.searching}
            values={{ cleanedNeedle: <strong>{cleanedNeedle}</strong> }}
          />
        </p>
      ) : null}
      <ul>
        {results.length ? (
          results.map(({ match, title, url }) => (
            <li key={url}>
              <Link to={url}>
                <div className="mb-5">
                  <Title className="my-0" size={5}>
                    {title}
                  </Title>
                  <p className={`content has-text-grey-dark ${styles.searchResult}`}>{match}</p>
                </div>
              </Link>
            </li>
          ))
        ) : needle.length <= matchCharLength ? (
          <FormattedMessage {...messages.minCharLength} />
        ) : (
          <FormattedMessage {...messages.noResultsFound} />
        )}
      </ul>
    </div>
  );
}
