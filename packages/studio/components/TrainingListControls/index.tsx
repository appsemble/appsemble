import { InputField, SelectField } from '@appsemble/react-components';
import { Permission } from '@appsemble/utils';
import { type ChangeEvent, type ReactElement, useCallback } from 'react';
import { useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { CreateTrainingButton } from '../../pages/settings/trainings/CreateTrainingButton/index.js';
import { checkRole } from '../../utils/checkRole.js';
import { type TrainingSortFunction } from '../TrainingListCard/index.js';
import { useUser } from '../UserProvider/index.js';

export const sortFunctions = {
  difficulty: (a, b) => a.difficultyLevel - b.difficultyLevel,
  $created: (a, b) => a.$created.localeCompare(b.$created),
  $updated: (a, b) => a.$updated.localeCompare(b.$updated),
  name: (a, b) => a.title.localeCompare(b.title),
} satisfies Record<string, TrainingSortFunction>;

export type TrainingSortFunctionName = keyof typeof sortFunctions;

export interface TrainingListControlsProps {
  readonly filter: string;
  readonly sort: TrainingSortFunctionName;
  readonly reverse: boolean;
  readonly onFilterChange: (filter: string) => void;
  readonly onSortChange: (sort: TrainingSortFunctionName, reverse: boolean) => void;
}

export function TrainingListControls({
  filter,
  onFilterChange,
  onSortChange,
  reverse,
  sort,
}: TrainingListControlsProps): ReactElement {
  const { formatMessage } = useIntl();
  const { organizations } = useUser();

  const handleSortChange = useCallback(
    ({ currentTarget: { value } }: ChangeEvent<HTMLSelectElement>): void => {
      const [name, direction] = value.split('.') as [TrainingSortFunctionName, 'asc' | 'desc'];
      onSortChange(name, direction === 'desc');
    },
    [onSortChange],
  );

  const isAppsembleMember = organizations.find((organization) => organization.id === 'appsemble');
  const mayCreateTraining =
    isAppsembleMember && checkRole(isAppsembleMember.role, Permission.CreateApps);
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
          {formatMessage(messages.difficulty)} (${formatMessage(messages.ascending)})
        </option>
        <option value="difficulty.asc">
          {`${formatMessage(messages.difficulty)} (${formatMessage(messages.ascending)})`}
        </option>
        <option value="difficulty.desc">
          {`${formatMessage(messages.difficulty)} (${formatMessage(messages.descending)})`}
        </option>
        <option value="name.asc">
          {`${formatMessage(messages.title)} (${formatMessage(messages.ascending)})`}
        </option>
        <option value="name.desc">
          {`${formatMessage(messages.title)} (${formatMessage(messages.descending)})`}
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
          {`${formatMessage(messages.updated)} (${formatMessage(messages.ascending)})`}
        </option>
      </SelectField>

      {mayCreateTraining ? (
        <div className="ml-auto">
          <CreateTrainingButton className="" />
        </div>
      ) : null}
    </div>
  );
}
