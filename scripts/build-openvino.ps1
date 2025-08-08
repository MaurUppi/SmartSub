param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("install", "build", "validate")]
    [string]$Action,
    
    [string]$Version = "2024.6.0",
    [string]$AddonName = "addon-windows-openvino.node",
    [string]$Arch = "x64"
)

# OpenVINO Build Script for SmartSub (Windows)
# Handles OpenVINO toolkit installation and whisper.cpp compilation with OpenVINO support

$ErrorActionPreference = "Stop"

function Install-OpenVINO {
    param(
        [string]$Version
    )
    
    Write-Host "Installing OpenVINO toolkit version $Version for Windows..." -ForegroundColor Green
    
    $downloadUrl = "https://storage.openvinotoolkit.org/repositories/openvino/packages/2024.6/w_openvino_toolkit_windows_${Version}_x86_64.zip"
    $tempFile = "$env:TEMP\openvino_$Version.zip"
    $extractDir = "$env:TEMP\openvino_extract"
    $installDir = "C:\intel\openvino_$Version"
    
    Write-Host "Downloading OpenVINO from: $downloadUrl" -ForegroundColor Yellow
    
    try {
        Invoke-WebRequest -Uri $downloadUrl -OutFile $tempFile -UseBasicParsing
        Write-Host "✓ Download completed" -ForegroundColor Green
    }
    catch {
        Write-Error "Failed to download OpenVINO: $_"
        exit 1
    }
    
    Write-Host "Extracting OpenVINO to $installDir" -ForegroundColor Yellow
    
    try {
        # Clean up previous extraction
        if (Test-Path $extractDir) {
            Remove-Item $extractDir -Recurse -Force
        }
        
        Expand-Archive -Path $tempFile -DestinationPath $extractDir -Force
        
        # Find the extracted directory
        $extractedDir = Get-ChildItem $extractDir -Directory | Where-Object { $_.Name -like "w_openvino_toolkit_windows*" } | Select-Object -First 1
        
        if (-not $extractedDir) {
            throw "Could not find extracted OpenVINO directory"
        }
        
        # Ensure install directory exists
        $installParent = Split-Path $installDir -Parent
        if (-not (Test-Path $installParent)) {
            New-Item -ItemType Directory -Path $installParent -Force | Out-Null
        }
        
        # Move to final location
        if (Test-Path $installDir) {
            Remove-Item $installDir -Recurse -Force
        }
        Move-Item $extractedDir.FullName $installDir
        
        # Set environment variable
        [Environment]::SetEnvironmentVariable("OPENVINO_INSTALL_DIR", $installDir, "Process")
        $env:OPENVINO_INSTALL_DIR = $installDir
        
        Write-Host "✓ OpenVINO $Version installed successfully at $installDir" -ForegroundColor Green
        
        # Validate installation
        if (Test-Path "$installDir\setupvars.bat") {
            Write-Host "✓ OpenVINO setup script found" -ForegroundColor Green
        } else {
            Write-Warning "OpenVINO setup script not found at expected location"
        }
        
    }
    catch {
        Write-Error "Failed to extract/install OpenVINO: $_"
        exit 1
    }
    finally {
        # Clean up temporary files
        if (Test-Path $tempFile) {
            Remove-Item $tempFile -Force
        }
        if (Test-Path $extractDir) {
            Remove-Item $extractDir -Recurse -Force
        }
    }
}

