# MCP Server MSIX Solution

This solution contains two projects that work together:

## Projects

### 1. mcp-server-msix (Main Application)
A Windows MSIX packaged application that:
- Starts a TCP server on port 8000
- Listens for incoming connections
- Logs all connection activity to both console and a UI window
- Exits when the window is closed

**How to Run:**
```powershell
# Build the project (requires x64 platform)
dotnet build -p:Platform=x64

# Run the application
cd mcp-server-msix\bin\x64\Debug\net8.0-windows10.0.19041.0\win-x64
.\mcp-server-msix.exe
```

Or run it directly from Visual Studio by setting it as the startup project and pressing F5.

### 2. McpServer (MCP Server)
A Model Context Protocol (MCP) server console application that:
- Provides an MCP tool called `Connect`
- Connects to the main application running on port 8000
- Sends a test message and receives a response
- Returns an error if the main app is not running

**How to Run:**
```powershell
# Build the project
cd McpServer
dotnet build

# Run the MCP server
dotnet run
```

The MCP server uses stdio transport and can be integrated with MCP-compatible clients.

## Usage Workflow

1. **Start the Main Application**: Run the `mcp-server-msix` application first. It will open a window showing the server log and start listening on port 8000.

2. **Run the MCP Server**: In a separate terminal, run the `McpServer` application. It will start the MCP server that can communicate with the main app.

3. **Use the Connect Tool**: When an MCP client calls the `Connect` tool, it will:
   - Attempt to connect to port 8000
   - Send a test message to the main application
   - The main application will log the connection and message
   - Return the response from the main application

## Architecture

```
┌─────────────────────────────┐
│   mcp-server-msix (MSIX)    │
│                             │
│  - WinUI 3 Application      │
│  - TCP Server (Port 8000)   │
│  - Logs connections         │
└──────────────┬──────────────┘
               │
               │ TCP Connection
               │
┌──────────────▼──────────────┐
│      McpServer (Console)     │
│                             │
│  - MCP Server               │
│  - Connect Tool             │
│  - stdio transport          │
└─────────────────────────────┘
```

## Requirements

- .NET 8.0 or later
- Windows 10 version 19041.0 or later (for MSIX app)
- Visual Studio 2022 or later (recommended for MSIX development)

## Building the Solution

```powershell
# Build both projects
dotnet build -p:Platform=x64

# Or build individually
dotnet build McpServer\McpServer.csproj
dotnet build mcp-server-msix\mcp-server-msix.csproj -p:Platform=x64
```

## Notes

- The MSIX project requires the `Platform` property to be set (x64, x86, or ARM64) due to MSIX packaging requirements
- The MCP server uses the ModelContextProtocol package (preview version)
- The main application displays logs in both the UI and console output
