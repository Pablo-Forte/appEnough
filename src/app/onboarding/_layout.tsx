// src/app/onboarding/_layout.tsx

import { Stack } from "expo-router";
import { OnboardingProvider } from "../../onboarding/OnboardingContext";

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </OnboardingProvider>
  );
}
