import {
  createExampleContext,
  examples,
  PredefinedAppRole,
  remap,
  type RemapperContext,
  type RemapperExampleKeys,
  RemapperValidator,
} from '@appsemble/lang-sdk';
import {
  applyRefs,
  Button,
  FileUpload,
  Message,
  Select,
  useToggle,
} from '@appsemble/react-components';
import classNames from 'classnames';
import { editor, type IDisposable } from 'monaco-editor/esm/vs/editor/editor.api.js';
// Required for syntax highlighting in the Playground input and output editors
import 'monaco-editor/esm/vs/language/json/monaco.contribution.js';
import { type ChangeEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';
import { parse, stringify, YAMLError } from 'yaml';

import styles from './index.module.css';
import { messages } from './messages.js';
import { useUser } from '../UserProvider/index.js';

// Required for syntax highlighting in the Playground input and output editors
window.MonacoEnvironment = {
  getWorker(workerId, label) {
    switch (label) {
      case 'json':
        return new Worker(
          new URL('monaco-editor/esm/vs/language/json/json.worker', import.meta.url),
        );
      default:
        throw new Error(`Unknown label ${label}`);
    }
  },
};

interface EditorProps {
  /**
   * A class name to add to the `div` element.
   */
  readonly className?: string;

  /**
   * The input code.
   */
  readonly value?: string;

  /**
   * The language to use for highlighting the code.
   */
  readonly language: string;

  /**
   * Whether the editor should be in readOnly mode.
   */
  readonly readOnly?: boolean;

  /**
   * This is called whenever the value of the editor changes.
   *
   * @param event The monaco change event.
   * @param value The new value.
   * @param model The monaco model which changed.
   */
  readonly onChange?: (
    event: editor.IModelContentChangedEvent,
    value: string,
    model: editor.ITextModel,
  ) => void;
}

function Editor({ className, language, onChange, readOnly, value }: EditorProps): ReactNode {
  const editorRef = useRef<editor.IStandaloneCodeEditor>();
  const ref = useRef<editor.IStandaloneCodeEditor>();

  /**
   * Cleanup the editor itself.
   */
  useEffect(() => () => editorRef.current.dispose(), []);

  /**
   * Set a new model if either the language or the uri changes.
   */
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) {
      return;
    }

    const model = editor.createModel('', language);
    ed.setModel(model);

    return () => model.dispose();
  }, [language]);

  /**
   * Update the model value if it changes.
   */
  useEffect(() => {
    const model = editorRef.current?.getModel();

    // TODO: handle invalid input value
    // Without this check undo and redo don’t work.
    if (model && model.getValue() !== value) {
      model.setValue(value);
    }
  }, [value]);

  useEffect(() => {
    const ed = editorRef.current;
    if (!ed || !onChange) {
      return;
    }

    // Keep track of the latest content change handler disposable.
    let contentDisposable: IDisposable;

    // Dispose the old handler if it exists, and register a new one if the model could be
    // resolved.
    const registerHandler = (model: editor.ITextModel | null): void => {
      contentDisposable?.dispose();
      contentDisposable = model
        ? model.onDidChangeContent((event) => onChange(event, model.getValue(), model))
        : undefined;
    };

    // Register a handler for the current model.
    registerHandler(ed.getModel());
    const modelDisposable = ed.onDidChangeModel(() => {
      // And update it when the model changes.
      registerHandler(ed.getModel());
    });

    return () => {
      // Cleanup all disposables.
      contentDisposable?.dispose();
      modelDisposable.dispose();
    };
  }, [onChange]);

  return (
    <div
      className={className}
      ref={(node) => {
        if (!editorRef.current) {
          applyRefs(
            editor.create(node, {
              automaticLayout: true,
              minimap: { enabled: false },
              tabSize: 2,
              readOnly,
              scrollBeyondLastLine: false,
              insertSpaces: true,
              renderLineHighlight: 'gutter',
              // Remove left gutter
              lineNumbers: 'off',
              glyphMargin: false,
              folding: false,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 0,
            }),
            editorRef,
            ref,
          );
        }
      }}
    />
  );
}

interface PlaygroundProps {
  /**
   * The default remapper to be selected.
   *
   * @default 'None'
   */
  readonly defaultOption?: RemapperExampleKeys;

  /**
   * A custom remapper example to include.
   */
  readonly customOption?: { input: unknown; remapper: string };
}

