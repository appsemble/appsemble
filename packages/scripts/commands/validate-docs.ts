import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

import { AppsembleError, authenticate, logger, opendirSafe } from '@appsemble/node-utils';
import {
  type ActionDefinition,
  type AppDefinition,
  type BasicPageDefinition,
  type BlockDefinition,
  type ControllerDefinition,
  type CronDefinition,
  type LinkActionDefinition,
  type ResourceActionDefinition,
  type ResourceDefinition,
  type UserPropertyDefinition,
} from '@appsemble/types';
import axios from 'axios';
import FormData from 'form-data';
import { type Code, type Root } from 'mdast';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { parse, stringify } from 'yaml';
import { type Argv } from 'yargs';

import pkg from '../package.json' assert { type: 'json' };

export const command = 'validate-docs';
export const description = 'Validate all app definition code blocks in docs are valid';

export function builder(argv: Argv): Argv<any> {
  return argv
    .option('organization', {
      type: 'string',
      description: 'The id of the organization to which the apps belong to',
    })
    .option('remote', {
      type: 'string',
      description: 'The remote to validate docs onto',
    });
}

interface Args {
  organization: string;
  remote: string;
}

const snippetTypes = {
  resources: 'resources-snippet',
  page: 'page-snippet',
  pages: 'pages-snippet',
  block: 'block-snippet',
  blocks: 'blocks-snippet',
  cron: 'cron-snippet',
  controller: 'controller-snippet',
  security: 'security-snippet',
  users: 'users-snippet',
};

type SnippetType = keyof typeof snippetTypes;

interface SnippetInfo {
  type: SnippetType;
  yaml: string;
  line: number;
}

interface AppDefinitionWithLocation {
  location: string;
  appDefinition: AppDefinition;
}

function appendRoleToTemplate(role: string, template: AppDefinition): AppDefinition {
  const updatedTemplate = template;

  updatedTemplate.security = {
    default: updatedTemplate.security?.default ?? {
      role,
    },
    roles: {
      ...updatedTemplate.security?.roles,
      [role]: {
        description: 'Description',
      },
    },
  };

  return updatedTemplate;
}

function appendResourcesToTemplate(
  resources: Record<string, ResourceDefinition>,
  template: AppDefinition,
): AppDefinition {
  const updatedTemplate = template;

  updatedTemplate.resources = template.resources
    ? {
        ...template.resources,
        [Object.keys(resources)[0]]: Object.values(resources)[0],
      }
    : resources;

  for (const resourceDefinition of Object.values(updatedTemplate.resources)) {
    for (const [, value] of Object.entries(resourceDefinition)) {
      for (const role of value.roles ?? []) {
        appendRoleToTemplate(role, updatedTemplate);
      }

      const to = value.hooks?.notification?.to;

      if (to) {
        if (typeof to === 'string') {
          appendRoleToTemplate(to, updatedTemplate);
        } else {
          for (const role of to) {
            appendRoleToTemplate(role, updatedTemplate);
          }
        }
      }
    }
  }

  return updatedTemplate;
}

