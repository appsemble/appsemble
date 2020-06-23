import { editor, Position, Range } from 'monaco-editor';
import * as React from 'react';

import type { EditLocation } from '../../types';
import styles from './index.css';

interface GUIEditorSelectProps {
  /**
   * Set edit location for use in GUIEditor parent
   */
  onChangeEditLocation: (value: EditLocation) => void;

  /**
   * Set edit location for use in GUIEditor parent
   */
  monacoEditor: editor.IStandaloneCodeEditor;

  /**
   * Save decorations even when editor is disposed
   */
  decorationList: string[];
  onChangeDecorationList: (value: string[]) => void;
}

export default function GUIEditorSelect({
  decorationList,
  monacoEditor,
  onChangeDecorationList,
  onChangeEditLocation,
}: GUIEditorSelectProps): React.ReactElement {
  const [newDecoration, setNewDecoration] = React.useState<editor.IModelDeltaDecoration[]>();

  const getBlockName = React.useCallback(
    (parents: EditLocation['parents'], position: Position): string => {
      let blockName: string;

      if (parents !== undefined) {
        parents.some((parent): string => {
          if (parent.name.includes('- type:') && position.lineNumber >= parent.line) {
            // number 8 matches "- type: " length
            blockName = parent.name.slice(8);
            if (blockName?.includes("'")) {
              blockName = blockName.replace(/'/g, '');
            }
          }
          return blockName;
        });
      }

      return blockName;
    },
    [],
  );

  const getEditLocation = React.useCallback(
    (model: editor.ITextModel, position: Position): void => {
      let editLocation: EditLocation;
      const lines = model.getValue().split(/\r?\n/g);
      let topParentLine = position.lineNumber;
      let isTopParent = false;

      while (!isTopParent) {
        if (lines.length !== topParentLine) {
          if (
            model.getLineFirstNonWhitespaceColumn(topParentLine) <=
            model.getLineFirstNonWhitespaceColumn(topParentLine + 1)
          ) {
            topParentLine += 1;
          } else if (
            lines[topParentLine].includes('- type') ||
            lines[topParentLine].includes('pages:') ||
            (lines[topParentLine].includes('- name:') &&
              lines[topParentLine + 1].includes('blocks:')) ||
            lines[topParentLine].trim() === '' ||
            model.getLineFirstNonWhitespaceColumn(topParentLine + 1) <= 3
          ) {
            isTopParent = true;
          } else {
            topParentLine += 1;
          }
        } else {
          isTopParent = true;
        }
      }

      lines.forEach((_line, i) => {
        if (i === 0) {
          return;
        }
        if (model.getLineFirstNonWhitespaceColumn(i) <= 1) {
          return;
        }
        let newIndent = model.getLineFirstNonWhitespaceColumn(i);
        const parents: EditLocation['parents'] = [
          {
            name: model.getLineContent(i).trim(),
            line: i,
            indent: model.getLineFirstNonWhitespaceColumn(i),
          },
        ];
        let parentCount = 1;
        if (i !== topParentLine) {
          return;
        }

        while (newIndent !== 1) {
          if (
            newIndent > model.getLineFirstNonWhitespaceColumn(i - parentCount) &&
            model.getLineContent(i - parentCount).trim() !== ''
          ) {
            newIndent = model.getLineFirstNonWhitespaceColumn(i - parentCount);

            parents.push({
              name: model.getLineContent(i - parentCount).trim(),
              line: i - parentCount,
              indent: newIndent,
            });
          }
          parentCount += 1;
        }

        const blockName = getBlockName(parents, position);
        const blockParentIndex = parents.findIndex((x) => x.name.includes(blockName));
        const editRange =
          blockParentIndex !== -1
            ? new Range(parents[blockParentIndex].line, 1, topParentLine + 1, 1)
            : new Range(position.lineNumber, 0, position.lineNumber, 0);

        const pageParent = parents[parents.findIndex((x) => x.name.includes('pages:')) - 1];
        if (pageParent) {
          const pageName = pageParent.name.slice(8);
          editLocation = {
            pageName,
            blockName,
            parents,
            editRange,
          };
        }
      });

      if (editLocation) {
        const newDecorations: editor.IModelDeltaDecoration[] = [
          {
            range: editLocation.editRange,
            options: {
              inlineClassName: styles.selectionDecoration,
            },
          },
        ];
        setNewDecoration(newDecorations);
        onChangeEditLocation(editLocation);
      } else {
        onChangeEditLocation(null);
      }
    },
    [getBlockName, onChangeEditLocation],
  );

  React.useEffect(() => {
    if (monacoEditor) {
      monacoEditor.onDidChangeCursorSelection(() => {
        getEditLocation(monacoEditor.getModel(), monacoEditor.getPosition());
      });
    }
  }, [monacoEditor, getEditLocation]);

  React.useEffect(() => {
    if (monacoEditor && newDecoration !== undefined) {
      onChangeDecorationList(
        monacoEditor.getModel().deltaDecorations(decorationList, newDecoration),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monacoEditor, newDecoration]);

  return null;
}
