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
  readonly isVisible: boolean;
}

export function HeaderComponent({ index, isVisible, item }: HeaderComponentProps): VNode {
  const {
    actions,
    parameters: {
      itemDefinition: { header },
    },
    utils: { asset, remap },
  } = useBlock();

  const [titleValue, setTitleValue] = useState<string>('');
  const [subtitleValue, setSubtitleValue] = useState<string>('');
  const [assetIcon, setAssetIcon] = useState<FileIconName>(null);
  const [fetched, setFetched] = useState<boolean>(false);

  const onItemClick = useCallback(
    (event: Event) => {
      event.preventDefault();
      actions.onClick(item);
    },
    [actions, item],
  );

  useEffect(() => {
    if ('title' in header) {
      const remappedTitle = remap(header.title, item);
      const remappedSubtitle = remap(header.subtitle, item);
      setTitleValue(remappedTitle ? String(remappedTitle) : null);
      setSubtitleValue(remappedSubtitle ? String(remappedSubtitle) : null);
    }
  }, [header, item, remap]);

  const headerHTML = (
    <div className="is-flex is-justify-content-space-between is-align-items-center">
      {'icon' in header && isPreactChild(header.icon) ? <Icon icon={header.icon} /> : null}
      {'showAssetIcon' in header && assetIcon && isPreactChild(assetIcon) ? (
        <Icon icon={assetIcon as IconName} size="large" />
      ) : null}
      <div>
        {isPreactChild(titleValue) ? <h4 className={styles.title}>{titleValue}</h4> : null}
        {isPreactChild(subtitleValue) ? <h5>{subtitleValue}</h5> : null}
      </div>
    </div>
  );

  useEffect(() => {
    if (!isVisible || ('showAssetIcon' in header && !header.showAssetIcon)) {
      return;
    }

    (async () => {
      if (titleValue && normalized.test(titleValue) && !fetched) {
        const headerValueAssetUrl = asset(titleValue as string);
        try {
          const response = await fetch(headerValueAssetUrl, { method: 'HEAD' });
          if (response.ok) {
            const contentType = response.headers.get('Content-Type');
            setAssetIcon(getMimeTypeIcon(getMimeTypeCategory(contentType)));

            const contentDisposition = response.headers.get('Content-Disposition');
            if (contentDisposition) {
              setTitleValue(getFilenameFromContentDisposition(contentDisposition));
            }
          }
        } catch {
          // Do nothing
        }
        setFetched(true);
      }
    })();
  }, [asset, item, titleValue, fetched, isVisible, header]);

  return (
    <div className={`${styles.headerWrapper} is-flex`}>
      <div className={`is-flex ${styles.image}`}>
        <div>
          {'image' in header ? (
            <Image field={header.image} index={index} isVisible={isVisible} item={item} />
          ) : null}
        </div>
        {'showAssetIcon' in header && assetIcon && 'title' in header ? (
          <a
            className={`${styles.item} has-text-left is-block`}
            download
            href={asset(remap(header.title, item) as string)}
          >
            {headerHTML}
          </a>
        ) : actions.onClick.type === 'link' ? (
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
      {'button' in header ? (
        <ButtonComponent field={header.button} index={index} item={item} />
      ) : null}
      {'toggleButton' in header ? (
        <ToggleButtonComponent field={header.toggleButton} index={index} item={item} />
      ) : null}
      {'dropdown' in header ? (
        <div className={styles.dropdown}>
          <DropdownComponent field={header.dropdown} index={index} item={item} record={item} />
        </div>
      ) : null}
    </div>
  );
}
