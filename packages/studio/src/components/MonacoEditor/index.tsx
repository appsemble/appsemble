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
  selectedItem: any;
  setSelectedBlockParent: any;
}

interface SelectedItem {
  content?: string;
  indent: string;
  parents?: [any];
}

export interface SelectedBlockParent {
  blockParent: SelectedItem['parents'];
  allowAddBlock?: boolean;
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
    const { language, options, value } = this.props;
    const model = editor.createModel(value, language);

    this.editor = editor.create(this.node.current, options);
    this.editor.setModel(model);

    // eslint-disable-next-line no-bitwise
    this.editor.addCommand(KeyMod.CtrlCmd | KeyCode.KEY_S, this.onMonacoSave);

    this.subscription = model.onDidChangeContent(this.onMonacoValueChange);

    this.observer = new ResizeObserver(() => {
      this.editor.layout();
    });

    this.observer.observe(this.node.current);

    this.editor.onDidChangeCursorSelection(() => {
      this.getSelectedItemParents(model, this.editor.getPosition());
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
    if (this.editor) {
      this.editor.dispose();
    }

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

  containsBlockParent = (selectedItem: SelectedItem): void => {
    let selectedBlockParent: SelectedBlockParent;
    let blockParent: SelectedItem['parents'];
    let allowAddBlock = false;

    if (selectedItem !== undefined) {
      selectedItem.parents.map((parent: any): void => {
        if (parent.name === 'blocks:') {
          allowAddBlock = true;
          blockParent = parent;
        }
        return parent;
      });
      selectedBlockParent = { blockParent, allowAddBlock };
      this.props.setSelectedBlockParent(selectedBlockParent);
    }
  };

  getSelectedItemParents = (model: any, position: any): void => {
    const lines = model.getValue().split('\n');
    let selectedItem: SelectedItem;
    for (let i = 1; i <= lines.length; i += 1) {
      if (i !== 1) {
        // if indent is not 1 look for parent structure
        if (model.getLineFirstNonWhitespaceColumn(i) > 1) {
          let newIndent = model.getLineFirstNonWhitespaceColumn(i);
          const parents: SelectedItem['parents'] = [
            {
              name: model.getLineContent(i).trim(),
              line: i,
              indent: model.getLineFirstNonWhitespaceColumn(i),
            },
          ];
          let pC = 1;

          if (i === position.lineNumber) {
            while (newIndent !== 1) {
              if (newIndent > model.getLineFirstNonWhitespaceColumn(i - pC)) {
                if (model.getLineContent(i - pC) !== '') {
                  newIndent = model.getLineFirstNonWhitespaceColumn(i - pC);

                  parents.push({
                    name: model.getLineContent(i - pC).trim(),
                    line: i - pC,
                    indent: newIndent,
                  });
                }
              }

              pC += 1;
            }

            selectedItem = {
              content: model.getLineContent(i).trim(),
              indent: model.getLineFirstNonWhitespaceColumn(i),
              parents,
            };
          }
        }
      }
    }
    this.props.selectedItem(selectedItem);
    this.containsBlockParent(selectedItem);
  };

  render(): React.ReactElement {
    return <div ref={this.node} className={styles.editor} />;
  }
}
