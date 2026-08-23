const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .wasm to assetExts so expo-sqlite works on the web
config.resolver.assetExts.push('wasm');

module.exports = config;
