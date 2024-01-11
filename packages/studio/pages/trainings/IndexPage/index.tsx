import { Content, useData } from '@appsemble/react-components';
import { type Training } from '@appsemble/types';
import { type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { AsyncDataView } from '../../../components/AsyncDataView/index.js';
import { TrainingListCard } from '../../../components/TrainingListCard/index.js';
import {
  sortFunctions,
  TrainingListControls,
  type TrainingSortFunctionName,
} from '../../../components/TrainingListControls/index.js';

export function IndexPage(): ReactNode {
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<{ name: TrainingSortFunctionName; reverse: boolean }>({
    name: 'difficulty',
    reverse: false,
  });
  const { lang } = useParams<{ lang: string }>();
  const url = `/${lang}/trainings`;
  const trainingsResult = useData<Training[]>('/api/trainings');

  const onSortChange = useCallback((name: TrainingSortFunctionName, reverse: boolean) => {
    setSort({ name, reverse });
  }, []);

  return (
    <Content className={styles.content} main>
      <div>
        <TrainingListControls
          filter={filter}
          onFilterChange={setFilter}
          onSortChange={onSortChange}
          reverse={sort?.reverse}
          sort={sort?.name}
        />
        <ul>
          <AsyncDataView
            emptyMessage={<FormattedMessage {...messages.emptyTraining} />}
            errorMessage={<FormattedMessage {...messages.errorTraining} />}
            loadingMessage={<FormattedMessage {...messages.loadingTraining} />}
            result={trainingsResult}
          >
            {(trainings) => {
              const filteredTrainings = trainings
                .filter((training) => training.title.toLowerCase().includes(filter.toLowerCase()))
                .sort((a, b) => {
                  const sortFunction = sortFunctions[sort?.name];
                  return sort.reverse ? sortFunction(b, a) : sortFunction(a, b);
                });
              return (
                <div>
                  {filteredTrainings.map((training) => (
                    <TrainingListCard
                      competences={training.competences}
                      description={training.description}
                      difficultyLevel={training.difficultyLevel}
                      id={String(training.id)}
                      key={training.id}
                      title={training.title}
                      to={`${url}/${training.id}`}
                    />
                  ))}
                </div>
              );
            }}
          </AsyncDataView>
        </ul>
      </div>
    </Content>
  );
}
