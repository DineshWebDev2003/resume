const { withAndroidManifest } = require('@expo/config-plugins');

function withAndroidFeatures(config, features = []) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    if (!androidManifest.manifest['uses-feature']) {
      androidManifest.manifest['uses-feature'] = [];
    }

    const existingFeatures = androidManifest.manifest['uses-feature'];

    features.forEach(({ name, required = false }) => {
      const existing = existingFeatures.find(
        (item) => item.$ && item.$['android:name'] === name
      );

      if (existing) {
        existing.$['android:required'] = String(required);
      } else {
        existingFeatures.push({
          $: {
            'android:name': name,
            'android:required': String(required),
          },
        });
      }
    });

    return config;
  });
}

module.exports = withAndroidFeatures;
