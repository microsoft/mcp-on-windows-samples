# MCP Server MSIX Solution

This solution contains a sample Windows app, and an MCP server that expose shared functionality.

## Projects

**How to Run:**
```powershell
# Build the project (requires x64 platform)
dotnet build -p:Platform=x64

# Run the application
cd mcp-server-msix\bin\x64\Debug\net8.0-windows10.0.19041.0\win-x64
.\mcp-server-msix.exe
```

Or run it directly from Visual Studio by setting it as the startup project and pressing F5.

## Requirements

- .NET 8.0 or later
- Windows 10 version 19041.0 or later (for MSIX app)
- Visual Studio 2022 or later (recommended for MSIX development)