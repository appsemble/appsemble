import {
  Button,
  ModalCard,
  SelectField,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleModalFooter,
} from '@appsemble/react-components';
import { type Training } from '@appsemble/types';
import axios from 'axios';
import { type ReactElement, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useLocation, useNavigate } from 'react-router-dom';

import { messages } from './messages.js';

export function CreateTrainingButton({ className }: { readonly className: string }): ReactElement {
  const navigate = useNavigate();
  const { hash } = useLocation();
  const [competence, setCompetence] = useState('accuracy');

  const competenceTags = ['accuracy', 'advance', 'analyze', 'basics', 'creativity'];

  const defaultValues = {
    title: '',
    description: '',
    difficultyLevel: 1,
  };

  const onCreate = useCallback(
    async ({ description, difficultyLevel, title }: typeof defaultValues) => {
      const { data } = await axios.post<Training>('/api/trainings', {
        title,
        description,
        competence,
        difficultyLevel,
      });
      navigate(String(data.id));
    },
    [navigate, competence],
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
      <Button className={`${className} is-primary is-light`} onClick={openCreateDialog}>
        <FormattedMessage {...messages.createTraining} />
      </Button>
      <ModalCard
        component={SimpleForm}
        defaultValues={defaultValues}
        footer={
          <SimpleModalFooter
            cancelLabel={<FormattedMessage {...messages.cancel} />}
            onClose={closeCreateDialog}
            submitLabel={<FormattedMessage {...messages.create} />}
          />
        }
        isActive={active}
        onClose={closeCreateDialog}
        onSubmit={onCreate}
        title={<FormattedMessage {...messages.createTraining} />}
      >
        <SimpleFormError>
          {({ error }) => (error ? <FormattedMessage {...messages.error} /> : null)}
        </SimpleFormError>
        <SimpleFormField
          label={<FormattedMessage {...messages.title} />}
          maxLength={30}
          minLength={1}
          name="title"
          required
        />
        <SimpleFormField
          label={<FormattedMessage {...messages.description} />}
          maxLength={800}
          minLength={1}
          name="description"
          required
        />
        <SimpleFormField
          component={SelectField}
          label={<FormattedMessage {...messages.competence} />}
          name="selectedTag"
          onChange={({ currentTarget }) => {
            setCompetence(currentTarget.value);
          }}
          required
        >
          {competenceTags.map((tag) => (
            <option className="is-capitalized" key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </SimpleFormField>
        <SimpleFormField
          label={<FormattedMessage {...messages.difficultyLevel} />}
          max={5}
          min={1}
          name="difficultyLevel"
          required
          type="number"
        />
      </ModalCard>
    </>
  );
}
