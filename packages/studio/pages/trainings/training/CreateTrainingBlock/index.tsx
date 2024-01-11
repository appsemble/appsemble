import { Button } from '@appsemble/react-components';
import { type TrainingBlock } from '@appsemble/types';
import axios from 'axios';
import { type ReactNode, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { messages } from './messages.js';
import TrainingBlockModal, {
  type defaults,
} from '../../../../components/TrainingBlockModal/index.js';

export function CreatingTrainingBlockButton({
  className,
}: {
  readonly className: string;
}): ReactNode {
  const { trainingId } = useParams<{ trainingId: string }>();
  const { hash } = useLocation();
  const navigate = useNavigate();

  const openCreateDialog = useCallback(() => {
    navigate({ hash: 'create' }, { replace: true });
  }, [navigate]);

  const closeCreateDialog = useCallback(() => {
    navigate({ hash: null }, { replace: true });
  }, [navigate]);

  const onCreateTrainingBlock = useCallback(
    async ({
      documentationLink,
      exampleCodeBlock,
      externalResourceLink,
      titleOfBlock,
      videoLink,
    }: typeof defaults) => {
      const formData = new FormData();
      formData.set('title', titleOfBlock);
      formData.set('documentationLink', documentationLink);
      formData.set('videoLink', videoLink);
      formData.set('exampleCode', exampleCodeBlock);
      formData.set('externalResource', externalResourceLink);

      await axios.post<TrainingBlock>(`/api/trainings/${trainingId}/blocks`, formData);
      closeCreateDialog();

      window.location.reload();
    },
    [trainingId, closeCreateDialog],
  );

  const active = hash === '#create';
  return (
    <div>
      <Button className={className} onClick={openCreateDialog}>
        <FormattedMessage {...messages.createTrainingBlock} />
      </Button>
      <TrainingBlockModal
        isActive={active}
        modalTitle={<FormattedMessage {...messages.createTrainingBlock} />}
        onClose={closeCreateDialog}
        onSubmit={onCreateTrainingBlock}
      />
    </div>
  );
}
