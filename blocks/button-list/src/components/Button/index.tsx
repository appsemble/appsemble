import { Icon } from '@appsemble/preact-components';
import { Action, Utils } from '@appsemble/sdk';
import classNames from 'classnames';
import { h, VNode } from 'preact';
import { useCallback, useMemo } from 'preact/hooks';

import { Button as ButtonType } from '../../../block';
import { ButtonWrapper } from '../ButtonWrapper';

interface ButtonProps {
  action: Action;
  button: ButtonType;
  data: unknown;
  utils: Utils;
}

export function Button({ action, button, data, utils }: ButtonProps): VNode {
  const onButtonClick = useCallback(
    (event: Event) => {
      event.preventDefault();
      action.dispatch(data);
    },
    [action, data],
  );

  const label = useMemo(() => utils.remap(button.label, data), [button, data, utils]);

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
      {label && <span>{label}</span>}
    </ButtonWrapper>
  );
}
