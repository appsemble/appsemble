import { Button } from '@appsemble/react-components';
import { type Training } from '@appsemble/types';
import axios from 'axios';
import { type ChangeEvent, type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useLocation, useNavigate } from 'react-router-dom';

import { messages } from './messages.js';
import {
  defaultTrainingValues,
  TrainingModal,
} from '../../../../components/TrainingModal/index.js';

export function CreateTrainingButton({ className }: { readonly className: string }): ReactNode {
  const navigate = useNavigate();
  const { hash } = useLocation();
  const [competences, setCompetences] = useState([]);

  const onCreateTraining = useCallback(
    async ({ description, difficultyLevel, title }: typeof defaultTrainingValues) => {
      const { data } = await axios.post<Training>('/api/trainings', {
        title,
        description,
        difficultyLevel,
        competences,
      });
      navigate(String(data.id));
    },
    [navigate, competences],
  );

  const handleSelectChange = useCallback(
    ({ currentTarget }: ChangeEvent<HTMLSelectElement>) => {
      const selectedValue = currentTarget.value;
      setCompetences((prevCompetences) => {
        if (prevCompetences.includes(selectedValue)) {
          return prevCompetences.filter((value) => value !== selectedValue);
        }
        return [...prevCompetences, selectedValue];
      });
    },
    [setCompetences],
  );

  const openCreateDialog = useCallback(() => {
    navigate({ hash: 'create' }, { replace: true });
  }, [navigate]);

  const closeCreateDialog = useCallback(() => {
    navigate({ hash: null }, { replace: true });
  }, [navigate]);

  const active = hash === '#create';

  return (
    <>
      <Button className={className} onClick={openCreateDialog}>
        <FormattedMessage {...messages.createTraining} />
      </Button>
      <TrainingModal
        defaultValues={{ ...defaultTrainingValues, competences }}
        isActive={active}
        modalTitle={<FormattedMessage {...messages.create} />}
        onClose={closeCreateDialog}
        onSelectChange={handleSelectChange}
        onSubmit={onCreateTraining}
      />
    </>
  );
}
