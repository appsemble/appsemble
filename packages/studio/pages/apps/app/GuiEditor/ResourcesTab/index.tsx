import { type ResourceDefinition } from '@appsemble/lang-sdk';
import {
  Button,
  CheckboxField,
  Form,
  FormButtons,
  Icon,
  InputField,
  Select,
  SelectField,
  useBeforeUnload,
  useConfirmation,
  useSideMenuState,
  useToggle,
} from '@appsemble/react-components';
import { randomString } from '@appsemble/web-utils';
import classNames from 'classnames';
import equal from 'fast-deep-equal';
import {
  type ChangeEvent,
  type MutableRefObject,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { type Document, type Node, type ParsedNode } from 'yaml';

import { ERD } from './ERD/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';
import { useFullscreenContext } from '../../../../../components/FullscreenProvider/index.js';
import { useApp } from '../../index.js';
import { IndexPage } from '../../resources/resource/IndexPage/index.js';
import { ResourceDefinitionDetailsPage } from '../../resources/resource/resource-definition-details/index.js';
import { ResourceDetailsPage } from '../../resources/resource/resource-details/index.js';
import { Sidebar } from '../Components/Sidebar/index.js';

type ResourcePropertyTabTypes = 'fields' | 'properties' | 'security';

interface ResourcePropertyTabs {
  tabName: ResourcePropertyTabTypes;
  title: string;
  icon: string;
}

interface ResourcesTabProps {
  readonly addIn: (path: Iterable<unknown>, value: Node) => void;
  readonly changeIn: (path: Iterable<unknown>, value: Node) => void;
  readonly deleteIn: (path: Iterable<unknown>) => void;
  readonly docRef: MutableRefObject<Document<ParsedNode>>;
  readonly handleSave: () => void;
  readonly isOpenLeft: boolean;
  readonly isOpenRight: boolean;
  readonly isShowingDefinition: boolean;
  readonly isShowingDetails: boolean;
  readonly saveStack: Document<ParsedNode, true>;
  readonly showResourceDefinition: () => void;
  readonly showResourceDetails: () => void;
  readonly toggleRightPanel: () => void;
  readonly goBack: () => void;
}

interface Field {
  type: 'array' | 'boolean' | 'integer' | 'number' | 'relationship' | 'string';
  fieldName: string;
  title?: string;
  description?: string;
  required?: boolean;
  default?: number | string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  multipleOf?: number;
  relationship?: string;
  [key: string]: any;
}

interface FormValues {
  resourceName: string;
  fields: Field[];
  roles?: string[];
  expires?: string;
  clonable?: boolean;
  [key: string]: any;
}

export function ResourcesTab({
  addIn,
  changeIn,
  deleteIn,
  docRef,
  goBack,
  handleSave,
  isOpenLeft,
  isOpenRight,
  isShowingDefinition,
  isShowingDetails,
  saveStack,
  showResourceDefinition,
  showResourceDetails,
  toggleRightPanel,
}: ResourcesTabProps): ReactNode {
  const { formatMessage } = useIntl();
  const { app } = useApp();
  const [selectedResource, setSelectedResource] = useState<number>(0);
  const [resourceToConfirm, setResourceToConfirm] = useState<number>(-1);
  const [resourceId, setResourceId] = useState<string>('');
  const [lastSelectedResource, setLastSelectedResource] = useState<number>(0);
  const [currentTab, setCurrentTab] = useState<ResourcePropertyTabTypes>('fields');
  const { fullscreen } = useFullscreenContext();
  const resourceNames = useMemo(
    () => (app?.definition?.resources && Object.keys(app.definition?.resources)) ?? [],
    [app?.definition?.resources],
  );
  const [formValues, setFormValues] = useState<FormValues>({
    resourceName: '',
    fields: [],
  });
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [shouldClose, setShouldClose] = useState<boolean>(false);
  const [shouldSave, setShouldSave] = useState<boolean>(false);
  const [shouldDelete, setShouldDelete] = useState<boolean>(false);
  const [toCreate, setToCreate] = useState<boolean>(false);
  const [toUpdate, setToUpdate] = useState<boolean>(false);
  const [fromSelection, setFromSelection] = useState<boolean>(false);
  const [originalFormValues, setOriginalFormValues] = useState<FormValues>();

  const [callUnsavedChanges, setCallUnsavedChanges] = useState(false);
  const [callCancelCreate, setCallCancelCreate] = useState(false);
  const [callResetCreate, setCallResetCreate] = useState(false);

  // TODO investigate custom roles: const [resourceRoles, setResourceRoles] = useState<string[]>([])
  const [multipleSelect, setMultipleSelect] = useState<string[]>([]);
  const { isOpen: isOpenSidemenu } = useSideMenuState();
  const showErd = useToggle();
  const tabs: ResourcePropertyTabs[] = [
    {
      title: formatMessage(messages.fields),
      tabName: 'fields',
      icon: 'fas fa-table',
    },
    {
      title: formatMessage(messages.security),
      tabName: 'security',
      icon: 'fa-solid fa-lock',
    },
    {
      title: formatMessage(messages.properties),
      tabName: 'properties',
      icon: 'fas fa-sliders',
    },
  ];

  const resetForm = useCallback((): void => {
    setMultipleSelect([]);
    setFormValues({ resourceName: '', fields: [] });
    setCurrentTab('fields');
    setOriginalFormValues({ resourceName: '', fields: [] });
    setIsUpdating(false);
    setShouldClose(false);
    setIsCreating(false);
    setFromSelection(false);
  }, []);

  const extractOriginalFormValues = useCallback(
    (selection?: number) => {
      const resourceIndex: number =
        selection ?? (selectedResource > -1 ? selectedResource : lastSelectedResource);
      const currentResource = app?.definition?.resources[resourceNames[resourceIndex]];
      const originalFields: Field[] = [];
      const resourceProperties = Object.entries(currentResource.schema.properties);
      for (const [resourcePropertyName, property] of resourceProperties) {
        if ('type' in property) {
          // TODO: doesn't handle ReferenceObject, only SchemaObject
          originalFields.push({
            fieldName: resourcePropertyName,
            type: property.type as 'array' | 'boolean' | 'integer' | 'number' | 'string',
            title: property.title,
            description: property.description,
            required:
              currentResource.schema.required &&
              currentResource.schema.required.includes(resourcePropertyName),
            default: property.default,
            maxLength: property.maxLength,
            minLength: property.minLength,
            pattern: property.pattern,
            minimum: property.minimum,
            maximum: property.maximum,
            multipleOf: property.multipleOf,
          });
        }
      }

      // Adding all the relationship fields.
      if (currentResource?.references) {
        for (const [fieldname, resourceReference] of Object.entries(currentResource.references)) {
          originalFields.push({
            type: 'relationship',
            fieldName: fieldname,
            relationship: resourceReference.resource,
          });
        }
      }

      const extractedFormValues = {
        resourceName: resourceNames[resourceIndex],
        expires: currentResource.expires,
        clonable: currentResource.clonable,
        fields: originalFields,
      } as FormValues;

      setOriginalFormValues(extractedFormValues);
    },
    [app?.definition?.resources, lastSelectedResource, resourceNames, selectedResource],
  );

  const triggerShowDetails = (passedResourceId: string): void => {
    setResourceId(passedResourceId);
    showResourceDetails();
  };

  const onClose = useCallback((): void => {
    const handleNoChanges = (): void => {
      if (isOpenRight) {
        toggleRightPanel();
      }
      resetForm();
    };

    const handleShouldSave = (): void => {
      setSelectedResource(0);
      setShouldSave(false);
    };

    const handleUpdate = (): void => {
      if (shouldSave) {
        handleShouldSave();
      }
      if (equal(originalFormValues, formValues)) {
        handleNoChanges();
      } else {
        setCallUnsavedChanges(true);
      }
    };

    const handleCreate = (): void => {
      if (equal(originalFormValues, formValues)) {
        handleNoChanges();
        if (!showErd.enabled && !fromSelection) {
          setSelectedResource(lastSelectedResource);
        }
        if (shouldSave) {
          handleShouldSave();
        }
      } else {
        setCallCancelCreate(true);
        setShouldClose(false);
      }
    };

    if (isUpdating) {
      handleUpdate();
      return;
    }

    if (isCreating) {
      handleCreate();
      return;
    }

    if (isOpenRight) {
      toggleRightPanel();
    }

    setShouldSave(false);
    setShouldClose(false);
    setSelectedResource(lastSelectedResource);
  }, [
    isUpdating,
    isCreating,
    shouldSave,
    originalFormValues,
    formValues,
    isOpenRight,
    toggleRightPanel,
    showErd.enabled,
    fromSelection,
    lastSelectedResource,
    resetForm,
  ]);

  // To handle on close
  useEffect(() => {
    // If onClose should be called
    if (shouldClose) {
      onClose();
    }
  }, [onClose, shouldClose]);

  const setCreateResource = useCallback((): void => {
    resetForm();
    if (selectedResource > -1) {
      setLastSelectedResource(selectedResource);
    }

    setSelectedResource(-1);

    setCallUnsavedChanges(false);
    setIsCreating(true);

    if (!isOpenRight) {
      toggleRightPanel();
    }
    setToCreate(false);
  }, [isOpenRight, selectedResource, toggleRightPanel, resetForm]);

  const setUpdateResource = useCallback((): void => {
    resetForm();
    setToUpdate(false);
    setIsUpdating(true);

    const resourceIndex: number =
      resourceToConfirm > -1
        ? resourceToConfirm
        : selectedResource > -1
          ? selectedResource
          : lastSelectedResource;
    const currentResource = app?.definition?.resources[resourceNames[resourceIndex]];

    const newFields: Field[] = [];

    const resourceProperties = Object.keys(currentResource.schema.properties);
    resourceProperties.map((resourcePropertyName) => {
      const property = currentResource.schema.properties[resourcePropertyName];

      if ('type' in property) {
        // TODO: doesn't handle ReferenceObject, only SchemaObject
        newFields.push({
          fieldName: resourcePropertyName,
          type: property.type as 'array' | 'boolean' | 'integer' | 'number' | 'string',
          title: property.title,
          description: property.description,
          required:
            currentResource.schema.required &&
            currentResource.schema.required.includes(resourcePropertyName),
          default: property.default,
          maxLength: property.maxLength,
          minLength: property.minLength,
          pattern: property.pattern,
          minimum: property.minimum,
          maximum: property.maximum,
          multipleOf: property.multipleOf,
        });
      }
    });

    // Adding all the relationship fields.
    if (currentResource?.references) {
      for (const [fieldname, resourceReference] of Object.entries(currentResource.references)) {
        newFields.push({
          type: 'relationship',
          fieldName: fieldname,
          relationship: resourceReference.resource,
        });
      }
    }

    const newFormValues = {
      resourceName: resourceNames[resourceIndex],
      expires: currentResource.expires,
      clonable: currentResource.clonable,
      fields: newFields,
    } as FormValues;

    extractOriginalFormValues(resourceIndex);
    setFormValues(newFormValues);

    if (resourceToConfirm > -1) {
      setResourceToConfirm(-1);
    }
    setCallUnsavedChanges(false);
    if (!isOpenRight) {
      toggleRightPanel();
    }
  }, [
    app?.definition?.resources,
    extractOriginalFormValues,
    isOpenRight,
    lastSelectedResource,
    resourceNames,
    resourceToConfirm,
    selectedResource,
    toggleRightPanel,
    resetForm,
  ]);

  const createOrUpdateResource = useCallback((): void => {
    const newResource: ResourceDefinition = {
      schema: {
        type: 'object',
        additionalProperties: false,
        required: [],
        properties: {},
      },
      references: {},
    };

    if (formValues.clonable) {
      newResource.clonable = formValues.clonable;
    }

    const mapField = (field: Field): void => {
      const {
        default: defaultValue,
        description,
        fieldName,
        maxLength,
        maximum,
        minLength,
        minimum,
        multipleOf,
        pattern,
        relationship,
        required,
        title,
        type,
      } = field;

      if (required) {
        newResource.schema.required.push(fieldName);
      }
      newResource.schema.properties[fieldName] = {
        type:
          type === 'relationship'
            ? 'number'
            : (type as 'boolean' | 'integer' | 'number' | 'string'),
        ...(title && { title }),
        ...(description && { description }),
        ...(defaultValue && { default: defaultValue }),
        ...(maximum && { maximum }),
        ...(minimum && { minimum }),
        ...(maxLength && { maxLength }),
        ...(minLength && { minLength }),
        ...(pattern && { pattern }),
        ...(multipleOf && { multipleOf }),
      };

      if (type === 'relationship') {
        newResource.references[fieldName] = { resource: relationship };
      }
    };

    // eslint-disable-next-line unicorn/no-array-for-each
    formValues.fields.forEach(mapField);

    if (newResource.schema.required.length === 0) {
      delete newResource.schema.required;
    }
    if (Object.keys(newResource.references).length === 0) {
      delete newResource.references;
    }

    const doc = docRef.current;
    const newResourceNode = doc.createNode(newResource);

    if (isUpdating) {
      if (resourceNames[selectedResource] === formValues.resourceName) {
        changeIn(['resources', resourceNames[selectedResource]], newResourceNode);
      } else {
        deleteIn(['resources', resourceNames[selectedResource]]);
        addIn(['resources', formValues.resourceName], newResourceNode);
      }
      resetForm();
    }
    if (isCreating) {
      addIn(['resources', formValues.resourceName], newResourceNode);
      resetForm();
    }

    setShouldSave(true);
  }, [
    addIn,
    changeIn,
    deleteIn,
    docRef,
    formValues.clonable,
    formValues.fields,
    formValues.resourceName,
    isCreating,
    isUpdating,
    resetForm,
    resourceNames,
    selectedResource,
  ]);

  const onUpdateResource = useConfirmation({
    title: formatMessage(messages.updateWarning),
    body: formatMessage(messages.UpdateWarningMessage, {
      resourceName: resourceNames[selectedResource],
    }),
    cancelLabel: formatMessage(messages.cancel),
    confirmLabel: formatMessage(messages.update),
    action: createOrUpdateResource,
  });

  const handleConfirmResetCreate = (): void => {
    resetForm();
    setCallResetCreate(false);
  };

  const onResetCreate = useConfirmation({
    title: formatMessage(messages.cancelCreateWarningTitle),
    body: formatMessage(messages.cancelCreateWarningMessage),
    cancelLabel: formatMessage(messages.cancelChoice),
    confirmLabel: formatMessage(messages.confirmChoice),
    action: handleConfirmResetCreate,
  });

  const handleConfirmCancelCreate = (): void => {
    resetForm();
    setCallCancelCreate(false);
    // If this is called due to resource selection
    if (resourceToConfirm > -1) {
      setSelectedResource(resourceToConfirm);
      setResourceToConfirm(-1);
      showErd.disable();
      if (isOpenRight) {
        toggleRightPanel();
      }
      return;
    }
    // If this is called by on close

    // Select the last selected resource if the ERD is disabled
    if (!showErd.enabled) {
      setSelectedResource(lastSelectedResource);
    }
    if (isOpenRight) {
      toggleRightPanel();
    }
  };

  const onCancelCreate = useConfirmation({
    title: formatMessage(messages.cancelCreateWarningTitle),
    body: formatMessage(messages.cancelCreateWarningMessage),
    cancelLabel: formatMessage(messages.cancelChoice),
    confirmLabel: formatMessage(messages.confirmChoice),
    action: handleConfirmCancelCreate,
  });

  const handleConfirmCancelUpdate = (): void => {
    // If this is triggered by another resource selection
    if (resourceToConfirm > -1) {
      if (selectedResource > -1) {
        setLastSelectedResource(selectedResource);
      }
      setSelectedResource(resourceToConfirm);
      setResourceToConfirm(-1);
      setUpdateResource();
      showErd.disable();
      return;
    }

    // If this is triggered by resource creation
    if (toCreate) {
      setCreateResource();
      if (showResourceDefinition || showResourceDetails) {
        goBack();
      }
      return;
    }

    // If triggered by 'update' button
    if (selectedResource > -1 && !shouldClose) {
      setUpdateResource();
      return;
    }

    if (!(selectedResource > -1)) {
      setSelectedResource(lastSelectedResource);
    }

    resetForm();
    setCallUnsavedChanges(false);
  };
  const onUnsavedChanges = useConfirmation({
    title: formatMessage(messages.unsavedUpdateChangesWarningTitle),
    body: formatMessage(messages.unsavedUpdateChangesWarningMessage, {
      resourceName: resourceNames[selectedResource],
    }),
    cancelLabel: formatMessage(messages.cancelChoice),
    confirmLabel: formatMessage(messages.confirmChoice),
    action: handleConfirmCancelUpdate,
  });

  useEffect(() => {
    if (callUnsavedChanges) {
      onUnsavedChanges();
      setCallUnsavedChanges(false);
      if (resourceToConfirm > -1) {
        setResourceToConfirm(-1);
      }
      setShouldClose(false);
    }
    if (callCancelCreate) {
      onCancelCreate();
      setCallCancelCreate(false);
    }
    if (callResetCreate) {
      onResetCreate();
      setCallResetCreate(false);
    }
  }, [
    callCancelCreate,
    callResetCreate,
    callUnsavedChanges,
    onCancelCreate,
    onResetCreate,
    onUnsavedChanges,
    resourceToConfirm,
    shouldClose,
  ]);

  // To handle set create
  useEffect(() => {
    const handleUpdateScenario = (): void => {
      if (equal(originalFormValues, formValues)) {
        setCreateResource();
      } else {
        setCallUnsavedChanges(true);
        setToCreate(false);
      }
      if (showResourceDefinition || showResourceDetails) {
        goBack();
      }
    };

    const handleCreateScenario = (): void => {
      if (equal(originalFormValues, formValues)) {
        resetForm();
      } else {
        setCallResetCreate(true);
      }
      if (showResourceDefinition || showResourceDetails) {
        goBack();
      }
      setToCreate(false);
    };

    if (toCreate) {
      if (isUpdating) {
        handleUpdateScenario();
        return;
      }

      if (isCreating) {
        handleCreateScenario();
        return;
      }

      if (showResourceDefinition || showResourceDetails) {
        goBack();
      }
      setCreateResource();
    }
  }, [
    formValues,
    goBack,
    isCreating,
    isUpdating,
    originalFormValues,
    setCreateResource,
    showResourceDefinition,
    showResourceDetails,
    toCreate,
    resetForm,
  ]);

  useEffect(() => {
    if (toUpdate) {
      if (isUpdating) {
        if (equal(originalFormValues, formValues)) {
          setUpdateResource();
        } else {
          setCallUnsavedChanges(true);
          setToUpdate(false);
        }
        return;
      }
      setUpdateResource();
    }
  }, [formValues, isCreating, isUpdating, originalFormValues, setUpdateResource, toUpdate]);

  useEffect(() => {
    if (resourceToConfirm > -1) {
      if (isUpdating) {
        setCallUnsavedChanges(true);
      }
      if (isCreating) {
        setCallCancelCreate(true);
      }
    }
  }, [isCreating, isUpdating, resourceToConfirm]);

  const onNewField = (e: ChangeEvent<HTMLSelectElement>): void => {
    const eventVar = e;
    const fieldType = eventVar.target.value as
      | 'array'
      | 'boolean'
      | 'integer'
      | 'number'
      | 'relationship'
      | 'string';
    const newField: Field = {
      type: fieldType,
      fieldName: '',
    };
    setFormValues((prevFormValues) => ({
      ...prevFormValues,
      fields: [...prevFormValues.fields, newField],
    }));
    eventVar.target.selectedIndex = 0;
  };

  const removeField = (index: number): void => {
    const updatedFields = [
      ...formValues.fields.slice(0, index),
      ...formValues.fields.slice(index + 1),
    ];
    const updatedFormValues = { ...formValues, fields: updatedFields };
    setFormValues(updatedFormValues);
  };

  const onChange = (propertyName: keyof FormValues) => (event: ChangeEvent<HTMLInputElement>) => {
    setFormValues((prevFormValues) => ({
      ...prevFormValues,
      [propertyName]: event.target.type === 'checkbox' ? event.target.checked : event.target.value,
    }));
  };

  const createFieldChangeHandler =
    (index: number) =>
    (fieldName: string) =>
    (event: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLSelectElement>) => {
      const updatedFields = [...formValues.fields];
      let fieldValue: boolean | number | string;

      if (event.target.type === 'checkbox') {
        fieldValue = (event.target as HTMLInputElement).checked;
      } else if (event.target.type === 'number') {
        fieldValue = Number.parseInt(event.target.value);
      } else {
        fieldValue = event.target.value;
      }

      updatedFields[index][fieldName] = fieldValue;
      const updatedFormValues = { ...formValues, fields: updatedFields };
      setFormValues(updatedFormValues);
    };

  function handleMultipleSelectChange({ currentTarget }: ChangeEvent<HTMLSelectElement>): void {
    const selectedValue = currentTarget.value;
    setMultipleSelect((prevValue?: string[]) => {
      if (prevValue === undefined) {
        return [selectedValue];
      }
      if (prevValue?.includes(selectedValue)) {
        return prevValue.filter((value) => value !== selectedValue);
      }
      return [...prevValue, selectedValue];
    });
  }

  const handleResourceSelection = (index: number): void => {
    const handleUpdateScenario = (): void => {
      if (equal(originalFormValues, formValues)) {
        if (index === selectedResource) {
          setLastSelectedResource(selectedResource);
          setUpdateResource();
        } else {
          if (selectedResource > -1) {
            setLastSelectedResource(selectedResource);
          }
          setSelectedResource(index);
          setToUpdate(true);
          showErd.disable();
        }
      } else {
        setResourceToConfirm(index);
      }
    };

    const handleCreateScenario = (): void => {
      setFromSelection(true);
      if (equal(originalFormValues, formValues)) {
        showErd.disable();
        setSelectedResource(index);
        setShouldClose(true);
      } else {
        setResourceToConfirm(index);
      }
    };

    if (isUpdating) {
      handleUpdateScenario();
      return;
    }

    if (isCreating) {
      handleCreateScenario();
      return;
    }

    // Default scenario when neither updating nor creating
    showErd.disable();
    if (selectedResource > -1) {
      setLastSelectedResource(selectedResource);
    }
    setSelectedResource(index);
  };

  const onConfirmDeleteResource = useCallback(() => {
    deleteIn(['resources', resourceNames[selectedResource]]);
    setShouldSave(true);
  }, [deleteIn, resourceNames, selectedResource]);

  const onDeleteResource = useConfirmation({
    title: formatMessage(messages.deletionWarning),
    body: formatMessage(messages.deletionWarningMessage, {
      resourceName: resourceNames[selectedResource],
    }),
    cancelLabel: formatMessage(messages.cancel),
    confirmLabel: formatMessage(messages.delete),
    action: onConfirmDeleteResource,
  });

  function handleErdButtonClick(): void {
    if (showErd.enabled) {
      if ((!isCreating && !isUpdating) || isUpdating) {
        setSelectedResource(lastSelectedResource);
      }
      showErd.disable();
    } else {
      if (selectedResource > -1) {
        setLastSelectedResource(selectedResource);
      }
      setSelectedResource(-1);
      showErd.enable();
    }
  }

  // To handle saving
  useEffect(() => {
    if (shouldSave) {
      setSelectedResource(0);

      handleSave();
      setShouldDelete(false);
      setShouldClose(true);
    }
  }, [
    saveStack,
    shouldSave,
    handleSave,
    isUpdating,
    isCreating,
    resourceNames.length,
    shouldDelete,
  ]);

  useEffect(() => {
    if (shouldDelete) {
      onDeleteResource();
      setShouldDelete(false);
    }
  }, [onDeleteResource, shouldDelete]);

  useBeforeUnload(!equal(originalFormValues, formValues));

  return (
    <>
      <Sidebar isOpen={isOpenLeft} type="left">
        {resourceNames.map((resource: string, resourceIndex: number) => (
          <div key={resource}>
            {isShowingDetails ? (
              <Button
                className={classNames(styles.leftBarButton, {
                  'is-link': selectedResource === resourceIndex,
                })}
                disabled={!(selectedResource === resourceIndex && isShowingDetails)}
                onClick={() => handleResourceSelection(resourceIndex)}
              >
                {resource}
              </Button>
            ) : (
              <Button
                className={classNames(styles.leftBarButton, {
                  'is-link': selectedResource === resourceIndex,
                })}
                onClick={() => handleResourceSelection(resourceIndex)}
              >
                {resource}
              </Button>
            )}
          </div>
        ))}
        <Button className={styles.addNewElement} onClick={() => setToCreate(true)}>
          <Icon className="mx-2" icon="plus" />
          {formatMessage(messages.createNewResource)}
        </Button>
        <Button
          className={classNames(styles.erdButton, {
            'is-primary': !showErd.enabled,
            'is-danger is-light': showErd.enabled,
          })}
          onClick={() => handleErdButtonClick()}
        >
          <Icon className="mr-2" icon="diagram-project" />
          {formatMessage(showErd.enabled ? messages.closeErd : messages.openErd)}
        </Button>
      </Sidebar>
      <div
        className={classNames(`${styles.root} p-3`, {
          [String(styles.fullscreen)]: fullscreen.enabled,
          [String(styles.shouldOverflow)]: isShowingDefinition || isShowingDetails,
        })}
      >
        {resourceNames[selectedResource] && !showErd.enabled ? (
          <div
            className={classNames(styles.wrappedIndexPage, styles.responsive, {
              [styles.withSidemenu]: isOpenSidemenu,
              [styles.withLeftPanel]: isOpenLeft,
              [styles.withRightPanel]: isOpenRight,
            })}
          >
            <div
              className={classNames(styles.buttonContainer, {
                [styles.definition]: isShowingDefinition,
                [styles.details]: isShowingDetails,
              })}
            >
              {isShowingDetails || isShowingDefinition ? null : (
                <>
                  <Button
                    className="is-primary mr-1 mb-2"
                    icon="cog"
                    onClick={() => setToUpdate(true)}
                  >
                    {formatMessage(messages.update)}
                  </Button>
                  <Button
                    className="ml-1 mr-1 mb-2"
                    color="danger"
                    icon="trash-alt"
                    onClick={() => setShouldDelete(true)}
                  >
                    {formatMessage(messages.delete)}
                  </Button>
                </>
              )}
            </div>
            {isShowingDefinition ? (
              <ResourceDefinitionDetailsPage guiResourceName={resourceNames[selectedResource]} />
            ) : isShowingDetails ? (
              <ResourceDetailsPage
                guiResourceId={resourceId}
                guiResourceName={resourceNames[selectedResource]}
              />
            ) : (
              <IndexPage
                isInGui
                providedResourceName={resourceNames[selectedResource]}
                rootClassName={styles.indexPage}
                showResourceDefinition={showResourceDefinition}
                tableDivClassName={styles.tableDiv}
                triggerShowDetails={triggerShowDetails}
              />
            )}
          </div>
        ) : showErd.enabled ? (
          // eslint-disable-next-line react/jsx-pascal-case
          <ERD
            className={classNames(styles.erd, styles.responsive, {
              [styles.withSidemenu]: isOpenSidemenu,
              [styles.withLeftPanel]: isOpenLeft,
              [styles.withRightPanel]: isOpenRight,
            })}
          />
        ) : null}
      </div>
      <Sidebar isOpen={isOpenRight} type="right">
        {isUpdating || isCreating ? (
          <div>
            <div className={`tabs is-toggle mx-2 mb-0 mt-2 ${styles.editorNavBar}`}>
              <ul className="is-justify-content-space-between">
                {tabs.map((tab) => (
                  <li key={tab.tabName}>
                    <Button
                      className={classNames('tabs is-toggle pr-2 m-2', {
                        'is-link': currentTab === tab.tabName,
                      })}
                      onClick={() => {
                        setCurrentTab(tab.tabName);
                      }}
                    >
                      <span className="icon tab-btn-icon">
                        <i aria-hidden="true" className={tab.icon} />
                      </span>
                      <span className="tab-btn-text">{tab.title}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
            <div
              className={`tags has-addons is-flex is-fullwidth is-justify-content-flex-start mx-0 mt-2 mb-0 pl-2 ${styles.tagDiv}`}
            >
              <span className="tag is-info is-medium">
                <FormattedMessage
                  {...(isUpdating ? messages.updatingResource : messages.creatingResource)}
                />
              </span>
              {/* eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
              <a
                className={`tag is-medium is-delete ${styles.closeTag}`}
                onClick={() => setShouldClose(true)}
              />
            </div>
            <div className={classNames(`${styles.rightBar} ${styles.propsList}`)}>
              <Form onSubmit={isUpdating ? onUpdateResource : createOrUpdateResource}>
                {currentTab === 'fields' ? (
                  <div>
                    <InputField
                      help={formatMessage(messages.resourceNameHelp)}
                      label={formatMessage(messages.resourceName)}
                      onChange={onChange('resourceName')}
                      placeholder={formatMessage(messages.resourceName)}
                      required
                      value={formValues.resourceName}
                    />
                    <div>
                      <p title={formatMessage(messages.systemFieldMessage)}>
                        System fields:
                        <span className={styles.highlight}>Id</span>,
                        <span className={styles.highlight}>Author</span>,
                        <span className={styles.highlight}>Created</span>,
                        <span className={styles.highlight}>Updated</span>
                      </p>
                    </div>
                    {formValues.fields.map((field, index) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <div className={styles.elementRoot} key={index}>
                        {/* eslint-disable-next-line @typescript-eslint/no-use-before-define */}
                        <FormField field={field} onChange={createFieldChangeHandler(index)} />
                        <Button
                          color="danger"
                          icon="square-minus"
                          iconSize="medium"
                          onClick={() => removeField(index)}
                        >
                          {formatMessage(messages.removeField)}
                        </Button>
                      </div>
                    ))}
                    <div>
                      <label className={styles.selectLabel}>
                        {formatMessage(messages.newField)}
                      </label>
                      <Select
                        onChange={onNewField}
                        value={formatMessage(messages.defaultValueSelect)}
                      >
                        <option disabled>{formatMessage(messages.defaultValueSelect)}</option>
                        {/* <option value='array' title='An array is a series of values'>Array</option> */}
                        {/* Not sure how arrays work */}
                        <option title={formatMessage(messages.booleanInfo)} value="boolean">
                          Boolean
                        </option>
                        <option title={formatMessage(messages.integerInfo)} value="integer">
                          Integer
                        </option>
                        <option title={formatMessage(messages.numberInfo)} value="number">
                          Number
                        </option>
                        <option title={formatMessage(messages.stringInfo)} value="string">
                          String
                        </option>
                        <option disabled={resourceNames.length === 0} title="" value="relationship">
                          {formatMessage(messages.relationship)}
                        </option>
                      </Select>
                    </div>
                  </div>
                ) : null}
                {currentTab === 'security' ? (
                  <div>
                    <SelectField
                      help={formatMessage(messages.roleInfo)}
                      label={formatMessage(messages.roles)}
                      multiple
                      name="roles"
                      onChange={(e) => handleMultipleSelectChange(e)}
                      value={multipleSelect}
                    >
                      <option title={formatMessage(messages.noneRoleInfo)} value="$none">
                        None
                      </option>
                      <option title={formatMessage(messages.publicRoleInfo)} value="$public">
                        Public
                      </option>
                      <option title={formatMessage(messages.authorRoleInfo)} value="$author">
                        Author
                      </option>
                      <option
                        title={formatMessage(messages.groupMemberRoleInfo)}
                        value="$group:member"
                      >
                        group:member
                      </option>
                      <option
                        title={formatMessage(messages.groupManagerRoleInfo)}
                        value="$group:manager"
                      >
                        group:manager
                      </option>
                      {/* {resourceRoles?.map((role: string) => {
                        const formattedRole = formatRoleString(role);
                        return (
                          <option
                            key={role}
                            value={`$${role}`}
                            title={formatMessage(messages[formattedRole as keyof typeof messages])}
                          >
                            {role}
                          </option>
                        );
                      })} */}
                    </SelectField>
                  </div>
                ) : null}
                {currentTab === 'properties' ? (
                  <div>
                    {/* No validation for the input format */}
                    <InputField
                      help={formatMessage(messages.expiresInfo)}
                      label={formatMessage(messages.expires)}
                      onChange={onChange('expires')}
                      placeholder="1d 8h 30m"
                      value={formValues.expires}
                    />
                    <CheckboxField
                      label={formatMessage(messages.clonable)}
                      name="clonable"
                      onChange={onChange('clonable')}
                      value={formValues.clonable}
                    />
                    <p>{formatMessage(messages.futureUpdateInfo)}</p>
                  </div>
                ) : null}
                <FormButtons className={styles.FormButtons}>
                  <Button color="danger" onClick={() => setShouldClose(true)}>
                    {formatMessage(messages.cancel)}
                  </Button>
                  <Button color="primary" type="submit">
                    {isUpdating ? formatMessage(messages.update) : formatMessage(messages.create)}
                  </Button>
                </FormButtons>
              </Form>
            </div>
          </div>
        ) : null}
      </Sidebar>
    </>
  );
}

