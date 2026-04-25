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
    infoPlist: {
      UIDeviceFamily: [1],
      NSPhotoLibraryAddUsageDescription:
        'Rüya görselinizi fotoğraf kütüphanenize kaydetmek için izin gerekiyor.',
      NSPhotoLibraryUsageDescription:
        'Rüya görselinizi fotoğraf kütüphanenize kaydetmek için izin gerekiyor.',
    },
  },
  plugins: [
    'expo-dev-client',
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
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        color: '#7C3AED',
        sounds: [],
        mode: 'production',
      },
    ],
    [
      'expo-tracking-transparency',
      {
        userTrackingPermission:
          'Kişiselleştirilmiş içerik ve ölçüm için izninize ihtiyacımız var. Bu veriler rüya deneyimini iyileştirmek için kullanılır.',
      },
    ],
    ...(process.env.EXPO_PUBLIC_FACEBOOK_APP_ID
      ? [
          [
            'react-native-fbsdk-next',
            {
              appID: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
              clientToken: process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN || '',
              displayName: 'Dreemart',
              scheme: `fb${process.env.EXPO_PUBLIC_FACEBOOK_APP_ID}`,
              advertiserIDCollectionEnabled: false,
              autoLogAppEventsEnabled: true,
              isAutoInitEnabled: true,
              iosUserTrackingPermission:
                'Rüya görselleştirmelerinizi geliştirmek için bu izin kullanılacak.',
            },
          ],
        ]
      : []),
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    /** EAS link/build; env ile override edilebilir */
    eas: {
      projectId:
        process.env.EAS_PROJECT_ID || 'ac098b62-2a78-4589-b3c2-558ad5a3a3cc',
    },
  },
  owner: process.env.EAS_OWNER || undefined,
};
