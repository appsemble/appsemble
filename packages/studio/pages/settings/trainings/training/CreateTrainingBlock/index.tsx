import {
  Button,
  ModalCard,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleModalFooter,
} from '@appsemble/react-components';
import { type TrainingBlock } from '@appsemble/types';
import axios from 'axios';
import { type ReactNode, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { messages } from './messages.js';

export function CreatingTrainingBlockButton({
  className,
}: {
  readonly className: string;
}): ReactNode {
  const { trainingId } = useParams<{ trainingId: string }>();
  const { hash } = useLocation();
  const navigate = useNavigate();

  const defaultValues = {
    title: '',
    linkToDocumentation: '',
    linkToVideo: '',
    exampleCode: '',
    externalResource: '',
  };

  const openCreateDialog = useCallback(() => {
    navigate({ hash: 'create' }, { replace: true });
  }, [navigate]);

  const closeCreateDialog = useCallback(() => {
    navigate({ hash: null }, { replace: true });
  }, [navigate]);

  const onCreateTrainingBlock = useCallback(
    async ({
      exampleCode,
      externalResource,
      linkToDocumentation,
      linkToVideo,
      title,
    }: typeof defaultValues) => {
      const formData = new FormData();
      formData.set('title', title);
      formData.set('documentationLink', linkToDocumentation);
      formData.set('videoLink', linkToVideo);
      formData.set('exampleCode', exampleCode);
      formData.set('externalResource', externalResource);

      await axios.post<TrainingBlock>(`/api/trainings/${trainingId}/blocks`, formData);
      closeCreateDialog();

      window.location.reload();
    },
    [trainingId, closeCreateDialog],
  );

  const active = hash === '#create';
  return (
    <div>
      <Button className={`is-primary ${className}`} onClick={openCreateDialog}>
        <FormattedMessage {...messages.createTrainingBlock} />
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
        onSubmit={onCreateTrainingBlock}
        title={<FormattedMessage {...messages.createTrainingBlock} />}
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
          label={<FormattedMessage {...messages.documentationLink} />}
          name="linkToDocumentation"
          type="url"
        />
        <SimpleFormField
          label={<FormattedMessage {...messages.videoLink} />}
          name="linkToVideo"
          type="url"
        />
        <SimpleFormField
          label={<FormattedMessage {...messages.exampleCode} />}
          name="exampleCode"
        />
        <SimpleFormField
          label={<FormattedMessage {...messages.externalResource} />}
          name="externalResource"
          type="url"
        />
      </ModalCard>
    </div>
  );
}
