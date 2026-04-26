const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for .mjs files, which are used by fontkit and other @react-pdf dependencies
config.resolver.sourceExts.push('mjs');

module.exports = config;
