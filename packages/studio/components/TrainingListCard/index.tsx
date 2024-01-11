import { Button, useConfirmation, useMessages } from '@appsemble/react-components';
import { type Training } from '@appsemble/types';
import { Permission } from '@appsemble/utils';
import { randomString } from '@appsemble/web-utils';
import axios from 'axios';
import {
  type ChangeEvent,
  type ElementType,
  type MouseEventHandler,
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { checkRole } from '../../utils/checkRole.js';
import { StarRating } from '../StarRating/index.js';
import { defaultTrainingValues, TrainingModal } from '../TrainingModal/index.js';
import { useUser } from '../UserProvider/index.js';

export interface TrainingListCardProps {
  readonly title: ReactNode;
  readonly competences: string[];
  readonly difficultyLevel: number;
  readonly id: string;
  readonly onClick?: MouseEventHandler<HTMLButtonElement>;
  readonly description: ReactNode;
  readonly to?: string;
}

export type TrainingSortFunction<ATraining extends Training = Training> = (
  a: ATraining,
  b: ATraining,
) => number;

export function TrainingListCard({
  competences,
  description,
  difficultyLevel,
  id,
  onClick,
  title,
  to,
}: TrainingListCardProps): ReactNode {
  const { formatMessage } = useIntl();
  const Wrapper: ElementType = to ? Link : 'button';
  const props = to ? { to } : ({ type: 'button', onClick } as const);
  const [showMenu, setShowMenu] = useState(false);
  const push = useMessages();
  const [comp, setComp] = useState(competences);
  const navigate = useNavigate();
  const { hash } = useLocation();
  const [trainingData, setTrainingData] = useState(defaultTrainingValues);
  const { organizations } = useUser();

  const isAppsembleMember = organizations?.find((org) => org.id === 'appsemble');
  const mayDeleteTraining =
    isAppsembleMember && checkRole(isAppsembleMember.role, Permission.DeleteApps);

  const handleSelectChange = useCallback(
    ({ currentTarget }: ChangeEvent<HTMLSelectElement>) => {
      const selectedValue = currentTarget.value;
      setComp((prevCompetence) => {
        if (prevCompetence.includes(selectedValue)) {
          return prevCompetence.filter((value) => value !== selectedValue);
        }
        return [...prevCompetence, selectedValue];
      });
    },
    [setComp],
  );
  const dropdownRef = useRef(null);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      // Close the menu if clicked outside of the dropdown menu
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    },
    [setShowMenu],
  );

  useLayoutEffect(() => {
    // Attach the click event listener to the document when the component mounts
    document.addEventListener('click', handleClickOutside);

    // Detach the event listener when the component unmounts
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [handleClickOutside]);

  const onEdit = useCallback(async () => {
    const { data: fetchedTrainingData } = await axios.get<Training>(`/api/trainings/${id}`);
    setTrainingData(fetchedTrainingData);
    navigate({ hash: `edit-${id}` }, { replace: true });
  }, [navigate, id]);

  const closeEditDialog = useCallback(() => {
    navigate({ hash: null }, { replace: true });
  }, [navigate]);

  const isEditModalActive = hash === `#edit-${id}`;

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
      const { data } = await axios.patch<Training>(`/api/trainings/${id}`, formData);
      closeEditDialog();
      navigate(String(data.id), { replace: true });
    },
    [navigate, comp, id, closeEditDialog],
  );

  const onDeleteTraining = useConfirmation({
    title: <FormattedMessage {...messages.deleteWarningTitle} />,
    body: <FormattedMessage {...messages.deleteWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.delete} />,
    async action() {
      try {
        await axios.delete(`/api/trainings/${id}`);
        push({
          body: formatMessage(messages.deleteSuccess, {
            name: String(title),
          }),
          color: 'info',
        });
        navigate('/settings/trainings');
      } catch {
        push(formatMessage(messages.errorDelete));
      }
    },
  });
  return (
    <div>
      {mayDeleteTraining ? (
        <div className="dropdown is-pulled-right is-right is-active" ref={dropdownRef}>
          <div className="dropdown-trigger">
            <Button
              aria-controls="dropdown-menu"
              aria-haspopup="true"
              icon="ellipsis-vertical"
              onClick={() => setShowMenu(!showMenu)}
            />
          </div>
          {showMenu ? (
            <div className="dropdown-menu" role="menu">
              <div className="dropdown-content">
                <div className="dropdown-item">
                  <Button className="is-ghost" onClick={onEdit}>
                    <FormattedMessage {...messages.editTraining} />
                  </Button>
                </div>
                <div className="dropdown-item">
                  <Button className="is-ghost" onClick={onDeleteTraining}>
                    <FormattedMessage {...messages.deleteTraining} />
                  </Button>
                </div>
                <TrainingModal
                  defaultValues={{
                    title: trainingData.title,
                    description: trainingData.description,
                    difficultyLevel: trainingData.difficultyLevel,
                    competences: comp,
                  }}
                  isActive={isEditModalActive}
                  modalTitle={<FormattedMessage {...messages.editTraining} />}
                  onClose={closeEditDialog}
                  onSelectChange={handleSelectChange}
                  onSubmit={onEditTraining}
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      <li className="my-4" id={id}>
        <Wrapper className={`box px-4 py-4 ${styles.wrapper}`} {...props}>
          <div className="columns is-multiline">
            <div className="column">
              <h6 className="title is-6 is-marginless">{title}</h6>
              <p>{description}</p>
            </div>
            <div className="column">
              <b>{formatMessage(messages.competences)}</b>
              <br />
              {competences.map((tag) => (
                <span className="tag is-medium is-center mb-2 mr-1" key={randomString()}>
                  {tag}
                </span>
              ))}
            </div>
            <div className="column">
              <b>{formatMessage(messages.difficulty)}</b>
              <StarRating className={styles.rating} value={difficultyLevel} />
            </div>
          </div>
        </Wrapper>
      </li>
    </div>
  );
}
