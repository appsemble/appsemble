import type { App, BlockManifest } from '@appsemble/types';
import type { editor } from 'monaco-editor';
import React from 'react';

import GUIEditorEditBlock from './components/GUIEditorEditBlock';
import GUIEditorNavBar from './components/GUIEditorNavBar';
import GUIEditorSelect from './components/GUIEditorSelect';
import GUIEditorToolbox from './components/GUIEditorToolbox';
import { EditLocation, GuiEditorStep } from './types';

interface GUIEditorProps {
  app: App;
  editorStep: GuiEditorStep;
  setEditor?: (value: editor.IStandaloneCodeEditor) => void;
  setEditorStep: (step: GuiEditorStep) => void;
  setRecipe: (value: string) => void;
  value?: string;
}

export default function GUIEditor({
  app,
  editorStep,
  setEditorStep,
  setRecipe,
}: GUIEditorProps): React.ReactElement {
  const [selectedBlock, setSelectedBlock] = React.useState<BlockManifest>(undefined);
  const [monacoEditor, setMonacoEditor] = React.useState<editor.IStandaloneCodeEditor>();
  const [appClone, setAppClone] = React.useState<App>(app);
  const [editLocation, setEditLocation] = React.useState<EditLocation>(undefined);

  switch (editorStep) {
    case GuiEditorStep.SELECT:
    default:
      return (
        <>
          <GUIEditorNavBar
            app={appClone}
            editLocation={editLocation}
            editorStep={editorStep}
            monacoEditor={monacoEditor}
            setApp={setAppClone}
            setEditorStep={setEditorStep}
            setRecipe={setRecipe}
          />
          <GUIEditorSelect
            language="yaml"
            setEditLocation={setEditLocation}
            setEditor={setMonacoEditor}
            value={appClone.yaml}
          />
        </>
      );
    case GuiEditorStep.ADD:
      return (
        <GUIEditorToolbox
          selectedBlock={selectedBlock}
          setEditorStep={setEditorStep}
          setSelectedBlock={setSelectedBlock}
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
