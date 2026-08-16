// src/app/onboarding/apps.tsx

import { useRouter } from "expo-router";
import { useState } from "react";
import OnboardingScreen from "../../components/OnboardingScreen";
import SelectableRow from "../../components/SelectableRow";
import { SelectedApp, useOnboarding } from "../../onboarding/OnboardingContext";

const AVAILABLE_APPS: SelectedApp[] = [
  {
    id: "app-instagram",
    displayName: "Instagram",
    appIdentifier: "com.instagram.android",
  },
  {
    id: "app-tiktok",
    displayName: "TikTok",
    appIdentifier: "com.zhiliaoapp.musically",
  },
  {
    id: "app-youtube",
    displayName: "YouTube",
    appIdentifier: "com.google.android.youtube",
  },
  {
    id: "app-facebook",
    displayName: "Facebook",
    appIdentifier: "com.facebook.katana",
  },
  { id: "app-x", displayName: "X", appIdentifier: "com.twitter.android" },
  {
    id: "app-reddit",
    displayName: "Reddit",
    appIdentifier: "com.reddit.frontpage",
  },
  {
    id: "app-snapchat",
    displayName: "Snapchat",
    appIdentifier: "com.snapchat.android",
  },
];

export default function SelectAppsScreen() {
  const router = useRouter();
  const { setSelectedApps } = useOnboarding();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function toggle(appId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(appId)) next.delete(appId);
      else next.add(appId);
      return next;
    });
  }

  function handleNext() {
    const chosen = AVAILABLE_APPS.filter((a) => selectedIds.has(a.id));
    setSelectedApps(chosen);
    router.push("/onboarding/goal");
  }

  return (
    <OnboardingScreen
      step={2}
      totalSteps={5}
      title="¿Qué apps querés controlar?"
      subtitle="Podés elegir más de una."
      onNext={handleNext}
      nextDisabled={selectedIds.size === 0}
    >
      {AVAILABLE_APPS.map((app) => (
        <SelectableRow
          key={app.id}
          label={app.displayName}
          selected={selectedIds.has(app.id)}
          onPress={() => toggle(app.id)}
        />
      ))}
    </OnboardingScreen>
  );
}