function FormField({
  field,
  onChange,
}: {
  readonly field: Field;
  readonly onChange: (
    propertyName: string,
  ) => (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLSelectElement>) => void;
}): ReactNode {
  const { formatMessage } = useIntl();
  const { app } = useApp();
  const resourceNames =
    (app?.definition?.resources && Object.keys(app.definition?.resources)) ?? [];
  const fieldPropsToggle = useToggle();

  const renderFieldProperties = (): ReactNode => (
    <div className={`${styles.elementRoot} px-3 py-3 my-2 mx-0`}>
      {field.type === 'string' && (
        <>
          <InputField
            label={formatMessage(messages.maximumLenght)}
            min={1}
            onChange={onChange('maxLength')}
            step={1}
            type="number"
            value={field.maxLength}
          />
          <InputField
            label={formatMessage(messages.minimumLenght)}
            min={0}
            onChange={onChange('minLength')}
            step={1}
            type="number"
            value={field.minLength}
          />
        </>
      )}
      {(field.type === 'number' || field.type === 'integer') && (
        <>
          {/* This doesn't work with decimal steps? */}
          <InputField
            label={formatMessage(messages.maximum)}
            onChange={onChange('maximum')}
            step={1}
            type="number"
            value={field.maximum}
          />
          <InputField
            label={formatMessage(messages.minimum)}
            onChange={onChange('minimum')}
            step={1}
            type="number"
            value={field.minimum}
          />
        </>
      )}
      <CheckboxField
        label={formatMessage(messages.required)}
        name={`${randomString(3)}${field.fieldName}`}
        onChange={onChange('required')}
        value={field.required}
      />
    </div>
  );

  return (
    <div>
      <InputField
        label={field.type}
        onChange={onChange('fieldName')}
        placeholder={formatMessage(messages.fieldName)}
        required
        type="text"
        value={field.fieldName}
      />
      {field.type === 'relationship' && (
        <SelectField
          defaultValue={formatMessage(messages.selectRelatedResource)}
          label={formatMessage(messages.relatedResource)}
          onChange={(e) => onChange('relationship')(e)}
          required
        >
          <option disabled>{formatMessage(messages.selectRelatedResource)}</option>
          {resourceNames.map((name: string) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </SelectField>
      )}
      <Button
        className={classNames({ 'mb-2': !fieldPropsToggle.enabled })}
        color="primary"
        icon={fieldPropsToggle.enabled ? 'chevron-up' : 'chevron-down'}
        onClick={fieldPropsToggle.toggle}
      >
        {formatMessage(messages.fieldProperties)}
      </Button>
      {fieldPropsToggle.enabled ? renderFieldProperties() : null}
    </div>
  );
}
