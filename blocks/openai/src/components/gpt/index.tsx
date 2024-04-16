import { type OpenAIResponse } from '@appsemble/sdk';
import { type VNode } from 'preact';

interface ModelGPTProps {
  readonly data: OpenAIResponse;
}

export function ModelGPT({ data }: ModelGPTProps): VNode {
  return (
    <div>
      {data?.choices?.length > 0 &&
        data.choices.map((choice) => (
          <p key={choice.index}>
            <strong>{choice.message.role}: </strong>
            <span>{choice.message.content}</span>
          </p>
        ))}
    </div>
  );
}
