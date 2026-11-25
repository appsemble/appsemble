# Appsemble Visual Studio Code Extension

This package wraps `@appsemble/appsemble-language-server` for Visual Studio Code.

It is currently a development package for issue #2137. It starts the language server from this
monorepo checkout and connects it to YAML documents.

## Run locally

```sh
npm install
npm --workspace @appsemble/vscode-extension run build
npm --workspace @appsemble/vscode-extension run prepare-server
code packages/vscode-extension
```

Press F5 and open an Appsemble `app-definition.yaml` file in the extension host window.

The extension launches:

```sh
node ../../packages/appsemble-language-server/build/server.js --stdio
```

## Notes

- The document selector currently attaches to YAML files broadly.
- The output channel is named `Appsemble Language Server`.
- Publishing to the VS Code Marketplace and Open VSX is tracked separately.
