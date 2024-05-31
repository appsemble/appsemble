import {
  ModalCard,
  SelectField,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleModalFooter,
} from '@appsemble/react-components';
import { type ChangeEvent, type ReactNode, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';

export const defaultTrainingValues = {
  title: '',
  description: '',
  difficultyLevel: 1,
  competences: [] as string[],
};

interface TrainingModalProps {
  readonly defaultValues?: typeof defaultTrainingValues;
  readonly modalTitle: ReactNode;
  readonly isActive: boolean;
  readonly onSubmit: (values: typeof defaultTrainingValues) => void;
  readonly onSelectChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  readonly onClose: () => void;
}

export function TrainingModal({
  defaultValues = defaultTrainingValues,
  isActive,
  modalTitle,
  onClose,
  onSelectChange,
  onSubmit,
}: TrainingModalProps): ReactNode {
  const competenceTags = ['accuracy', 'advance', 'analyze', 'basics', 'creativity'];
  // TODO: fix
  const sideMenu = document?.querySelector('#sideMenu') as HTMLElement;

  // Fixes the problem with the side menu drawing over the modal.
  useEffect(() => {
    const styleSideMenu = (): void => {
      if (sideMenu) {
        sideMenu.style.zIndex = isActive ? 'auto' : '1500';
      }
    };

    styleSideMenu();
  }, [isActive, sideMenu]);

  return (
    <ModalCard
      component={SimpleForm}
      defaultValues={defaultValues}
      footer={
        <SimpleModalFooter
          cancelLabel={<FormattedMessage {...messages.cancel} />}
          onClose={onClose}
          submitLabel={<FormattedMessage {...messages.submit} />}
        />
      }
      isActive={isActive}
      onClose={onClose}
      onSubmit={onSubmit}
      title={modalTitle}
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
        label={<FormattedMessage {...messages.competences} />}
        multiple
        onChange={onSelectChange}
        required
        value={defaultValues.competences}
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
  );
}
