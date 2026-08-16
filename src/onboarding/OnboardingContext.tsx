// src/onboarding/OnboardingContext.tsx

import React, { createContext, useContext, useState } from "react";

export interface SelectedApp {
  id: string;
  displayName: string;
  appIdentifier: string;
}

export interface OnboardingData {
  timePerception: string;
  selectedApps: SelectedApp[];
  mainGoal: string;
  limitsByAppId: Record<string, number>;
  blockDurationMinutes: number;
}

interface OnboardingContextType {
  data: OnboardingData;
  setTimePerception: (v: string) => void;
  setSelectedApps: (v: SelectedApp[]) => void;
  setMainGoal: (v: string) => void;
  setLimit: (appId: string, minutes: number) => void;
  setBlockDurationMinutes: (v: number) => void;
}

const defaultData: OnboardingData = {
  timePerception: "",
  selectedApps: [],
  mainGoal: "",
  limitsByAppId: {},
  blockDurationMinutes: 120,
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [data, setData] = useState<OnboardingData>(defaultData);

  const value: OnboardingContextType = {
    data,
    setTimePerception: (v) => setData((d) => ({ ...d, timePerception: v })),
    setSelectedApps: (v) => setData((d) => ({ ...d, selectedApps: v })),
    setMainGoal: (v) => setData((d) => ({ ...d, mainGoal: v })),
    setLimit: (appId, minutes) =>
      setData((d) => ({
        ...d,
        limitsByAppId: { ...d.limitsByAppId, [appId]: minutes },
      })),
    setBlockDurationMinutes: (v) =>
      setData((d) => ({ ...d, blockDurationMinutes: v })),
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx)
    throw new Error("useOnboarding debe usarse dentro de OnboardingProvider");
  return ctx;
}
