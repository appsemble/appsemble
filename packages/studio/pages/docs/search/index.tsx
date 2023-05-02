import { Title, useMeta } from '@appsemble/react-components';
import { type ReactElement, type ReactNode, useDeferredValue, useMemo } from 'react';
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
}

const index: SearchEntry[] = [];
for (const doc of docs) {
  for (const [hash, { haystack, title }] of doc.searchIndex) {
    index.push({
      url: `../${doc.p.replace(/^\//, '')}#${hash}`,
      title,
      haystack,
    });
  }
}

export function SearchPage(): ReactElement {
  useMeta(messages.title);
  const location = useLocation();

  const needle = useDeferredValue(decodeURIComponent(location.hash.slice(1)));

  const results = useMemo(() => {
    const matches: SearchResult[] = [];
    if (!needle) {
      return matches;
    }

    for (const { haystack, title, url } of index) {
      const match = highlight(haystack, needle);
      if (!match) {
        continue;
      }

      matches.push({ match, url, title });
    }
    // Fewer matches means longer matches, which means a higher relevance.
    matches.sort((a, b) => a.match.length - b.match.length);
    return matches;
  }, [needle]);

  return (
    <ul>
      {results.map(({ match, title, url }) => (
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
      ))}
    </ul>
  );
}
