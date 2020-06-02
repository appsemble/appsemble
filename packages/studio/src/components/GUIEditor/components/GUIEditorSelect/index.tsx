import { editor, IDisposable, Position, Range } from 'monaco-editor';
import * as React from 'react';
import ResizeObserver from 'resize-observer-polyfill';

import type { EditLocation } from '../../types';
import styles from './index.css';

interface MonacoEditorProps {
  value?: string;
  language: string;
  theme?: string;
  options: editor.IEditorOptions;
  setEditLocation: (value: EditLocation) => void;
  setEditor?: (value: editor.IStandaloneCodeEditor) => void;
  setAllowEdit: (allow: boolean) => void;
  setAllowAdd: (allow: boolean) => void;
}

export default class GUIEditorSelect extends React.Component<MonacoEditorProps> {
  node = React.createRef<HTMLDivElement>();

  observer: ResizeObserver = null;

  editor: editor.IStandaloneCodeEditor;

  subscription: IDisposable;

  decorators: string[];

  static defaultProps = {
    value: '',
    theme: 'vs',
    options: {
      insertSpaces: true,
      tabSize: 2,
      minimap: { enabled: false },
      colorDecorators: true,
      readOnly: true,
    },
  };

  componentDidMount(): void {
    const { language, options, setEditor, value } = this.props;
    const model = editor.createModel(value, language);

    this.editor = editor.create(this.node.current, options);
    this.editor.setModel(model);

    setEditor(this.editor);

    this.decorators = this.editor.deltaDecorations(
      [],
      [
        {
          range: new Range(0, 0, 0, 0),
          options: { isWholeLine: false },
        },
      ],
    );

    this.observer = new ResizeObserver(() => {
      this.editor.layout();
    });

    this.observer.observe(this.node.current);

    this.editor.onDidChangeCursorSelection(() => {
      this.getEditLocation(model, this.editor.getPosition());
    });
  }

  componentDidUpdate(): void {
    const { value } = this.props;

    const model = this.editor.getModel();

    if (value !== model.getValue()) {
      model.setValue(value);
    }
  }

  getBlockName = (parents: EditLocation['parents'], position: any): string => {
    let blockName: string;

    if (parents !== undefined) {
      parents.some((parent: any): string => {
        if (parent.name.includes('- type:') && position.lineNumber >= parent.line) {
          // number 8 matches "- type: " length
          blockName = parent.name.slice(8);
          if (blockName?.includes("'")) {
            blockName = blockName.replace(/'/g, '');
          }
          this.props.setAllowEdit(true);
          this.props.setAllowAdd(true);
        } else if (parent.name.includes('blocks:') && position.lineNumber === parent.line) {
          this.props.setAllowEdit(false);
          this.props.setAllowAdd(true);
        } else if (parent.name.includes('blocks:') && position.lineNumber <= parent.line) {
          this.props.setAllowEdit(false);
          this.props.setAllowAdd(false);
        }
        return blockName;
      });
    }

    return blockName;
  };

  setEditorDecorators = (range: Range, options: editor.IModelDecorationOptions): void => {
    this.editor.deltaDecorations(this.decorators, [
      {
        range,
        options,
      },
    ]);
  };

  getEditLocation = (model: editor.ITextModel, position: Position): void => {
    const lines = model.getValue().split(/\r?\n/g);
    let editLocation: EditLocation;
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

      const blockName = this.getBlockName(parents, position);
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
      this.setEditorDecorators(editLocation.editRange, {
        className: styles.selectionDecoration,
      });
      this.props.setEditLocation(editLocation);
    } else {
      this.props.setAllowEdit(false);
    }
  };

  render(): React.ReactElement {
    return <div ref={this.node} className={styles.editor} />;
  }
}
