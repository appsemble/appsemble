# Core development

## Setup

To run `Appsemble` on your machine for development or for self hosting purposes, you need to install
the following packages either from the package manager of your choice or from the respective
websites of these tools.

- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [NodeJS 18](https://nodejs.org/)

You can start local development by cloning the git repository and installing the dependencies. Run
the following commands to get started.

```sh copy
git clone https://gitlab.com/appsemble/appsemble.git
cd appsemble
npm ci
```

The project requires a PostgreSQL database. To make the development process easy,
`docker-compose.yml` contains the configuration to spin up a preconfigured database with ease.

```sh copy
docker compose up -d
```

The project can be served using `npm start`. You can specify different options like `port`, `host`,
`database-port`, `database-host` to configure the Appsemble server. To know more about the available
options, use the `--help` argument. i.e. `npm start -- --help`.

To start the local development process, you need to register an account and login using CLI. In your
browser, register a new account by going to `http://localhost:9999/reigster`. You need an email
address to register an account. If you don’t have an SMTP server configured, the confirmation email
is printed in the server logs. i.e. the email is not sent in the real time. This also allows you to
use a random test email address. After registering a new account and confirming your email address,
you can run the following command to login into the [Appsemble CLI](/docs/packages/cli).

```sh
npm run appsemble login
```

This will open Appsemble studio in a new browser window or tab, you will be prompted to select the
permissions. The credentials are stored locally in your default wallet. You can also manually create
OAuth2 credentials [here](/settings/client-credentials), these credentials can be used locally by
setting the APPSEMBLE_CLIENT_CREDENTIALS environment variable.

After completing the login, the first step is to create an
[organization](../03-guide/organizations.mdx). This can be done either via the CLI or the studio. To
create an organization from the CLI, use the following command.

```sh
npm run appsemble organization create <organization_id>
```

To know more about the available options, you can use `--help` flag.

Similarly, to create an organization from the studio visit the organizations page and create a new
organization.

---

**🛈NOTE**

> We recommend using `appsemble` as your organization id for the local development as it allows you
> to publish the block available in the blocks directory of your repository.

---

The next step is to publish the [blocks](./02-developing-blocks.md) available in the repository.
This can only be done via the CLI and the following command is used to publish all the blocks in
blocks directory.

```sh copy
npm run appsemble block publish blocks/*
```

If you previously decided to use an Id other `appsemble` for your organization, you will have to
change the block names manually to match the pattern `@<organization_id>/block_name` in
`package.json` file of the block. Similar to other commands, `--help` flag can be used to view the
available options.

The last step in local setup is to publish the apps. This can be done using the following command.

```sh copy
npm run appsemble -- app publish apps/* --context development
```

Similar to blocks, if you didn’t choose `appsemble` as your organization Id earlier, you have to
manually modify the block references in app definitions and change the organization name in
`.appsemblerc.yaml` files.

After completing this step, your initial setup is complete. The next step is to make some changes.

## Development

The core product development happens in the `packages` directory. Although a lot of the packages
have name describing their use, each package has a separate `README.md` file containing information
about what the package does. E.g. `server` contains the code for Appsemble server controllers,
various database models, migration files, etc. Similarly, you can check `README.md` file for each
package to know more about that package.

Some common development tasks include adding a new server endpoint, adding a new
[action](../../actions/introduction.mdx), adding a new [remapper](../../remapper/introduction.mdx),
adding new column to a table etc.

**To add a new server endpoint the following steps should be followed.**

- Find the suitable file for the path that will be used to access the new endpoint in
  `packages/utils/api/paths`.
- Add the path and the method to the file.
- Add the code for your controller in a suitable file in `packages/server/controllers/`.
- Add tests for your code in the relative `.test.ts` file.
- If a change in documentation is required, update the documentation in
  `packages/studio/pages/docs`.

**Similarly, to add a new action the following steps should be followed.**

- Add your action type to `packages/types/action.ts`.
- Create a new file in `packages/app/utils/actions/` or put your logic in an existing file if the
  action is related to either of the existing actions like resources or storage actions.
- If the action is a server side action, add the logic in `packages/server/utils/actions/`,
  otherwise, define the action as `noop` in `packages/server/utils/index.ts`.
- Add the schema for your action in a separate file in `packages/utils/api/components/schemas` and
  add the action schema to `packages/utils/api/components/schemas/ActionDefinition.ts`.
- Finally, update the docs at `packages/studio/docs/actions/`.

**Similarly, to add a new remapper the following steps should be followed.**

- Add the new remapper to `packages/types/index.ts` to the `Remappers` interface.
- Add the implementation of the remapper in `packages/utils/remap.ts` to the `mapperImplementations`
  object.
- Add tests for your remapper in `packages/utils/remap.test.ts`.
- Finally, add the schema for your remapper in `packages/utils/reference-schemas/remappers/`.
