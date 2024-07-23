import { type ReactNode } from 'react';

interface LogEntryListProps {
  readonly entries: string[];
}

function formatLogEntry(input: string): string {
  return input.replaceAll(/\[3\dm/g, '');
}

export function LogEntryList({ entries }: LogEntryListProps): ReactNode {
  return (
    <ul className="is-family-monospace is-size-7">
      {entries.map((e, i) => (
        <li key={String()}>
          {i + 1}. {formatLogEntry(e)}
        </li>
      ))}
    </ul>
  );
}
