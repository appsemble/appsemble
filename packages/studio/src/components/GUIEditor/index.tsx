import type { App, BlockManifest } from '@appsemble/types';
import axios from 'axios';
// import yaml from 'js-yaml';
import type { editor } from 'monaco-editor';
import React from 'react';

import { GuiEditorStep } from '../Editor';
import GUIEditorEditBlock from '../GUIEditorEditBlock';
import GUIEditorToolbox from '../GUIEditorToolbox';
import type { EditLocation } from '../MonacoEditor';

// const indentString = require('indent-string');

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
    properties: any;
    required?: string[];
  };
}

export default function GUIEditor({
  app,
  editLocation,
  editorStep,
  setEditorStep,
}: GUIEditorProps): React.ReactElement {
  const [selectedBlock, setSelectedBlock] = React.useState<SelectedBlockManifest>();
  const [blocks, setBlocks] = React.useState<SelectedBlockManifest[]>([]);

  React.useEffect(() => {
    const getBlocks = async (): Promise<void> => {
      setBlocks(undefined);
      const { data } = await axios.get('/api/blocks');
      setBlocks(data);
    };
    getBlocks();
  }, []);

  const save = (edittedParams: any): void => {
    // console.log('==================================================');
    // console.log('edittedParams', edittedParams);
    // console.log('selectedBlock', selectedBlock);
    // console.log('editorStep', editorStep);
    // console.log('editLocation', editLocation);
    // console.log('app', app);
    // const blockParent = Object.values(selectedBlockParent)[0];
    //
    // const parentIndent = blockParent.indent - 1;
    // const { line } = blockParent;
    // const range = new Range(line + 1, 1, line + 1, 1);
    // const id = { major: 1, minor: 1 };
    //
    // let edittedParameters = '';
    //
    // Object.keys(edittedParams).map((item: any) => {
    //   edittedParameters += `${item}: ${edittedParams[item]}\n`;
    //   return edittedParameters;
    // });
    //
    // const text = indentString(
    //   yaml
    //     .safeDump([
    //       {
    //         type: stripBlockName(selectedBlock.name),
    //         version: '0.11.6',
    //         parameters: edittedParameters,
    //       },
    //     ])
    //     .replace('|', ''),
    //   parentIndent + 2,
    // );
    //
    // const op = {
    //   identifier: id,
    //   range,
    //   text,
    //   forceMoveMarkers: true,
    // };
    //
    // monacoEditor.executeEdits('GUIEditor-saveBlock', [op]);
    // setRecipe(monacoEditor.getValue());
    // save();
    // setEditorStep(GuiEditorStep.ADD);
  };

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
    case GuiEditorStep.EDIT:
      return (
        <GUIEditorEditBlock
          app={app}
          blockList={blocks}
          editLocation={editLocation}
          save={save}
          selectedBlock={selectedBlock}
          setEditorStep={(step: GuiEditorStep) => setEditorStep(step)}
          setSelectedBlock={(block: SelectedBlockManifest) => setSelectedBlock(block)}
        />
      );
  }
}
