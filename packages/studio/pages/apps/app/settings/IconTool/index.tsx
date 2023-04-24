import {
  Button,
  Icon,
  Input,
  RadioButton,
  RadioGroup,
  useConfirmation,
  useMessages,
  useSimpleForm,
} from '@appsemble/react-components';
import axios from 'axios';
import {
  type ChangeEvent,
  type ReactElement,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { useUser } from '../../../../../components/UserProvider/index.js';
import { useApp } from '../../index.js';
import { IconPicker } from '../IconPicker/index.js';

const shapes = {
  minimal: 'inset(10% round 40%)',
  circle: 'inset(0 round 50%)',
  rounded: 'inset(0 round 20%)',
  square: 'inset(0)',
};

interface IconToolProps {
  disabled?: boolean;
}

export function IconTool({ disabled }: IconToolProps): ReactElement {
  const { formatMessage } = useIntl();
  const push = useMessages();
  const { app, setApp } = useApp();
  const { organizations } = useUser();
  const { setValue, values } = useSimpleForm();
  const { lang } = useParams<{ lang: string }>();

  const organization = organizations.find((org) => org.id === app.OrganizationId)!;

  const [shape, setShape] = useState<keyof typeof shapes>('minimal');

  let { icon, maskableIcon } = values;
  let scaleMaskableIcon = false;
  if (!icon) {
    if (app.iconUrl) {
      icon = `/api/apps/${app.id}/icon`;
    } else {
      if (organization.iconUrl) {
        icon = `/api/organizations/${organization.id}/icon`;
      }
    }
  }
  if (maskableIcon) {
    maskableIcon = URL.createObjectURL(maskableIcon);
  } else {
    if (app.hasMaskableIcon) {
      maskableIcon = `/api/apps/${app.id}/icon?maskable=true`;
    } else {
      scaleMaskableIcon = true;
      if (typeof icon === 'string') {
        maskableIcon = `/api/apps/${app.id}/icon?raw=true`;
      } else if (icon instanceof Blob) {
        maskableIcon = URL.createObjectURL(icon);
      }
    }
  }
  if (icon instanceof Blob) {
    icon = URL.createObjectURL(icon);
  }

  useEffect(() => () => URL.revokeObjectURL(icon), [icon]);
  useEffect(() => () => URL.revokeObjectURL(maskableIcon), [maskableIcon]);

  const shapeShift = useCallback((event: ChangeEvent, value: typeof shape) => setShape(value), []);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>, value: unknown) => {
      setValue(event.currentTarget.name, value);
      setApp({ ...app, [event.currentTarget.name]: Boolean(value) });
    },
    [setValue, setApp, app],
  );

  const handleMaskableIconLoad = useCallback(
    ({
      currentTarget: { classList, naturalHeight, naturalWidth, style },
    }: SyntheticEvent<HTMLImageElement>) => {
      if (classList.contains(styles.fill)) {
        // eslint-disable-next-line no-param-reassign
        style.width = '';
      } else {
        const safeAreaDiameter = 80;
        const angle = Math.atan(naturalHeight / naturalWidth);
        // eslint-disable-next-line no-param-reassign
        style.width = `${Math.cos(angle) * safeAreaDiameter}%`;
      }
    },
    [],
  );

  const onDeleteIcon = useConfirmation({
    title: <FormattedMessage {...messages.deleteIconWarningTitle} />,
    body: <FormattedMessage {...messages.deleteIconWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.delete} />,
    async action() {
      const { id } = app;

      try {
        await axios.delete(`/api/apps/${id}/icon`);
        push({
          body: formatMessage(messages.deleteIconSuccess),
          color: 'info',
        });
        setApp({
          ...app,
          hasIcon: false,
          iconUrl: null,
        });
        setValue('icon', null);
      } catch {
        push(formatMessage(messages.errorIconDelete));
      }
    },
  });

  const onDeleteMaskableIcon = useConfirmation({
    title: <FormattedMessage {...messages.deleteIconWarningTitle} />,
    body: <FormattedMessage {...messages.deleteIconWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.delete} />,
    async action() {
      const { id } = app;

      try {
        await axios.delete(`/api/apps/${id}/maskableIcon`);
        push({
          body: formatMessage(messages.deleteIconSuccess),
          color: 'info',
        });
        setApp({
          ...app,
          hasMaskableIcon: false,
        });
        setValue('maskableIcon', null);
      } catch {
        push(formatMessage(messages.errorIconDelete));
      }
    },
  });

  return (
    <div>
      <span className="label">
        <FormattedMessage {...messages.icon} />
      </span>
      <Link className="help" to={`/${lang}/docs/guide/app-icons`}>
        <FormattedMessage {...messages.more} />
      </Link>
      <div className="is-flex">
        <div className="mb-2 mr-2">
          <IconPicker disabled={disabled} name="icon" onChange={handleChange}>
            <figure className={`image is-flex is-128x128 ${styles.icon}`}>
              {icon ? (
                <img
                  alt={formatMessage(messages.iconPreview)}
                  className={styles.preview}
                  src={icon}
                />
              ) : (
                <Icon className={styles.iconFallback} icon="mobile-alt" />
              )}
            </figure>
          </IconPicker>
          <Button
            className={`${styles.deleteButton} mt-1`}
            color="danger"
            disabled={!app.hasIcon}
            icon="trash-alt"
            onClick={onDeleteIcon}
          />
        </div>
        <div className="mb-2 mr-2">
          <IconPicker disabled={disabled} name="maskableIcon" onChange={handleChange}>
            <figure
              className={`image is-flex is-128x128 ${styles.maskableIcon}`}
              // eslint-disable-next-line react/forbid-dom-props
              style={{
                clipPath: shapes[shape],
                backgroundColor: values.iconBackground || 'white',
              }}
            >
              {maskableIcon ? (
                // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
                <img
                  alt={formatMessage(messages.maskableIconPreview)}
                  className={scaleMaskableIcon ? styles.contain : styles.fill}
                  onLoad={handleMaskableIconLoad}
                  src={maskableIcon}
                />
              ) : (
                <Icon className={styles.maskableIconFallback} icon="mobile-alt" />
              )}
            </figure>
          </IconPicker>
          <Button
            className={`${styles.deleteButton} mt-1`}
            color="danger"
            disabled={!app.hasMaskableIcon}
            icon="trash-alt"
            onClick={onDeleteMaskableIcon}
          />
        </div>
        <div>
          <RadioGroup name="shape" onChange={shapeShift} value={shape}>
            <RadioButton id="shape-minimal" value="minimal">
              <FormattedMessage {...messages.minimal} />
            </RadioButton>
            <RadioButton id="shape-circle" value="circle">
              <FormattedMessage {...messages.circle} />
            </RadioButton>
            <RadioButton id="shape-rounded" value="rounded">
              <FormattedMessage {...messages.rounded} />
            </RadioButton>
            <RadioButton id="shape-square" value="square">
              <FormattedMessage {...messages.square} />
            </RadioButton>
          </RadioGroup>
          <Input
            className="is-paddingless"
            disabled={disabled}
            name="iconBackground"
            onChange={handleChange}
            type="color"
            value={values.iconBackground}
          />
        </div>
      </div>
    </div>
  );
}
