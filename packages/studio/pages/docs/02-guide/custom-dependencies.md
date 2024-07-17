# Developing on an existing app structure

Some organizations have their own ecosystem of blocks, packages and apps. If you want to edit these
existing systems or create your own, there is some setup to do.

## Table of Contents

- [Setting up your development environment](#setting-up-your-development-environment)
- [Common problems](#common-problems)

# Setting up your development environment

**Note:** In this section it is assumed that you are already familiar with setting up the Appsemble
environment on your local machine.

1. Import any data you want to put into the environment either by cloning the repository or manually
   importing the different files/directories. For the rest of this guide, it is assumed that you
   clone your repository beside the Appsemble directory.

   Below is roughly the expected file structure.

   ```
   .
    ├── appsemble/
    │   └── ..
    └── project repository/
        ├── apps/
        │   └── New application/
        │       └── ..
        ├── blocks/
        │   └── Block for application/
        │       └── ..
        ├── packages/
        │   └── scripts/
        │       └── ..
        ├── tsconfig.json
        ├── package.json
        └── ..

   ```

2. Drag the contents of the apps, blocks and packages directories into their respective folders in
   the Appsemble directory. Your file structure should now look like this:

   ```
   .
   └── appsemble/
       ├── apps/
       │   ├── ..
       │   └── New application
       ├── blocks/
       │   ├── ..
       │   └── Block for application
       ├── packages/
       │   ├── ..
       │   └── scripts
       └── ..
   ```

3. The block(s) you imported reference a `tsconfig.json` file from the other repository. To use this
   file in your blocks you need to make sure each block’s TypeScript configuration references this
   `tsconfig.json` file.

   **Note:** The same goes for packages.

   In `appsemble/blocks/Block for application/tsconfig.json`

   ```json
   {
     "extends": "../../../project repository/tsconfig.json"
   }
   ```

   You could also directly copy and paste the contents of the outside repository’s `tsconfig.json`
   file into each block’s TypeScript configuration file.

4. Open your favorite terminal in the Appsemble main directory, and run the `npm install` command.

5. Create an organization with the name specified in the `.appsemblerc.yaml` file of the app you
   want to develop on. You can either do this in the studio or in the CLI with
   `npx appsemble organization create --name {name} {id}`

6. Publish the new blocks to your local environment with
   `npx appsemble block publish blocks/{block name}`

7. Upload the new app to your local environment with
   `npx appsemble app publish --context development apps/{app name}`

# Common problems

- The app definition says it cannot find the blocks you just uploaded

  This can happen because the blocks definition was not specified correctly. One parameter to look
  out for is the block version.

  Some apps define the blocks version to be a variable as a static value, or something like the
  Appsemble version. You need to make sure the block version specified matches an existing version
  of the block you want to use.
