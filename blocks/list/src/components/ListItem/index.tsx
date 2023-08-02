import { useBlock } from '@appsemble/preact';
import { Icon, isPreactChild } from '@appsemble/preact-components';
import classNames from 'classnames';
import { Fragment, type VNode } from 'preact';
import { useCallback, useMemo } from 'preact/hooks';

import styles from './index.module.css';
import { type Item } from '../../../block.js';
import { ListItemWrapper } from '../ListItemWrapper/index.js';

interface ListItemProps {
  readonly item: Item;
}

export function ListItem({ item }: ListItemProps): VNode {
  const {
    actions,
    parameters: {
      button: {
        alignment,
        color,
        fullwidth,
        icon: buttonIcon,
        inverted,
        label: buttonLabel,
        light,
        onClick: onClickButton,
        outlined,
        rounded,
        size: buttonSize = 'normal',
        title,
        ...button
      },
      fields,
      header,
      icon,
      image,
    },
    utils: { asset, remap },
  } = useBlock();

  const onItemClick = useCallback(
    (event: Event) => {
      event.preventDefault();
      actions.onClick(item);
    },
    [actions, item],
  );

  const headerValue = remap(header, item);
  const img = remap(image, item) as string;

  const disabled = useMemo(
    () => Boolean(remap(button.disabled, item)),
    [button.disabled, item, remap],
  );
  const action = actions[onClickButton];
  const className = classNames('button', `is-${buttonSize}`, {
    'is-rounded': rounded,
    'is-fullwidth': fullwidth,
    [`is-${color}`]: color,
    'is-light': light,
    'is-inverted': inverted,
    'is-outlined': outlined,
  });
  const remappedTitle = remap(title, item) as string;

  const content = (
    <Fragment>
      {icon ? <Icon icon={icon} /> : null}
      <span>{remap(buttonLabel, item) as string}</span>
    </Fragment>
  );

  const onClick = useCallback(() => {
    if (disabled) {
      return;
    }

    action(item);
  }, [action, disabled, item]);

  return (
    <ListItemWrapper
      actions={actions}
      className={`${styles.item} has-text-left is-block my-1 pt-4 pr-6 pb-4 pl-5`}
      item={item}
      onClick={onItemClick}
    >
      {img ? (
        <figure className={`image is-48x48 mr-2 ${styles.image}`}>
          <img alt="list icon" src={/^(https?:)?\/\//.test(img) ? img : asset(img)} />
        </figure>
      ) : null}
      <div className="is-inline-block">
        {isPreactChild(icon) || isPreactChild(headerValue) ? (
          <div className={classNames({ [styles.header]: fields?.length })}>
            {isPreactChild(icon) ? <Icon icon={icon} /> : null}
            {isPreactChild(headerValue) ? <h4>{headerValue}</h4> : null}
            {button ? (
              <button
                className={className}
                disabled={disabled}
                onClick={onClick}
                title={remappedTitle}
                type="button"
              >
                {content}
              </button>
            ) : null}
          </div>
        ) : null}
        {fields?.map((field) => {
          let value;
          let label;

          if (field.value) {
            value = remap(field.value, item);
          }

          if (field.label) {
            label = remap(field.label, item);
          }

          return (
            // There is nothing that is guaranteed to be unique in these items.
            // eslint-disable-next-line react/jsx-key
            <span className={`${styles.itemField} mr-1 is-inline-block`}>
              {field.icon ? <Icon icon={field.icon} /> : null}
              {label == null ? null : (
                <span>
                  {label}
                  {value ? ': ' : null}
                </span>
              )}
              {value ? (
                <strong className="has-text-bold">
                  {typeof value === 'string' ? value : JSON.stringify(value)}
                </strong>
              ) : null}
            </span>
          );
        })}
      </div>
      {actions.onClick.type !== 'noop' && button == null && (
        <Icon className={`${styles.button} mx-0 my-0 px-0 py-0`} icon="angle-right" size="large" />
      )}
    </ListItemWrapper>
  );
}
