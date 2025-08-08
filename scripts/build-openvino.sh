#!/bin/bash

# OpenVINO Build Script for SmartSub
# Handles OpenVINO toolkit installation and whisper.cpp compilation with OpenVINO support

set -e

OPENVINO_VERSION=${2:-"2024.6.0"}
OS_VERSION=${3:-"ubuntu-20.04"}
ADDON_NAME=${2:-"addon-linux-openvino.node"}
ARCH=${3:-"x64"}

function install_openvino() {
    local version=$1
    local os_version=$2
    
    echo "Installing OpenVINO toolkit version $version for $os_version..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Ubuntu/Linux installation
        local ubuntu_version=""
        if [[ "$os_version" == *"22.04"* ]]; then
            ubuntu_version="22"
        else
            ubuntu_version="20"
        fi
        
        local download_url="https://storage.openvinotoolkit.org/repositories/openvino/packages/2024.6/l_openvino_toolkit_ubuntu${ubuntu_version}_${version}_x86_64.tgz"
        local temp_file="/tmp/openvino_${version}.tgz"
        local install_dir="/opt/intel/openvino_${version}"
        
        echo "Downloading OpenVINO from: $download_url"
        curl -L -o "$temp_file" "$download_url"
        
        echo "Extracting OpenVINO to $install_dir"
        sudo mkdir -p /opt/intel
        sudo tar -xzf "$temp_file" -C /opt/intel
        sudo mv /opt/intel/l_openvino_toolkit_ubuntu*_x86_64 "$install_dir"
        
        # Set up environment
        export OPENVINO_INSTALL_DIR="$install_dir"
        echo "OPENVINO_INSTALL_DIR=$install_dir" >> ~/.bashrc
        
        # Install dependencies including Python 3.10 (recommended by OpenVINO)
        sudo apt-get update
        sudo apt-get install -y \
            cmake \
            build-essential \
            pkg-config \
            libssl-dev \
            libffi-dev \
            python3.10 \
            python3.10-dev \
            python3.10-venv \
            python3-pip \
            software-properties-common
        
        # Ensure python3 points to python3.10
        sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.10 1
        
        # Source OpenVINO environment
        source "$install_dir/setupvars.sh"
        
        echo "OpenVINO $version installed successfully at $install_dir"
        
    else
        echo "Unsupported OS for OpenVINO installation: $OSTYPE"
        exit 1
    fi
}

function build_whisper_openvino() {
    local addon_name=$1
    local arch=$2
    
    echo "Building whisper.cpp addon with OpenVINO support..."
    echo "Addon name: $addon_name"
    echo "Architecture: $arch"
    
    # Source OpenVINO environment if available
    if [[ -f "/opt/intel/openvino_${OPENVINO_VERSION}/setupvars.sh" ]]; then
        echo "Sourcing OpenVINO environment..."
        source "/opt/intel/openvino_${OPENVINO_VERSION}/setupvars.sh"
    elif [[ -n "$OPENVINO_INSTALL_DIR" && -f "$OPENVINO_INSTALL_DIR/setupvars.sh" ]]; then
        echo "Sourcing OpenVINO environment from OPENVINO_INSTALL_DIR..."
        source "$OPENVINO_INSTALL_DIR/setupvars.sh"
    else
        echo "Warning: OpenVINO environment not found, proceeding anyway..."
    fi
    
    # Set up Python virtual environment for OpenVINO model conversion
    echo "Setting up Python virtual environment for OpenVINO..."
    python3 -m venv openvino_conv_env
    source openvino_conv_env/bin/activate
    python -m pip install --upgrade pip
    
    # Install OpenVINO Python requirements
    if [[ -f "requirements-openvino.txt" ]]; then
        echo "Installing OpenVINO Python requirements..."
        pip install -r requirements-openvino.txt
    else
        echo "Installing essential OpenVINO Python packages..."
        pip install openvino-dev[onnx,pytorch] transformers torch
    fi
    
    # Generate OpenVINO encoder model (using base.en model as per docs)
    echo "Converting whisper model to OpenVINO format..."
    if [[ -f "convert-whisper-to-openvino.py" ]]; then
        python convert-whisper-to-openvino.py --model base.en
    else
        echo "Warning: convert-whisper-to-openvino.py not found, skipping model conversion"
    fi
    
    # Build whisper.cpp with OpenVINO using official CMake flags
    echo "Building whisper.cpp with OpenVINO support using official CMake flags..."
    cmake -B build -DWHISPER_OPENVINO=1
    cmake --build build -j --config Release
    
    # For addon.node build, we still need cmake-js for Electron compatibility
    echo "Building addon.node for Electron with OpenVINO..."
    cd examples/addon.node
    npm install
    cd ../../
    
    # Use cmake-js with corrected OpenVINO flags
    npx cmake-js compile -T addon.node -B Release \
        --CDBUILD_SHARED_LIBS=OFF \
        --CDWHISPER_STATIC=ON \
        --CDWHISPER_OPENVINO=1 \
        --runtime=electron \
        --runtime-version=30.1.0 \
        --arch="$arch"
    
    echo "OpenVINO addon build completed successfully"
    
    # Verify the build
    if [[ -f "build/Release/addon.node.node" ]]; then
        echo "✓ Addon built successfully: build/Release/addon.node.node"
        ls -la build/Release/addon.node.node
    else
        echo "✗ Addon build failed: build/Release/addon.node.node not found"
        exit 1
    fi
    
    # Deactivate Python virtual environment
    deactivate
}

function validate_openvino() {
    echo "Validating OpenVINO installation..."
    
    # Check if OpenVINO is properly installed
    if [[ -z "$OPENVINO_INSTALL_DIR" ]]; then
        echo "Warning: OPENVINO_INSTALL_DIR not set"
        return 1
    fi
    
    if [[ ! -d "$OPENVINO_INSTALL_DIR" ]]; then
        echo "Error: OpenVINO installation directory not found: $OPENVINO_INSTALL_DIR"
        return 1
    fi
    
    echo "✓ OpenVINO installation validated: $OPENVINO_INSTALL_DIR"
    
    # Check for key OpenVINO libraries
    if [[ -f "$OPENVINO_INSTALL_DIR/runtime/lib/intel64/libopenvino.so" ]]; then
        echo "✓ OpenVINO runtime library found"
    else
        echo "Warning: OpenVINO runtime library not found"
    fi
    
    return 0
}

# Main script logic
case "$1" in
    "install")
        install_openvino "$OPENVINO_VERSION" "$OS_VERSION"
        validate_openvino
        ;;
    "build")
        build_whisper_openvino "$ADDON_NAME" "$ARCH"
        ;;
    "validate")
        validate_openvino
        ;;
    *)
        echo "Usage: $0 {install|build|validate} [openvino_version] [os_version|addon_name] [arch]"
        echo ""
        echo "Commands:"
        echo "  install  - Install OpenVINO toolkit"
        echo "  build    - Build whisper.cpp addon with OpenVINO"
        echo "  validate - Validate OpenVINO installation"
        echo ""
        echo "Examples:"
        echo "  $0 install 2024.6.0 ubuntu-20.04"
        echo "  $0 build addon-linux-openvino.node x64"
        echo "  $0 validate"
        exit 1
        ;;
esac

echo "OpenVINO build script completed successfully"