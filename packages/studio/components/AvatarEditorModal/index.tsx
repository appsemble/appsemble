import { CardFooterButton, ModalCard, type Toggle } from '@appsemble/react-components';
import { type ReactNode, useCallback, useRef, useState } from 'react';
import AvatarEditor from 'react-avatar-editor';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';

interface AvatarEditorModalProps {
  /**
   * Whether the modal should be visible or not.
   */
  readonly state: Toggle;

  /**
   * The photo to edit.
   */
  readonly photo: File;

  /**
   * The callback that is called when the photo is done being edited.
   */
  readonly onCompleted: (file: File) => void;

  /**
   * The callback that is called when the modal is closed.
   */
  readonly onCanceled: () => void;
}

/**
 * A modal that allows the user to edit a profile photo.
 */
export function AvatarEditorModal({
  onCanceled,
  onCompleted,
  photo,
  state,
}: AvatarEditorModalProps): ReactNode {
  const editorRef = useRef(null);
  const [scale, setScale] = useState(1);

  const closeModal = useCallback(() => {
    setScale(1);
    state.disable();
    onCanceled();
  }, [onCanceled, state]);

  const onSubmit = useCallback(() => {
    if (editorRef.current) {
      const canvas = editorRef.current.getImageScaledToCanvas() as HTMLCanvasElement;
      canvas.toBlob((blob) => {
        const file = new File([blob], photo.name, { type: photo.type });
        onCompleted(file);
        state.disable();
      });
    }
  }, [onCompleted, state, editorRef, photo]);

  return (
    <ModalCard
      footer={
        <>
          <CardFooterButton onClick={closeModal}>
            <FormattedMessage {...messages.cancel} />
          </CardFooterButton>
          <CardFooterButton color="primary" onClick={onSubmit}>
            <FormattedMessage {...messages.submit} />
          </CardFooterButton>
        </>
      }
      isActive={state.enabled}
      onClose={closeModal}
      onSubmit={onSubmit}
      title={<FormattedMessage {...messages.modalTitle} />}
    >
      <div className="is-flex is-flex-direction-column">
        <AvatarEditor
          borderRadius={Number.POSITIVE_INFINITY}
          className="m-auto"
          height={250}
          image={photo}
          ref={editorRef}
          scale={scale}
          width={250}
        />
        <div className="m-auto">
          <label>
            <FormattedMessage {...messages.scale} />
            <input
              defaultValue="1"
              max="3"
              min="1"
              onChange={(event) => setScale(Number(event.currentTarget.value))}
              step="0.01"
              type="range"
            />
          </label>
          <span>{scale}x</span>
        </div>
      </div>
    </ModalCard>
  );
}
