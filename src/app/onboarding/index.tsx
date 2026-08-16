// src/app/onboarding/index.tsx

import { useRouter } from "expo-router";
import { useState } from "react";
import OnboardingScreen from "../../components/OnboardingScreen";
import SelectableRow from "../../components/SelectableRow";
import { useOnboarding } from "../../onboarding/OnboardingContext";

const OPTIONS = [
  "Menos de 30 min",
  "30-60 min",
  "1-2 horas",
  "2-4 horas",
  "Más de 4 horas",
];

export default function TimePerceptionScreen() {
  const router = useRouter();
  const { setTimePerception } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(null);

  function handleNext() {
    if (!selected) return;
    setTimePerception(selected);
    router.push("/onboarding/apps");
  }

  return (
    <OnboardingScreen
      step={1}
      totalSteps={5}
      title="¿Cuánto tiempo sientes que pierdes en redes?"
      subtitle="No hace falta que sea exacto, una estimación está bien."
      onNext={handleNext}
      nextDisabled={!selected}
    >
      {OPTIONS.map((option) => (
        <SelectableRow
          key={option}
          label={option}
          selected={selected === option}
          onPress={() => setSelected(option)}
        />
      ))}
    </OnboardingScreen>
  );
}
