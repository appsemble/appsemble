import { editor, IDisposable, KeyCode, KeyMod } from 'monaco-editor';
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
  setAllowAdd: (allow: boolean) => void;
  setAllowEdit: (allow: boolean) => void;
}

export interface EditLocation {
  blockName: string;
  pageName: string;
  parents?: [{ name: string; line: number; indent: number }];
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
      this.getEditLocationParents(model, this.editor.getPosition());
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

  containsBlockParent = (parents: EditLocation['parents']): string => {
    let blockName: string;

    if (parents !== undefined) {
      parents.some((parent: any): string => {
        if (parent.name.includes('- type:')) {
          const block = parent.name.split(' ');
          blockName = block[block.length - 1];
          this.props.setAllowEdit(true);
          this.props.setAllowAdd(true);
        }
        if (parent.name.includes('blocks:')) {
          this.props.setAllowAdd(true);
        }
        return blockName;
      });
    }

    return blockName;
  };

  getEditLocationParents = (model: any, position: any): void => {
    const lines = model.getValue().split(/\r?\n/g);
    let editLocation: EditLocation;
    for (let i = 1; i <= lines.length; i += 1) {
      if (i !== 1) {
        // if indent is not 1 look for parent structure
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

          if (i === position.lineNumber) {
            while (newIndent !== 1) {
              if (newIndent > model.getLineFirstNonWhitespaceColumn(i - parentCount)) {
                if (model.getLineContent(i - parentCount) !== '') {
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
            const blockName = this.containsBlockParent(parents);
            const parentsNames = parents[parents.length - 2].name.split(': ');
            const pageName = parentsNames[parentsNames.length - 1];
            editLocation = {
              pageName,
              blockName,
              parents,
            };
          }
        }
      }
    }
    if (editLocation !== undefined) {
      this.props.editLocation(editLocation);
    } else {
      this.props.setAllowEdit(false);
      this.props.setAllowAdd(false);
    }
  };

  render(): React.ReactElement {
    return <div ref={this.node} className={styles.editor} />;
  }
}
