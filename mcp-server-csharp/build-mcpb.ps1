#!/usr/bin/env pwsh
# Build script for MCP C# bundle

Write-Host "Building MCP C# server and packaging as bundle..." -ForegroundColor Green

# Step 1: Build the server
Write-Host "Step 1: Building the server..." -ForegroundColor Yellow
dotnet publish McpServer.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true
if ($LASTEXITCODE -ne 0) {
    Write-Error "Publish failed!"
    exit 1
}

# Step 2: Copy files to server directory
Write-Host "Step 2: Copying executable to mcpb server directory..." -ForegroundColor Yellow
$sourceFile = ".\bin\Release\net9.0\win-x64\publish\McpServer.exe"
$targetDir = ".\mcpb\server\"

# Ensure target directory exists
if (!(Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force
}

Copy-Item $sourceFile $targetDir -Force
if (!(Test-Path "$targetDir\McpServer.exe")) {
    Write-Error "Failed to copy executable!"
    exit 1
}

# Step 3: Pack the bundle
Write-Host "Step 3: Packing the MCP bundle..." -ForegroundColor Yellow
npx -y @anthropic-ai/mcpb pack mcpb
if ($LASTEXITCODE -ne 0) {
    Write-Error "Packing failed!"
    exit 1
}

Write-Host "Build and pack completed successfully!" -ForegroundColor Green
Write-Host "You can now double-click 'mcpb.mcpb' to install the bundle." -ForegroundColor Cyan
