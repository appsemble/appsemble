/** @jsx h */
import { Icon } from '@appsemble/preact-components';
import type { Action } from '@appsemble/sdk';
import classNames from 'classnames';
import { h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import type { Button as ButtonType } from '../../../block';
import ButtonWrapper from '../ButtonWrapper';

interface ButtonProps {
  action: Action;
  button: ButtonType;
  data: any;
}

export default function Button({ action, button, data }: ButtonProps): VNode {
  const onButtonClick = useCallback(
    (event: Event) => {
      event.preventDefault();
      action.dispatch(data);
    },
    [action, data],
  );

  return (
    <ButtonWrapper
      action={action}
      className={classNames('button', `is-${button.size ?? 'normal'}`, {
        'is-rounded': button.rounded,
        'is-fullwidth': button.fullwidth,
        [`is-${button.color}`]: button.color,
        'is-light': button.light,
        'is-inverted': button.inverted,
        'is-outlined': button.outlined,
      })}
      onClick={onButtonClick}
    >
      {button.icon && <Icon icon={button.icon} />}
      {button.label && <span>{button.label}</span>}
    </ButtonWrapper>
  );
}
