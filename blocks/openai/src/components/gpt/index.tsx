import { type OpenAIResponse } from '@appsemble/sdk';
import { type VNode } from 'preact';
import Markdown from 'preact-markdown';

interface ModelGPTProps {
  readonly data: OpenAIResponse | null;
}

export function ModelGPT({ data }: ModelGPTProps): VNode | null {
  if (!data) {
    return null;
  }
  return (
    <div>
      {data.choices.length > 0 &&
        data.choices.map((choice) => (
          <p key={choice.index}>
            <strong>{choice.message.role}: </strong>
            {(Markdown as any)({ markdown: choice.message.content })}
          </p>
        ))}
    </div>
  );
}
