import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Redirect, Slot, usePathname } from 'expo-router';
import { HeroUINativeProvider } from 'heroui-native';
import { useCallback, useEffect } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  KeyboardAvoidingView,
  KeyboardProvider,
} from 'react-native-keyboard-controller';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';
import '../i18n';
import '../../global.css';
import { AuthProvider, useAuth } from '../contexts/auth-context';
import { DreemartRevenueCatProvider } from '../contexts/dreemart-revenuecat-context';
import { OnboardingProvider, useOnboarding } from '../contexts/onboarding-context';
import { ProfileProvider } from '../contexts/profile-context';
import { initAmplitude } from '../lib/amplitude';
import { colors } from '../constants/theme';

function LoadingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

function AppContent() {
  const contentWrapper = useCallback(
    (children: React.ReactNode) => (
      <KeyboardAvoidingView
        pointerEvents="box-none"
        behavior="padding"
        keyboardVerticalOffset={12}
        className="flex-1"
      >
        {children}
      </KeyboardAvoidingView>
    ),
    []
  );

  const { onboardingDone } = useOnboarding();
  const pathname = usePathname();

  if (onboardingDone === null) {
    return <LoadingScreen />;
  }

  if (!onboardingDone && !pathname.startsWith('/onboarding')) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <HeroUINativeProvider
      config={{
        toast: {
          contentWrapper,
        },
      }}
    >
      <Slot />
    </HeroUINativeProvider>
  );
}

function AppWithAuth() {
  const { userId, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <DreemartRevenueCatProvider userId={userId}>
      <ProfileProvider userId={userId}>
        <OnboardingProvider>
          <AppContent />
        </OnboardingProvider>
      </ProfileProvider>
    </DreemartRevenueCatProvider>
  );
}

export default function Layout() {
  const fonts = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    initAmplitude();
  }, []);

  if (!fonts) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <KeyboardProvider>
        <AuthProvider>
          <AppWithAuth />
        </AuthProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
