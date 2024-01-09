import {
  ModalCard,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleModalFooter,
  TextAreaField,
} from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';

export const defaults = {
  titleOfBlock: '',
  documentationLink: '',
  videoLink: '',
  exampleCodeBlock: '',
  externalResourceLink: '',
};
interface TrainingBlockModalProps {
  readonly defaultValues?: typeof defaults;
  readonly errorMessage?: ReactNode;
  readonly isActive: boolean;
  readonly modalTitle: ReactNode;
  readonly onClose: () => void;
  readonly onSubmit: (values: typeof defaults) => void;
}

function TrainingBlockModal({
  defaultValues = defaults,
  errorMessage = <FormattedMessage {...messages.error} />,
  isActive,
  modalTitle,
  onClose,
  onSubmit,
}: TrainingBlockModalProps): ReactNode {
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
      <SimpleFormError>{({ error }) => (error ? errorMessage : null)}</SimpleFormError>

      <SimpleFormField
        label={<FormattedMessage {...messages.title} />}
        maxLength={30}
        minLength={1}
        name="titleOfBlock"
        required
      />
      <SimpleFormField
        label={<FormattedMessage {...messages.documentationLink} />}
        name="documentationLink"
        type="url"
      />
      <SimpleFormField
        label={<FormattedMessage {...messages.videoLink} />}
        name="videoLink"
        type="url"
      />
      <SimpleFormField
        component={TextAreaField}
        label={<FormattedMessage {...messages.exampleCode} />}
        name="exampleCodeBlock"
      />
      <SimpleFormField
        label={<FormattedMessage {...messages.externalResource} />}
        name="externalResourceLink"
        type="url"
      />
    </ModalCard>
  );
}

export default TrainingBlockModal;