function appendBlockToTemplate(block: BlockDefinition, template: AppDefinition): AppDefinition {
  const updatedTemplate = template;
  const supportPageName = 'Blocks Container';

  if (!template.pages.some((page) => page.name === supportPageName)) {
    updatedTemplate.pages.push({
      name: supportPageName,
      blocks: [],
    });
  }

  updatedTemplate.defaultPage = supportPageName;

  (updatedTemplate.pages as BasicPageDefinition[])
    .find((page) => page.name === supportPageName)
    .blocks.push(block);

  if (block.actions) {
    const supportBlock: BlockDefinition = {
      type: block.type,
      version: block.version,
      parameters: block.parameters,
    };

    const blockLinkActionDefinition = Object.values(block.actions).find(
      (value: ActionDefinition) => value.type === 'link',
    ) as LinkActionDefinition;

    if (blockLinkActionDefinition && typeof blockLinkActionDefinition.to === 'string') {
      updatedTemplate.pages.push({
        name: blockLinkActionDefinition.to,
        blocks: [supportBlock],
      });
    }

    const blockOnSuccessActionDefinition = Object.values(block.actions).find(
      (value: ActionDefinition) => value.onSuccess?.type === 'link',
    ) as { onSuccess: LinkActionDefinition };

    if (
      blockOnSuccessActionDefinition &&
      typeof blockOnSuccessActionDefinition.onSuccess.to === 'string'
    ) {
      updatedTemplate.pages.push({
        name: blockOnSuccessActionDefinition.onSuccess.to,
        blocks: [supportBlock],
      });
    }

    const blockResourceActionDefinition = Object.values(block.actions).find(
      (value: ActionDefinition) => value.type.startsWith('resource'),
    ) as ResourceActionDefinition<'noop'>;

    if (blockResourceActionDefinition) {
      updatedTemplate.resources = {
        [blockResourceActionDefinition.resource]: {
          roles: ['$public'],
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              property: {
                type: 'string',
              },
            },
          },
        },
      };
    }
  }

  return updatedTemplate;
}

function appendCronToTemplate(
  cron: Record<string, CronDefinition>,
  template: AppDefinition,
): AppDefinition {
  const updatedTemplate = template;

  updatedTemplate.cron = cron;

  const cronAction = Object.values(cron)[0].action as ResourceActionDefinition<'noop'>;

  if (cronAction.type.startsWith('resource')) {
    updatedTemplate.resources = {
      [cronAction.resource]: {
        roles: ['$public'],
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            property: {
              type: 'string',
            },
          },
        },
      },
    };
  }

  return updatedTemplate;
}

function appendControllerToTemplate(
  controller: ControllerDefinition,
  template: AppDefinition,
): AppDefinition {
  const updatedTemplate = template;

  updatedTemplate.controller = controller;

  for (const action of Object.values(controller.actions)) {
    if (action.type.startsWith('resource')) {
      updatedTemplate.resources = {
        [(action as ResourceActionDefinition<'noop'>).resource]: {
          roles: ['$public'],
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              property: {
                type: 'string',
              },
            },
          },
        },
      };
    }
  }

  return updatedTemplate;
}

function appendUsersToTemplate(
  users: {
    properties: Record<string, UserPropertyDefinition>;
  },
  template: AppDefinition,
): AppDefinition {
  const updatedTemplate = template;

  updatedTemplate.users = users;

  for (const propertyDefinition of Object.values(users.properties)) {
    if (propertyDefinition.reference.resource) {
      updatedTemplate.resources = {
        [propertyDefinition.reference.resource]: {
          roles: ['$public'],
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              property: {
                type: 'string',
              },
            },
          },
        },
      };
    }
  }

  return updatedTemplate;
}

