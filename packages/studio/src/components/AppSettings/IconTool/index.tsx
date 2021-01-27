import {
  Input,
  RadioButton,
  RadioGroup,
  useObjectURL,
  useSimpleForm,
} from '@appsemble/react-components';
import { ChangeEvent, ReactElement, SyntheticEvent, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useApp } from '../../AppContext';
import { IconPicker } from '../IconPicker';
import styles from './index.css';
import { messages } from './messages';

const shapes = {
  minimal: 'inset(10% round 40%)',
  circle: 'inset(0 round 50%)',
  rounded: 'inset(0 round 20%)',
  square: 'inset(0)',
};

export function IconTool(): ReactElement {
  const { formatMessage } = useIntl();
  const { app } = useApp();
  const { setValue, values } = useSimpleForm();

  // Const image = useRef()
  const [shape, setShape] = useState<keyof typeof shapes>('minimal');

  const iconUrl = useObjectURL(values.icon);
  const adaptiveIconUrl = useObjectURL(
    values.adaptiveIcon ||
      (app.hasAdaptiveIcon ? `${app.iconUrl}?adaptive=true&raw=true` : iconUrl),
  );
  const hasAdaptiveIcon = values.adaptiveIcon || app.hasAdaptiveIcon;

  const shapeShift = useCallback((event, value) => setShape(value), []);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>, value: unknown) => {
      setValue(event.currentTarget.name, value);
    },
    [setValue],
  );

  const handleAdaptiveIconLoad = useCallback(
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

  return (
    <div>
      <span className="label">Icon</span>
      <div className="is-flex">
        <div>
          <IconPicker name="icon" onChange={handleChange}>
            <figure className={`image is-flex is-128x128 ${styles.icon}`}>
              <img
                alt={formatMessage(messages.iconPreview)}
                className={styles.preview}
                src={iconUrl}
              />
            </figure>
          </IconPicker>
        </div>
        <div>
          <IconPicker name="adaptiveIcon" onChange={handleChange}>
            <figure
              className={`image is-flex is-128x128 ${styles.adaptiveIcon}`}
              // eslint-disable-next-line react/forbid-dom-props
              style={{
                clipPath: shapes[shape],
                backgroundColor: values.iconBackground || 'white',
              }}
            >
              {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
              <img
                alt={formatMessage(messages.adaptiveIconPreview)}
                className={hasAdaptiveIcon ? styles.fill : styles.contain}
                onLoad={handleAdaptiveIconLoad}
                src={adaptiveIconUrl}
              />
            </figure>
          </IconPicker>
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
