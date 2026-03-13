# Electron app as MCP host on Windows

This sample shows how to integrate your Electron application as an MCP host on the Windows MCP platform. The sample was generated with `npx create-electron-app` and setup for Windows development with `npx winapp init` [Learn more about WinAppCli](https://github.com/microsoft/WinAppCli)

## Requirements:
* NodeJS - `winget install OpenJS.NodeJS.LTS`
* @microsoft/winappcli npm package (installed from npm as a dev dependency)
* Optionally, run `> npm install @microsoft/winappcli --save-dev` to add or update the WinAppCli dependency

## Run the sample 

Before running the sample, ensure it is properly setup (run first time only)
* `> npm install` - to install all dependencies
* `> npm run restore` - to restore Windows dependencies and generate dev cert if not present
* `> npx winapp node add-electron-debug-identity` - to add identity to electron while debugging

Then run `npm start` to run the app 

## Package

To create a self-signed msix package, run `npm run package-msix`
