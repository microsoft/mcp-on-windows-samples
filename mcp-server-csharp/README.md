# MCP bundle C# sample

This sample shows how to build an MCP server, based in C#, and package it for installation on Windows in two different formats:

- **MCPB (MCP Bundle)**
- **MSIX**

## Build and pack the project

### Option 1: Build as MCPB bundle
`.\build-mcpb.ps1`

This will build the server and create the mcpb in the root.
Double click `mcpb.mcpb` to install.

### Option 2: Build as MSIX package
`.\build-msix.ps1`

This will build the server and create an MSIX package.
Double click the generated `*.msix` file to install.

**Note**: If this is the first time installing on this machine, you may need to install the development certificate first. See the certificate installation instructions below.

## Installing the Development Certificate (MSIX only)

When building with `build-msix.ps1`, a development certificate is automatically generated and used to sign the MSIX package. For the first installation on a machine, you need to install this certificate to the Trusted Root Certification Authorities store.

### Step-by-step certificate installation:

1. Right-click on the generated `*.msix` file (e.g., `mcp-dotnet-msix-sample-server.msix`)
2. Select **Properties**
3. Go to the **Digital Signatures** tab
4. Select the signature and click **Details**
5. Click **View Certificate**
6. Click **Install Certificate**
7. Choose **Local Machine** and click **Next**
8. Select **Place all certificates in the following store**
9. Click **Browse**
10. Select **Trusted Root Certification Authorities**
11. Click **Next**
12. Click **Finish**

After installing the certificate, you can install the MSIX package by double-clicking the `.msix` file.