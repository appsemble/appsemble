import { useBlock } from '@appsemble/preact';
import { FormComponent } from '@appsemble/preact-components';
import { Crepe } from '@milkdown/crepe';
import { linkTooltipAPI } from '@milkdown/kit/component/link-tooltip';
import { commandsCtx, editorViewCtx, editorViewOptionsCtx } from '@milkdown/kit/core';
import { type Ctx } from '@milkdown/kit/ctx';
import {
  linkSchema,
  toggleEmphasisCommand,
  toggleStrongCommand,
} from '@milkdown/kit/preset/commonmark';
import { gfm, toggleStrikethroughCommand } from '@milkdown/kit/preset/gfm';
import { type MarkType } from '@milkdown/kit/prose/model';
import { listenerCtx, listener as listenerPlugin } from '@milkdown/plugin-listener';
import classNames from 'classnames';
import { type VNode } from 'preact';
import { useCallback, useEffect, useMemo, useRef } from 'preact/hooks';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';

import styles from './MarkdownInput.module.css';
import { type InputProps, type MarkdownField } from '../../../block.js';
import { getValueByNameSequence } from '../../utils/getNested.js';
import { isRequired } from '../../utils/requirements.js';

type MarkdownInputProps = InputProps<string, MarkdownField>;

function isActive(ctx: Ctx, mark: MarkType): boolean {
  if (!ctx) {
    return false;
  }
  const view = ctx.get(editorViewCtx);
  const {
    state: { doc, selection },
  } = view;
  return doc.rangeHasMark(selection.from, selection.to, mark);
}

function stripImages(markdown: string): string {
  const u = unified().use(remarkParse).use(remarkStringify);
  const ast = u.parse(markdown);
  visit(ast, 'image', (node, index, parent) => {
    if (parent && typeof index === 'number') {
      parent.children.splice(index, 1);
    }
  });
  const md = u.stringify(ast);
  return md;
}

export function MarkdownInput({
  className,
  dirty,
  disabled,
  error,
  errorLinkRef,
  field,
  formValues,
  name,
  onChange,
  readOnly,
}: MarkdownInputProps): VNode {
  const { utils } = useBlock();

  const crepeRef = useRef<Crepe | undefined>();
  const crepeRootRef = useRef<HTMLDivElement | null>(null);

  const value = getValueByNameSequence(name, formValues) as string;

  const { defaultValue, help, icon, label, tag } = field;

  const remappedLabel = utils.remap(label, value) ?? name;

  const initValueRef = useRef<string | undefined>();
  const initValue = useMemo(() => {
    const val = crepeRef.current ? initValueRef.current : value;
    initValueRef.current = val;
    return val ?? defaultValue;
  }, [defaultValue, value]);

  useEffect(() => {
    async function configure(crepe: NonNullable<typeof crepeRef.current>): Promise<void> {
      // https://milkdown.dev/docs/api/plugin-listener
      crepe.editor
        .config((ctx) => {
          ctx.set(editorViewOptionsCtx, { editable: () => true });
          const listener = ctx.get(listenerCtx);
          listener.markdownUpdated((...[, markdown, prevMarkdown]) => {
            if (markdown !== prevMarkdown) {
              const imagelessMarkdown = stripImages(markdown);
              onChange(name, imagelessMarkdown);
            }
          });
        })
        // Github-flavored Markdown
        .use(gfm)
        .use(listenerPlugin);
      await crepe.create();
    }

    if (crepeRootRef.current) {
      if (errorLinkRef) {
        // eslint-disable-next-line no-param-reassign
        errorLinkRef.current = crepeRootRef.current;
      }

      crepeRef.current = new Crepe({
        root: crepeRootRef.current,
        defaultValue: initValue,
        features: {
          'block-edit': false,
          toolbar: false,
          'image-block': false,
        },
      });
      const crepe = crepeRef.current;
      configure(crepe);
      return () => {
        crepe.destroy();
      };
    }
  }, [errorLinkRef, initValue, name, onChange]);

  // Common and custom editor commands
  const toggleBold = useCallback(() => {
    crepeRef.current?.editor.action((ctx) => {
      const commandManager = ctx.get(commandsCtx);
      commandManager.call(toggleStrongCommand.key);
    });
  }, []);
  const toggleItalic = useCallback(() => {
    crepeRef.current?.editor.action((ctx) => {
      const commandManager = ctx.get(commandsCtx);
      commandManager.call(toggleEmphasisCommand.key);
    });
  }, []);
  const toggleStrikethrough = useCallback(() => {
    crepeRef.current?.editor.action((ctx) => {
      const commandManager = ctx.get(commandsCtx);
      commandManager.call(toggleStrikethroughCommand.key);
    });
  }, []);
  const toggleLink = useCallback(() => {
    crepeRef.current?.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const { selection } = view.state;

      if (isActive(ctx, linkSchema.type(ctx))) {
        ctx.get(linkTooltipAPI.key).removeLink(selection.from, selection.to);
        return;
      }

      ctx.get(linkTooltipAPI.key).addLink(selection.from, selection.to);
    });
  }, []);

  useEffect(() => {
    if (crepeRef?.current) {
      crepeRef.current.setReadonly(disabled || readOnly);
    }
  }, [disabled, readOnly]);

  return (
    <FormComponent
      className={className}
      error={dirty ? error : null}
      help={help}
      icon={icon}
      label={remappedLabel as string}
      required={isRequired(field, utils, formValues)}
      tag={tag}
    >
      <div className={classNames('is-flex is-flex-direction-row', styles.gap)}>
        <button className="button" onClick={toggleBold} title="Bold" type="button">
          <i className="fas fa-bold" />
        </button>
        <button className="button" onClick={toggleItalic} title="Italic" type="button">
          <i className="fas fa-italic" />
        </button>
        <button className="button" onClick={toggleStrikethrough} title="Strike out" type="button">
          <i className="fas fa-strikethrough" />
        </button>
        <button className="button" onClick={toggleLink} title="Add link" type="button">
          <i className="fas fa-link" />
        </button>
      </div>
      <div id="root-crepe" ref={crepeRootRef} />
    </FormComponent>
  );
}
