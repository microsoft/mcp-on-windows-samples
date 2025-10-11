#!/usr/bin/env pwsh
# Build script for MCP C# bundle

Write-Host "Building MCP C# server and packaging as bundle..." -ForegroundColor Green

# Step 1: Build the project
Write-Host "Step 1: Build the project..." -ForegroundColor Yellow
dotnet publish McpServer.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed!"
    exit 1
}

# Step 2: Copy files to server directory
Write-Host "Step 2: Copying executable to msix server directory..." -ForegroundColor Yellow
$sourceFile = ".\bin\Release\net9.0\win-x64\publish\McpServer.exe"
$targetDir = ".\msix\server\"

# Ensure target directory exists
if (!(Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force
}

Copy-Item $sourceFile $targetDir -Force
if (!(Test-Path "$targetDir\McpServer.exe")) {
    Write-Error "Failed to copy executable!"
    exit 1
}

# Step 3: Create the msix package
Write-Host "Step 3: Creating the MSIX package..." -ForegroundColor Yellow

# Check if certificate exists, if not generate one
if (!(Test-Path ".\devcert.pfx")) {
    Write-Host "Certificate not found, generating development certificate..." -ForegroundColor Yellow
    & "..\tools\winsdk-win-x64\winsdk.exe" cert generate --manifest "msix\appxmanifest.xml" --install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Certificate generation failed!"
        exit 1
    }
}

# Package the MSIX
Write-Host "Packaging MSIX..." -ForegroundColor Yellow
& "..\tools\winsdk-win-x64\winsdk.exe" package ".\msix" --verbose --cert ".\devcert.pfx"
if ($LASTEXITCODE -ne 0) {
    Write-Error "MSIX packaging failed!"
    exit 1
}

Write-Host "Build and pack completed successfully!" -ForegroundColor Green
Write-Host "You can now install the generated *.msix package" -ForegroundColor Cyan
Write-Host ""
Write-Host "NOTE: If this is the first time installing on this machine, you may need to install the development certificate." -ForegroundColor Yellow
Write-Host "See the README.md file for detailed certificate installation instructions." -ForegroundColor White
