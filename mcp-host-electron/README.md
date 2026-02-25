# Electron app as MCP host on Windows

This sample shows how to integrate your Electron application as an MCP host on the Windows MCP platform. The sample was generated with `npx create-electron-app` and setup for Windows development with `npx winapp init` [Learn more about WinAppCli](https://github.com/microsoft/WinAppCli)

## Requirements:
* NodeJS - `winget install OpenJS.NodeJS.LTS`
* @microsoft/WinAppCli npm package - [download the *.tgz package from here](https://github.com/microsoft/WinAppCli/releases) and place it in the root of this project

## Run the sample 

Before running the sample, ensure it is properly setup (run first time only)
* `> npm install @microsoft/winappcli --save-dev` - to install the winapp cli
* `> npm install` - to install all dependencies
* `> npm run restore` - to restore Windows dependencies and generate dev cert if not present
* `> npx winapp node add-electron-debug-identity` - to add identity to electron while debugging

Then run `npm start` to run the app 

## Package

To create a self-signed msix package, run `npm run package-msix`