export function Playground({ customOption, defaultOption = 'None' }: PlaygroundProps): ReactNode {
  const custom = { ...customOption, remapper: customOption?.remapper.trim() };
  const { lang } = useParams<'lang'>();
  const { userInfo } = useUser();

  const minimized = useToggle(false);

  const context: RemapperContext = useMemo(() => {
    const url = new URL(window.origin);
    return createExampleContext(url, lang, {
      ...userInfo,
      demo: false,
      // TODO: this enum might not work
      role: PredefinedAppRole.Member,
    });
  }, [lang, userInfo]);

  const [jsonError, setJsonError] = useState(false);
  const [yamlError, setYamlError] = useState<string>(null);
  const [remapperErrorMessages, setRemapperErrorMessages] = useState([]);

  const [input, setInput] = useState(custom?.input || examples[defaultOption].input);
  const stringifiedInput = useMemo(() => {
    try {
      return JSON.stringify(input, null, 2);
    } catch {
      setJsonError(true);
    }
  }, [input]);
  const [remapper, setRemapper] = useState(
    custom?.remapper || stringify(examples[defaultOption].remapper),
  );
  const [output, setOutput] = useState('');
  const [skipped, setSkipped] = useState(examples[defaultOption].skip);

  const onChangeInput: EditorProps['onChange'] = (event, value) => {
    try {
      setInput(JSON.parse(value));
      setJsonError(false);
    } catch {
      setJsonError(true);
    }
  };

  const onUploadFile = async (event: ChangeEvent, file: File): Promise<void> => {
    if (file.type === 'application/json') {
      const text = await file.text();
      try {
        setInput(JSON.parse(text));
      } catch {
        setJsonError(true);
      }
    }
  };

  const onSelect = (event: ChangeEvent, value: keyof typeof examples): void => {
    const { input: newInput, remapper: newRemapper, skip } = examples?.[value] ?? examples.None;
    setInput(newInput);
    setRemapper(stringify(newRemapper));
    setSkipped(skip);
  };

  const onChangeRemapper: EditorProps['onChange'] = (event, value) => {
    setRemapper(value);
  };

  useEffect(() => {
    try {
      setJsonError(false);
      const parsedRemapper = parse(remapper);
      setYamlError(null);
      const validator = new RemapperValidator();
      // TODO: consider using a service worker to offload the work from the main thread
      const result = validator.validateRemapper(parsedRemapper);

      if (result.errors.length) {
        setRemapperErrorMessages(() => {
          const errors = result.errors?.filter((e) => e.path.length).map((e) => e.message);
          if (!errors.length) {
            return ['Invalid'];
          }
          return errors;
        });
        return;
      }

      const remappedValue = remap(parsedRemapper, input, context);
      const stringifiedOutput = JSON.stringify(remappedValue, null, 2);
      // The remapped value may be undefined, which results in an error when set in MonacoEditor.
      setOutput(stringifiedOutput === undefined ? 'undefined' : stringifiedOutput);
      setRemapperErrorMessages([]);
    } catch (error) {
      if (error instanceof YAMLError) {
        setYamlError(error.message);
      } else if (error instanceof Error) {
        setRemapperErrorMessages([error.message]);
      } else {
        setRemapperErrorMessages([error]);
      }
    }
  }, [remapper, input, lang, userInfo, context]);

  return (
    <div className="is-flex is-flex-direction-column">
      <div className={`is-flex is-flex-direction-row ${styles.menu}`}>
        <FileUpload
          accept="application/json"
          formComponentClassName={classNames('m-0', styles.dense)}
          onChange={onUploadFile}
        />
        <Select defaultValue={defaultOption} onChange={onSelect}>
          {Object.keys(examples)
            .toSorted()
            .map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
        </Select>
        <Button
          className="px-3"
          icon={minimized.enabled ? 'chevron-left' : 'chevron-down'}
          iconPosition="right"
          onClick={minimized.toggle}
        />
        {/* Intentionally not adding translations for this button as it's temporary. */}
        <button
          className={styles.verify}
          disabled
          title={`The example has ${skipped ? 'not ' : ''}been tested.`}
          type="button"
        >
          {skipped ? 'Unverified' : 'Verified'}
        </button>
      </div>
      <div
        className={classNames(
          styles.container,
          'is-flex is-flex-direction-row my-2 p-3 is-relative',
        )}
      >
        <Editor
          className={classNames(styles.editor, { 'is-hidden': minimized.enabled })}
          language="json"
          onChange={onChangeInput}
          value={stringifiedInput}
        />
        <Editor
          className={classNames(styles.editor)}
          language="yaml"
          onChange={onChangeRemapper}
          value={remapper}
        />
        <Editor className={classNames(styles.editor)} language="json" readOnly value={output} />
      </div>
      {jsonError ? (
        <Message className="mb-1" color="danger">
          <FormattedMessage {...messages.jsonError} />
        </Message>
      ) : null}
      {yamlError ? (
        <Message className="mb-1" color="danger">
          <FormattedMessage {...messages.yamlError} values={{ error: <pre>{yamlError}</pre> }} />
        </Message>
      ) : null}
      {remapperErrorMessages?.length ? (
        <Message className="mb-1" color="danger">
          {remapperErrorMessages?.map((msg) => (
            <div key={msg}>
              <FormattedMessage {...messages.remapperError} values={{ error: msg }} />
            </div>
          ))}
        </Message>
      ) : null}
    </div>
  );
}
