import { useBlock } from '@appsemble/preact';
import { Icon, isPreactChild } from '@appsemble/preact-components';
import {
  type FileIconName,
  getFilenameFromContentDisposition,
  getMimeTypeCategory,
  getMimeTypeIcon,
  normalized,
} from '@appsemble/utils';
import { type IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { type VNode } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

import styles from './index.module.css';
import { type Item } from '../../../../block.js';
import { ButtonComponent } from '../../Button/index.js';
import { DropdownComponent } from '../../Dropdown/index.js';
import { ToggleButtonComponent } from '../../ToggleButton/index.js';
import { Image } from '../Image/index.js';

interface HeaderComponentProps {
  readonly index: number;
  readonly item: Item;
}

export function HeaderComponent({ index, item }: HeaderComponentProps): VNode {
  const {
    actions,
    parameters: { button, dropdown, fields, header, icon, image, toggleButton },
    utils: { asset, remap },
  } = useBlock();

  const [headerValue, setHeaderValue] = useState<string>('');
  const [fileIcon, setFileIcon] = useState<FileIconName>(null);
  const [fetched, setFetched] = useState<boolean>(false);

  const onItemClick = useCallback(
    (event: Event) => {
      event.preventDefault();
      actions.onClick(item);
    },
    [actions, item],
  );

  useEffect(() => {
    const remappedHeader = remap(header, item);
    setHeaderValue(remappedHeader ? String(remappedHeader) : null);
  }, [header, item, remap]);

  const headerHTML = (
    <div className={classNames({ [styles.header]: fields?.length || fileIcon })}>
      {fileIcon && isPreactChild(fileIcon) ? (
        <Icon icon={fileIcon as IconName} size="large" />
      ) : isPreactChild(icon) ? (
        <Icon icon={icon} />
      ) : null}
      {isPreactChild(headerValue) ? <h4>{headerValue}</h4> : null}
    </div>
  );

  useEffect(() => {
    (async () => {
      if (headerValue && normalized.test(headerValue) && !fetched) {
        const headerValueAssetUrl = asset(headerValue as string);
        try {
          const response = await fetch(headerValueAssetUrl, { method: 'HEAD' });
          if (response.ok) {
            const contentType = response.headers.get('Content-Type');
            setFileIcon(getMimeTypeIcon(getMimeTypeCategory(contentType)));

            const contentDisposition = response.headers.get('Content-Disposition');
            if (contentDisposition) {
              setHeaderValue(getFilenameFromContentDisposition(contentDisposition));
            }
          }
        } catch {
          // Do nothing
        }
        setFetched(true);
      }
    })();
  }, [asset, item, headerValue, fetched]);

  return (
    <div className={`${styles.headerWrapper} is-flex`}>
      <div className={`is-flex ${styles.image}`}>
        <div>
          {image && image.alignment === 'header' ? (
            <Image field={image} index={index} item={item} />
          ) : null}
        </div>
        {actions.onClick.type === 'link' ? (
          <a className={`${styles.item} has-text-left is-block`} href={actions.onClick.href(item)}>
            {headerHTML}
          </a>
        ) : (
          <button
            className={`${styles.item} has-text-left is-block`}
            onClick={onItemClick}
            type="button"
          >
            {headerHTML}
          </button>
        )}
      </div>
      {button && button.alignment === 'top-right' ? (
        <ButtonComponent field={button} index={index} item={item} />
      ) : null}
      {toggleButton ? (
        <ToggleButtonComponent field={toggleButton} index={index} item={item} />
      ) : null}
      {dropdown && dropdown.alignment === 'top-right' ? (
        <div className={styles.dropdown}>
          <DropdownComponent field={dropdown} index={index} item={item} record={item} />
        </div>
      ) : null}
    </div>
  );
}