function Build-WhisperOpenVINO {
    param(
        [string]$AddonName,
        [string]$Arch
    )
    
    Write-Host "Building whisper.cpp addon with OpenVINO support..." -ForegroundColor Green
    Write-Host "Addon name: $AddonName" -ForegroundColor Yellow
    Write-Host "Architecture: $Arch" -ForegroundColor Yellow
    
    # Set up OpenVINO environment
    $openvinoDir = $env:OPENVINO_INSTALL_DIR
    if (-not $openvinoDir) {
        $openvinoDir = "C:\intel\openvino_$Version"
    }
    
    if (Test-Path "$openvinoDir\setupvars.bat") {
        Write-Host "Setting up OpenVINO environment..." -ForegroundColor Yellow
        
        # Source OpenVINO environment variables
        $setupCmd = "$openvinoDir\setupvars.bat"
        cmd /c "$setupCmd && set" | ForEach-Object {
            if ($_ -match "^([^=]+)=(.*)$") {
                [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
            }
        }
    } else {
        Write-Warning "OpenVINO setup script not found, proceeding anyway..."
    }
    
    # Set up Python virtual environment for OpenVINO model conversion
    Write-Host "Setting up Python virtual environment for OpenVINO..." -ForegroundColor Yellow
    try {
        python -m venv openvino_conv_env
        & .\openvino_conv_env\Scripts\Activate.ps1
        python -m pip install --upgrade pip
        
        # Install OpenVINO Python requirements
        if (Test-Path "requirements-openvino.txt") {
            Write-Host "Installing OpenVINO Python requirements..." -ForegroundColor Yellow
            pip install -r requirements-openvino.txt
        } else {
            Write-Host "Installing essential OpenVINO Python packages..." -ForegroundColor Yellow
            pip install "openvino-dev[onnx,pytorch]" transformers torch
        }
        
        # Generate OpenVINO encoder model (using base.en model as per docs)
        Write-Host "Converting whisper model to OpenVINO format..." -ForegroundColor Yellow
        if (Test-Path "convert-whisper-to-openvino.py") {
            python convert-whisper-to-openvino.py --model base.en
        } else {
            Write-Warning "convert-whisper-to-openvino.py not found, skipping model conversion"
        }
        
        # Build whisper.cpp with OpenVINO using official CMake flags
        Write-Host "Building whisper.cpp with OpenVINO support using official CMake flags..." -ForegroundColor Yellow
        cmake -B build -DWHISPER_OPENVINO=1
        cmake --build build -j --config Release
        
        # For addon.node build, we still need cmake-js for Electron compatibility
        Write-Host "Building addon.node for Electron with OpenVINO..." -ForegroundColor Yellow
        Set-Location "examples\addon.node"
        npm install
        Set-Location "..\.."
        
        # Use cmake-js with corrected OpenVINO flags  
        $buildArgs = @(
            "compile"
            "-T", "addon.node"
            "-B", "Release"
            "--CDBUILD_SHARED_LIBS=OFF"
            "--CDWHISPER_STATIC=ON"
            "--CDWHISPER_OPENVINO=1"
            "--runtime=electron"
            "--runtime-version=30.1.0"
            "--arch=$Arch"
        )
        
        & npx cmake-js @buildArgs
        
        if ($LASTEXITCODE -ne 0) {
            throw "cmake-js compilation failed with exit code $LASTEXITCODE"
        }
        
        Write-Host "✓ OpenVINO addon build completed successfully" -ForegroundColor Green
        
        # Verify the build
        if (Test-Path "build\Release\addon.node.node") {
            Write-Host "✓ Addon built successfully: build\Release\addon.node.node" -ForegroundColor Green
            Get-ChildItem "build\Release\addon.node.node" | Format-Table Name, Length, LastWriteTime
        } else {
            throw "Addon build failed: build\Release\addon.node.node not found"
        }
        
        # Deactivate Python virtual environment
        deactivate
    }
    catch {
        Write-Error "Failed to build whisper addon: $_"
        exit 1
    }
}

function Test-OpenVINOInstallation {
    Write-Host "Validating OpenVINO installation..." -ForegroundColor Green
    
    $openvinoDir = $env:OPENVINO_INSTALL_DIR
    if (-not $openvinoDir) {
        $openvinoDir = "C:\intel\openvino_$Version"
    }
    
    if (-not $openvinoDir) {
        Write-Warning "OPENVINO_INSTALL_DIR not set"
        return $false
    }
    
    if (-not (Test-Path $openvinoDir)) {
        Write-Error "OpenVINO installation directory not found: $openvinoDir"
        return $false
    }
    
    Write-Host "✓ OpenVINO installation validated: $openvinoDir" -ForegroundColor Green
    
    # Check for key OpenVINO files
    $runtimeLib = "$openvinoDir\runtime\bin\intel64\Release\openvino.dll"
    if (Test-Path $runtimeLib) {
        Write-Host "✓ OpenVINO runtime library found" -ForegroundColor Green
    } else {
        Write-Warning "OpenVINO runtime library not found at expected location"
    }
    
    $setupScript = "$openvinoDir\setupvars.bat"
    if (Test-Path $setupScript) {
        Write-Host "✓ OpenVINO setup script found" -ForegroundColor Green
    } else {
        Write-Warning "OpenVINO setup script not found"
    }
    
    return $true
}

# Main script logic
try {
    switch ($Action) {
        "install" {
            Install-OpenVINO -Version $Version
            Test-OpenVINOInstallation
        }
        "build" {
            Build-WhisperOpenVINO -AddonName $AddonName -Arch $Arch
        }
        "validate" {
            $result = Test-OpenVINOInstallation
            if (-not $result) {
                exit 1
            }
        }
        default {
            Write-Host @"
Usage: .\build-openvino.ps1 -Action <install|build|validate> [-Version <version>] [-AddonName <name>] [-Arch <arch>]

Commands:
  install  - Install OpenVINO toolkit
  build    - Build whisper.cpp addon with OpenVINO
  validate - Validate OpenVINO installation

Examples:
  .\build-openvino.ps1 -Action install -Version 2024.6.0
  .\build-openvino.ps1 -Action build -AddonName addon-windows-openvino.node -Arch x64
  .\build-openvino.ps1 -Action validate
"@ -ForegroundColor Yellow
            exit 1
        }
    }
    
    Write-Host "OpenVINO build script completed successfully" -ForegroundColor Green
}
catch {
    Write-Error "Script failed: $_"
    exit 1
}