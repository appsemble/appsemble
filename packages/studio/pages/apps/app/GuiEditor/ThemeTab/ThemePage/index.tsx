import {
  baseTheme,
  type BasicPageDefinition,
  type FlowPageDefinition,
  type FontDefinition,
  type TabsPageDefinition,
  type Theme,
} from '@appsemble/lang-sdk';
import { IconButton } from '@appsemble/react-components';
import { googleFonts } from '@appsemble/utils';
import { type MutableRefObject, type ReactNode, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { type Document, type Node, type ParsedNode, type YAMLMap } from 'yaml';

import styles from './index.module.css';
import { messages } from './messages.js';
import { ColorPicker } from '../../Components/ColorPicker/index.js';
import { InputList } from '../../Components/InputList/index.js';
import { InputString } from '../../Components/InputString/index.js';

interface ThemeColors {
  themeColor: string;
  primaryColor: string;
  dangerColor: string;
  linkColor: string;
  successColor: string;
  warningColor: string;
  infoColor: string;
  font: string;
  splashColor: string;
  tileLayer: string;
}

interface ThemePageProps {
  readonly changeIn: (path: Iterable<unknown>, value: Node) => void;
  readonly deleteIn: (path: Iterable<unknown>) => void;
  readonly docRef: MutableRefObject<Document<ParsedNode>>;
  readonly selectedPage: number;
  readonly selectedBlock: number;
  readonly selectedSubParent: number;
}

const defaultFont: FontDefinition = { family: 'Open Sans', source: 'google' };
export function ThemePage({
  changeIn,
  deleteIn,
  docRef,
  selectedBlock,
  selectedPage,
  selectedSubParent,
}: ThemePageProps): ReactNode {
  const { formatMessage } = useIntl();

  function getTheme(
    block: number,
    page: number,
    subParent: number,
  ): { theme: Theme; inheritors: ThemeColors } {
    const theme = docRef.current.toJS().theme ? { ...docRef.current.toJS().theme } : {};

    const inheritors: ThemeColors = {
      themeColor: formatMessage(messages.defaultTheme),
      primaryColor: formatMessage(messages.defaultTheme),
      dangerColor: formatMessage(messages.defaultTheme),
      linkColor: formatMessage(messages.defaultTheme),
      successColor: formatMessage(messages.defaultTheme),
      warningColor: formatMessage(messages.defaultTheme),
      infoColor: formatMessage(messages.defaultTheme),
      font: formatMessage(messages.defaultTheme),
      splashColor: formatMessage(messages.defaultTheme),
      tileLayer: formatMessage(messages.defaultTheme),
    };
    if (block === -1 && page === -1 && subParent === -1) {
      for (const [key] of Object.entries(inheritors) as [keyof ThemeColors, string][]) {
        if (theme[key]) {
          inheritors[key] = '';
        } else {
          inheritors[key] = formatMessage(messages.defaultTheme);
          theme[key] = baseTheme[key];
        }
      }
      return { theme: theme as Theme, inheritors };
    }

    const currentPage = docRef.current.toJS().pages[page];
    if (page !== -1 && block === -1 && subParent === -1) {
      for (const [key] of Object.entries(inheritors) as [keyof ThemeColors, string][]) {
        if (currentPage.theme?.[key]) {
          theme[key] = currentPage.theme?.[key];
          inheritors[key] = '';
        } else if (!theme[key]) {
          theme[key] = baseTheme[key];
        }
      }
      return { theme: theme as Theme, inheritors };
    }
    const currentBlock =
      !currentPage.type || currentPage.type === 'page'
        ? (currentPage as BasicPageDefinition).blocks[block]
        : currentPage.type === 'flow'
          ? (currentPage as FlowPageDefinition).steps[subParent].blocks[block]
          : (currentPage as TabsPageDefinition).tabs[subParent].blocks[block];
    for (const [key] of Object.entries(inheritors) as [keyof ThemeColors, string][]) {
      if (currentBlock.theme?.[key]) {
        theme[key] = currentBlock.theme?.[key];
        inheritors[key] = '';
      } else if (currentPage.theme?.[key]) {
        theme[key] = currentPage.theme?.[key];
        inheritors[key] = currentPage.name;
      } else if (!theme[key]) {
        theme[key] = baseTheme[key];
      }
    }
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
          changeIn(['pages', selectedPage, 'theme', type], doc.createNode(input));
        } else {
          if (!currentPage.getIn(['type']) || currentPage.getIn(['type']) === 'page') {
            changeIn(
              ['pages', selectedPage, 'blocks', selectedBlock, 'theme', type],
              doc.createNode(input),
            );
          }
          if (currentPage.getIn(['type']) === 'flow') {
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
          if (currentPage.getIn(['type']) === 'tabs') {
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
      const doc = docRef.current;
      if (isDefaultTheme) {
        deleteIn(['theme', type]);
        if ((doc.getIn(['theme']) as YAMLMap).items.length === 0) {
          deleteIn(['theme']);
        }
      } else {
        const currentPage = doc.getIn(['pages', selectedPage]) as YAMLMap;
        if (selectedPage !== -1 && selectedBlock === -1 && selectedSubParent === -1) {
          deleteIn(['pages', selectedPage, 'theme', type]);
          if ((doc.getIn(['pages', selectedPage, 'theme']) as YAMLMap).items.length === 0) {
            deleteIn(['pages', selectedPage, 'theme']);
          }
        } else {
          if (!currentPage.getIn(['type']) || currentPage.getIn(['type']) === 'page') {
            deleteIn(['pages', selectedPage, 'blocks', selectedBlock, 'theme', type]);
            if (
              (doc.getIn(['pages', selectedPage, 'blocks', selectedBlock, 'theme']) as YAMLMap)
                .items.length === 0
            ) {
              deleteIn(['pages', selectedPage, 'blocks', selectedBlock, 'theme']);
            }
          }
          if (currentPage.getIn(['type']) === 'flow') {
            deleteIn([
              'pages',
              selectedPage,
              'steps',
              selectedSubParent,
              'blocks',
              selectedBlock,
              'theme',
              type,
            ]);
            if (
              Object.keys(
                doc.getIn([
                  'pages',
                  selectedPage,
                  'steps',
                  selectedSubParent,
                  'blocks',
                  selectedBlock,
                  'theme',
                ]),
              ).length === 0
            ) {
              deleteIn([
                'pages',
                selectedPage,
                'steps',
                selectedSubParent,
                'blocks',
                selectedBlock,
                'theme',
              ]);
            }
          }
          if (currentPage.getIn(['type']) === 'tabs') {
            deleteIn([
              'pages',
              selectedPage,
              'tabs',
              selectedSubParent,
              'blocks',
              selectedBlock,
              'theme',
              type,
            ]);
            if (
              Object.keys(
                doc.getIn([
                  'pages',
                  selectedPage,
                  'tabs',
                  selectedSubParent,
                  'blocks',
                  selectedBlock,
                  'theme',
                ]),
              ).length === 0
            ) {
              deleteIn([
                'pages',
                selectedPage,
                'tabs',
                selectedSubParent,
                'blocks',
                selectedBlock,
                'theme',
              ]);
            }
          }
        }
      }
    },
    [deleteIn, docRef, isDefaultTheme, selectedBlock, selectedPage, selectedSubParent],
  );

  const onChangeFont = useCallback(
    (index: number, options: string[], type: 'family' | 'source') => {
      const doc = docRef.current;
      if (isDefaultTheme) {
        if (!doc.getIn(['theme'])) {
          changeIn(['theme', 'font'], doc.createNode(defaultFont));
        }
        if (type === 'family') {
          changeIn(['theme', 'font', 'family'], doc.createNode(options[index]));
        }
        if (type === 'source') {
          changeIn(
            ['theme', 'font', 'source'],
            doc.createNode(options[index] as 'custom' | 'google'),
          );
        }
      } else {
        if (selectedPage !== -1 && selectedBlock === -1 && selectedSubParent === -1) {
          if (!doc.getIn(['pages', selectedPage, 'theme', 'font'])) {
            changeIn(['pages', selectedPage, 'theme', 'font'], doc.createNode(defaultFont));
          }
          if (type === 'family') {
            changeIn(
              ['pages', selectedPage, 'theme', 'font', 'family'],
              doc.createNode(options[index]),
            );
          }
          if (type === 'source') {
            changeIn(
              ['pages', selectedPage, 'theme', 'font', 'source'],
              doc.createNode(options[index] as 'custom' | 'google'),
            );
          }
        } else {
          const currentPage = doc.getIn(['pages', selectedPage]) as YAMLMap;
          if (!currentPage.getIn(['type']) || currentPage.getIn(['type']) === 'page') {
            if (!currentPage.getIn(['blocks', selectedBlock, 'theme', 'font'])) {
              changeIn(
                ['pages', selectedPage, 'blocks', selectedBlock, 'theme', 'font'],
                doc.createNode(defaultFont),
              );
            }
            if (type === 'family') {
              changeIn(
                ['pages', selectedPage, 'blocks', selectedBlock, 'theme', 'font', 'family'],
                doc.createNode(options[index]),
              );
            }
            if (type === 'source') {
              changeIn(
                ['pages', selectedPage, 'blocks', selectedBlock, 'theme', 'font', 'source'],
                doc.createNode(options[index] as 'custom' | 'google'),
              );
            }
          }
          if (currentPage.getIn(['type']) === 'flow') {
            if (
              !currentPage.getIn([
                'steps',
                selectedSubParent,
                'blocks',
                selectedBlock,
                'theme',
                'font',
              ])
            ) {
              changeIn(
                [
                  'pages',
                  selectedPage,
                  'steps',
                  selectedSubParent,
                  'blocks',
                  selectedBlock,
                  'theme',
                  'font',
                ],
                doc.createNode(defaultFont),
              );
            }
            if (type === 'family') {
              changeIn(
                [
                  'pages',
                  selectedPage,
                  'steps',
                  selectedSubParent,
                  'blocks',
                  selectedBlock,
                  'theme',
                  'font',
                  'family',
                ],
                doc.createNode(options[index]),
              );
            }
            if (type === 'source') {
              changeIn(
                [
                  'pages',
                  selectedPage,
                  'steps',
                  selectedSubParent,
                  'blocks',
                  selectedBlock,
                  'theme',
                  'font',
                  'source',
                ],
                doc.createNode(options[index] as 'custom' | 'google'),
              );
            }
          }
          if (currentPage.getIn(['type']) === 'tabs') {
            if (
              !currentPage.getIn([
                'tabs',
                selectedSubParent,
                'blocks',
                selectedBlock,
                'theme',
                'font',
              ])
            ) {
              changeIn(
                [
                  'pages',
                  selectedPage,
                  'tabs',
                  selectedSubParent,
                  'blocks',
                  selectedBlock,
                  'theme',
                  'font',
                ],
                doc.createNode(defaultFont),
              );
            }
            if (type === 'family') {
              changeIn(
                [
                  'pages',
                  selectedPage,
                  'tabs',
                  selectedSubParent,
                  'blocks',
                  selectedBlock,
                  'theme',
                  'font',
                  'family',
                ],
                doc.createNode(options[index]),
              );
            }
            if (type === 'source') {
              changeIn(
                [
                  'pages',
                  selectedPage,
                  'tabs',
                  selectedSubParent,
                  'blocks',
                  selectedBlock,
                  'theme',
                  'font',
                  'source',
                ],
                doc.createNode(options[index] as 'custom' | 'google'),
              );
            }
          }
        }
      }
    },
    [changeIn, docRef, isDefaultTheme, selectedBlock, selectedPage, selectedSubParent],
  );

  return (
    <>
      <ColorPicker
        canReset={inheritors.themeColor === ''}
        inheritFrom={inheritors.themeColor}
        label={formatMessage(messages.themeColor)}
        onChange={(color: string) => onChangeTheme(color, 'themeColor')}
        onReset={() => onReset('themeColor')}
        selectedColor={theme.themeColor}
      />
      <ColorPicker
        canReset={inheritors.splashColor === ''}
        inheritFrom={inheritors.splashColor}
        label={formatMessage(messages.splashColor)}
        onChange={(color: string) => onChangeTheme(color, 'splashColor')}
        onReset={() => onReset('splashColor')}
        selectedColor={theme.splashColor}
      />
      <ColorPicker
        canReset={inheritors.primaryColor === ''}
        inheritFrom={inheritors.primaryColor}
        label={formatMessage(messages.primaryColor)}
        onChange={(color: string) => onChangeTheme(color, 'primaryColor')}
        onReset={() => onReset('primaryColor')}
        selectedColor={theme.primaryColor}
      />
      <ColorPicker
        canReset={inheritors.linkColor === ''}
        inheritFrom={inheritors.linkColor}
        label={formatMessage(messages.linkColor)}
        onChange={(color: string) => onChangeTheme(color, 'linkColor')}
        onReset={() => onReset('linkColor')}
        selectedColor={theme.linkColor}
      />
      <ColorPicker
        canReset={inheritors.infoColor === ''}
        inheritFrom={inheritors.infoColor}
        label={formatMessage(messages.infoColor)}
        onChange={(color: string) => onChangeTheme(color, 'infoColor')}
        onReset={() => onReset('infoColor')}
        selectedColor={theme.infoColor}
      />
      <ColorPicker
        canReset={inheritors.successColor === ''}
        inheritFrom={inheritors.successColor}
        label={formatMessage(messages.successColor)}
        onChange={(color: string) => onChangeTheme(color, 'successColor')}
        onReset={() => onReset('successColor')}
        selectedColor={theme.successColor}
      />
      <ColorPicker
        canReset={inheritors.warningColor === ''}
        inheritFrom={inheritors.warningColor}
        label={formatMessage(messages.warningColor)}
        onChange={(color: string) => onChangeTheme(color, 'warningColor')}
        onReset={() => onReset('warningColor')}
        selectedColor={theme.warningColor}
      />
      <ColorPicker
        canReset={inheritors.dangerColor === ''}
        inheritFrom={inheritors.dangerColor}
        label={formatMessage(messages.dangerColor)}
        onChange={(color: string) => onChangeTheme(color, 'dangerColor')}
        onReset={() => onReset('dangerColor')}
        selectedColor={theme.dangerColor}
      />
      <div>
        <label className="label">
          {formatMessage(messages.tileLayers)}{' '}
          <span className={styles.inheritFrom}>{inheritors.tileLayer}</span>
        </label>
        <div className={styles.resetItem}>
          <InputString
            allowSymbols
            maxLength={999}
            minLength={1}
            onChange={(event, value: string) => onChangeTheme(value, 'tileLayer')}
            value={theme.tileLayer}
          />
          {inheritors.tileLayer === '' && (
            <IconButton icon="close" onClick={() => onReset('tileLayer')} />
          )}
        </div>
      </div>
      <div>
        <label className="label">
          {formatMessage(messages.font)}{' '}
          <span className={styles.inheritFrom}>{inheritors.font}</span>
        </label>
        <label className="label">{formatMessage(messages.fontSource)}</label>
        <div className={styles.resetItem}>
          <InputList
            onChange={(index) => onChangeFont(index, ['custom', 'google'], 'source')}
            options={['custom', 'google']}
            value={theme.font.source || 'google'}
          />
          {inheritors.font === '' && <IconButton icon="close" onClick={() => onReset('font')} />}
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
          {inheritors.font === '' && <IconButton icon="close" onClick={() => onReset('font')} />}
        </div>
      </div>
    </>
  );
}
