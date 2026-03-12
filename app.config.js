export default {
  name: 'Dreemart',
  slug: 'dreemart',
  version: '1.0.0',
  scheme: 'dreemart',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  platforms: ['ios'],
  ios: {
    bundleIdentifier: 'com.dreemart.app',
    buildNumber: '1',
    supportsTablet: false,
    UIDeviceFamily: [1],
    infoPlist: {
      NSPhotoLibraryAddUsageDescription:
        'Rüya görselinizi fotoğraf kütüphanenize kaydetmek için izin gerekiyor.',
      NSPhotoLibraryUsageDescription:
        'Rüya görselinizi fotoğraf kütüphanenize kaydetmek için izin gerekiyor.',
    },
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#0A0A1A',
      },
    ],
    'expo-media-library',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: { projectId: process.env.EAS_PROJECT_ID || '' },
  },
};
