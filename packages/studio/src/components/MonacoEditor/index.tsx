import { editor, IDisposable, KeyCode, KeyMod, Range } from 'monaco-editor';
import * as React from 'react';
import ResizeObserver from 'resize-observer-polyfill';

import styles from './index.css';

interface MonacoEditorProps {
  value?: string;
  language: string;
  theme?: string;
  onValueChange: (value: string) => void;
  onSave: () => void;
  options: editor.IEditorOptions;
  editLocation?: any;
  setEditor?: (value: editor.IStandaloneCodeEditor) => void;
  setAllowEdit: (allow: boolean) => void;
  setAllowAdd: (allow: boolean) => void;
}

export interface EditLocation {
  blockName: string;
  pageName: string;
  parents?: [{ name: string; line: number; indent: number }];
  editRange?: Range;
}

export default class MonacoEditor extends React.Component<MonacoEditorProps> {
  node = React.createRef<HTMLDivElement>();

  observer: ResizeObserver = null;

  editor: editor.IStandaloneCodeEditor;

  subscription: IDisposable;

  static defaultProps = {
    value: '',
    theme: 'vs',
    options: { insertSpaces: true, tabSize: 2, minimap: { enabled: false } },
  };

  componentDidMount(): void {
    const { language, options, setEditor, value } = this.props;
    const model = editor.createModel(value, language);

    this.editor = editor.create(this.node.current, options);
    this.editor.setModel(model);

    setEditor(this.editor);

    // eslint-disable-next-line no-bitwise
    this.editor.addCommand(KeyMod.CtrlCmd | KeyCode.KEY_S, this.onMonacoSave);

    this.subscription = model.onDidChangeContent(this.onMonacoValueChange);

    this.observer = new ResizeObserver(() => {
      this.editor.layout();
    });

    this.observer.observe(this.node.current);

    this.editor.onDidChangeCursorSelection(() => {
      this.getEditLocation(model, this.editor.getPosition());
    });
  }

  componentDidUpdate(prevProps: MonacoEditorProps): void {
    const { language, options, theme, value } = this.props;

    this.editor.updateOptions(options);
    const model = this.editor.getModel();

    if (prevProps.theme !== theme) {
      editor.setTheme(theme);
    }

    if (prevProps.language !== language) {
      editor.setModelLanguage(model, language);
    }

    if (value !== model.getValue()) {
      model.setValue(value);
    }
  }

  componentWillUnmount(): void {
    if (this.subscription) {
      this.subscription.dispose();
    }

    if (this.observer) {
      this.observer.unobserve(this.node.current);
    }
  }

  onMonacoSave = (): void => {
    this.props.onSave();
  };

  onMonacoValueChange = (): void => {
    this.props.onValueChange(this.editor.getModel().getValue());
  };

  containsBlockParent = (parents: EditLocation['parents'], position: any): string => {
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

  getEditLocation = (model: any, position: any): void => {
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

    for (let i = 1; i <= lines.length; i += 1) {
      if (i !== 1) {
        if (model.getLineFirstNonWhitespaceColumn(i) > 1) {
          let newIndent = model.getLineFirstNonWhitespaceColumn(i);
          const parents: EditLocation['parents'] = [
            {
              name: model.getLineContent(i).trim(),
              line: i,
              indent: model.getLineFirstNonWhitespaceColumn(i),
            },
          ];
          let parentCount = 1;

          if (i === topParentLine) {
            while (newIndent !== 1) {
              if (newIndent > model.getLineFirstNonWhitespaceColumn(i - parentCount)) {
                if (model.getLineContent(i - parentCount).trim() !== '') {
                  newIndent = model.getLineFirstNonWhitespaceColumn(i - parentCount);

                  parents.push({
                    name: model.getLineContent(i - parentCount).trim(),
                    line: i - parentCount,
                    indent: newIndent,
                  });
                }
              }
              parentCount += 1;
            }
            const pageParent = parents[parents.findIndex((x) => x.name.includes('pages:')) - 1];
            if (pageParent) {
              const blockName = this.containsBlockParent(parents, position);
              const blockParentIndex = parents.findIndex((x) => x.name.includes(blockName));
              let editRange = new Range(topParentLine + 1, 1, topParentLine + 1, 1);
              if (blockParentIndex !== -1) {
                editRange = new Range(parents[blockParentIndex].line, 1, topParentLine + 1, 1);
              }
              // number 8 matches "- name: " length
              const pageName = pageParent.name.slice(8);
              editLocation = {
                pageName,
                blockName,
                parents,
                editRange,
              };
            }
          }
        }
      }
    }

    if (editLocation) {
      this.props.editLocation(editLocation);
    } else {
      this.props.setAllowEdit(false);
    }
  };

  render(): React.ReactElement {
    return <div ref={this.node} className={styles.editor} />;
  }
}
