import type { App, BlockManifest } from '@appsemble/types';
import type { editor } from 'monaco-editor';
import React from 'react';

import GUIEditorDelete from './components/GUIEditorDelete';
import GUIEditorEditBlock from './components/GUIEditorEditBlock';
import GUIEditorSelect from './components/GUIEditorSelect';
import GUIEditorToolbox from './components/GUIEditorToolbox';
import { EditLocation, GuiEditorStep } from './types';

interface GUIEditorProps {
  app: App;
  editorStep: GuiEditorStep;
  editLocation: EditLocation;
  setAllowEdit: (allow: boolean) => void;
  setAllowAdd: (allow: boolean) => void;
  setEditor?: (value: editor.IStandaloneCodeEditor) => void;
  setEditorStep: (step: GuiEditorStep) => void;
  setEditLocation: (value: EditLocation) => void;
  setRecipe: (value: string) => void;
  value?: string;
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
  const [selectedBlock, setSelectedBlock] = React.useState<BlockManifest>(undefined);
  const [monacoEditor, setMonacoEditor] = React.useState<editor.IStandaloneCodeEditor>();
  const [appClone, setAppClone] = React.useState<App>(app);

  switch (editorStep) {
    case GuiEditorStep.SELECT:
    default:
      return (
        <GUIEditorSelect
          language="yaml"
          setAllowAdd={setAllowAdd}
          setAllowEdit={setAllowEdit}
          setEditLocation={setEditLocation}
          setEditor={setMonacoEditor}
          value={appClone.yaml}
        />
      );
    case GuiEditorStep.ADD:
      return (
        <GUIEditorToolbox
          selectedBlock={selectedBlock}
          setEditorStep={setEditorStep}
          setSelectedBlock={setSelectedBlock}
        />
      );
    case GuiEditorStep.DELETE:
      return (
        <GUIEditorDelete
          app={appClone}
          editLocation={editLocation}
          monacoEditor={monacoEditor}
          setAllowAdd={setAllowAdd}
          setApp={setAppClone}
          setEditorStep={setEditorStep}
          setRecipe={setRecipe}
        />
      );
    case GuiEditorStep.EDIT:
      return (
        <GUIEditorEditBlock
          app={appClone}
          editLocation={editLocation}
          monacoEditor={monacoEditor}
          selectedBlock={selectedBlock}
          setApp={setAppClone}
          setEditorStep={setEditorStep}
          setRecipe={setRecipe}
          setSelectedBlock={setSelectedBlock}
        />
      );
  }
}
