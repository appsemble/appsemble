# ![](https://gitlab.com/appsemble/appsemble/-/raw/0.28.11/config/assets/logo.svg) Appsemble

[![npm](https://img.shields.io/npm/v/appsemble)](https://www.npmjs.com/package/appsemble)
[![GitLab CI](https://gitlab.com/appsemble/appsemble/badges/0.28.11/pipeline.svg)](https://gitlab.com/appsemble/appsemble/-/releases/0.28.11)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [License](#license)

## Installation

It’s recommended to install `@appsemble/eslint-plugin` during development.

```sh
npm install @appsemble/eslint-plugin
```

## Usage

Add `appsemble` as plugin to the plugins in the eslint config.

**Rules**

- `enforce-index-decorator` has been made to enforce a consistent method of applying uniquess to
  columns in tables.

## Why these rules?

TLDR;

Unless we name every composite constraint we add `<table-name>_(<column-name_)*ukey>` and every
single column unique constraints `<table-name>_<column-name>_key`, neither
`npm run appsemble check-migrations` or `npm run appsemble check-down-migrations` will work, because
of the below mentioned inconsistencies in Sequelize. The `@Index` decorator allows a name to be
defined that is used within the database schema unlike the `@Unique` decorator.

> Note: This is based on how Sequelize v6 behaves, in v7 this is supposed to be different according
> to the docs: https://sequelize.org/docs/v7/models/indexes/.

<details>
<summary>
See issues
</summary>

Both unique constraints and unique indexes are considered to be part of the tables' `indexes` when
using `psql ... -c '\d "<InsertTableName>"'`. However `psql` and `pg_dump` both still mention
whether it's actually a constraint or an index. _The library `extract-pg-schema`, used in the
`check-migrations` and `check-down-migrations` commands considers constraints and indexes to be both
[`TableIndexes`](https://kristiandupont.github.io/extract-pg-schema/api/extract-pg-schema.tableindex.html)_

```sh
Indexes:
    "BlockVersion_pkey" PRIMARY KEY, btree (id)
    "blockVersionComposite" UNIQUE CONSTRAINT, btree ("OrganizationId", name, version)
...
Indexes:
    "BlockVersion_pkey" PRIMARY KEY, btree (id)
    "blockVersionComposite" UNIQUE, btree ("OrganizationId", name, version)
```

Now Sequelize allows a propery called `unique` to be added to table columns as compsite constraint,
but this doesn't actually work when using `createTable`, see
https://github.com/sequelize/sequelize/issues/8269 which is blocked (by
https://github.com/sequelize/sequelize/issues/8269#issuecomment-400617295). _There is also this
upstream bug https://github.com/sequelize/sequelize/issues/17312 on single column unique
constraints._

So the composite unique constraint result from `createTable` is as follows:

```sh
Indexes:
    "BlockVersion_pkey" PRIMARY KEY, btree (id)
Foreign-key constraints:
```

For single column unique constraints created with `createTable` cannot be named manually:

```sh
Indexes:
    "BlockVersion_pkey" PRIMARY KEY, btree (id)
    "BlockVersion_OrganizationId_key" UNIQUE CONSTRAINT, btree ("OrganizationId")
    "BlockVersion_name_key" UNIQUE CONSTRAINT, btree (name)
    "BlockVersion_version_key" UNIQUE CONSTRAINT, btree (version)
Foreign-key constraints:
```

Now the `@Unique` decorator does not allow you to define your own name for the composite constraint
(seems this will behave differently in Sequelize v7), it will combine the columns names under the
hood.

Example

```
BlockVersion_OrganizationId_name_version_key
blockVersionComposite
```

So the `check-migrations` and `appsemble check-down-migrations` commands fail, unless we don't
specify the name for the constraint when using `addConstraint`, accept that... `addConstraint` also
names it differently, so what would need to be done is actually setting it to what the `@Unique`
decorator expects which is `BlockVersion_OrganizationId_name_version_ukey`.

Example

```
BlockVersion_OrganizationId_name_version_ukey
BlockVersion_OrganizationId_name_version_uk
```

</details><br>

## License

[LGPL-3.0-only](https://gitlab.com/appsemble/appsemble/-/blob/0.28.11/LICENSE.md) ©
[Appsemble](https://appsemble.com)
