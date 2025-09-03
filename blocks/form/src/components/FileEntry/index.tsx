import { useBlock } from '@appsemble/preact';
import { Modal, useObjectURL, useToggle } from '@appsemble/preact-components';
import {
  type FileIconName,
  getFilenameFromContentDisposition,
  getMimeTypeCategories,
  getMimeTypeCategory,
  getMimeTypeIcon,
  MimeTypeCategory,
} from '@appsemble/utils';
import { findIconDefinition, icon, library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import { type JSX, type Ref, type VNode } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import styles from './index.module.css';
import { type AcceptRequirement, type FileField, type InputProps } from '../../../block.js';
import { getAccept } from '../../utils/requirements.js';
import { resize } from '../../utils/resize.js';

export function createCustomSvg(iconName: any, hasPlus?: boolean): string {
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

  if (hasPlus) {
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
  }

  //
  // cspell:disable-next-line
  svgContent = svgContent.replace(/viewbox="[\d\s.-]+"/i, `viewBox="${newViewBox}"`);

  const encodedSvg = encodeURIComponent(svgContent);

  return `url('data:image/svg+xml,${encodedSvg}')`;
}

interface FileEntryProps extends InputProps<Blob | string, FileField> {
  readonly formDataLoading: boolean;
  readonly repeated?: boolean;

  /**
   * A function to add a thumbnail to the form collected thumbnails
   */
  readonly addThumbnail: (thumbnail: File | string) => void;

  /**
   * A function to remove a thumbnail from the form collected thumbnails
   */
  readonly removeThumbnail: (thumbnail: File | string) => void;

  /**
   * A function to update the ready status of the file entries
   */
  readonly handleFileEntryReady: (entryName: string, ready: boolean) => void;
}

export function FileEntry({
  addThumbnail: addThumbnailToFormPayload,
  disabled,
  errorLinkRef,
  field,
  formDataLoading,
  formValues: value,
  handleFileEntryReady,
  name,
  onChange,
  removeThumbnail,
  repeated,
}: FileEntryProps): VNode {
  const { utils } = useBlock();
  const valueString = typeof value === 'string' ? (value as string) : null;
  const prefix = valueString ? utils.asset(valueString) : null;
  const src = valueString?.startsWith('http') ? valueString : prefix;
  const url = useObjectURL((src || value) as unknown as Blob | string);
  const { icon: iconName, requirements } = field;
  const acceptMime = getAccept(field);

  const acceptRequirement = requirements?.find((requirement) => 'accept' in requirement);
  const acceptedMimeTypeCategories = getMimeTypeCategories(
    (acceptRequirement as AcceptRequirement)?.accept || [],
  );

  const modal = useToggle();
  const videoRef = useRef(null);
  const [fileType, setFileType] = useState<MimeTypeCategory | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [firstFrameSrc, setFirstFrameSrc] = useState('');
  const [thumbnail, setThumbnail] = useState<File | string>(null);
  const [thumbnailAddedToForm, setThumbnailAddedToForm] = useState<boolean>(false);
  const [checkedThumbnailAsset, setCheckedThumbnailAsset] = useState<boolean>(false);

  const onSelect = useCallback(
    async (event: JSX.TargetedEvent<HTMLInputElement>): Promise<void> => {
      const { maxHeight, maxWidth, quality } = field;
      const { currentTarget } = event;

      let file = currentTarget.files[0] as Blob;
      currentTarget.value = null;

      if (file?.type.match('image/*') && (maxWidth || maxHeight || quality)) {
        file = await resize(file, maxWidth, maxHeight, quality);
      }

      if (file?.type.match('video/*')) {
        handleFileEntryReady(name, false);
      } else {
        handleFileEntryReady(name, true);
      }

      setThumbnailAddedToForm(false);
      onChange({ currentTarget, ...event }, file);
    },
    [field, onChange, handleFileEntryReady, name],
  );

  useEffect(() => {
    if (formDataLoading === false && !value) {
      handleFileEntryReady(name, true);
    }
  }, [value, formDataLoading, handleFileEntryReady, name]);

  useEffect(() => {
    (async () => {
      const controller = new AbortController();
      if (valueString) {
        try {
          const assetUrl = utils.asset(valueString);
          const response = await fetch(assetUrl, { mode: 'cors' });
          if (response.ok) {
            if (!checkedThumbnailAsset && !thumbnailAddedToForm) {
              const thumbnailId = `${valueString}-thumbnail`;
              const thumbnailUrl = utils.asset(thumbnailId);
              const thumbnailResponse = await fetch(thumbnailUrl, { signal: controller.signal });
              if (thumbnailResponse.ok) {
                setThumbnail(thumbnailId);
                addThumbnailToFormPayload(thumbnailId);
                handleFileEntryReady(name, true);
                setThumbnailAddedToForm(true);
                setCheckedThumbnailAsset(true);
              }
            }

            const contentType = response.headers.get('Content-Type');
            if (contentType) {
              setFileType(getMimeTypeCategory(contentType));
              if (contentType !== MimeTypeCategory.Video) {
                handleFileEntryReady(name, true);
              }
            }

            const contentDisposition = response.headers.get('Content-Disposition');
            if (contentDisposition) {
              setFileName(getFilenameFromContentDisposition(contentDisposition));
            }
          } else {
            setFileType(null);
          }
        } catch {
          setFileType(null);
        }
      } else {
        if (!(value instanceof Blob)) {
          setFileType(null);
          return;
        }

        setFileType(getMimeTypeCategory(value.type));

        if (value instanceof File) {
          setFileName(value.name);
        }
      }

      return () => controller.abort();
    })();
  }, [
    addThumbnailToFormPayload,
    checkedThumbnailAsset,
    name,
    handleFileEntryReady,
    thumbnailAddedToForm,
    utils,
    value,
    valueString,
  ]);

  useEffect(() => {
    if (firstFrameSrc && fileName && !thumbnailAddedToForm) {
      const [header, base64] = firstFrameSrc.split(',');
      const mimeType = header.match(/:(.*?);/)[1];
      const binary = atob(base64);
      const array = new Uint8Array(binary.length);

      for (let i = 0; i < binary.length; i += 1) {
        array[i] = binary.charCodeAt(i);
      }

      const newThumbnail = new File(
        [array],
        `${fileName.slice(0, fileName.indexOf('.'))}-thumbnail.png`,
        {
          type: mimeType,
        },
      );

      setThumbnail(newThumbnail);
      addThumbnailToFormPayload(newThumbnail);
      handleFileEntryReady(name, true);

      setThumbnailAddedToForm(true);
    }
  }, [
    firstFrameSrc,
    fileName,
    addThumbnailToFormPayload,
    thumbnailAddedToForm,
    handleFileEntryReady,
    name,
  ]);

  const onRemove = useCallback(
    (event: Event) => {
      event.preventDefault();
      onChange({ currentTarget: { name } } as any as Event, null);
      removeThumbnail(thumbnail);
      setThumbnail(null);
      setFirstFrameSrc('');
      setThumbnailAddedToForm(false);
    },
    [name, onChange, removeThumbnail, thumbnail],
  );

  const captureFirstFrame = (): void => {
    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.pause();
      videoElement.currentTime = 0;
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const dataURL = canvas.toDataURL();
      setFirstFrameSrc(dataURL);
    }
  };

  const previewAvailable = ['image', 'video'].includes(fileType);

  const displayFileEntryPlaceholder = (
    fileIconName: FileIconName,
    label?: VNode,
    hasPlus?: boolean,
  ): VNode => (
    <span
      className={`image is-128x128 px-2 py-2 has-text-centered ${styles.rounded} ${styles.placeholder}`}
      /* eslint-disable-next-line react/forbid-dom-props */
      style={{ backgroundImage: createCustomSvg(fileIconName, hasPlus) }}
    >
      {label ?? null}
    </span>
  );

  const displayFileEntryButtons = (): VNode =>
    !disabled && (
      <button
        className={`button is-small ${styles['remove-button']}`}
        onClick={onRemove}
        type="button"
      >
        <span className="icon">
          <i className="fas fa-times" />
        </span>
      </button>
    );

  return (
    <div
      className={`appsemble-file file mr-3 ${repeated ? styles['root-repeated'] : styles.root}`}
      id={name}
      ref={errorLinkRef as unknown as Ref<HTMLDivElement>}
    >
      {value && url && previewAvailable ? (
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
            accept={
              acceptMime?.includes('image/') || acceptMime?.includes('video/')
                ? `${acceptMime}, android/allowCamera`
                : acceptMime
            }
            className={`file-input ${styles.input}`}
            disabled={disabled}
            name={name}
            onChange={onSelect}
            type="file"
          />
        ) : null}
        {url ? (
          previewAvailable ? (
            (fileType === 'video' && firstFrameSrc) || fileType === 'image' ? (
              <>
                <button className={styles.button} onClick={modal.enable} type="button">
                  <figure className={classNames('image is-relative', styles.thumbnail)}>
                    <img
                      alt={(utils.remap(field.label, value) as string) ?? field.name}
                      className={`${styles.image} ${styles.rounded}`}
                      src={fileType === 'video' ? firstFrameSrc : url}
                    />
                  </figure>
                </button>
                {displayFileEntryButtons()}
              </>
            ) : (
              displayFileEntryPlaceholder('spinner')
            )
          ) : (
            <>
              {displayFileEntryPlaceholder(getMimeTypeIcon(fileType))}
              {displayFileEntryButtons()}
            </>
          )
        ) : (
          displayFileEntryPlaceholder(
            iconName || acceptedMimeTypeCategories.length === 1
              ? getMimeTypeIcon(acceptedMimeTypeCategories[0])
              : 'file',
            <span className="file-label">
              {utils.remap(field.emptyFileLabel ?? ' ', field) as string}
            </span>,
            true,
          )
        )}
      </label>
      {url && fileType === 'video' ? (
        <div className={styles.input}>
          <video
            autoPlay
            className={styles.videoAbsolute}
            controls
            crossOrigin="anonymous"
            muted
            onLoadedData={captureFirstFrame}
            ref={videoRef}
            src={url}
          >
            <track kind="captions" />
          </video>
        </div>
      ) : null}
    </div>
  );
}
