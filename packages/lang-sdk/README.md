# ![](https://gitlab.com/appsemble/appsemble/-/raw/0.32.1-test.14/config/assets/logo.svg) Appsemble Lang SDK

> Appsemble Language SDK.

[![npm](https://img.shields.io/npm/v/@appsemble/lang-sdk)](https://www.npmjs.com/package/@appsemble/lang-sdk)
[![GitLab CI](https://gitlab.com/appsemble/appsemble/badges/0.32.1-test.14/pipeline.svg)](https://gitlab.com/appsemble/appsemble/-/releases/0.32.1-test.14)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [License](#license)

## Installation

```sh
npm install @appsemble/lang-sdk
```

## Usage

This package provides utilities and tools for working with the language DSL used in Appsemble.

## Exports

### 1. **Validators**

- `AppValidator`
- `BlockExampleValidator`
- `BlockParamInstanceValidator`
- `BlockParamSchemaValidator`
- `RemapperValidator`
- `BaseValidatorFactory`

### 2. **Constants and Patterns**

- `blockNamePattern`
- `domainPattern`
- `googleAnalyticsIDPattern`
- `hexColor`
- `ISODateTimePattern`
- `jwtPattern`
- `uuid4Pattern`

### 3. **Utilities**

- `normalize`
- `normalizeBlockName`
- `stripBlockName`
- `combineSchemas`
- `generateDataFromSchema`
- `remap`
- `createExampleContext`
- `prefixBlockURL`
- `getAppBlocks`
- `camelToHyphen`
- `decodeJSONRef`
- `normalized`
- `parseBlockName`
- `partialNormalized`
- `partialSemver`
- `toUpperCase`

### 4. **Iterators**

- `iterApp`
- `iterPage`
- `iterBlock`
- `iterBlockList`
- `iterAction`
- `iterController`
- `iterJSONSchema`

### 5. **Authorization**

- `getAppRoles`
- `getAppRolePermissions`
- `getGuestAppPermissions`
- `checkAppRoleAppPermissions`
- `checkGuestAppPermissions`
- `getAppPossiblePermissions`
- `getAppPossibleGuestPermissions`
- `getAppRolesByPermissions`
- `getAppInheritedRoles`
- `PredefinedAppRole`
- `predefinedAppRolePermissions`
- `predefinedAppRoles`

### 6. **Miscellaneous**

- `findPageByName`
- `examples`
- `noop`
- `schemaExample`

### 7. **Schemas**

- `schemas`
- `referenceSchemas`

### 8. **Other**

- `ActionError`
- `allActions`
- `AppPermission`
- `assignAppMemberProperties`
- `baseTheme`
- `defaultLocale`
- `googleFonts`
- `isAppLink`
- `serverActions`
- `validateAppDefinition`
- `referenceSchemas`

## License

[LGPL-3.0-only](https://gitlab.com/appsemble/appsemble/-/blob/0.32.1-test.14/LICENSE.md) ©
[Appsemble](https://appsemble.com)
