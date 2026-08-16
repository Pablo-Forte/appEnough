// src/app/onboarding/block-duration.tsx

import { useRouter } from "expo-router";
import { useState } from "react";
import OnboardingScreen from "../../components/OnboardingScreen";
import SelectableRow from "../../components/SelectableRow";
import { initDatabase, saveTrackedApp, saveUser } from "../../database/db";
import { useOnboarding } from "../../onboarding/OnboardingContext";

const OPTIONS: { label: string; minutes: number }[] = [
  { label: "15 minutos", minutes: 15 },
  { label: "30 minutos", minutes: 30 },
  { label: "1 hora", minutes: 60 },
  { label: "2 horas", minutes: 120 },
  { label: "4 horas", minutes: 240 },
  { label: "Hasta el día siguiente", minutes: 1440 },
];

const USER_ID = "demo-user";

export default function BlockDurationScreen() {
  const router = useRouter();
  const { data, setBlockDurationMinutes } = useOnboarding();
  const [selected, setSelected] = useState<number | null>(null);

  function handleFinish() {
    if (selected === null) return;
    setBlockDurationMinutes(selected);

    const now = new Date().toISOString();
    initDatabase();

    saveUser({
      id: USER_ID,
      onboardingCompleted: true,
      timePerception: data.timePerception,
      mainGoal: data.mainGoal,
      theme: "dark",
      createdAt: now,
      updatedAt: now,
    });

    data.selectedApps.forEach((app) => {
      saveTrackedApp({
        id: app.id,
        userId: USER_ID,
        appIdentifier: app.appIdentifier,
        displayName: app.displayName,
        platform: "android",
        dailyLimitMinutes: data.limitsByAppId[app.id] ?? 20,
        blockDurationMinutes: selected,
        warningMinutesBefore: 5,
        allowExceptions: false,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    });

    router.replace("/");
  }

  return (
    <OnboardingScreen
      step={5}
      totalSteps={5}
      title="¿Qué debería pasar cuando alcances tu límite?"
      subtitle="Tu objetivo no es usar menos por obligación. Es recuperar el control sobre tu tiempo."
      onNext={handleFinish}
      nextLabel="Empezar"
      nextDisabled={selected === null}
    >
      {OPTIONS.map((option) => (
        <SelectableRow
          key={option.minutes}
          label={option.label}
          selected={selected === option.minutes}
          onPress={() => setSelected(option.minutes)}
        />
      ))}
    </OnboardingScreen>
  );
}
