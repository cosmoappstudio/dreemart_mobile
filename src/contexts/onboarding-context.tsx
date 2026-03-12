import React, { createContext, useContext, useEffect, useState } from 'react';
import { storage, StorageKeys } from '../helpers/utils/storage';

/** Her uygulama açılışında onboarding göster. Sadece geliştirme için true yap. */
const FORCE_ONBOARDING_EVERY_LAUNCH = false;

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
    const [onboardingDone, setOnboardingDoneState] = useState<boolean | null>(null);

    useEffect(() => {
        if (FORCE_ONBOARDING_EVERY_LAUNCH) {
            setOnboardingDoneState(false);
            return;
        }
        storage.getBoolean(StorageKeys.ONBOARDING_DONE).then((done) => {
            setOnboardingDoneState(done);
        });
    }, []);

    const setOnboardingDone = async (done: boolean) => {
        await storage.set(StorageKeys.ONBOARDING_DONE, done);
        setOnboardingDoneState(done);
    };

    return (
        <OnboardingContext.Provider value={{ onboardingDone, setOnboardingDone }}>
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (context === undefined) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
}
