import type { App, BlockManifest } from '@appsemble/types';
import { stripBlockName } from '@appsemble/utils';
import axios from 'axios';
import indentString from 'indent-string';
import yaml from 'js-yaml';
import { editor, Range } from 'monaco-editor';
import type { OpenAPIV3 } from 'openapi-types';
import React from 'react';

import GUIEditorDelete from './components/GUIEditorDelete';
import GUIEditorEditBlock from './components/GUIEditorEditBlock';
import GUIEditorSelect from './components/GUIEditorSelect';
import GUIEditorToolbox from './components/GUIEditorToolbox';

export enum GuiEditorStep {
  'YAML',
  'SELECT',
  'ADD',
  'EDIT',
  'DELETE',
}

export interface EditLocation {
  blockName: string;
  pageName: string;
  parents?: [{ name: string; line: number; indent: number }];
  editRange?: Range;
}

interface GUIEditorProps {
  editorStep: GuiEditorStep;
  save: (edittedParams: any) => void;
  editLocation: EditLocation;
  setRecipe: (value: string) => void;
  app: App;
  setEditorStep: (step: GuiEditorStep) => void;
  setEditor?: (value: editor.IStandaloneCodeEditor) => void;
  setAllowEdit: (allow: boolean) => void;
  setAllowAdd: (allow: boolean) => void;
  setEditLocation: (value: EditLocation) => void;
  value?: string;
}

export interface SelectedBlockManifest extends BlockManifest {
  /**
   * A JSON schema to validate block parameters.
   *
   * Since multiple JSON schema typings exist and not all of them play nice
   * with each other, this type is normally set to `object`. To improve typings
   * this is an extension of the existing BlockManifest.
   */
  parameters: {
    properties: OpenAPIV3.BaseSchemaObject;
    required?: string[];
    definitions?: OpenAPIV3.SchemaObject[];
  };
}

export default function GUIEditor({
  app,
  editLocation,
  editorStep,
  setAllowAdd,
  setAllowEdit,
  setEditLocation,
  setEditorStep,
  setRecipe,
}: GUIEditorProps): React.ReactElement {
  const [selectedBlock, setSelectedBlock] = React.useState<SelectedBlockManifest>(undefined);
  const [blocks, setBlocks] = React.useState<SelectedBlockManifest[]>(undefined);
  const [monacoEditor, setMonacoEditor] = React.useState<editor.IStandaloneCodeEditor>();
  const [appClone, setAppClone] = React.useState<App>(app);

  React.useEffect(() => {
    const getBlocks = async (): Promise<void> => {
      const { data } = await axios.get('/api/blocks');
      setBlocks(data);
    };
    getBlocks();
  }, []);

  const save = (edittedParams: any, edit: boolean): void => {
    const blockParent =
      editLocation.parents[editLocation.parents.findIndex((x) => x.name === 'blocks:')];

    let range;
    if (edit) {
      range = editLocation.editRange;
    } else {
      range = new Range(blockParent.line + 2, 1, blockParent.line + 2, 1);
    }

    const text = indentString(
      yaml.safeDump([
        {
          type: stripBlockName(selectedBlock.name),
          version: selectedBlock.version,
          parameters: edittedParams,
        },
      ]),
      blockParent.indent + 1,
    );
    const options = {
      identifier: { major: 1, minor: 1 },
      range,
      text,
      forceMoveMarkers: true,
    };
    monacoEditor.updateOptions({ readOnly: false });
    monacoEditor.executeEdits('GUIEditor-saveBlock', [options]);
    monacoEditor.updateOptions({ readOnly: true });
    const newRecipe = monacoEditor.getValue();
    setRecipe(newRecipe);
    setEditorStep(GuiEditorStep.SELECT);
    setAppClone({ ...appClone, yaml: newRecipe });
  };

  const getSelectedBlock = React.useCallback((): SelectedBlockManifest => {
    let block: SelectedBlockManifest;
    if (blocks) {
      blocks.map((b: SelectedBlockManifest) => {
        if (b.name.includes(editLocation.blockName)) {
          setSelectedBlock(b);
          block = b;
        }
        return block;
      });
    }
    return block;
  }, [blocks, editLocation, setSelectedBlock]);

  switch (editorStep) {
    case GuiEditorStep.SELECT:
    default:
      return (
        <GUIEditorSelect
          language="yaml"
          setAllowAdd={setAllowAdd}
          setAllowEdit={setAllowEdit}
          setEditLocation={setEditLocation}
          setEditor={(value: editor.IStandaloneCodeEditor) => setMonacoEditor(value)}
          value={appClone.yaml}
        />
      );
    case GuiEditorStep.ADD:
      return (
        <GUIEditorToolbox
          blocks={blocks}
          selectedBlock={selectedBlock}
          setEditorStep={(step: GuiEditorStep) => setEditorStep(step)}
          setSelectedBlock={(block: SelectedBlockManifest) => setSelectedBlock(block)}
        />
      );
    case GuiEditorStep.DELETE:
      return (
        <GUIEditorDelete
          app={appClone}
          editLocation={editLocation}
          monacoEditor={monacoEditor}
          setApp={(value: App) => setAppClone(value)}
          setEditorStep={(step: GuiEditorStep) => setEditorStep(step)}
        />
      );
    case GuiEditorStep.EDIT:
      return (
        <GUIEditorEditBlock
          app={appClone}
          editLocation={editLocation}
          save={save}
          selectedBlock={selectedBlock || getSelectedBlock()}
          setEditorStep={(step: GuiEditorStep) => setEditorStep(step)}
        />
      );
  }
}
