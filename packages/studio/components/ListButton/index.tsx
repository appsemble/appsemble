import { Subtitle, Title } from '@appsemble/react-components';
import { fa } from '@appsemble/web-utils';
import { type IconName } from '@fortawesome/fontawesome-common-types';
import { type ElementType, type MouseEventHandler, type ReactElement, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import styles from './index.module.css';

interface ListButtonProps {
  alt?: string;
  description?: ReactNode;
  icon?: IconName;
  image?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  subtitle?: ReactNode;
  title?: ReactNode;
  to?: string;
}

export function ListButton({
  alt,
  description,
  icon,
  image,
  onClick,
  subtitle,
  title,
  to,
}: ListButtonProps): ReactElement {
  const Wrapper: ElementType = to ? Link : 'button';
  const props = to ? { to } : ({ type: 'button', onClick } as const);

  return (
    <li className="my-4">
      <Wrapper className={`is-flex px-4 py-4 ${styles.wrapper}`} {...props}>
        <figure className={`image is-64x64 is-flex ${styles.figure}`}>
          {image ? (
            <img alt={alt} src={image} />
          ) : (
            <i className={`${fa(icon)} fa-3x has-text-dark`} />
          )}
        </figure>
        <div className={`ml-4 ${styles.content}`}>
          {title ? (
            <Title className="is-marginless" size={4}>
              {title}
            </Title>
          ) : null}
          {subtitle ? (
            <Subtitle className="is-marginless" size={5}>
              {subtitle}
            </Subtitle>
          ) : null}
          {description ? <span className="has-text-grey">{description}</span> : null}
        </div>
      </Wrapper>
    </li>
  );
}
