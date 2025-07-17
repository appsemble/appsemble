import {
  type BasicPageDefinition,
  type FlowPageDefinition,
  type TabsPageDefinition,
} from '@appsemble/lang-sdk';
import { Button, Input, TextArea } from '@appsemble/react-components';
import { type MutableRefObject, type ReactNode, useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { type Document, type Node, type ParsedNode } from 'yaml';

import styles from './index.module.css';
import { messages } from './messages.js';
import { ColorPicker } from '../../Components/ColorPicker/index.js';
import { InputList } from '../../Components/InputList/index.js';

interface StylePageProps {
  readonly changeIn: (path: Iterable<unknown>, value: Node) => void;
  readonly coreStyle: string;
  readonly docRef: MutableRefObject<Document<ParsedNode>>;
  readonly setCoreStyle: (style: string) => void;
  readonly selectedPage: number;
  readonly selectedProp?: string;
  readonly selectedBlock: number;
  readonly selectedSubParent: number;
}
const borderTypes = [
  'none',
  'dotted',
  'dashed',
  'solid',
  'double',
  'groove',
  'ridge',
  'inset',
  'outset',
  'hidden',
];

const loginOptions = ['navbar', 'navigation', 'hidden'] as const;
const settingsOptions = ['navbar', 'navigation', 'hidden'] as const;
const feedBackOptions = ['navigation', 'navbar', 'hidden'] as const;
const navigationOptions = ['left-menu', 'bottom', 'hidden'] as const;

export function StylePage({
  changeIn,
  coreStyle,
  docRef,
  selectedBlock,
  selectedPage,
  selectedProp,
  selectedSubParent,
  setCoreStyle,
}: StylePageProps): ReactNode {
  const regex = /\s*(\d+})\s*/g;
  const { formatMessage } = useIntl();
  const [borderType, setBorderType] = useState<string>(borderTypes[0]);
  const [borderColor, setBorderColor] = useState<string>('#000000');
  const [css, setCss] = useState<string[]>(coreStyle ? coreStyle.split(regex) : ['']);
  const [borderWidth, setBorderWidth] = useState<number>(0);
  const [borderRadius, setBorderRadius] = useState<number>(0);
  const [marginArray, setMarginArray] = useState<string[]>(['0', '0', '0', '0']);
  const [paddingArray, setPaddingArray] = useState<string[]>(['0', '0', '0', '0']);

  const currentPage = docRef.current.toJS().pages[selectedPage];

  const getBlockName = useCallback((): string => {
    const currentBlock =
      !currentPage.type || currentPage.type === 'page'
        ? (currentPage as BasicPageDefinition).blocks[selectedBlock]
        : currentPage.type === 'flow'
          ? (currentPage as FlowPageDefinition).steps[selectedSubParent].blocks[selectedBlock]
          : (currentPage as TabsPageDefinition).tabs[selectedSubParent].blocks[selectedBlock];
    return currentBlock.type;
  }, [currentPage, selectedBlock, selectedSubParent]);

  const getPropName = useCallback(() => {
    if (selectedPage === -1 && selectedBlock === -1 && selectedSubParent === -1 && selectedProp) {
      // Select the selectedProp
      return selectedProp;
    }
    if (selectedPage !== -1 && selectedBlock === -1 && selectedSubParent === -1) {
      // Selected a page
      return `[data-page='@appsemble/${currentPage.name}']`;
    }
    if (selectedPage !== -1 && selectedBlock !== -1 && selectedSubParent === -1) {
      // Selected a block
      return `[data-block='@appsemble/${getBlockName()}']`;
    }
    return 'html';
  }, [currentPage, getBlockName, selectedBlock, selectedPage, selectedProp, selectedSubParent]);

  const onBorderTypeChange = useCallback((index: number) => {
    setBorderType(borderTypes[index]);
  }, []);
  const onBorderColorChange = useCallback(
    (color: string) => {
      setBorderColor(color);
    },
    [setBorderColor],
  );
  const onBorderWidthChange = useCallback(
    (width: number) => {
      setBorderWidth(width);
    },
    [setBorderWidth],
  );
  const onBorderRadiusChange = useCallback(
    (width: number) => {
      setBorderRadius(width);
    },
    [setBorderRadius],
  );
  const onMarginChange = useCallback(
    (value: string, index: number) => {
      const stringArray = marginArray;
      stringArray[index] = `${value}%`;
      setMarginArray(stringArray);
    },
    [marginArray],
  );
  const onPaddingChange = useCallback(
    (value: string, index: number) => {
      const stringArray = paddingArray;
      stringArray[index] = `${value}%`;
      setPaddingArray(stringArray);
    },
    [paddingArray],
  );

  // TODO reset function

  const applyCoreStyle = useCallback(() => {
    // First check if there is already ccs present for the property and remove it if true
    setCss(css.filter((e) => !e.includes(getPropName())));

    // If the prop is not present write it to coreStyle
    const cssString = `${getPropName()} {
      border: ${borderWidth}px ${borderType} ${borderColor};
      border-radius: ${borderRadius}px;
      margin: ${marginArray.join(' ')};
      padding: ${paddingArray.join(' ')};
    }`;
    css.push(cssString);

    setCoreStyle(css.join('\n'));
  }, [
    borderColor,
    borderRadius,
    borderType,
    borderWidth,
    css,
    getPropName,
    marginArray,
    paddingArray,
    setCoreStyle,
  ]);

  const onChangeLoginOption = useCallback(
    (index: number) => {
      const doc = docRef.current;
      changeIn(['layout', 'login'], doc.createNode(loginOptions[index]));
    },
    [changeIn, docRef],
  );

  const onChangeSettingsOption = useCallback(
    (index: number) => {
      const doc = docRef.current;
      changeIn(['layout', 'settings'], doc.createNode(settingsOptions[index]));
    },
    [changeIn, docRef],
  );

  const onChangeFeedbackOption = useCallback(
    (index: number) => {
      const doc = docRef.current;
      changeIn(['layout', 'feedback'], doc.createNode(feedBackOptions[index]));
    },
    [changeIn, docRef],
  );

  const onChangeNavigationOption = useCallback(
    (index: number) => {
      const doc = docRef.current;
      changeIn(['layout', 'navigation'], doc.createNode(navigationOptions[index]));
    },
    [changeIn, docRef],
  );

  return (
    <div>
      {selectedProp === 'layout' ? (
        <div className={styles.rightBar}>
          <InputList
            label={formatMessage(messages.loginLabel)}
            labelPosition="top"
            onChange={onChangeLoginOption}
            options={loginOptions}
            value={docRef.current.toJS().layout?.login || loginOptions[0]}
          />
          <InputList
            label={formatMessage(messages.settingsLabel)}
            labelPosition="top"
            onChange={onChangeSettingsOption}
            options={settingsOptions}
            value={docRef.current.toJS().layout?.settings || settingsOptions[0]}
          />
          <InputList
            label={formatMessage(messages.feedbackLabel)}
            labelPosition="top"
            onChange={onChangeFeedbackOption}
            options={feedBackOptions}
            value={docRef.current.toJS().layout?.feedback || feedBackOptions[0]}
          />
          <InputList
            label={formatMessage(messages.navigationLabel)}
            labelPosition="top"
            onChange={onChangeNavigationOption}
            options={navigationOptions}
            value={docRef.current.toJS().layout?.navigation || navigationOptions[0]}
          />
        </div>
      ) : (
        <div>
          <div>
            <label className="label">
              {selectedProp ??
                (selectedBlock >= 0 ? getBlockName() : selectedPage >= 0 ? currentPage.name : '')}
            </label>
            {/* Borders: thickness (number selector px), type (solid dotted dashed dropdown), color (colorpicker) */}
            <div>
              <label className="label">{formatMessage(messages.border)} </label>
              <label className="label">
                {`${formatMessage(messages.width)}, ${formatMessage(messages.type)}, ${formatMessage(
                  messages.color,
                )}, ${formatMessage(messages.radius)}`}
              </label>
              <div className={styles.borderContainer}>
                <Input
                  className={styles.input}
                  onChange={(event, width: number) => onBorderWidthChange(width)}
                  pattern={/0-9/}
                  type="number"
                  value={borderWidth}
                />
                <InputList
                  onChange={(index: number) => onBorderTypeChange(index)}
                  options={borderTypes}
                  value={borderType}
                />
                <ColorPicker
                  canReset={false}
                  labelPosition="left"
                  onChange={(color: string) => onBorderColorChange(color)}
                  selectedColor={borderColor}
                />
                <Input
                  className={styles.input}
                  name={formatMessage(messages.radius)}
                  onChange={(event, width: number) => onBorderRadiusChange(width)}
                  pattern={/0-9/}
                  type="number"
                  value={borderRadius}
                />
              </div>
            </div>
          </div>
          <label className="label">
            {`${formatMessage(messages.margin)} and ${formatMessage(messages.padding)}`}
          </label>
          <div className={styles.marginContainer}>
            <table>
              <tbody>
                <tr className={styles.marginColor}>
                  <td />
                  <td />
                  <td>
                    <Input
                      className={styles.input}
                      name={formatMessage(messages.radius)}
                      onChange={(event, value: string) => onMarginChange(value, 0)}
                      placeholder="0"
                      type="text"
                    />
                  </td>
                  <td />
                  <td className={styles.marginColor} />
                </tr>
                <tr className={styles.paddingColor}>
                  <td className={styles.marginColor} />
                  <td className={styles.paddingColor} />
                  <td>
                    <Input
                      className={styles.input}
                      name={formatMessage(messages.radius)}
                      onChange={(event, value: string) => onPaddingChange(value, 0)}
                      placeholder="0"
                      type="text"
                    />
                  </td>
                  <td className={styles.paddingColor} />
                  <td className={styles.marginColor} />
                </tr>
                <tr>
                  <td className={styles.marginColor}>
                    <Input
                      className={styles.input}
                      name={formatMessage(messages.radius)}
                      onChange={(event, value: string) => onMarginChange(value, 3)}
                      placeholder="0"
                      type="text"
                    />
                  </td>
                  <td className={styles.paddingColor}>
                    <Input
                      className={styles.input}
                      name={formatMessage(messages.radius)}
                      onChange={(event, value: string) => onPaddingChange(value, 3)}
                      placeholder="0"
                      type="text"
                    />
                  </td>
                  <td className={styles.contentColor} />
                  <td className={styles.paddingColor}>
                    <Input
                      className={styles.input}
                      name={formatMessage(messages.radius)}
                      onChange={(event, value: string) => onPaddingChange(value, 1)}
                      placeholder="0"
                      type="text"
                    />
                  </td>
                  <td className={styles.marginColor}>
                    <Input
                      className={styles.input}
                      name={formatMessage(messages.radius)}
                      onChange={(event, value: string) => onMarginChange(value, 1)}
                      placeholder="0"
                      type="text"
                    />
                  </td>
                </tr>
                <tr className={styles.paddingColor}>
                  <td className={styles.marginColor} />
                  <td />
                  <td>
                    <Input
                      className={styles.input}
                      name={formatMessage(messages.radius)}
                      onChange={(event, value: string) => onPaddingChange(value, 2)}
                      placeholder="0"
                      type="text"
                    />
                  </td>
                  <td />
                  <td className={styles.marginColor} />
                </tr>
                <tr className={styles.marginColor}>
                  <td />
                  <td />
                  <td>
                    <Input
                      className={styles.input}
                      name={formatMessage(messages.radius)}
                      onChange={(event, value: string) => onMarginChange(value, 2)}
                      placeholder="0"
                      type="text"
                    />
                  </td>
                  <td />
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
          <label className="label">{formatMessage(messages.cssPreview)} </label>
          <Button className="is-primary" component="a" icon="add" onClick={applyCoreStyle}>
            {formatMessage(messages.applyCore)}
          </Button>
          <TextArea
            className={styles.cssField}
            maxLength={999}
            minLength={0}
            readOnly
            value={coreStyle ?? ''}
          />
        </div>
      )}
    </div>
  );
}
