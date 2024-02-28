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
import { randomString } from '@appsemble/web-utils';
import axios from 'axios';
import { type ChangeEvent, type ReactNode, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { CreatingTrainingBlockButton } from './CreateTrainingBlock/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';
import { AsyncDataView } from '../../../components/AsyncDataView/index.js';
import { CardHeaderControl } from '../../../components/CardHeaderControl/index.js';
import { StarRating } from '../../../components/StarRating/index.js';
import { TrainingBlockCard } from '../../../components/TrainingBlockCard/index.js';
import {
  type defaultTrainingValues,
  TrainingModal,
} from '../../../components/TrainingModal/index.js';
import { useUser } from '../../../components/UserProvider/index.js';
import { checkRole } from '../../../utils/checkRole.js';

export function TrainingHomePage(): ReactNode {
  const { formatMessage } = useIntl();
  const { trainingId } = useParams<{ trainingId: string }>();
  const { organizations, userInfo } = useUser();
  const push = useMessages();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const trainingInfo = useData<Training>(`/api/trainings/${trainingId}`);
  const [comp, setComp] = useState(null);
  const trainingBlocks = useData<TrainingBlock[]>(`/api/trainings/${trainingId}/blocks`);
  const isEnrolled = useData<{ enrolled: boolean; completed: boolean }>(
    `/api/trainings/${trainingId}/enroll`,
  );

  const isAppsembleMember = organizations?.find((org) => org.id === 'appsemble');

  useEffect(() => {
    if (trainingInfo) {
      setComp(trainingInfo?.data?.competences);
    }
  }, [trainingInfo]);

  const markAsCompleted = useCallback(async () => {
    const formData = new FormData();
    formData.set('completed', 'true');
    await axios.patch(`/api/trainings/${trainingId}/enroll`, formData);
    window.location.reload();
  }, [trainingId]);

  const onEnroll = useCallback(async () => {
    await axios.post(`/api/trainings/${trainingId}/enroll`);
    window.location.reload();
  }, [trainingId]);

  const mayDeleteTraining =
    isAppsembleMember && checkRole(isAppsembleMember.role, Permission.DeleteApps);

  const handleSelectChange = useCallback(
    ({ currentTarget }: ChangeEvent<HTMLSelectElement>) => {
      const selectedValue = currentTarget.value;
      setComp((prevCompetence: string[]) => {
        if (prevCompetence.includes(selectedValue)) {
          return prevCompetence.filter((value) => value !== selectedValue);
        }
        return [...prevCompetence, selectedValue];
      });
    },
    [setComp],
  );

  const onEdit = useCallback(() => {
    navigate({ hash: 'edit' }, { replace: true });
  }, [navigate]);

  const closeEditDialog = useCallback(() => {
    navigate({ hash: null }, { replace: true });
  }, [navigate]);

  const isEditModalActive = hash === '#edit';

  const onEditTraining = useCallback(
    async ({
      description: trainingDescription,
      difficultyLevel: trainingDifficultyLevel,
      title: trainingTitle,
    }: typeof defaultTrainingValues) => {
      const formData = new FormData();
      formData.set('title', trainingTitle);
      formData.set('description', trainingDescription);
      formData.set('difficultyLevel', String(trainingDifficultyLevel));
      formData.set('competences', JSON.stringify(comp));
      await axios.patch<Training>(`/api/trainings/${trainingId}`, formData);
      closeEditDialog();
      window.location.reload();
    },
    [closeEditDialog, comp, trainingId],
  );

  const onDeleteTraining = useConfirmation({
    title: <FormattedMessage {...messages.deleteWarningTitle} />,
    body: <FormattedMessage {...messages.deleteWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.delete} />,
    async action() {
      try {
        await axios.delete(`/api/trainings/${trainingId}`);
        push({
          body: formatMessage(messages.deleteSuccess, {
            name: String(trainingInfo?.data.title),
          }),
          color: 'info',
        });
        navigate('../');
      } catch {
        push(formatMessage(messages.errorDelete));
      }
    },
  });

  return (
    <Content className={`pb-5 ${styles.root}`}>
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
                  <CreatingTrainingBlockButton className="mx-3 my-1 is-flex" />
                ) : null}
                {mayDeleteTraining ? (
                  <Button
                    className="button is-primary mx-3 my-1"
                    icon="edit"
                    iconSize="medium"
                    onClick={onEdit}
                  >
                    <FormattedMessage {...messages.editTraining} />
                  </Button>
                ) : null}
                {mayDeleteTraining ? (
                  <Button
                    className="button is-danger is-light mx-3 my-1"
                    icon="trash"
                    iconSize="medium"
                    onClick={onDeleteTraining}
                  >
                    <FormattedMessage {...messages.deleteTraining} />
                  </Button>
                ) : null}
                <TrainingModal
                  defaultValues={{
                    title: trainingInfo?.data.title,
                    description: trainingInfo?.data.description,
                    difficultyLevel: trainingInfo?.data.difficultyLevel,
                    competences: comp,
                  }}
                  isActive={isEditModalActive}
                  modalTitle={<FormattedMessage {...messages.editTraining} />}
                  onClose={closeEditDialog}
                  onSelectChange={handleSelectChange}
                  onSubmit={onEditTraining}
                />
              </>
            }
            description={trainingInfoData?.description}
            details={
              <>
                <div>
                  <StarRating value={trainingInfoData?.difficultyLevel} />
                </div>
                <div>
                  {trainingInfoData?.competences?.map((tag) => (
                    <span className="tag is-primary is-capitalized ml-2" key={randomString()}>
                      {tag}
                    </span>
                  ))}
                </div>
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
            {trainingBlocksData?.map((block) => (
              <div className={styles.stack} key={block.id}>
                <TrainingBlockCard
                  blockId={block.id}
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
      <div className={styles.isPositionedTopRight}>
        {userInfo && isEnrolled.data && !isEnrolled.data.enrolled ? (
          <Button className="is-primary" icon="school" onClick={onEnroll}>
            <FormattedMessage {...messages.enroll} />
          </Button>
        ) : null}
        {isEnrolled.data?.enrolled && !isEnrolled.data?.completed ? (
          <Button className="is-primary" icon="school-circle-check" onClick={markAsCompleted}>
            <FormattedMessage {...messages.markAsCompleted} />
          </Button>
        ) : (isEnrolled.data && !isEnrolled.data.enrolled) || !userInfo ? null : (
          <div className="tag is-large has-background-success-light has-text-success-dark">
            <span>
              <Icon className="mr-2" icon="user-graduate" />
              <FormattedMessage {...messages.completed} />
            </span>
          </div>
        )}
      </div>
    </Content>
  );
}
