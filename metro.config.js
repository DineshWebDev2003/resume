const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for .mjs files, which are used by fontkit and other @react-pdf dependencies
config.resolver.sourceExts.push('mjs');

// Ensure react-native-svg always resolves to its compiled commonjs entry point
// and react-native-nitro-modules resolves to our safe stub
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-svg') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/react-native-svg/lib/commonjs/index.js'),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'react-native-nitro-modules') {
    return {
      filePath: path.resolve(__dirname, 'stubs/react-native-nitro-modules.js'),
      type: 'sourceFile',
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
