import {
  Button,
  Content,
  Icon,
  useConfirmation,
  useData,
  useMessages,
} from '@appsemble/react-components';
import { type Training, type TrainingBlock } from '@appsemble/types';
import { Permission } from '@appsemble/utils';
import axios from 'axios';
import { type ReactElement, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';

import { CreatingTrainingBlockButton } from './CreateTrainingBlock/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';
import { AsyncDataView } from '../../../../components/AsyncDataView/index.js';
import { CardHeaderControl } from '../../../../components/CardHeaderControl/index.js';
import { StarRating } from '../../../../components/StarRating/index.js';
import { TrainingCard } from '../../../../components/TrainingCard/index.js';
import { useUser } from '../../../../components/UserProvider/index.js';
import { checkRole } from '../../../../utils/checkRole.js';

export function TrainingHomePage(): ReactElement {
  const { trainingId } = useParams<{ trainingId: string }>();
  const { organizations, userInfo } = useUser();

  const trainingInfo = useData<Training>(`/api/trainings/${trainingId}`);
  const trainingBlocks = useData<TrainingBlock[]>(`/api/trainings/${trainingId}/blocks`);
  const isEnrolled = useData<{ enrolled: boolean; completed: boolean }>(
    `/api/trainings/${trainingId}/enroll`,
  );
  const push = useMessages();
  const navigate = useNavigate();
  const { formatMessage } = useIntl();

  const isAppsembleMember = organizations?.find((org) => org.id === 'appsemble');

  const markAsCompleted = useCallback(async () => {
    const formData = new FormData();
    formData.set('completed', 'true');
    await axios.patch(`/api/trainings/${trainingId}/enroll`, formData);
    window.location.reload();
  }, [trainingId]);
  const onDeleteTraining = useConfirmation({
    title: <FormattedMessage {...messages.deleteWarningTitle} />,
    body: <FormattedMessage {...messages.deleteWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.delete} />,
    async action() {
      try {
        await axios.delete(`/api/trainings/${trainingInfo.data.id}`);
        push({
          body: formatMessage(messages.deleteSuccess, {
            name: trainingInfo.data.title,
          }),
          color: 'info',
        });
        navigate('/settings/trainings');
      } catch {
        push(formatMessage(messages.errorDelete));
      }
    },
  });

  const onEnroll = useCallback(async () => {
    await axios.post(`/api/trainings/${trainingId}/enroll`);
    window.location.reload();
  }, [trainingId]);

  const mayDeleteTraining =
    isAppsembleMember && checkRole(isAppsembleMember.role, Permission.DeleteApps);
  return (
    <Content className={`pb-2 ${styles.root}`}>
      <AsyncDataView
        emptyMessage={<FormattedMessage {...messages.emptyTraining} />}
        errorMessage={<FormattedMessage {...messages.errorTraining} />}
        loadingMessage={<FormattedMessage {...messages.loadingTraining} />}
        result={trainingInfo}
      >
        {(trainingInfoData) => (
          <CardHeaderControl
            controls={
              <>
                {mayDeleteTraining ? (
                  <>
                    <Button className="mb-3 ml-4 is-danger" onClick={onDeleteTraining}>
                      <FormattedMessage {...messages.deleteTraining} />
                    </Button>
                    <CreatingTrainingBlockButton className="mb-3" />
                  </>
                ) : null}
                {userInfo && isEnrolled.data && !isEnrolled.data.enrolled ? (
                  <Button className="is-primary" onClick={onEnroll}>
                    <FormattedMessage {...messages.enroll} />
                  </Button>
                ) : null}
              </>
            }
            description={trainingInfoData?.description}
            details={
              <>
                <div>
                  <StarRating value={trainingInfoData?.difficultyLevel} />
                </div>
                <span className="tag is-primary is-medium is-rounded is-capitalized">
                  {trainingInfoData.competence}
                </span>
              </>
            }
            icon={<Icon className={`px-4 py-4 card fa-light ${styles.icon}`} icon="book-open" />}
            subtitle={null}
            title={trainingInfoData.title}
          />
        )}
      </AsyncDataView>
      <AsyncDataView
        emptyMessage={null}
        errorMessage={<FormattedMessage {...messages.errorTraining} />}
        loadingMessage={<FormattedMessage {...messages.loadingTraining} />}
        result={trainingBlocks}
      >
        {(trainingBlocksData) => (
          <div className={styles.list}>
            {trainingBlocksData.map((block) => (
              <div className={styles.stack} key={block.id}>
                <TrainingCard
                  exampleCode={block.exampleCode}
                  externalResource={block.externalResource}
                  linkToDocumentation={block.documentationLink}
                  linkToVideo={block.videoLink}
                  title={block.title}
                />
              </div>
            ))}
          </div>
        )}
      </AsyncDataView>
      <div className="mt-2 is-flex is-justify-content-flex-end">
        {isEnrolled.data && isEnrolled.data.enrolled && !isEnrolled.data.completed ? (
          <Button className="is-primary" onClick={markAsCompleted}>
            <FormattedMessage {...messages.markAsCompleted} />
          </Button>
        ) : isEnrolled.data && !isEnrolled.data.enrolled ? null : (
          <div className="tag is-large is-success">
            <FormattedMessage {...messages.completed} />
          </div>
        )}
      </div>
    </Content>
  );
}
