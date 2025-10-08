# MCP bundle C# sample

This sample shows how to build an MCP server, based in C#, and package it as an MCP bundle with a binary.

## Build the project

`dotnet build`

## Pack into an MCP bundle

Publish it:

`dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true`

Copy files to server

`cp .\bin\Release\net9.0\win-x64\publish\McpServer.exe .\mcpb\server\`

Pack it

```
cd mcpb
mcpb pack
```

Double click `mcpb.mcpb` to intsall