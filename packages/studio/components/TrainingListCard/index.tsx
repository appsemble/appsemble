import { type Training } from '@appsemble/types';
import { type ElementType, type MouseEventHandler, type ReactElement, type ReactNode } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { StarRating } from '../StarRating/index.js';

export interface TrainingListCardProps {
  readonly title: ReactNode;
  readonly competence: string;
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
  competence,
  description,
  difficultyLevel,
  id,
  onClick,
  title,
  to,
}: TrainingListCardProps): ReactElement {
  const { formatMessage } = useIntl();
  const Wrapper: ElementType = to ? Link : 'button';
  const props = to ? { to } : ({ type: 'button', onClick } as const);
  return (
    <li className="my-4" id={id}>
      <Wrapper className={`box px-4 py-4 ${styles.wrapper}`} {...props}>
        <div className="columns is-multiline">
          <div className="column">
            <h6 className="title is-6 is-marginless">{title}</h6>
            <p>{description}</p>
          </div>
          <div className="column">
            <b>{formatMessage(messages.competence)}</b>
            <p>
              <span className="tag is-primary is-rounded is-medium">{competence}</span>
            </p>
          </div>
          <div className="column">
            <b>{formatMessage(messages.difficulty)}</b>
            <StarRating className={styles.rating} value={difficultyLevel} />
          </div>
        </div>
      </Wrapper>
    </li>
  );
}
