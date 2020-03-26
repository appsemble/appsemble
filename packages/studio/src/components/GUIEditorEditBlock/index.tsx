import React from 'react';

export default function GUIEditorEditBlock(params: any): React.ReactElement {
  return (
    <div className="container">
      <h1 className="title">{params.selectedBlock.id}</h1>
    </div>
  );
}