async function accumulateAppDefinitions(docsPath: string): Promise<AppDefinitionWithLocation[]> {
  const processor = unified().use(remarkParse);

  const appDefinitionsWithLocations: AppDefinitionWithLocation[] = [];
  const snippetsByFilename: Record<string, SnippetInfo[]> = {};

  await opendirSafe(
    docsPath,
    async (path, stats) => {
      if (stats.isFile() && /^.*\.(md|mdx)$/.test(path)) {
        const file = await readFile(path, 'utf8');
        const ast = processor.parse(file) as Root;

        logger.verbose(`Processing ${path} ⚙️`);

        visit(ast, 'code', (node: Code) => {
          const { meta, position, value } = node;
          const { line } = position.start;

          const filename = basename(path);

          const location = `Code snippet in ${filename} on line ${line}`;

          if (meta && meta.includes('validate')) {
            const parsed = parse(value);

            if (meta.includes('-snippet')) {
              const snippetType = meta
                .split(' ')
                .find((tag) => tag.includes('-snippet')) as `${SnippetType}-snippet`;

              if (!snippetsByFilename[filename]) {
                snippetsByFilename[filename] = [];
              }

              snippetsByFilename[filename].push({
                type: snippetType.replace('-snippet', '') as SnippetType,
                yaml: value,
                line,
              });
            } else {
              appDefinitionsWithLocations.push({
                location,
                appDefinition: parsed,
              });
            }
          }
        });
      }
    },
    { recursive: true },
  );

  for (const [filename, snippets] of Object.entries(snippetsByFilename)) {
    let template: AppDefinition = {
      name: 'App from snippets',
      defaultPage: null,
      pages: [],
    };

    for (const snippet of snippets) {
      const parsed = parse(snippet.yaml);
      switch (snippet.type) {
        case 'page':
          template.pages.push(parsed[0]);
          break;
        case 'pages':
          for (const page of parsed.pages) {
            template.pages.push(page);
          }
          break;
        case 'resources':
          template = appendResourcesToTemplate(parsed.resources, template);
          break;
        case 'block':
          template = appendBlockToTemplate(parsed[0], template);
          break;
        case 'blocks':
          for (const block of parsed.blocks) {
            template = appendBlockToTemplate(block, template);
          }
          break;
        case 'cron':
          template = appendCronToTemplate(parsed.cron, template);
          break;
        case 'controller':
          template = appendControllerToTemplate(parsed.controller, template);
          break;
        case 'users':
          template = appendUsersToTemplate(parsed.users, template);
          break;
        case 'security':
          template.security = template.security
            ? {
                ...template.security,
                ...parsed.security,
              }
            : parsed.security;
          break;
        default:
          break;
      }
    }

    if (template.pages.length < 1) {
      const { version } = pkg;

      template.pages.push({
        name: 'Support Page',
        blocks: [
          {
            type: 'action-button',
            version,
            parameters: {
              icon: 'home',
            },
            actions: {
              onClick: {
                type: 'noop',
              },
            },
          },
        ],
      });
    }

    template.defaultPage = template.pages[0]?.name;

    appDefinitionsWithLocations.push({
      location: `${filename} code snippets`,
      appDefinition: template,
    });
  }

  return appDefinitionsWithLocations;
}

async function validateAppDefinitions(
  appDefinitionsWithLocations: AppDefinitionWithLocation[],
  organization: string,
  remote: string,
): Promise<void> {
  let errorsCount = 0;
  const validationPromises = appDefinitionsWithLocations.map(async (appDefinitionWithLocation) => {
    const { appDefinition, location } = appDefinitionWithLocation;

    try {
      logger.verbose(`Validating ${location}\n${stringify(appDefinition)}`);

      const formData = new FormData();
      formData.append('yaml', stringify(appDefinitionWithLocation.appDefinition));
      formData.append('OrganizationId', organization);

      await axios.post('/api/apps', formData, {
        baseURL: remote,
        params: { dryRun: true },
      });

      logger.info(`✔️ ${location} ${location.endsWith('snippets') ? 'are' : 'is'} valid`);
    } catch (error_: any) {
      logger.error(`In ${location}`);
      logger.error(appDefinition);

      const errors = error_?.response?.data?.data?.errors;
      if (errors) {
        for (const error of errors) {
          logger.error(error.stack);
        }
      } else {
        logger.error(`❌  ${error_.response?.data?.message ?? error_}`);
      }

      errorsCount += 1;
    }
  });

  await Promise.all(validationPromises);

  if (errorsCount > 0) {
    throw new AppsembleError('Docs validation failed');
  }
}

export async function handler({ organization, remote }: Args): Promise<void> {
  await authenticate(remote, 'apps:write', '');

  logger.info('Validating docs directory');

  const docsPath = join(process.cwd(), 'packages', 'studio', 'pages', 'docs', 'docs');

  const appDefinitionsWithLocations = await accumulateAppDefinitions(docsPath);

  await validateAppDefinitions(appDefinitionsWithLocations, organization, remote);
}
