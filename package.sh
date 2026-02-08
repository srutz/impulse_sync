#!/bin/bash

# Build and package script for distribution

echo "Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

# Create distribution directory
DIST_DIR="impulse-sync-distribution"
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

echo "Copying files..."
cp package.json "$DIST_DIR/"
cp README.md "$DIST_DIR/"
cp DISTRIBUTION.md "$DIST_DIR/"
cp -r dist "$DIST_DIR/"

# Copy package-lock.json if it exists
if [ -f package-lock.json ]; then
    cp package-lock.json "$DIST_DIR/"
fi

# Create zip file
ZIP_NAME="impulse-sync-v$(node -p "require('./package.json').version")-win.zip"
echo "Creating zip: $ZIP_NAME"
cd "$DIST_DIR"
zip -r "../$ZIP_NAME" ./*
cd ..

echo "Distribution package created: $ZIP_NAME"
echo ""
echo "Contents:"
unzip -l "$ZIP_NAME"

# Cleanup
rm -rf "$DIST_DIR"
