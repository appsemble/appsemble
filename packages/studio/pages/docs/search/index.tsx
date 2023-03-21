import { Input, Title, useDeferredValue, useMeta } from '@appsemble/react-components';
import highlight from 'fuzzysearch-highlight';
import { ChangeEvent, ReactElement, useMemo, useReducer } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import { docs } from '../docs.js';
import styles from './index.module.css';
import { messages } from './messages.js';

function updateNeedle(state: string, event: ChangeEvent<HTMLInputElement>): string {
  return event.target.value;
}

interface SearchEntry {
  url: string;
  title: string;
  haystack: string;
}

interface SearchResult {
  url: string;
  title: string;
  match: string;
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
  const [search, setSearch] = useReducer(updateNeedle, '');
  const { formatMessage } = useIntl();

  const needle = useDeferredValue(search);

  const results = useMemo(() => {
    const matches: SearchResult[] = [];
    if (!needle) {
      return matches;
    }

    for (const { haystack, title, url } of index) {
      const match = highlight(needle, haystack);
      if (!match) {
        continue;
      }

      matches.push({ url, match, title });
    }
    return matches;
  }, [needle]);

  return (
    <>
      <Input
        name="search"
        onChange={setSearch}
        placeholder={formatMessage(messages.placeholder)}
        type="search"
      />
      <hr />
      <ul>
        {results.map(({ match, title, url }) => (
          <li key={url}>
            <Link to={url}>
              <div className="mb-5">
                <Title className="my-0" size={5}>
                  {title}
                </Title>
                <p
                  className={`content has-text-grey-dark ${styles.searchResult}`}
                  dangerouslySetInnerHTML={{ __html: match }}
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
