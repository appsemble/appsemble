import type { App, BlockManifest } from '@appsemble/types';
import { stripBlockName } from '@appsemble/utils';
import axios from 'axios';
import indentString from 'indent-string';
import yaml from 'js-yaml';
import type { editor } from 'monaco-editor';
import { Range } from 'monaco-editor';
import type { OpenAPIV3 } from 'openapi-types';
import React from 'react';

import type { EditLocation } from '../MonacoEditor';
import GUIEditorDelete from './components/GUIEditorDelete';
import GUIEditorEditBlock from './components/GUIEditorEditBlock';
import GUIEditorToolbox from './components/GUIEditorToolbox';

export enum GuiEditorStep {
  'YAML',
  'SELECT',
  'ADD',
  'EDIT',
  'DELETE',
}

interface GUIEditorProps {
  editorStep: GuiEditorStep;
  monacoEditor: editor.IStandaloneCodeEditor;
  save: (edittedParams: any) => void;
  editLocation: EditLocation;
  setRecipe: (value: string) => void;
  app: App;
  setEditorStep: (step: GuiEditorStep) => void;
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
  monacoEditor,
  setEditorStep,
  setRecipe,
}: GUIEditorProps): React.ReactElement {
  const [selectedBlock, setSelectedBlock] = React.useState<SelectedBlockManifest>(undefined);
  const [blocks, setBlocks] = React.useState<SelectedBlockManifest[]>(undefined);

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

    // const selectBlockParent =
    //   editLocation.parents[editLocation.parents.findIndex((x) => x.name === 'blocks:') - 1];
    //
    // let range;
    // if (edit) {
    //   range = new Range(selectBlockParent.line, 1, editLocation.editRange.endLineNumber, 1);
    // } else {
    //   range = new Range(blockParent.line + 1, 1, blockParent.line + 1, 1);
    // }

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
    const op = {
      identifier: { major: 1, minor: 1 },
      range: editLocation.editRange,
      text,
      forceMoveMarkers: true,
    };

    monacoEditor.executeEdits('GUIEditor-saveBlock', [op]);
    setRecipe(monacoEditor.getValue());
    setEditorStep(GuiEditorStep.SELECT);
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
  }, [blocks, editLocation.blockName, setSelectedBlock]);

  switch (editorStep) {
    case GuiEditorStep.ADD:
    default:
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
          app={app}
          editLocation={editLocation}
          monacoEditor={monacoEditor}
          setEditorStep={(step: GuiEditorStep) => setEditorStep(step)}
          setRecipe={(value: any) => setRecipe(value)}
        />
      );
    case GuiEditorStep.EDIT:
      return (
        <GUIEditorEditBlock
          app={app}
          editLocation={editLocation}
          save={save}
          selectedBlock={selectedBlock || getSelectedBlock()}
          setEditorStep={(step: GuiEditorStep) => setEditorStep(step)}
        />
      );
  }
}
