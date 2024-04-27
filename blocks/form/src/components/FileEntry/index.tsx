import { useBlock } from '@appsemble/preact';
import { Modal, useObjectURL, useToggle } from '@appsemble/preact-components';
import { findIconDefinition, icon, library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { type JSX, type VNode } from 'preact';
import { useCallback, useRef, useState } from 'preact/hooks';

import styles from './index.module.css';
import { type FileField, type InputProps } from '../../../block.js';
import { getAccept } from '../../utils/requirements.js';
import { resize } from '../../utils/resize.js';

export function createCustomSvg(iconName: any): string {
  /* Add all font awesome solid icons to the library. */
  library.add(fas);

  /* Parse the library for an icon with given name and then return it as a font awesome icon object. */
  const iconDefinition = icon(findIconDefinition({ prefix: 'fas', iconName }));
  let svgContent;

  if (iconDefinition === undefined) {
    return;
  }

  svgContent = iconDefinition.html[0];
  svgContent = svgContent.replace('fill="currentColor"', 'fill="#FFFFFF"');
  const viewBoxMatch = svgContent.match(
    /viewBox="(\d+(?:\.\d+)?) (\d+(?:\.\d+)?) (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)/,
  );
  const originalViewBoxValues = viewBoxMatch.slice(1).map(Number);
  const [xMin, yMin, originalWidth, originalHeight] = originalViewBoxValues;

  const circleRadius = 120;
  const overflow = circleRadius / 2;
  const enlargement = overflow * 2;

  const newWidth = originalWidth + enlargement;
  const newHeight = originalHeight + enlargement;
  const newViewBox = `${xMin - enlargement / 2} ${yMin - enlargement / 2} ${newWidth} ${newHeight}`;

  const circleX = originalWidth - circleRadius * 2 + overflow;
  const circleY = originalHeight - circleRadius * 2 + overflow;

  const plusSignSvg = `
      <g id="plus-sign" transform="translate(${circleX}, ${circleY})">
          <circle id="circle-background" fill="#BEBEBE" cx="${circleRadius}" cy="${circleRadius}" r="${circleRadius}"></circle>
          <path d="M${circleRadius - circleRadius / 2},${circleRadius} L${
            circleRadius + circleRadius / 2
          },${circleRadius}" stroke="#FFFFFF" stroke-linecap="round" stroke-width="30"></path>
          <path d="M${circleRadius},${circleRadius - circleRadius / 2} L${circleRadius},${
            circleRadius + circleRadius / 2
          }" stroke="#FFFFFF" stroke-linecap="round" stroke-width="30"></path>
      </g>
      `;

  svgContent = svgContent.replace('</svg>', `${plusSignSvg}</svg>`);
  //
  // cspell:disable-next-line
  svgContent = svgContent.replace(/viewbox="[\d\s.-]+"/i, `viewBox="${newViewBox}"`);

  const encodedSvg = encodeURIComponent(svgContent);

  return `url('data:image/svg+xml,${encodedSvg}')`;
}

type FileEntryProps = InputProps<Blob | string, FileField>;

export function FileEntry({ field, formValues: value, name, onChange }: FileEntryProps): VNode {
  const { utils } = useBlock();

  const valueString = typeof value === 'string' ? (value as string) : null;
  const prefix = valueString ? utils.asset(valueString) : null;
  const src = valueString?.startsWith('http') ? valueString : prefix;
  const url = useObjectURL((src || value) as unknown as Blob | string);
  const { icon: iconName } = field;

  const modal = useToggle();
  const videoRef = useRef(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  const [firstFrameSrc, setFirstFrameSrc] = useState('');

  const onSelect = useCallback(
    async (event: JSX.TargetedEvent<HTMLInputElement>): Promise<void> => {
      const { maxHeight, maxWidth, quality } = field;
      const { currentTarget } = event;
      let file = currentTarget.files[0] as Blob;
      currentTarget.value = null;

      if (file?.type.match('image/*') && (maxWidth || maxHeight || quality)) {
        file = await resize(file, maxWidth, maxHeight, quality);
        setFileType('image');
      }

      if (file?.type.match('video/*')) {
        setFileType('video');
      }

      onChange({ currentTarget, ...event }, file);
    },
    [field, onChange],
  );

  const onRemove = useCallback(
    (event: Event) => {
      event.preventDefault();
      onChange({ currentTarget: { name } } as any as Event, null);
    },
    [name, onChange],
  );

  const captureFirstFrame = (): void => {
    const videoElement = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    const dataURL = canvas.toDataURL();
    setFirstFrameSrc(dataURL);
  };

  return (
    <div className={`appsemble-file file mr-3 ${styles.root}`}>
      {value && url ? (
        <Modal isActive={modal.enabled} onClose={modal.disable}>
          {fileType === 'image' ? (
            <figure className="image">
              <img
                alt={(utils.remap(field.label, value) as string) ?? field.name}
                className={styles.image}
                src={url}
              />
            </figure>
          ) : null}
          {fileType === 'video' ? (
            <video controls ref={videoRef} src={url}>
              <track kind="captions" />
            </video>
          ) : null}
        </Modal>
      ) : null}
      <label className="file-label">
        {!value || !url ? (
          <input
            accept={getAccept(field)}
            className={`file-input ${styles.input}`}
            name={name}
            onChange={onSelect}
            type="file"
          />
        ) : null}
        {url ? (
          <>
            <button className={styles.button} onClick={modal.enable} type="button">
              <figure className="image is-relative">
                <img
                  alt={(utils.remap(field.label, value) as string) ?? field.name}
                  className={`${styles.image} ${styles.rounded}`}
                  src={fileType === 'video' ? firstFrameSrc : url}
                />
              </figure>
            </button>
            <button
              className={`button is-small ${styles.removeButton}`}
              onClick={onRemove}
              type="button"
            >
              <span className="icon">
                <i className="fas fa-times" />
              </span>
            </button>
          </>
        ) : (
          <span
            className={`image is-128x128 px-2 py-2 has-text-centered ${styles.rounded} ${styles.empty} `}
            /* eslint-disable-next-line react/forbid-dom-props */
            style={
              createCustomSvg(iconName)
                ? {
                    backgroundImage: createCustomSvg(iconName),
                  }
                : {}
            }
          >
            <span className="file-label">
              {utils.remap(field.emptyFileLabel ?? ' ', field) as string}
            </span>
          </span>
        )}
      </label>
      {url && fileType === 'video' ? (
        <div className={styles.input}>
          <video autoPlay controls onCanPlay={captureFirstFrame} ref={videoRef} src={url}>
            <track kind="captions" />
          </video>
        </div>
      ) : null}
    </div>
  );
}
