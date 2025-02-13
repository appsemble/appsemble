import { Button, Icon, useMessages, useMeta } from '@appsemble/react-components';
import { type Training } from '@appsemble/types';
import axios from 'axios';
import { type ComponentType, type ReactNode, useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocation, useNavigate } from 'react-router-dom';

import { messages } from './messages.js';
import { useUser } from '../../../components/UserProvider/index.js';

interface TrainingPageProps {
  readonly content: ComponentType;
  readonly id: string;
  readonly completed: boolean;
  readonly setCompleted: (trainingId: string) => void;
  readonly nextTraining?: Training;
}

export function TrainingPage({
  completed,
  content: TrainingContent,
  id,
  nextTraining,
  setCompleted,
}: TrainingPageProps): ReactNode {
  const [isCompleted, setIsCompleted] = useState(completed);
  useMeta(id);
  const push = useMessages();
  const { formatMessage } = useIntl();
  const isLoggedIn = useUser().userInfo != null;
  const navigate = useNavigate();
  const location = useLocation();

  // State doesn't get reset when using navigate, so this needs to be initialized again
  useMemo(() => {
    setIsCompleted(completed);
  }, [completed]);

  const completeTraining = useCallback(async () => {
    if (isLoggedIn) {
      await axios.post(`/api/trainings/completed/${id}`).catch(() => {
        push(formatMessage(messages.completeFailed));
        throw new Error(formatMessage(messages.completeFailed));
      });
    }

    setIsCompleted(true);
    setCompleted(id);
  }, [isLoggedIn, setCompleted, id, push, formatMessage]);

  const navToTree = useCallback(() => {
    const trainingTreeUrl = `${location.pathname.split('trainings')[0]}trainings`;
    navigate(trainingTreeUrl);
  }, [location.pathname, navigate]);

  const navToNextTraining = useCallback(() => {
    if (!nextTraining) {
      navToTree();
    }
    const nextTrainingUrl = `${location.pathname.split('/').slice(0, -2).join('/')}/${nextTraining.path}`;
    navigate(nextTrainingUrl);
  }, [nextTraining, location.pathname, navigate, navToTree]);

  return (
    <div>
      <TrainingContent />
      <Button
        className={`ml-6 ${isCompleted ? 'is-success is-light' : 'is-primary'}`}
        disabled={isCompleted}
        onClick={completeTraining}
      >
        {isCompleted ? (
          <FormattedMessage {...messages.trainingButtonCompleted} />
        ) : (
          <FormattedMessage {...messages.trainingButtonNotCompleted} />
        )}
      </Button>
      <div className={`ml-6 pt-3 ${isCompleted ? '' : 'disabled'}`}>
        <Button className="is-info mr-3" disabled={!isCompleted} onClick={navToTree}>
          <Icon icon="diagram-project" />
          <span>
            <FormattedMessage {...messages.backToTree} />
          </span>
        </Button>
        {nextTraining ? (
          <Button className="is-info" disabled={!isCompleted} onClick={navToNextTraining}>
            <Icon icon="arrow-down" />
            <span>
              <FormattedMessage {...messages.to} /> &quot;{nextTraining.title}&quot;
            </span>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
