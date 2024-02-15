import {
  Button,
  InputField,
  SelectField,
  useClickOutside,
  useToggle,
} from '@appsemble/react-components';
import { type ChangeEvent, type ReactNode, useCallback, useRef } from 'react';
import { useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { CreateAppButton } from '../../pages/apps/IndexPage/CreateAppButton/index.js';
import { ImportAppButton } from '../../pages/apps/IndexPage/ImportAppButton/index.js';
import { type AppSortFunction } from '../AppList/index.js';
import { useUser } from '../UserProvider/index.js';

export const sortFunctions = {
  organization: (a, b) => a.OrganizationId.localeCompare(b.OrganizationId),
  rating(a, b) {
    const ratingA = a.rating ?? { average: 0, count: 0 };
    const ratingB = b.rating ?? { average: 0, count: 0 };

    return ratingA.average === ratingB.average
      ? ratingA.count - ratingB.count
      : ratingA.average - ratingB.average;
  },
  $created: (a, b) => a.$created.localeCompare(b.$created),
  $updated: (a, b) => a.$updated.localeCompare(b.$updated),
  name: (a, b) => a.definition.name.localeCompare(b.definition.name),
} satisfies Record<string, AppSortFunction>;

export type AppSortFunctionName = keyof typeof sortFunctions;

export interface AppListControlsProps {
  readonly filter: string;
  readonly sort: AppSortFunctionName;
  readonly reverse: boolean;
  readonly onFilterChange: (filter: string) => void;
  readonly onSortChange: (sortName: AppSortFunctionName, reverse: boolean) => void;
  readonly actionControl?: ReactNode;
  readonly actionControlImport?: ReactNode;
}

export function AppListControls({
  actionControl: actionButton = <CreateAppButton />,
  actionControlImport: actionImportButton = <ImportAppButton />,
  filter,
  onFilterChange,
  onSortChange,
  reverse,
  sort,
}: AppListControlsProps): ReactNode {
  const { formatMessage } = useIntl();
  const { userInfo } = useUser();
  const { disable, enabled: isActive, toggle } = useToggle(false);

  const handleSortChange = useCallback(
    ({ currentTarget: { value } }: ChangeEvent<HTMLSelectElement>): void => {
      const [name, direction] = value.split('.') as [AppSortFunctionName, 'asc' | 'desc'];
      onSortChange(name, direction === 'desc');
    },
    [onSortChange],
  );
  const dropdownRef = useRef<HTMLDivElement | null>();
  useClickOutside(dropdownRef, disable);

  return (
    <div className={`is-flex-desktop ${styles.gap}`}>
      <InputField
        className="mb-0 is-fullwidth"
        icon="search"
        name="search"
        onChange={({ currentTarget: { value } }) => onFilterChange(value)}
        placeholder={formatMessage(messages.search)}
        type="search"
        value={filter}
      />
      <SelectField
        className="mb-0"
        icon="sort"
        name="sort"
        onChange={handleSortChange}
        value={`${sort}.${reverse ? 'desc' : 'asc'}`}
      >
        <option hidden>
          {formatMessage(messages.ratings)} (${formatMessage(messages.descending)})
        </option>
        <option value="rating.asc">
          {`${formatMessage(messages.ratings)} (${formatMessage(messages.ascending)})`}
        </option>
        <option value="rating.desc">
          {`${formatMessage(messages.ratings)} (${formatMessage(messages.descending)})`}
        </option>
        <option value="name.asc">
          {`${formatMessage(messages.name)} (${formatMessage(messages.ascending)})`}
        </option>
        <option value="name.desc">
          {`${formatMessage(messages.name)} (${formatMessage(messages.descending)})`}
        </option>
        <option value="organization.asc">
          {`${formatMessage(messages.organization)} (${formatMessage(messages.ascending)})`}
        </option>
        <option value="organization.desc">
          {`${formatMessage(messages.organization)} (${formatMessage(messages.descending)})`}
        </option>
        <option value="$created.asc">
          {`${formatMessage(messages.created)} (${formatMessage(messages.ascending)})`}
        </option>
        <option value="$created.desc">
          {`${formatMessage(messages.created)} (${formatMessage(messages.descending)})`}
        </option>
        <option value="$updated.asc">
          {`${formatMessage(messages.updated)} (${formatMessage(messages.ascending)})`}
        </option>
        <option value="$updated.desc">
          {`${formatMessage(messages.updated)} (${formatMessage(messages.descending)})`}
        </option>
      </SelectField>
      <div className="mb-2 ml-auto">
        {userInfo ? (
          <>
            {actionButton || null}
            {actionImportButton ? (
              <div className={`dropdown ${isActive ? 'is-active' : ''} is-pulled-right is-right`}>
                <div className="dropdown-trigger ml-4">
                  <Button
                    aria-controls="dropdown-trigger"
                    aria-haspopup="true"
                    icon={isActive ? 'chevron-up' : 'chevron-down'}
                    onClick={toggle}
                  />
                </div>
                <div className="dropdown-menu" role="menu">
                  <div className="dropdown-content px-4">{actionImportButton || null}</div>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
