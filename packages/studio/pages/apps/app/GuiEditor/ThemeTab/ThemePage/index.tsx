import { IconButton } from '@appsemble/react-components';
import {
  type BasicPageDefinition,
  type FlowPageDefinition,
  type FontDefinition,
  type TabsPageDefinition,
  type Theme,
} from '@appsemble/types';
import { baseTheme, googleFonts } from '@appsemble/utils';
import { type MutableRefObject, type ReactElement, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { type Document, type Node, type ParsedNode, type YAMLMap } from 'yaml';

import styles from './index.module.css';
import { messages } from './messages.js';
import { useApp } from '../../../index.js';
import { ColorPicker } from '../../Components/ColorPicker/index.js';
import { InputList } from '../../Components/InputList/index.js';
import { InputString } from '../../Components/InputString/index.js';

interface InheritedTheme {
  themeInherited: string;
  primaryInherited: string;
  dangerInherited: string;
  linkInherited: string;
  successInherited: string;
  warningInherited: string;
  infoInherited: string;
  fontInherited: string;
  splashInherited: string;
  tileInherited: string;
}

interface ThemePageProps {
  changeIn: (path: Iterable<unknown>, value: Node) => void;
  docRef: MutableRefObject<Document<ParsedNode>>;
  selectedPage: number;
  selectedBlock: number;
  selectedSubParent: number;
}

const defaultFont: FontDefinition = { family: 'Open Sans', source: 'google' };
export function ThemePage({
  changeIn,
  docRef,
  selectedBlock,
  selectedPage,
  selectedSubParent,
}: ThemePageProps): ReactElement {
  const { app, setApp } = useApp();
  const { formatMessage } = useIntl();

  function getTheme(
    block: number,
    page: number,
    subParent: number,
  ): { theme: Theme; inheritors: InheritedTheme } {
    const theme = app.definition.theme ? { ...app.definition.theme } : {};
    const inheritors: InheritedTheme = {
      themeInherited: formatMessage(messages.defaultTheme),
      primaryInherited: formatMessage(messages.defaultTheme),
      dangerInherited: formatMessage(messages.defaultTheme),
      linkInherited: formatMessage(messages.defaultTheme),
      successInherited: formatMessage(messages.defaultTheme),
      warningInherited: formatMessage(messages.defaultTheme),
      infoInherited: formatMessage(messages.defaultTheme),
      fontInherited: formatMessage(messages.defaultTheme),
      splashInherited: formatMessage(messages.defaultTheme),
      tileInherited: formatMessage(messages.defaultTheme),
    };
    if (block === -1 && page === -1 && subParent === -1) {
      inheritors.themeInherited = theme.themeColor ? '' : formatMessage(messages.defaultTheme);
      theme.themeColor = theme.themeColor || baseTheme.themeColor;
      inheritors.primaryInherited = theme.primaryColor ? '' : formatMessage(messages.defaultTheme);
      theme.primaryColor = theme.primaryColor || baseTheme.primaryColor;
      inheritors.dangerInherited = theme.dangerColor ? '' : formatMessage(messages.defaultTheme);
      theme.dangerColor = theme.dangerColor || baseTheme.dangerColor;
      inheritors.linkInherited = theme.linkColor ? '' : formatMessage(messages.defaultTheme);
      theme.linkColor = theme.linkColor || baseTheme.linkColor;
      inheritors.successInherited = theme.successColor ? '' : formatMessage(messages.defaultTheme);
      theme.successColor = theme.successColor || baseTheme.successColor;
      inheritors.warningInherited = theme.warningColor ? '' : formatMessage(messages.defaultTheme);
      theme.warningColor = theme.warningColor || baseTheme.warningColor;
      inheritors.splashInherited = theme.splashColor ? '' : formatMessage(messages.defaultTheme);
      theme.splashColor = theme.splashColor || baseTheme.splashColor;
      inheritors.fontInherited = theme.font ? '' : formatMessage(messages.defaultTheme);
      theme.font = theme.font || baseTheme.font;
      inheritors.infoInherited = theme.infoColor ? '' : formatMessage(messages.defaultTheme);
      theme.infoColor = theme.infoColor || baseTheme.infoColor;
      inheritors.tileInherited = theme.tileLayer ? '' : formatMessage(messages.defaultTheme);
      theme.tileLayer = theme.tileLayer || baseTheme.tileLayer;
      return { theme: theme as Theme, inheritors };
    }

    const currentPage = docRef.current.toJS().pages[page];
    if (page !== -1 && block === -1 && subParent === -1) {
      theme.themeColor = currentPage.theme?.themeColor || theme.themeColor || baseTheme.themeColor;
      inheritors.themeInherited = currentPage.theme?.themeColor ? '' : inheritors.themeInherited;
      theme.primaryColor =
        currentPage.theme?.primaryColor || theme.primaryColor || baseTheme.primaryColor;
      inheritors.primaryInherited = currentPage.theme?.primaryColor
        ? ''
        : inheritors.primaryInherited;
      theme.dangerColor =
        currentPage.theme?.dangerColor || theme.dangerColor || baseTheme.dangerColor;
      inheritors.dangerInherited = currentPage.theme?.dangerColor ? '' : inheritors.dangerInherited;
      theme.linkColor = currentPage.theme?.linkColor || theme.linkColor || baseTheme.linkColor;
      inheritors.linkInherited = currentPage.theme?.linkColor ? '' : inheritors.linkInherited;
      theme.successColor =
        currentPage.theme?.successColor || theme.successColor || baseTheme.successColor;
      inheritors.successInherited = currentPage.theme?.successColor
        ? ''
        : inheritors.successInherited;
      theme.warningColor =
        currentPage.theme?.warningColor || theme.warningColor || baseTheme.warningColor;
      inheritors.warningInherited = currentPage.theme?.warningColor
        ? ''
        : inheritors.warningInherited;
      theme.splashColor =
        currentPage.theme?.splashColor || theme.splashColor || baseTheme.splashColor;
      inheritors.splashInherited = currentPage.theme?.splashColor ? '' : inheritors.splashInherited;
      theme.font = currentPage.theme?.font || theme.font || baseTheme.font;
      inheritors.fontInherited = currentPage.theme?.font ? '' : inheritors.fontInherited;
      theme.infoColor = currentPage.theme?.infoColor || theme.infoColor || baseTheme.infoColor;
      inheritors.infoInherited = currentPage.theme?.infoColor ? '' : inheritors.infoInherited;
      theme.tileLayer = currentPage.theme?.tileLayer || theme.tileLayer || baseTheme.tileLayer;
      inheritors.tileInherited = currentPage.theme?.tileLayer ? '' : inheritors.tileInherited;
      return { theme: theme as Theme, inheritors };
    }
    const currentBlock =
      !currentPage.type || currentPage.type === 'page'
        ? (currentPage as BasicPageDefinition).blocks[block]
        : currentPage.type === 'flow'
        ? (currentPage as FlowPageDefinition).steps[subParent].blocks[block]
        : (currentPage as TabsPageDefinition).tabs[subParent].blocks[block];
    theme.themeColor =
      currentBlock.theme?.themeColor ??
      (currentPage.theme?.themeColor || theme.themeColor || baseTheme.themeColor);
    inheritors.themeInherited = currentBlock.theme?.themeColor
      ? ''
      : currentPage.theme?.themeColor
      ? currentPage.name
      : inheritors.themeInherited;
    theme.primaryColor =
      currentBlock.theme?.primaryColor ??
      (currentPage.theme?.primaryColor || theme.primaryColor || baseTheme.primaryColor);
    inheritors.primaryInherited = currentBlock.theme?.primaryColor
      ? ''
      : currentPage.theme?.primaryColor
      ? currentPage.name
      : inheritors.primaryInherited;
    theme.dangerColor =
      currentBlock.theme?.dangerColor ??
      (currentPage.theme?.dangerColor || theme.dangerColor || baseTheme.dangerColor);
    inheritors.dangerInherited = currentBlock.theme?.dangerColor
      ? ''
      : currentPage.theme?.dangerColor
      ? currentPage.name
      : inheritors.dangerInherited;
    theme.linkColor =
      currentBlock.theme?.linkColor ??
      (currentPage.theme?.linkColor || theme.linkColor || baseTheme.linkColor);
    inheritors.linkInherited = currentBlock.theme?.linkColor
      ? ''
      : currentPage.theme?.linkColor
      ? currentPage.name
      : inheritors.linkInherited;
    theme.successColor =
      currentBlock.theme?.successColor ??
      (currentPage.theme?.successColor || theme.successColor || baseTheme.successColor);
    inheritors.successInherited = currentBlock.theme?.successColor
      ? ''
      : currentPage.theme?.successColor
      ? currentPage.name
      : inheritors.successInherited;
    theme.warningColor =
      currentBlock.theme?.warningColor ??
      (currentPage.theme?.warningColor || theme.warningColor || baseTheme.warningColor);
    inheritors.warningInherited = currentBlock.theme?.warningColor
      ? ''
      : currentPage.theme?.warningColor
      ? currentPage.name
      : inheritors.warningInherited;
    theme.splashColor =
      currentBlock.theme?.splashColor ??
      (currentPage.theme?.splashColor || theme.splashColor || baseTheme.splashColor);
    inheritors.splashInherited = currentBlock.theme?.splashColor
      ? ''
      : currentPage.theme?.splashColor
      ? currentPage.name
      : inheritors.splashInherited;
    theme.font =
      currentBlock.theme?.font ?? (currentPage.theme?.font || theme.font || baseTheme.font);
    inheritors.fontInherited = currentBlock.theme?.font
      ? ''
      : currentPage.theme?.font
      ? currentPage.name
      : inheritors.fontInherited;
    theme.infoColor =
      currentBlock.theme?.infoColor ??
      (currentPage.theme?.infoColor || theme.infoColor || baseTheme.infoColor);
    inheritors.infoInherited = currentBlock.theme?.infoColor
      ? ''
      : currentPage.theme?.infoColor
      ? currentPage.name
      : inheritors.infoInherited;
    theme.tileLayer =
      currentBlock.theme?.tileLayer ??
      (currentPage.theme?.tileLayer || theme.tileLayer || baseTheme.tileLayer);
    inheritors.tileInherited = currentBlock.theme?.tileLayer
      ? ''
      : currentPage.theme?.tileLayer
      ? currentPage.name
      : inheritors.tileInherited;
    return { theme: theme as Theme, inheritors };
  }
  const isDefaultTheme = selectedBlock === -1 && selectedPage === -1 && selectedSubParent === -1;
  const { inheritors, theme } = getTheme(selectedBlock, selectedPage, selectedSubParent);

  const onChangeTheme = useCallback(
    (input: string, type: keyof Omit<Theme, 'font'>) => {
      const doc = docRef.current;
      if (isDefaultTheme) {
        changeIn(['theme', type], doc.createNode(input));
      } else {
        const currentPage = doc.getIn(['pages', selectedPage]) as YAMLMap;
        if (selectedPage !== -1 && selectedBlock === -1 && selectedSubParent === -1) {
          changeIn(['pages', selectedPage, 'theme', type], doc.createNode({ theme: {} }));
        } else {
          if (!currentPage.get(['type']) || currentPage.get(['type']) === 'page') {
            changeIn(
              ['pages', selectedPage, 'blocks', selectedBlock, 'theme', type],
              doc.createNode(input),
            );
          }
          if (currentPage.get(['type']) === 'flow') {
            changeIn(
              [
                'pages',
                selectedPage,
                'steps',
                selectedSubParent,
                'blocks',
                selectedBlock,
                'theme',
                type,
              ],
              doc.createNode(input),
            );
          }
          if (currentPage.get(['type']) === 'tabs') {
            changeIn(
              [
                'pages',
                selectedPage,
                'tabs',
                selectedSubParent,
                'blocks',
                selectedBlock,
                'theme',
                type,
              ],
              doc.createNode(input),
            );
          }
        }
      }
    },
    [changeIn, docRef, isDefaultTheme, selectedBlock, selectedPage, selectedSubParent],
  );

  const onReset = useCallback(
    (type: keyof Theme) => {
      if (isDefaultTheme) {
        delete app.definition.theme?.[type];
        if (Object.keys(app.definition.theme).length === 0) {
          delete app.definition.theme;
        }
      } else {
        const currentPage = app.definition.pages[selectedPage];
        if (selectedPage !== -1 && selectedBlock === -1 && selectedSubParent === -1) {
          delete app.definition.pages[selectedPage].theme?.[type];
          if (Object.keys(app.definition.pages[selectedPage].theme).length === 0) {
            delete app.definition.pages[selectedPage].theme;
          }
        } else {
          if (!currentPage.type || currentPage.type === 'page') {
            delete (app.definition.pages[selectedPage] as BasicPageDefinition).blocks[selectedBlock]
              .theme?.[type];
            if (
              Object.keys(
                (app.definition.pages[selectedPage] as BasicPageDefinition).blocks[selectedBlock]
                  .theme,
              ).length === 0
            ) {
              delete (app.definition.pages[selectedPage] as BasicPageDefinition).blocks[
                selectedBlock
              ].theme;
            }
          }
          if (currentPage.type === 'flow') {
            delete (app.definition.pages[selectedPage] as FlowPageDefinition).steps[
              selectedSubParent
            ].blocks[selectedBlock].theme?.[type];
            if (
              Object.keys(
                (app.definition.pages[selectedPage] as FlowPageDefinition).steps[selectedSubParent]
                  .blocks[selectedBlock].theme,
              ).length === 0
            ) {
              delete (app.definition.pages[selectedPage] as FlowPageDefinition).steps[
                selectedSubParent
              ].blocks[selectedBlock].theme;
            }
          }
          if (currentPage.type === 'tabs') {
            delete (app.definition.pages[selectedPage] as TabsPageDefinition).tabs[
              selectedSubParent
            ].blocks[selectedBlock].theme?.[type];
            if (
              Object.keys(
                (app.definition.pages[selectedPage] as TabsPageDefinition).tabs[selectedSubParent]
                  .blocks[selectedBlock].theme,
              ).length === 0
            ) {
              delete (app.definition.pages[selectedPage] as TabsPageDefinition).tabs[
                selectedSubParent
              ].blocks[selectedBlock].theme;
            }
          }
        }
      }
      setApp({ ...app });
    },
    [app, isDefaultTheme, selectedBlock, selectedPage, selectedSubParent, setApp],
  );

  const onChangeFont = useCallback(
    (index: number, options: string[], type: 'family' | 'source') => {
      if (isDefaultTheme) {
        if (!app.definition.theme) {
          app.definition.theme = {};
        }
        if (!app.definition.theme.font) {
          app.definition.theme.font = defaultFont;
        }
        if (type === 'family') {
          app.definition.theme.font.family = options[index];
        }
        if (type === 'source') {
          app.definition.theme.font.source = options[index] as 'custom' | 'google';
        }
      } else {
        const currentPage = app.definition.pages[selectedPage];
        if (selectedPage !== -1 && selectedBlock === -1 && selectedSubParent === -1) {
          if (!app.definition.pages[selectedPage].theme) {
            app.definition.pages[selectedPage].theme = {};
          }
          if (!app.definition.pages[selectedPage].theme.font) {
            app.definition.pages[selectedPage].theme.font = defaultFont;
          }
          if (type === 'family') {
            app.definition.pages[selectedPage].theme.font.family = options[index];
          }
          if (type === 'source') {
            app.definition.pages[selectedPage].theme.font.source = options[index] as
              | 'custom'
              | 'google';
          }
        } else {
          if (!currentPage.type || currentPage.type === 'page') {
            if (!(currentPage as BasicPageDefinition).blocks[selectedBlock].theme) {
              (app.definition.pages[selectedPage] as BasicPageDefinition).blocks[
                selectedBlock
              ].theme = {};
            }
            if (!(currentPage as BasicPageDefinition).blocks[selectedBlock].theme.font) {
              (app.definition.pages[selectedPage] as BasicPageDefinition).blocks[
                selectedBlock
              ].theme.font = defaultFont;
            }
            if (type === 'family') {
              (app.definition.pages[selectedPage] as BasicPageDefinition).blocks[
                selectedBlock
              ].theme.font.family = options[index];
            }
            if (type === 'source') {
              (app.definition.pages[selectedPage] as BasicPageDefinition).blocks[
                selectedBlock
              ].theme.font.source = options[index] as 'custom' | 'google';
            }
          }
          if (currentPage.type === 'flow') {
            if (
              !(currentPage as FlowPageDefinition).steps[selectedSubParent].blocks[selectedBlock]
                .theme
            ) {
              (app.definition.pages[selectedPage] as FlowPageDefinition).steps[
                selectedSubParent
              ].blocks[selectedBlock].theme = {};
            }
            if (
              !(currentPage as FlowPageDefinition).steps[selectedSubParent].blocks[selectedBlock]
                .theme.font
            ) {
              (app.definition.pages[selectedPage] as FlowPageDefinition).steps[
                selectedSubParent
              ].blocks[selectedBlock].theme.font = defaultFont;
            }
            if (type === 'family') {
              (app.definition.pages[selectedPage] as FlowPageDefinition).steps[
                selectedSubParent
              ].blocks[selectedBlock].theme.font.family = options[index];
            }
            if (type === 'source') {
              (app.definition.pages[selectedPage] as FlowPageDefinition).steps[
                selectedSubParent
              ].blocks[selectedBlock].theme.font.source = options[index] as 'custom' | 'google';
            }
          }
          if (currentPage.type === 'tabs') {
            if (
              !(currentPage as TabsPageDefinition).tabs[selectedSubParent].blocks[selectedBlock]
                .theme
            ) {
              (app.definition.pages[selectedPage] as TabsPageDefinition).tabs[
                selectedSubParent
              ].blocks[selectedBlock].theme = {};
            }
            if (
              !(currentPage as TabsPageDefinition).tabs[selectedSubParent].blocks[selectedBlock]
                .theme.font
            ) {
              (app.definition.pages[selectedPage] as TabsPageDefinition).tabs[
                selectedSubParent
              ].blocks[selectedBlock].theme.font = defaultFont;
            }
            if (type === 'family') {
              (app.definition.pages[selectedPage] as TabsPageDefinition).tabs[
                selectedSubParent
              ].blocks[selectedBlock].theme.font.family = options[index];
            }
            if (type === 'source') {
              (app.definition.pages[selectedPage] as TabsPageDefinition).tabs[
                selectedSubParent
              ].blocks[selectedBlock].theme.font.source = options[index] as 'custom' | 'google';
            }
          }
        }
      }
      setApp({ ...app });
    },
    [app, isDefaultTheme, selectedBlock, selectedPage, selectedSubParent, setApp],
  );

  return (
    <>
      <ColorPicker
        canReset={inheritors.themeInherited === ''}
        inheritFrom={inheritors.themeInherited}
        label={formatMessage(messages.themeColor)}
        onChange={(color: string) => onChangeTheme(color, 'themeColor')}
        onReset={() => onReset('themeColor')}
        selectedColor={theme.themeColor}
      />
      <ColorPicker
        canReset={inheritors.splashInherited === ''}
        inheritFrom={inheritors.splashInherited}
        label={formatMessage(messages.splashColor)}
        onChange={(color: string) => onChangeTheme(color, 'splashColor')}
        onReset={() => onReset('splashColor')}
        selectedColor={theme.splashColor}
      />
      <ColorPicker
        canReset={inheritors.primaryInherited === ''}
        inheritFrom={inheritors.primaryInherited}
        label={formatMessage(messages.primaryColor)}
        onChange={(color: string) => onChangeTheme(color, 'primaryColor')}
        onReset={() => onReset('primaryColor')}
        selectedColor={theme.primaryColor}
      />
      <ColorPicker
        canReset={inheritors.linkInherited === ''}
        inheritFrom={inheritors.linkInherited}
        label={formatMessage(messages.linkColor)}
        onChange={(color: string) => onChangeTheme(color, 'linkColor')}
        onReset={() => onReset('linkColor')}
        selectedColor={theme.linkColor}
      />
      <ColorPicker
        canReset={inheritors.infoInherited === ''}
        inheritFrom={inheritors.infoInherited}
        label={formatMessage(messages.infoColor)}
        onChange={(color: string) => onChangeTheme(color, 'infoColor')}
        onReset={() => onReset('infoColor')}
        selectedColor={theme.infoColor}
      />
      <ColorPicker
        canReset={inheritors.successInherited === ''}
        inheritFrom={inheritors.successInherited}
        label={formatMessage(messages.successColor)}
        onChange={(color: string) => onChangeTheme(color, 'successColor')}
        onReset={() => onReset('successColor')}
        selectedColor={theme.successColor}
      />
      <ColorPicker
        canReset={inheritors.warningInherited === ''}
        inheritFrom={inheritors.warningInherited}
        label={formatMessage(messages.warningColor)}
        onChange={(color: string) => onChangeTheme(color, 'warningColor')}
        onReset={() => onReset('warningColor')}
        selectedColor={theme.warningColor}
      />
      <ColorPicker
        canReset={inheritors.dangerInherited === ''}
        inheritFrom={inheritors.dangerInherited}
        label={formatMessage(messages.dangerColor)}
        onChange={(color: string) => onChangeTheme(color, 'dangerColor')}
        onReset={() => onReset('dangerColor')}
        selectedColor={theme.dangerColor}
      />
      <div>
        <label className="label">
          {formatMessage(messages.tileLayers)}{' '}
          <span className={styles.inheritFrom}>{inheritors.tileInherited}</span>
        </label>
        <div className={styles.resetItem}>
          <InputString
            allowSymbols
            maxLength={999}
            minLength={1}
            onChange={(event, value: string) => onChangeTheme(value, 'tileLayer')}
            value={theme.tileLayer}
          />
          {inheritors.tileInherited === '' && (
            <IconButton icon="close" onClick={() => onReset('tileLayer')} />
          )}
        </div>
      </div>
      <div>
        <label className="label">
          {formatMessage(messages.font)}{' '}
          <span className={styles.inheritFrom}>{inheritors.fontInherited}</span>
        </label>
        <label className="label">{formatMessage(messages.fontSource)}</label>
        <div className={styles.resetItem}>
          <InputList
            onChange={(index) => onChangeFont(index, ['custom', 'google'], 'source')}
            options={['custom', 'google']}
            value={theme.font.source || 'google'}
          />
          {inheritors.fontInherited === '' && (
            <IconButton icon="close" onClick={() => onReset('font')} />
          )}
        </div>
        <label className="label">{formatMessage(messages.fontFamily)}</label>
        <div className={styles.resetItem}>
          <InputList
            onChange={(index) =>
              onChangeFont(
                index,
                theme.font.source === 'google' ? googleFonts : [theme.font.family],
                'family',
              )
            }
            options={theme.font.source === 'google' ? googleFonts : [theme.font.family]}
            value={theme.font.family}
          />
          {inheritors.fontInherited === '' && (
            <IconButton icon="close" onClick={() => onReset('font')} />
          )}
        </div>
      </div>
    </>
  );
}
